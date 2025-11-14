/**
 * Integration Tests for CRUD Operations
 * Tests the full lifecycle of notes
 */

import { describe, it, expect, beforeEach } from '../test-framework.js';
import * as storage from '../../js/storage.js';
import * as utils from '../../js/utils.js';

describe('Integration - Full CRUD Cycle', () => {
  beforeEach(() => {
    localStorage.clear();
    storage.initStorage();
  });

  it('should complete full note lifecycle: Create → Read → Update → Delete', () => {
    // CREATE
    const newNote = {
      id: utils.generateId(),
      title: 'Integration Test Note',
      content: 'This is a test note for integration testing',
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    const createResult = storage.saveNote(newNote);
    expect(createResult.success).toBeTruthy();
    expect(createResult.note.id).toBe(newNote.id);

    // READ
    const retrieved = storage.getNoteById(newNote.id);
    expect(retrieved).toBeTruthy();
    expect(retrieved.title).toBe('Integration Test Note');
    expect(retrieved.content).toBe('This is a test note for integration testing');

    // UPDATE
    const updateResult = storage.updateNote(newNote.id, {
      title: 'Updated Title',
      content: 'Updated content'
    });
    expect(updateResult.success).toBeTruthy();
    expect(updateResult.note.title).toBe('Updated Title');
    expect(updateResult.note.content).toBe('Updated content');

    const updatedNote = storage.getNoteById(newNote.id);
    expect(updatedNote.title).toBe('Updated Title');

    // DELETE
    const deleteResult = storage.deleteNote(newNote.id);
    expect(deleteResult).toBeTruthy();

    const deletedNote = storage.getNoteById(newNote.id);
    expect(deletedNote).toBeNull();

    const allNotes = storage.getAllNotes();
    expect(allNotes.length).toBe(0);
  });
});

describe('Integration - Multiple Notes Management', () => {
  beforeEach(() => {
    localStorage.clear();
    storage.initStorage();
  });

  it('should handle multiple notes correctly', () => {
    const notes = [];
    for (let i = 0; i < 5; i++) {
      const note = {
        id: utils.generateId(),
        title: `Note ${i + 1}`,
        content: `Content for note ${i + 1}`,
        createdAt: Date.now() + i,
        updatedAt: Date.now() + i
      };
      notes.push(note);
      storage.saveNote(note);
    }

    const allNotes = storage.getAllNotes();
    expect(allNotes.length).toBe(5);

    // Delete one note
    storage.deleteNote(notes[2].id);
    const afterDelete = storage.getAllNotes();
    expect(afterDelete.length).toBe(4);

    // Update one note
    storage.updateNote(notes[0].id, { title: 'Updated Note 1' });
    const updated = storage.getNoteById(notes[0].id);
    expect(updated.title).toBe('Updated Note 1');

    // Other notes should be unchanged
    const note4 = storage.getNoteById(notes[3].id);
    expect(note4.title).toBe('Note 4');
  });

  it('should maintain note order after updates', () => {
    const note1 = {
      id: 'note-1',
      title: 'First',
      content: 'Content',
      createdAt: Date.now() - 3000,
      updatedAt: Date.now() - 3000
    };

    const note2 = {
      id: 'note-2',
      title: 'Second',
      content: 'Content',
      createdAt: Date.now() - 2000,
      updatedAt: Date.now() - 2000
    };

    const note3 = {
      id: 'note-3',
      title: 'Third',
      content: 'Content',
      createdAt: Date.now() - 1000,
      updatedAt: Date.now() - 1000
    };

    storage.saveNote(note1);
    storage.saveNote(note2);
    storage.saveNote(note3);

    // Update note1, making it most recent
    storage.updateNote('note-1', { title: 'Updated First' });

    const allNotes = storage.getAllNotes();
    expect(allNotes[0].id).toBe('note-1'); // Most recently updated should be first
  });
});

describe('Integration - Data Persistence', () => {
  beforeEach(() => {
    localStorage.clear();
    storage.initStorage();
  });

  it('should persist notes across storage re-initialization', () => {
    const note = {
      id: 'persist-test',
      title: 'Persistent Note',
      content: 'This should persist',
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    storage.saveNote(note);

    // Re-initialize storage (simulates page reload)
    storage.initStorage();

    const retrieved = storage.getNoteById('persist-test');
    expect(retrieved).toBeTruthy();
    expect(retrieved.title).toBe('Persistent Note');
    expect(retrieved.content).toBe('This should persist');
  });

  it('should maintain data integrity after multiple operations', () => {
    const operations = 10;
    const noteIds = [];

    // Create notes
    for (let i = 0; i < operations; i++) {
      const note = {
        id: `integrity-${i}`,
        title: `Note ${i}`,
        content: `Content ${i}`,
        createdAt: Date.now(),
        updatedAt: Date.now()
      };
      noteIds.push(note.id);
      storage.saveNote(note);
    }

    expect(storage.getAllNotes().length).toBe(operations);

    // Update all notes
    noteIds.forEach(id => {
      storage.updateNote(id, { content: 'Updated Content' });
    });

    // Verify all updates
    noteIds.forEach(id => {
      const note = storage.getNoteById(id);
      expect(note.content).toBe('Updated Content');
    });

    // Delete half
    for (let i = 0; i < operations / 2; i++) {
      storage.deleteNote(noteIds[i]);
    }

    expect(storage.getAllNotes().length).toBe(operations / 2);
  });
});

describe('Integration - Search Functionality', () => {
  beforeEach(() => {
    localStorage.clear();
    storage.initStorage();

    const testNotes = [
      {
        id: '1',
        title: 'JavaScript Basics',
        content: 'Learn the fundamentals of JavaScript programming',
        createdAt: Date.now(),
        updatedAt: Date.now()
      },
      {
        id: '2',
        title: 'Advanced JavaScript',
        content: 'Deep dive into closures, promises, and async/await',
        createdAt: Date.now(),
        updatedAt: Date.now()
      },
      {
        id: '3',
        title: 'Python Tutorial',
        content: 'Getting started with Python programming language',
        createdAt: Date.now(),
        updatedAt: Date.now()
      },
      {
        id: '4',
        title: 'Web Development',
        content: 'HTML, CSS, and JavaScript for building web applications',
        createdAt: Date.now(),
        updatedAt: Date.now()
      }
    ];

    testNotes.forEach(note => storage.saveNote(note));
  });

  it('should search across title and content', () => {
    const results = storage.searchNotes('JavaScript');
    expect(results.length).toBe(3); // Notes 1, 2, and 4
  });

  it('should handle case-insensitive search', () => {
    const lowerCase = storage.searchNotes('javascript');
    const upperCase = storage.searchNotes('JAVASCRIPT');
    const mixedCase = storage.searchNotes('JaVaScRiPt');

    expect(lowerCase.length).toBe(upperCase.length);
    expect(upperCase.length).toBe(mixedCase.length);
  });

  it('should return empty results for non-matching query', () => {
    const results = storage.searchNotes('NonExistentQuery123');
    expect(results.length).toBe(0);
  });

  it('should handle partial word matching', () => {
    const results = storage.searchNotes('program');
    expect(results.length).toBeGreaterThan(0);
  });

  it('should search with special characters', () => {
    const note = {
      id: 'special',
      title: 'Special: Test & Demo',
      content: 'Content with special chars: @#$%',
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    storage.saveNote(note);

    const results = storage.searchNotes('Special');
    expect(results.length).toBeGreaterThan(0);
  });
});

describe('Integration - Edge Cases', () => {
  beforeEach(() => {
    localStorage.clear();
    storage.initStorage();
  });

  it('should handle notes with empty content', () => {
    const note = {
      id: 'empty-content',
      title: 'Empty Content Note',
      content: '',
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    const result = storage.saveNote(note);
    expect(result.success).toBeTruthy();

    const retrieved = storage.getNoteById('empty-content');
    expect(retrieved.content).toBe('');
  });

  it('should handle notes with empty title', () => {
    const note = {
      id: 'empty-title',
      title: '',
      content: 'Some content',
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    const result = storage.saveNote(note);
    expect(result.success).toBeTruthy();

    const retrieved = storage.getNoteById('empty-title');
    expect(retrieved.title).toBe('');
  });

  it('should handle notes with very long content', () => {
    const longContent = 'A'.repeat(10000);
    const note = {
      id: 'long-content',
      title: 'Long Content',
      content: longContent,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    const result = storage.saveNote(note);
    expect(result.success).toBeTruthy();

    const retrieved = storage.getNoteById('long-content');
    expect(retrieved.content.length).toBe(10000);
  });

  it('should handle special characters in content', () => {
    const note = {
      id: 'special-chars',
      title: 'Special Characters',
      content: '!@#$%^&*()_+-=[]{}|;:\'",.<>?/~`',
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    const result = storage.saveNote(note);
    expect(result.success).toBeTruthy();

    const retrieved = storage.getNoteById('special-chars');
    expect(retrieved.content).toBe('!@#$%^&*()_+-=[]{}|;:\'",.<>?/~`');
  });

  it('should handle unicode characters', () => {
    const note = {
      id: 'unicode',
      title: 'Unicode Test 你好 🎉',
      content: 'Content with emoji 😀 and symbols ∑∫∂',
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    const result = storage.saveNote(note);
    expect(result.success).toBeTruthy();

    const retrieved = storage.getNoteById('unicode');
    expect(retrieved.title).toContain('你好');
    expect(retrieved.title).toContain('🎉');
  });
});

describe('Integration - Concurrent Operations', () => {
  beforeEach(() => {
    localStorage.clear();
    storage.initStorage();
  });

  it('should handle rapid successive operations', () => {
    const note = {
      id: 'rapid-test',
      title: 'Initial',
      content: 'Initial',
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    storage.saveNote(note);

    // Rapid updates
    for (let i = 0; i < 10; i++) {
      storage.updateNote('rapid-test', { title: `Update ${i}` });
    }

    const final = storage.getNoteById('rapid-test');
    expect(final.title).toBe('Update 9');
  });

  it('should handle creating and deleting multiple notes rapidly', () => {
    const ids = [];

    // Create 10 notes
    for (let i = 0; i < 10; i++) {
      const id = `rapid-${i}`;
      ids.push(id);
      storage.saveNote({
        id,
        title: `Note ${i}`,
        content: `Content ${i}`,
        createdAt: Date.now(),
        updatedAt: Date.now()
      });
    }

    expect(storage.getAllNotes().length).toBe(10);

    // Delete all notes
    ids.forEach(id => storage.deleteNote(id));

    expect(storage.getAllNotes().length).toBe(0);
  });
});
