// Notes Manager Tests
const fs = require('fs');
const path = require('path');

// Load the NotesManager class
const notesManagerCode = fs.readFileSync(
  path.join(process.cwd(), 'assets/js/notes.js'),
  'utf8'
);

// Mock dependencies
class MockAuthManager {
  constructor() {
    this.currentUser = { id: 'test-user-id', name: 'Test User' };
  }

  getCurrentUser() {
    return this.currentUser;
  }
}

class MockStorageManager {
  constructor() {
    this.notes = new Map();
    this.idCounter = 1;
  }

  async getNotesByUserId(userId) {
    return Array.from(this.notes.values()).filter(note => note.userId === userId);
  }

  async saveNote(noteData) {
    const note = {
      id: noteData.id || `note_${this.idCounter++}`,
      ...noteData,
      createdAt: noteData.createdAt || new Date().toISOString(),
      modifiedAt: new Date().toISOString()
    };
    this.notes.set(note.id, note);
    return note;
  }

  async getNoteById(id) {
    return this.notes.get(id) || null;
  }

  async updateNote(id, noteData) {
    const existing = this.notes.get(id);
    if (!existing) throw new Error('Note not found');

    const updated = {
      ...existing,
      ...noteData,
      modifiedAt: new Date().toISOString()
    };
    this.notes.set(id, updated);
    return updated;
  }

  async deleteNote(id) {
    return this.notes.delete(id);
  }
}

// Make dependencies available
global.StorageManager = MockStorageManager;

// Execute the notes manager code to define the class
eval(notesManagerCode);

