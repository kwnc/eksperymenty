/**
 * Unit Tests for storage.js
 * Tests all storage operations
 */

import { describe, it, expect, beforeEach, afterEach } from '../test-framework.js';
import * as storage from '../../js/storage.js';

// Store original localStorage
const originalLocalStorage = window.localStorage;

describe('Storage - initStorage()', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('should initialize storage with default structure', () => {
    const result = storage.initStorage();
    expect(result).toBeTruthy();

    const data = JSON.parse(localStorage.getItem('notes_app_data'));
    expect(data).toBeTruthy();
    expect(Array.isArray(data.notes)).toBeTruthy();
    expect(data.version).toBe('1.0.0');
  });

  it('should not overwrite existing storage', () => {
    storage.initStorage();
    const testNote = {
      id: 'test-123',
      title: 'Test',
      content: 'Content',
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    storage.saveNote(testNote);

    storage.initStorage();
    const notes = storage.getAllNotes();
    expect(notes.length).toBeGreaterThan(0);
  });
});

describe('Storage - saveNote() and getAllNotes()', () => {
  beforeEach(() => {
    localStorage.clear();
    storage.initStorage();
  });

  it('should save a new note', () => {
    const note = {
      id: 'test-1',
      title: 'Test Note',
      content: 'Test Content',
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    const result = storage.saveNote(note);
    expect(result.success).toBeTruthy();
    expect(result.note).toBeTruthy();
  });

  it('should retrieve all notes', () => {
    const note1 = {
      id: 'test-1',
      title: 'Note 1',
      content: 'Content 1',
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    const note2 = {
      id: 'test-2',
      title: 'Note 2',
      content: 'Content 2',
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    storage.saveNote(note1);
    storage.saveNote(note2);

    const notes = storage.getAllNotes();
    expect(notes.length).toBe(2);
  });

  it('should sort notes by updatedAt (most recent first)', () => {
    const oldNote = {
      id: 'old',
      title: 'Old',
      content: 'Old',
      createdAt: Date.now() - 10000,
      updatedAt: Date.now() - 10000
    };

    const newNote = {
      id: 'new',
      title: 'New',
      content: 'New',
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    storage.saveNote(oldNote);
    storage.saveNote(newNote);

    const notes = storage.getAllNotes();
    expect(notes[0].id).toBe('new');
  });

  it('should update existing note', () => {
    const note = {
      id: 'test-update',
      title: 'Original',
      content: 'Original Content',
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    storage.saveNote(note);

    note.title = 'Updated';
    const result = storage.saveNote(note);

    expect(result.success).toBeTruthy();
    expect(result.note.title).toBe('Updated');

    const retrieved = storage.getNoteById('test-update');
    expect(retrieved.title).toBe('Updated');
  });

  it('should reject invalid note', () => {
    const invalidNote = {
      title: 'No ID',
      content: 'Content'
    };

    const result = storage.saveNote(invalidNote);
    expect(result.success).toBeFalsy();
    expect(result.error).toBeTruthy();
  });
});

describe('Storage - getNoteById()', () => {
  beforeEach(() => {
    localStorage.clear();
    storage.initStorage();
  });

  it('should retrieve note by ID', () => {
    const note = {
      id: 'find-me',
      title: 'Find Me',
      content: 'Content',
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    storage.saveNote(note);
    const retrieved = storage.getNoteById('find-me');

    expect(retrieved).toBeTruthy();
    expect(retrieved.id).toBe('find-me');
    expect(retrieved.title).toBe('Find Me');
  });

  it('should return null for non-existent ID', () => {
    const result = storage.getNoteById('does-not-exist');
    expect(result).toBeNull();
  });
});

describe('Storage - deleteNote()', () => {
  beforeEach(() => {
    localStorage.clear();
    storage.initStorage();
  });

  it('should delete a note', () => {
    const note = {
      id: 'delete-me',
      title: 'Delete Me',
      content: 'Content',
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    storage.saveNote(note);
    expect(storage.getAllNotes().length).toBe(1);

    const result = storage.deleteNote('delete-me');
    expect(result).toBeTruthy();
    expect(storage.getAllNotes().length).toBe(0);
  });

  it('should return false for non-existent note', () => {
    const result = storage.deleteNote('does-not-exist');
    expect(result).toBeFalsy();
  });

  it('should not affect other notes', () => {
    const note1 = {
      id: 'keep-1',
      title: 'Keep 1',
      content: 'Content',
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    const note2 = {
      id: 'delete-2',
      title: 'Delete 2',
      content: 'Content',
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    storage.saveNote(note1);
    storage.saveNote(note2);

    storage.deleteNote('delete-2');

    const notes = storage.getAllNotes();
    expect(notes.length).toBe(1);
    expect(notes[0].id).toBe('keep-1');
  });
});

describe('Storage - updateNote()', () => {
  beforeEach(() => {
    localStorage.clear();
    storage.initStorage();
  });

  it('should update existing note', () => {
    const note = {
      id: 'update-me',
      title: 'Original',
      content: 'Original Content',
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    storage.saveNote(note);

    const result = storage.updateNote('update-me', { title: 'Updated Title' });
    expect(result.success).toBeTruthy();
    expect(result.note.title).toBe('Updated Title');
    expect(result.note.content).toBe('Original Content');
  });

  it('should return error for non-existent note', () => {
    const result = storage.updateNote('does-not-exist', { title: 'New' });
    expect(result.success).toBeFalsy();
    expect(result.error).toBeTruthy();
  });

  it('should preserve original ID and createdAt', () => {
    const note = {
      id: 'preserve-test',
      title: 'Test',
      content: 'Content',
      createdAt: 123456,
      updatedAt: Date.now()
    };

    storage.saveNote(note);
    const result = storage.updateNote('preserve-test', {
      id: 'new-id',
      title: 'Updated',
      createdAt: 999999
    });

    expect(result.note.id).toBe('preserve-test');
    expect(result.note.createdAt).toBe(123456);
  });
});

describe('Storage - searchNotes()', () => {
  beforeEach(() => {
    localStorage.clear();
    storage.initStorage();

    const notes = [
      {
        id: '1',
        title: 'JavaScript Tutorial',
        content: 'Learn JavaScript basics',
        createdAt: Date.now(),
        updatedAt: Date.now()
      },
      {
        id: '2',
        title: 'Python Guide',
        content: 'Python programming language',
        createdAt: Date.now(),
        updatedAt: Date.now()
      },
      {
        id: '3',
        title: 'Web Development',
        content: 'HTML, CSS, and JavaScript',
        createdAt: Date.now(),
        updatedAt: Date.now()
      }
    ];

    notes.forEach(note => storage.saveNote(note));
  });

  it('should search by title', () => {
    const results = storage.searchNotes('JavaScript');
    expect(results.length).toBe(2); // Matches title in note 1 and content in note 3
  });

  it('should search by content', () => {
    const results = storage.searchNotes('Python');
    expect(results.length).toBe(1);
    expect(results[0].id).toBe('2');
  });

  it('should be case-insensitive', () => {
    const results = storage.searchNotes('javascript');
    expect(results.length).toBeGreaterThan(0);
  });

  it('should return all notes for empty query', () => {
    const results = storage.searchNotes('');
    expect(results.length).toBe(3);
  });

  it('should return empty array for no matches', () => {
    const results = storage.searchNotes('NonExistentTerm');
    expect(results.length).toBe(0);
  });
});

describe('Storage - getStorageInfo()', () => {
  beforeEach(() => {
    localStorage.clear();
    storage.initStorage();
  });

  it('should return storage information', () => {
    const info = storage.getStorageInfo();
    expect(info).toBeTruthy();
    expect(typeof info.used).toBe('number');
    expect(typeof info.available).toBe('number');
    expect(typeof info.percentage).toBe('number');
  });

  it('should calculate percentage correctly', () => {
    const info = storage.getStorageInfo();
    expect(info.percentage).toBeGreaterThan(-1);
    expect(info.percentage).toBeLessThan(101);
  });

  it('should show increased usage after adding notes', () => {
    const infoBefore = storage.getStorageInfo();

    const note = {
      id: 'test-storage',
      title: 'Test',
      content: 'A'.repeat(1000),
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    storage.saveNote(note);

    const infoAfter = storage.getStorageInfo();
    expect(infoAfter.used).toBeGreaterThan(infoBefore.used);
  });
});

describe('Storage - exportData() and importData()', () => {
  beforeEach(() => {
    localStorage.clear();
    storage.initStorage();
  });

  it('should export data as JSON string', () => {
    const note = {
      id: 'export-test',
      title: 'Export Test',
      content: 'Content',
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    storage.saveNote(note);
    const exported = storage.exportData();

    expect(typeof exported).toBe('string');
    const parsed = JSON.parse(exported);
    expect(parsed.notes).toBeTruthy();
    expect(Array.isArray(parsed.notes)).toBeTruthy();
  });

  it('should import data from JSON string', () => {
    const data = {
      version: '1.0.0',
      lastModified: Date.now(),
      notes: [
        {
          id: 'import-test',
          title: 'Imported',
          content: 'Imported Content',
          createdAt: Date.now(),
          updatedAt: Date.now()
        }
      ],
      settings: {}
    };

    const jsonString = JSON.stringify(data);
    const result = storage.importData(jsonString);

    expect(result).toBeTruthy();

    const notes = storage.getAllNotes();
    expect(notes.length).toBe(1);
    expect(notes[0].title).toBe('Imported');
  });

  it('should reject invalid JSON', () => {
    const result = storage.importData('invalid json');
    expect(result).toBeFalsy();
  });

  it('should reject data without notes array', () => {
    const invalidData = JSON.stringify({ version: '1.0.0' });
    const result = storage.importData(invalidData);
    expect(result).toBeFalsy();
  });
});

describe('Storage - Error Handling', () => {
  beforeEach(() => {
    localStorage.clear();
    storage.initStorage();
  });

  it('should handle empty notes array gracefully', () => {
    const notes = storage.getAllNotes();
    expect(Array.isArray(notes)).toBeTruthy();
    expect(notes.length).toBe(0);
  });

  it('should handle corrupted localStorage data', () => {
    localStorage.setItem('notes_app_data', 'corrupted data');
    const notes = storage.getAllNotes();
    expect(Array.isArray(notes)).toBeTruthy();
  });
});
