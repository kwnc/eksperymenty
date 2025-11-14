/**
 * Unit Tests for notes.js
 * Test business logic, CRUD operations, filtering, and search
 */

function runNotesTests() {
  describe('Notes Module Tests', () => {

    // Clean up before and after each test
    beforeEach(() => {
      cleanupTestData();
      initNotes();
    });

    afterEach(() => {
      cleanupTestData();
    });

    // Test initNotes()
    describe('initNotes()', () => {
      it('should initialize notes state', () => {
        initNotes();
        const notes = getAllNotes();
        assert.isType(notes, 'array');
      });

      it('should load existing notes from storage', () => {
        const testNotes = [
          { id: 'test-1', title: 'Note 1', content: '', tags: [], createdAt: Date.now(), updatedAt: Date.now() }
        ];
        saveNotes(testNotes);

        initNotes();
        const notes = getAllNotes();
        assert.lengthEquals(notes, 1);
        assert.equals(notes[0].id, 'test-1');
      });
    });

    // Test createNote()
    describe('createNote()', () => {
      it('should create a new note', () => {
        const note = createNote('Test Title', 'Test Content', ['tag1', 'tag2']);
        assert.exists(note);
        assert.exists(note.id);
        assert.equals(note.title, 'Test Title');
        assert.equals(note.content, 'Test Content');
        assert.deepEquals(note.tags, ['tag1', 'tag2']);
      });

      it('should trim title and content', () => {
        const note = createNote('  Spaced Title  ', '  Spaced Content  ', []);
        assert.equals(note.title, 'Spaced Title');
        assert.equals(note.content, 'Spaced Content');
      });

      it('should set timestamps', () => {
        const before = Date.now();
        const note = createNote('Test', 'Content', []);
        const after = Date.now();

        assert.exists(note.createdAt);
        assert.exists(note.updatedAt);
        assert.isTrue(note.createdAt >= before && note.createdAt <= after);
        assert.equals(note.createdAt, note.updatedAt);
      });

      it('should add note to beginning of list', () => {
        createNote('First', 'Content', []);
        createNote('Second', 'Content', []);
        const notes = getAllNotes();

        assert.lengthEquals(notes, 2);
        assert.equals(notes[0].title, 'Second'); // Most recent first
        assert.equals(notes[1].title, 'First');
      });

      it('should set note as current note', () => {
        const note = createNote('Test', 'Content', []);
        const current = getCurrentNote();
        assert.exists(current);
        assert.equals(current.id, note.id);
      });

      it('should persist note to storage', () => {
        createNote('Test', 'Content', []);
        const stored = loadNotes();
        assert.lengthEquals(stored, 1);
        assert.equals(stored[0].title, 'Test');
      });

      it('should handle empty content', () => {
        const note = createNote('Title Only', '', []);
        assert.equals(note.content, '');
      });

      it('should handle empty tags', () => {
        const note = createNote('Test', 'Content', []);
        assert.deepEquals(note.tags, []);
      });

      it('should handle default parameters', () => {
        const note = createNote('Test');
        assert.equals(note.title, 'Test');
        assert.equals(note.content, '');
        assert.deepEquals(note.tags, []);
      });
    });

    // Test updateNote()
    describe('updateNote()', () => {
      it('should update existing note', () => {
        const note = createNote('Original', 'Original Content', ['tag1']);
        const updated = updateNote(note.id, {
          title: 'Updated',
          content: 'Updated Content',
          tags: ['tag2']
        });

        assert.exists(updated);
        assert.equals(updated.id, note.id);
        assert.equals(updated.title, 'Updated');
        assert.equals(updated.content, 'Updated Content');
        assert.deepEquals(updated.tags, ['tag2']);
      });

      it('should update timestamp', () => {
        const note = createNote('Test', 'Content', []);
        const originalUpdatedAt = note.updatedAt;

        // Wait a moment
        const later = Date.now() + 100;
        const updated = updateNote(note.id, { title: 'Updated' });

        assert.isTrue(updated.updatedAt >= originalUpdatedAt);
      });

      it('should preserve createdAt timestamp', () => {
        const note = createNote('Test', 'Content', []);
        const originalCreatedAt = note.createdAt;

        const updated = updateNote(note.id, { title: 'Updated' });

        assert.equals(updated.createdAt, originalCreatedAt);
      });

      it('should not allow ID change', () => {
        const note = createNote('Test', 'Content', []);
        const originalId = note.id;

        const updated = updateNote(note.id, { id: 'new-id', title: 'Updated' });

        assert.equals(updated.id, originalId);
      });

      it('should persist changes to storage', () => {
        const note = createNote('Test', 'Content', []);
        updateNote(note.id, { title: 'Updated' });

        const stored = loadNotes();
        assert.equals(stored[0].title, 'Updated');
      });

      it('should set as current note', () => {
        const note = createNote('Test', 'Content', []);
        createNote('Another', 'Content', []); // Create another note

        updateNote(note.id, { title: 'Updated' });
        const current = getCurrentNote();
        assert.equals(current.id, note.id);
      });

      it('should return null for non-existent note', () => {
        const updated = updateNote('non-existent-id', { title: 'Test' });
        assert.notExists(updated);
      });

      it('should validate updated note', () => {
        const note = createNote('Test', 'Content', []);
        const updated = updateNote(note.id, {
          title: 'a'.repeat(201) // Invalid title length
        });
        // Should return null if validation fails
        assert.notExists(updated);
      });
    });

    // Test deleteNote()
    describe('deleteNote()', () => {
      it('should delete existing note', () => {
        const note = createNote('Test', 'Content', []);
        const deleted = deleteNote(note.id);

        assert.isTrue(deleted);
        const notes = getAllNotes();
        assert.lengthEquals(notes, 0);
      });

      it('should remove from storage', () => {
        const note = createNote('Test', 'Content', []);
        deleteNote(note.id);

        const stored = loadNotes();
        assert.lengthEquals(stored, 0);
      });

      it('should clear current note if deleted', () => {
        const note = createNote('Test', 'Content', []);
        setCurrentNote(note.id);

        deleteNote(note.id);

        const current = getCurrentNote();
        assert.notExists(current);
      });

      it('should return false for non-existent note', () => {
        const deleted = deleteNote('non-existent-id');
        assert.isFalse(deleted);
      });

      it('should only delete specified note', () => {
        const note1 = createNote('Note 1', 'Content', []);
        const note2 = createNote('Note 2', 'Content', []);
        const note3 = createNote('Note 3', 'Content', []);

        deleteNote(note2.id);

        const notes = getAllNotes();
        assert.lengthEquals(notes, 2);
        assert.exists(getNoteById(note1.id));
        assert.notExists(getNoteById(note2.id));
        assert.exists(getNoteById(note3.id));
      });
    });

    // Test getNoteById()
    describe('getNoteById()', () => {
      it('should retrieve note by ID', () => {
        const note = createNote('Test', 'Content', []);
        const retrieved = getNoteById(note.id);

        assert.exists(retrieved);
        assert.equals(retrieved.id, note.id);
        assert.equals(retrieved.title, 'Test');
      });

      it('should return null for non-existent ID', () => {
        const retrieved = getNoteById('non-existent');
        assert.notExists(retrieved);
      });
    });

    // Test getAllNotes()
    describe('getAllNotes()', () => {
      it('should return all notes', () => {
        createNote('Note 1', 'Content', []);
        createNote('Note 2', 'Content', []);
        createNote('Note 3', 'Content', []);

        const notes = getAllNotes();
        assert.lengthEquals(notes, 3);
      });

      it('should return empty array when no notes', () => {
        const notes = getAllNotes();
        assert.isType(notes, 'array');
        assert.lengthEquals(notes, 0);
      });

      it('should return copy of notes array', () => {
        createNote('Test', 'Content', []);
        const notes1 = getAllNotes();
        const notes2 = getAllNotes();

        // Modifying one should not affect the other
        notes1.push({ id: 'fake', title: 'Fake' });
        assert.isFalse(notes1.length === notes2.length);
      });
    });

    // Test filterNotesByTag()
    describe('filterNotesByTag()', () => {
      beforeEach(() => {
        createNote('Note 1', 'Content', ['work', 'important']);
        createNote('Note 2', 'Content', ['personal', 'ideas']);
        createNote('Note 3', 'Content', ['work', 'project']);
        createNote('Note 4', 'Content', ['personal']);
      });

      it('should filter notes by tag', () => {
        const filtered = filterNotesByTag('work');
        assert.lengthEquals(filtered, 2);
        assert.isTrue(filtered[0].tags.includes('work'));
        assert.isTrue(filtered[1].tags.includes('work'));
      });

      it('should return all notes for null/empty tag', () => {
        const filtered = filterNotesByTag(null);
        assert.lengthEquals(filtered, 4);
      });

      it('should be case-insensitive', () => {
        const filtered = filterNotesByTag('WORK');
        assert.lengthEquals(filtered, 2);
      });

      it('should return empty array for non-existent tag', () => {
        const filtered = filterNotesByTag('nonexistent');
        assert.lengthEquals(filtered, 0);
      });
    });

    // Test searchNotes()
    describe('searchNotes()', () => {
      beforeEach(() => {
        createNote('Meeting Notes', 'Discuss project timeline', ['work', 'meeting']);
        createNote('Shopping List', 'Buy groceries and supplies', ['personal']);
        createNote('Project Ideas', 'Brainstorm new features', ['work', 'ideas']);
        createNote('Book Review', 'Review of timeline book', ['personal', 'reading']);
      });

      it('should search by title', () => {
        const results = searchNotes('meeting');
        assert.lengthEquals(results, 1);
        assert.isTrue(results[0].title.toLowerCase().includes('meeting'));
      });

      it('should search by content', () => {
        const results = searchNotes('timeline');
        assert.lengthEquals(results, 2); // Both notes contain "timeline"
      });

      it('should search by tags', () => {
        const results = searchNotes('work');
        assert.lengthEquals(results, 2);
      });

      it('should be case-insensitive', () => {
        const results = searchNotes('MEETING');
        assert.lengthEquals(results, 1);
      });

      it('should return all notes for empty query', () => {
        const results = searchNotes('');
        assert.lengthEquals(results, 4);
      });

      it('should return all notes for null/undefined query', () => {
        const results1 = searchNotes(null);
        const results2 = searchNotes(undefined);
        assert.lengthEquals(results1, 4);
        assert.lengthEquals(results2, 4);
      });

      it('should return empty array for no matches', () => {
        const results = searchNotes('nonexistentquery');
        assert.lengthEquals(results, 0);
      });
    });

    // Test getAllTags()
    describe('getAllTags()', () => {
      it('should return unique tags with counts', () => {
        createNote('Note 1', 'Content', ['work', 'important']);
        createNote('Note 2', 'Content', ['work', 'project']);
        createNote('Note 3', 'Content', ['personal']);

        const tags = getAllTags();

        assert.isType(tags, 'array');
        assert.lengthEquals(tags, 3); // work, important, project, personal

        const workTag = tags.find(t => t.tag === 'work');
        assert.exists(workTag);
        assert.equals(workTag.count, 2);
      });

      it('should sort tags by count (descending)', () => {
        createNote('Note 1', 'Content', ['common']);
        createNote('Note 2', 'Content', ['common']);
        createNote('Note 3', 'Content', ['common', 'rare']);

        const tags = getAllTags();

        assert.equals(tags[0].tag, 'common'); // Should be first (count: 3)
        assert.equals(tags[0].count, 3);
        assert.equals(tags[1].tag, 'rare'); // Should be second (count: 1)
        assert.equals(tags[1].count, 1);
      });

      it('should return empty array when no notes', () => {
        const tags = getAllTags();
        assert.lengthEquals(tags, 0);
      });

      it('should handle notes without tags', () => {
        createNote('Note 1', 'Content', []);
        createNote('Note 2', 'Content', ['tag1']);

        const tags = getAllTags();
        assert.lengthEquals(tags, 1);
        assert.equals(tags[0].tag, 'tag1');
      });
    });

    // Test getCurrentNote() and setCurrentNote()
    describe('getCurrentNote() and setCurrentNote()', () => {
      it('should set and get current note', () => {
        const note = createNote('Test', 'Content', []);
        setCurrentNote(note.id);

        const current = getCurrentNote();
        assert.exists(current);
        assert.equals(current.id, note.id);
      });

      it('should return null for non-existent ID', () => {
        setCurrentNote('non-existent');
        const current = getCurrentNote();
        assert.notExists(current);
      });

      it('should clear current note with null', () => {
        const note = createNote('Test', 'Content', []);
        setCurrentNote(note.id);
        setCurrentNote(null);

        const current = getCurrentNote();
        assert.notExists(current);
      });
    });

    // Test state management
    describe('State Management', () => {
      it('should maintain separate notes and filteredNotes arrays', () => {
        createNote('Note 1', 'Content', ['work']);
        createNote('Note 2', 'Content', ['personal']);

        const allNotes = getAllNotes();
        assert.lengthEquals(allNotes, 2);

        filterNotesByTag('work');
        const filteredNotes = filterNotesByTag('work');
        assert.lengthEquals(filteredNotes, 1);

        // All notes should still be 2
        const allNotesAfter = getAllNotes();
        assert.lengthEquals(allNotesAfter, 2);
      });
    });
  });
}