describe('NotesManager', () => {
  let notesManager;
  let mockAuthManager;
  let mockStorageManager;

  beforeEach(() => {
    jest.clearAllMocks();
    notesManager = new NotesManager();
    mockAuthManager = new MockAuthManager();
    mockStorageManager = new MockStorageManager();

    // Set up dependencies
    notesManager.setAuthManager(mockAuthManager);
    notesManager.storageManager = mockStorageManager;
  });

  describe('initialization', () => {
    test('should initialize with empty notes array', () => {
      expect(notesManager.notes).toEqual([]);
      expect(notesManager.currentNote).toBeNull();
    });

    test('should set auth manager correctly', () => {
      expect(notesManager.authManager).toBe(mockAuthManager);
    });
  });

  describe('createNote', () => {
    test('should create new note with default values', async () => {
      const noteData = {
        title: 'Test Note',
        content: '<p>Test content</p>',
        notebookId: 'test-notebook'
      };

      const note = await notesManager.createNote(noteData);

      expect(note).toBeDefined();
      expect(note.id).toBeDefined();
      expect(note.title).toBe(noteData.title);
      expect(note.content).toBe(noteData.content);
      expect(note.userId).toBe('test-user-id');
      expect(note.tags).toEqual([]);
    });

    test('should create note with minimal data', async () => {
      const note = await notesManager.createNote({});

      expect(note.title).toBe('Untitled Note');
      expect(note.content).toBe('');
      expect(note.notebookId).toBe('default');
    });

    test('should process tags correctly', async () => {
      const note = await notesManager.createNote({
        tags: ['tag1', 'tag2', 'tag3']
      });

      expect(note.tags).toEqual(['tag1', 'tag2', 'tag3']);
    });

    test('should require authenticated user', async () => {
      mockAuthManager.currentUser = null;

      await expect(notesManager.createNote({}))
        .rejects.toThrow('User not authenticated');
    });
  });

  describe('loadNotes', () => {
    beforeEach(async () => {
      // Create test notes
      await mockStorageManager.saveNote(createMockNote({
        id: 'note1',
        title: 'First Note',
        userId: 'test-user-id'
      }));
      await mockStorageManager.saveNote(createMockNote({
        id: 'note2',
        title: 'Second Note',
        userId: 'test-user-id'
      }));
    });

    test('should load all user notes', async () => {
      await notesManager.loadNotes();

      expect(notesManager.notes).toHaveLength(2);
      expect(notesManager.notes[0].userId).toBe('test-user-id');
    });

    test('should filter by notebook ID', async () => {
      await mockStorageManager.saveNote(createMockNote({
        id: 'note3',
        notebookId: 'specific-notebook',
        userId: 'test-user-id'
      }));

      await notesManager.loadNotes({ notebookId: 'specific-notebook' });

      expect(notesManager.notes).toHaveLength(1);
      expect(notesManager.notes[0].notebookId).toBe('specific-notebook');
    });

    test('should sort notes correctly', async () => {
      notesManager.setSortOptions('title', 'asc');
      await notesManager.loadNotes();

      expect(notesManager.notes[0].title).toBe('First Note');
      expect(notesManager.notes[1].title).toBe('Second Note');
    });
  });

  describe('setCurrentNote', () => {
    let testNote;

    beforeEach(async () => {
      testNote = await mockStorageManager.saveNote(createMockNote({
        id: 'test-note',
        userId: 'test-user-id'
      }));
    });

    test('should set current note by ID', async () => {
      await notesManager.setCurrentNote('test-note');

      expect(notesManager.currentNote).toBeDefined();
      expect(notesManager.currentNote.id).toBe('test-note');
    });

    test('should clear current note with null', async () => {
      await notesManager.setCurrentNote('test-note');
      await notesManager.setCurrentNote(null);

      expect(notesManager.currentNote).toBeNull();
    });

    test('should call current note changed callback', async () => {
      const callback = jest.fn();
      notesManager.setCurrentNoteChangedCallback(callback);

      await notesManager.setCurrentNote('test-note');

      expect(callback).toHaveBeenCalledWith(expect.objectContaining({
        id: 'test-note'
      }));
    });

    test('should handle non-existent note ID', async () => {
      await expect(notesManager.setCurrentNote('non-existent'))
        .rejects.toThrow('Note not found');
    });
  });

  describe('saveCurrentNote', () => {
    let testNote;

    beforeEach(async () => {
      testNote = await mockStorageManager.saveNote(createMockNote({
        id: 'test-note',
        userId: 'test-user-id'
      }));
      await notesManager.setCurrentNote('test-note');
    });

    test('should save current note with new data', async () => {
      const updates = {
        title: 'Updated Title',
        content: '<p>Updated content</p>',
        tags: ['updated', 'tag']
      };

      const savedNote = await notesManager.saveCurrentNote(updates);

      expect(savedNote.title).toBe('Updated Title');
      expect(savedNote.content).toBe('<p>Updated content</p>');
      expect(savedNote.tags).toEqual(['updated', 'tag']);
    });

    test('should require current note to be set', async () => {
      notesManager.currentNote = null;

      await expect(notesManager.saveCurrentNote({}))
        .rejects.toThrow('No current note to save');
    });

    test('should call notes changed callback after save', async () => {
      const callback = jest.fn();
      notesManager.setNotesChangedCallback(callback);

      await notesManager.saveCurrentNote({ title: 'Updated' });

      expect(callback).toHaveBeenCalled();
    });
  });

  describe('deleteNote', () => {
    let testNote;

    beforeEach(async () => {
      testNote = await mockStorageManager.saveNote(createMockNote({
        id: 'test-note',
        userId: 'test-user-id'
      }));
      await notesManager.loadNotes();
    });

    test('should delete note successfully', async () => {
      const result = await notesManager.deleteNote('test-note');

      expect(result).toBe(true);
      expect(notesManager.notes.find(n => n.id === 'test-note')).toBeUndefined();
    });

    test('should clear current note if deleted note is current', async () => {
      await notesManager.setCurrentNote('test-note');
      await notesManager.deleteNote('test-note');

      expect(notesManager.currentNote).toBeNull();
    });

    test('should call callbacks after deletion', async () => {
      const notesCallback = jest.fn();
      const currentNoteCallback = jest.fn();

      notesManager.setNotesChangedCallback(notesCallback);
      notesManager.setCurrentNoteChangedCallback(currentNoteCallback);

      await notesManager.setCurrentNote('test-note');
      await notesManager.deleteNote('test-note');

      expect(notesCallback).toHaveBeenCalled();
      expect(currentNoteCallback).toHaveBeenCalledWith(null);
    });
  });

  describe('search functionality', () => {
    beforeEach(async () => {
      await mockStorageManager.saveNote(createMockNote({
        id: 'note1',
        title: 'JavaScript Tutorial',
        content: '<p>Learn JavaScript fundamentals</p>',
        tags: ['programming', 'tutorial'],
        userId: 'test-user-id'
      }));

      await mockStorageManager.saveNote(createMockNote({
        id: 'note2',
        title: 'CSS Styling',
        content: '<p>Advanced CSS techniques</p>',
        tags: ['design', 'css'],
        userId: 'test-user-id'
      }));

      await notesManager.loadNotes();
    });

    test('should search by title', () => {
      const results = notesManager.searchNotes('JavaScript');

      expect(results).toHaveLength(1);
      expect(results[0].title).toBe('JavaScript Tutorial');
    });

    test('should search by content', () => {
      const results = notesManager.searchNotes('CSS techniques');

      expect(results).toHaveLength(1);
      expect(results[0].title).toBe('CSS Styling');
    });

    test('should search by tags', () => {
      const results = notesManager.searchNotes('tutorial');

      expect(results).toHaveLength(1);
      expect(results[0].tags).toContain('tutorial');
    });

    test('should return empty array for no matches', () => {
      const results = notesManager.searchNotes('nonexistent');

      expect(results).toHaveLength(0);
    });

    test('should handle case-insensitive search', () => {
      const results = notesManager.searchNotes('JAVASCRIPT');

      expect(results).toHaveLength(1);
    });
  });

  describe('utility methods', () => {
    test('should get note preview correctly', () => {
      const note = createMockNote({
        content: '<p>This is a long content that should be truncated after a certain number of characters to create a preview</p>'
      });

      mockStorageManager.notes.set(note.id, note);
      notesManager.notes = [note];

      const preview = notesManager.getNotePreview(note.id);

      expect(preview).toBe('This is a long content that should be truncated after a certain number of characters to create a preview');
      expect(preview.length).toBeLessThanOrEqual(150);
    });

    test('should format relative dates', () => {
      const now = new Date();
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
      const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

      expect(notesManager.formatRelativeDate(oneHourAgo.toISOString())).toMatch(/hour/);
      expect(notesManager.formatRelativeDate(oneDayAgo.toISOString())).toMatch(/day/);
    });

    test('should handle auto-save scheduling', () => {
      jest.useFakeTimers();

      const noteData = { title: 'Auto saved', content: 'Content' };
      notesManager.currentNote = createMockNote();

      notesManager.scheduleAutoSave(noteData);

      // Check that timeout was set
      expect(setTimeout).toHaveBeenCalledWith(expect.any(Function), 2000);

      jest.useRealTimers();
    });
  });

  describe('sorting and filtering', () => {
    beforeEach(async () => {
      const now = new Date();
      await mockStorageManager.saveNote(createMockNote({
        id: 'note1',
        title: 'Z Note',
        createdAt: new Date(now.getTime() - 2000).toISOString(),
        modifiedAt: new Date(now.getTime() - 1000).toISOString(),
        userId: 'test-user-id'
      }));

      await mockStorageManager.saveNote(createMockNote({
        id: 'note2',
        title: 'A Note',
        createdAt: new Date(now.getTime() - 1000).toISOString(),
        modifiedAt: new Date(now.getTime() - 2000).toISOString(),
        userId: 'test-user-id'
      }));
    });

    test('should sort by title ascending', async () => {
      notesManager.setSortOptions('title', 'asc');
      await notesManager.loadNotes();

      expect(notesManager.notes[0].title).toBe('A Note');
      expect(notesManager.notes[1].title).toBe('Z Note');
    });

    test('should sort by created date descending', async () => {
      notesManager.setSortOptions('createdAt', 'desc');
      await notesManager.loadNotes();

      expect(notesManager.notes[0].title).toBe('A Note'); // newer
      expect(notesManager.notes[1].title).toBe('Z Note'); // older
    });

    test('should sort by modified date', async () => {
      notesManager.setSortOptions('modifiedAt', 'desc');
      await notesManager.loadNotes();

      expect(notesManager.notes[0].title).toBe('Z Note'); // modified more recently
    });
  });
});