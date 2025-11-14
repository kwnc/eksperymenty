/**
 * Integration Tests - Notes CRUD Workflows
 * Test complete end-to-end workflows for note operations
 */

function runIntegrationTests() {
  describe('Integration Tests - Notes CRUD Workflows', () => {

    // Clean up before and after each test
    beforeEach(() => {
      cleanupTestData();
      initNotes();
    });

    afterEach(() => {
      cleanupTestData();
    });

    // Complete Create Flow
    describe('Complete Note Creation Flow', () => {
      it('should create note and persist across reload', () => {
        // Create a note
        const note = createNote('Integration Test', 'Full workflow test', ['test', 'integration']);

        // Verify note exists
        assert.exists(note);
        assert.equals(note.title, 'Integration Test');

        // Verify in getAllNotes()
        const allNotes = getAllNotes();
        assert.lengthEquals(allNotes, 1);

        // Verify in storage
        const stored = loadNotes();
        assert.lengthEquals(stored, 1);
        assert.equals(stored[0].id, note.id);

        // Simulate reload by re-initializing
        initNotes();
        const reloaded = getAllNotes();
        assert.lengthEquals(reloaded, 1);
        assert.equals(reloaded[0].title, 'Integration Test');
      });

      it('should create multiple notes in sequence', () => {
        const note1 = createNote('First Note', 'Content 1', ['tag1']);
        const note2 = createNote('Second Note', 'Content 2', ['tag2']);
        const note3 = createNote('Third Note', 'Content 3', ['tag3']);

        assert.exists(note1);
        assert.exists(note2);
        assert.exists(note3);

        const notes = getAllNotes();
        assert.lengthEquals(notes, 3);

        // Verify order (most recent first)
        assert.equals(notes[0].title, 'Third Note');
        assert.equals(notes[1].title, 'Second Note');
        assert.equals(notes[2].title, 'First Note');
      });
    });

    // Complete Edit Flow
    describe('Complete Note Editing Flow', () => {
      it('should edit note and persist changes', () => {
        // Create original note
        const original = createNote('Original Title', 'Original Content', ['original']);

        // Edit the note
        const edited = updateNote(original.id, {
          title: 'Updated Title',
          content: 'Updated Content',
          tags: ['updated']
        });

        assert.exists(edited);
        assert.equals(edited.title, 'Updated Title');
        assert.equals(edited.content, 'Updated Content');
        assert.deepEquals(edited.tags, ['updated']);

        // Verify persistence
        const stored = loadNotes();
        assert.equals(stored[0].title, 'Updated Title');

        // Simulate reload
        initNotes();
        const reloaded = getNoteById(original.id);
        assert.equals(reloaded.title, 'Updated Title');
      });

      it('should handle partial updates correctly', () => {
        const note = createNote('Test Title', 'Test Content', ['tag1', 'tag2']);

        // Update only title
        updateNote(note.id, { title: 'New Title' });
        let updated = getNoteById(note.id);
        assert.equals(updated.title, 'New Title');
        assert.equals(updated.content, 'Test Content'); // Should remain unchanged

        // Update only content
        updateNote(note.id, { content: 'New Content' });
        updated = getNoteById(note.id);
        assert.equals(updated.content, 'New Content');
        assert.deepEquals(updated.tags, ['tag1', 'tag2']); // Should remain unchanged
      });
    });

    // Complete Delete Flow
    describe('Complete Note Deletion Flow', () => {
      it('should delete note and remove from storage', () => {
        // Create note
        const note = createNote('To Delete', 'This will be deleted', ['delete']);

        // Verify it exists
        assert.exists(getNoteById(note.id));
        assert.lengthEquals(getAllNotes(), 1);

        // Delete it
        const deleted = deleteNote(note.id);
        assert.isTrue(deleted);

        // Verify it's gone
        assert.notExists(getNoteById(note.id));
        assert.lengthEquals(getAllNotes(), 0);

        // Verify storage
        const stored = loadNotes();
        assert.lengthEquals(stored, 0);

        // Simulate reload
        initNotes();
        assert.lengthEquals(getAllNotes(), 0);
      });

      it('should delete specific note from multiple notes', () => {
        const note1 = createNote('Note 1', 'Content 1', []);
        const note2 = createNote('Note 2', 'Content 2', []);
        const note3 = createNote('Note 3', 'Content 3', []);

        // Delete middle note
        deleteNote(note2.id);

        assert.lengthEquals(getAllNotes(), 2);
        assert.exists(getNoteById(note1.id));
        assert.notExists(getNoteById(note2.id));
        assert.exists(getNoteById(note3.id));

        // Verify persistence
        initNotes();
        assert.lengthEquals(getAllNotes(), 2);
      });
    });

    // Tag Filtering Flow
    describe('Complete Tag Filtering Flow', () => {
      beforeEach(() => {
        createNote('Work Note 1', 'Work content', ['work', 'important']);
        createNote('Personal Note 1', 'Personal content', ['personal']);
        createNote('Work Note 2', 'More work', ['work', 'project']);
        createNote('Personal Note 2', 'More personal', ['personal', 'ideas']);
      });

      it('should filter notes by tag and clear filter', () => {
        // Filter by work
        let filtered = filterNotesByTag('work');
        assert.lengthEquals(filtered, 2);
        filtered.forEach(note => {
          assert.contains(note.tags, 'work');
        });

        // Filter by personal
        filtered = filterNotesByTag('personal');
        assert.lengthEquals(filtered, 2);
        filtered.forEach(note => {
          assert.contains(note.tags, 'personal');
        });

        // Clear filter
        filtered = filterNotesByTag(null);
        assert.lengthEquals(filtered, 4);
      });

      it('should update tag cloud after operations', () => {
        let tags = getAllTags();
        assert.lengthEquals(tags, 4); // work, personal, important, project, ideas

        // Create note with new tag
        createNote('New Note', 'Content', ['newtag']);
        tags = getAllTags();
        assert.lengthEquals(tags, 5);

        const newTag = tags.find(t => t.tag === 'newtag');
        assert.exists(newTag);
        assert.equals(newTag.count, 1);
      });
    });

    // Search Flow
    describe('Complete Search Flow', () => {
      beforeEach(() => {
        createNote('JavaScript Tutorial', 'Learn JavaScript basics', ['programming', 'tutorial']);
        createNote('Python Guide', 'Python programming guide', ['programming', 'python']);
        createNote('Shopping List', 'Buy groceries', ['personal', 'todo']);
        createNote('Meeting Notes', 'Discuss JavaScript project', ['work', 'meeting']);
      });

      it('should search across title, content, and tags', () => {
        // Search by title
        let results = searchNotes('tutorial');
        assert.lengthEquals(results, 1);
        assert.equals(results[0].title, 'JavaScript Tutorial');

        // Search by content
        results = searchNotes('programming');
        assert.lengthEquals(results, 2); // Both programming notes

        // Search by tag
        results = searchNotes('python');
        assert.lengthEquals(results, 1);

        // Search that appears in multiple places
        results = searchNotes('javascript');
        assert.lengthEquals(results, 2); // Title and content match
      });

      it('should handle search with no results', () => {
        const results = searchNotes('nonexistent');
        assert.lengthEquals(results, 0);
      });

      it('should return all notes for empty search', () => {
        const results = searchNotes('');
        assert.lengthEquals(results, 4);
      });
    });

    // Mixed Operations Flow
    describe('Complex Mixed Operations', () => {
      it('should handle create → edit → delete cycle', () => {
        // Create
        const note = createNote('Test Note', 'Original content', ['test']);
        assert.lengthEquals(getAllNotes(), 1);

        // Edit
        updateNote(note.id, { title: 'Updated Note', content: 'Updated content' });
        const updated = getNoteById(note.id);
        assert.equals(updated.title, 'Updated Note');

        // Delete
        deleteNote(note.id);
        assert.lengthEquals(getAllNotes(), 0);

        // Verify persistence
        const stored = loadNotes();
        assert.lengthEquals(stored, 0);
      });

      it('should handle multiple edits to same note', () => {
        const note = createNote('Test', 'Content', ['tag1']);

        updateNote(note.id, { title: 'Version 2' });
        updateNote(note.id, { content: 'Content 2' });
        updateNote(note.id, { tags: ['tag2', 'tag3'] });

        const final = getNoteById(note.id);
        assert.equals(final.title, 'Version 2');
        assert.equals(final.content, 'Content 2');
        assert.deepEquals(final.tags, ['tag2', 'tag3']);
      });

      it('should maintain data integrity during bulk operations', () => {
        // Create 10 notes
        for (let i = 1; i <= 10; i++) {
          createNote(`Note ${i}`, `Content ${i}`, [`tag${i}`]);
        }

        assert.lengthEquals(getAllNotes(), 10);

        // Update half of them
        const notes = getAllNotes();
        for (let i = 0; i < 5; i++) {
          updateNote(notes[i].id, { title: `Updated ${i}` });
        }

        // Delete 3 of them
        deleteNote(notes[0].id);
        deleteNote(notes[1].id);
        deleteNote(notes[2].id);

        assert.lengthEquals(getAllNotes(), 7);

        // Verify persistence
        initNotes();
        assert.lengthEquals(getAllNotes(), 7);
      });
    });

    // Edge Cases and Error Handling
    describe('Edge Cases and Error Handling', () => {
      it('should handle very long title (boundary)', () => {
        const longTitle = 'a'.repeat(200); // Max length
        const note = createNote(longTitle, 'Content', []);
        assert.exists(note);
        assert.equals(note.title.length, 200);
      });

      it('should reject title longer than 200 chars', () => {
        const tooLongTitle = 'a'.repeat(201);
        const note = createNote(tooLongTitle, 'Content', []);
        assert.notExists(note); // Should fail validation
      });

      it('should handle empty title (should be trimmed)', () => {
        const note = createNote('', 'Content', []);
        // Empty string after trim should fail validation
        assert.notExists(note);
      });

      it('should handle special characters in all fields', () => {
        const note = createNote(
          'Special <>&"\' Title',
          'Content with special chars: <>&"\'',
          ['special-tag']
        );

        assert.exists(note);
        assert.isTrue(note.title.includes('<>'));
        assert.isTrue(note.content.includes('<>'));
      });

      it('should handle unicode characters', () => {
        const note = createNote(
          '日本語 Title 🎉',
          'Content: 한글 Ελληνικά',
          ['unicode']
        );

        assert.exists(note);
        const retrieved = getNoteById(note.id);
        assert.equals(retrieved.title, '日本語 Title 🎉');
      });

      it('should handle many tags', () => {
        const manyTags = [];
        for (let i = 1; i <= 20; i++) {
          manyTags.push(`tag${i}`);
        }

        const note = createNote('Test', 'Content', manyTags);
        assert.exists(note);
        assert.lengthEquals(note.tags, 20);
      });
    });

    // Concurrent Operations Simulation
    describe('Rapid Sequential Operations', () => {
      it('should handle rapid create operations', () => {
        // Simulate rapid creation
        for (let i = 0; i < 20; i++) {
          createNote(`Note ${i}`, `Content ${i}`, [`tag${i}`]);
        }

        const notes = getAllNotes();
        assert.lengthEquals(notes, 20);

        // Verify all IDs are unique
        const ids = new Set(notes.map(n => n.id));
        assert.equals(ids.size, 20, 'All IDs should be unique');
      });

      it('should handle rapid mixed operations', () => {
        // Create some notes
        const notes = [];
        for (let i = 0; i < 10; i++) {
          notes.push(createNote(`Note ${i}`, `Content ${i}`, []));
        }

        // Rapid mixed operations
        updateNote(notes[0].id, { title: 'Updated 0' });
        deleteNote(notes[1].id);
        updateNote(notes[2].id, { content: 'Updated content 2' });
        const newNote = createNote('New Note', 'New Content', []);
        deleteNote(notes[3].id);

        const remaining = getAllNotes();
        assert.lengthEquals(remaining, 9); // 10 - 2 deleted + 1 created

        // Verify persistence
        initNotes();
        assert.lengthEquals(getAllNotes(), 9);
      });
    });
  });
}
