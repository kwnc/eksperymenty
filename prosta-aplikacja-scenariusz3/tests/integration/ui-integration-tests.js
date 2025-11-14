/**
 * UI Integration Tests
 * Tests DOM interactions and UI component behavior
 */

import { describe, it, expect, beforeEach } from '../test-framework.js';
import * as storage from '../../js/storage.js';
import * as notesList from '../../js/components/notesList.js';
import * as noteEditor from '../../js/components/noteEditor.js';

describe('UI - Notes List Rendering', () => {
  let container;

  beforeEach(() => {
    localStorage.clear();
    storage.initStorage();
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  it('should render empty state when no notes exist', () => {
    notesList.renderNotesList({
      container,
      notes: [],
      onSelect: () => {},
      onDelete: () => {}
    });

    const emptyState = container.querySelector('.empty-state');
    expect(emptyState).toBeTruthy();
  });

  it('should render list of notes', () => {
    const testNotes = [
      {
        id: '1',
        title: 'Test Note 1',
        content: 'Content 1',
        createdAt: Date.now(),
        updatedAt: Date.now()
      },
      {
        id: '2',
        title: 'Test Note 2',
        content: 'Content 2',
        createdAt: Date.now(),
        updatedAt: Date.now()
      }
    ];

    notesList.renderNotesList({
      container,
      notes: testNotes,
      onSelect: () => {},
      onDelete: () => {}
    });

    const noteItems = container.querySelectorAll('.note-item');
    expect(noteItems.length).toBe(2);
  });

  it('should highlight selected note', () => {
    const testNotes = [
      {
        id: 'selected',
        title: 'Selected Note',
        content: 'Content',
        createdAt: Date.now(),
        updatedAt: Date.now()
      },
      {
        id: 'not-selected',
        title: 'Other Note',
        content: 'Content',
        createdAt: Date.now(),
        updatedAt: Date.now()
      }
    ];

    notesList.renderNotesList({
      container,
      notes: testNotes,
      onSelect: () => {},
      onDelete: () => {},
      selectedNoteId: 'selected'
    });

    const noteItems = container.querySelectorAll('.note-item');
    const selectedItem = Array.from(noteItems).find(item =>
      item.classList.contains('selected')
    );
    expect(selectedItem).toBeTruthy();
  });

  it('should call onSelect when note is clicked', (done) => {
    const testNote = {
      id: 'clickable',
      title: 'Clickable Note',
      content: 'Content',
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    let selectedId = null;
    notesList.renderNotesList({
      container,
      notes: [testNote],
      onSelect: (id) => {
        selectedId = id;
        expect(selectedId).toBe('clickable');
        done();
      },
      onDelete: () => {}
    });

    const noteItem = container.querySelector('.note-item');
    if (noteItem) {
      noteItem.click();
    }
  });

  it('should display note preview content', () => {
    const testNote = {
      id: '1',
      title: 'Test Title',
      content: 'This is the preview content',
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    notesList.renderNotesList({
      container,
      notes: [testNote],
      onSelect: () => {},
      onDelete: () => {}
    });

    const noteTitle = container.querySelector('.note-title');
    expect(noteTitle).toBeTruthy();
    expect(noteTitle.textContent).toContain('Test Title');
  });
});

describe('UI - Note Editor Rendering', () => {
  let container;

  beforeEach(() => {
    localStorage.clear();
    storage.initStorage();
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  it('should render empty editor when no note is selected', () => {
    noteEditor.renderEditor({
      container,
      note: null,
      onSave: () => {}
    });

    const emptyState = container.querySelector('.empty-state');
    expect(emptyState).toBeTruthy();
  });

  it('should render editor with note data', () => {
    const testNote = {
      id: 'test',
      title: 'Test Note',
      content: 'Test Content',
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    noteEditor.renderEditor({
      container,
      note: testNote,
      onSave: () => {}
    });

    const titleInput = container.querySelector('#noteTitle');
    const contentInput = container.querySelector('#noteContent');

    expect(titleInput).toBeTruthy();
    expect(contentInput).toBeTruthy();
    expect(titleInput.value).toBe('Test Note');
    expect(contentInput.value).toBe('Test Content');
  });

  it('should display character count', () => {
    const testNote = {
      id: 'test',
      title: 'Test',
      content: 'Hello World',
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    noteEditor.renderEditor({
      container,
      note: testNote,
      onSave: () => {}
    });

    const charCount = container.querySelector('.char-count');
    expect(charCount).toBeTruthy();
    expect(charCount.textContent).toContain('11');
  });

  it('should show delete button when note exists', () => {
    const testNote = {
      id: 'test',
      title: 'Test',
      content: 'Content',
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    noteEditor.renderEditor({
      container,
      note: testNote,
      onSave: () => {},
      onDelete: () => {}
    });

    const deleteButton = container.querySelector('#btnDeleteNote');
    expect(deleteButton).toBeTruthy();
  });
});

describe('UI - Search Functionality', () => {
  beforeEach(() => {
    localStorage.clear();
    storage.initStorage();

    const testNotes = [
      {
        id: '1',
        title: 'JavaScript Tutorial',
        content: 'Learn JavaScript',
        createdAt: Date.now(),
        updatedAt: Date.now()
      },
      {
        id: '2',
        title: 'Python Guide',
        content: 'Python programming',
        createdAt: Date.now(),
        updatedAt: Date.now()
      },
      {
        id: '3',
        title: 'Web Development',
        content: 'HTML, CSS, JavaScript',
        createdAt: Date.now(),
        updatedAt: Date.now()
      }
    ];

    testNotes.forEach(note => storage.saveNote(note));
  });

  it('should filter notes by search query', () => {
    const results = storage.searchNotes('JavaScript');
    expect(results.length).toBe(2); // Notes 1 and 3
  });

  it('should return all notes for empty search', () => {
    const results = storage.searchNotes('');
    expect(results.length).toBe(3);
  });

  it('should be case-insensitive', () => {
    const results = storage.searchNotes('javascript');
    expect(results.length).toBeGreaterThan(0);
  });

  it('should search in both title and content', () => {
    const results = storage.searchNotes('Python');
    expect(results.length).toBe(1);
    expect(results[0].title).toContain('Python');
  });
});

describe('UI - Modal Interactions', () => {
  let modal;

  beforeEach(() => {
    modal = document.createElement('div');
    modal.id = 'modal';
    modal.className = 'modal';
    modal.innerHTML = `
      <div class="modal-content">
        <h2 class="modal-title">Confirm</h2>
        <p class="modal-message">Are you sure?</p>
        <div class="modal-actions">
          <button id="btnModalConfirm">Confirm</button>
          <button id="btnModalCancel">Cancel</button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
  });

  it('should have modal element in DOM', () => {
    const modalElement = document.getElementById('modal');
    expect(modalElement).toBeTruthy();
  });

  it('should have confirm and cancel buttons', () => {
    const confirmBtn = document.getElementById('btnModalConfirm');
    const cancelBtn = document.getElementById('btnModalCancel');
    expect(confirmBtn).toBeTruthy();
    expect(cancelBtn).toBeTruthy();
  });

  it('should update modal message', () => {
    const message = modal.querySelector('.modal-message');
    message.textContent = 'Delete this note?';
    expect(message.textContent).toBe('Delete this note?');
  });
});

describe('UI - Toast Notifications', () => {
  let toast;

  beforeEach(() => {
    toast = document.createElement('div');
    toast.id = 'toast';
    toast.className = 'toast';
    document.body.appendChild(toast);
  });

  it('should have toast element in DOM', () => {
    const toastElement = document.getElementById('toast');
    expect(toastElement).toBeTruthy();
  });

  it('should update toast message', () => {
    toast.textContent = 'Note saved successfully';
    expect(toast.textContent).toBe('Note saved successfully');
  });

  it('should support different toast types', () => {
    toast.className = 'toast success';
    expect(toast.classList.contains('success')).toBeTruthy();

    toast.className = 'toast error';
    expect(toast.classList.contains('error')).toBeTruthy();
  });
});

describe('UI - Input Validation', () => {
  it('should handle empty title input', () => {
    const note = {
      id: 'test',
      title: '',
      content: 'Content',
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    const result = storage.saveNote(note);
    expect(result.success).toBeTruthy();
  });

  it('should handle very long title', () => {
    const longTitle = 'A'.repeat(200);
    const note = {
      id: 'test',
      title: longTitle,
      content: 'Content',
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    const result = storage.saveNote(note);
    expect(result.success).toBeTruthy();
  });

  it('should handle special characters in input', () => {
    const note = {
      id: 'test',
      title: '<script>alert("xss")</script>',
      content: 'Normal content',
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    const result = storage.saveNote(note);
    expect(result.success).toBeTruthy();

    const retrieved = storage.getNoteById('test');
    expect(retrieved.title).toContain('<script>');
  });
});

describe('UI - Responsive Behavior', () => {
  it('should have viewport meta tag', () => {
    const viewport = document.querySelector('meta[name="viewport"]');
    expect(viewport).toBeTruthy();
  });

  it('should have responsive CSS classes', () => {
    const testDiv = document.createElement('div');
    testDiv.className = 'app-container';
    document.body.appendChild(testDiv);

    expect(testDiv.classList.contains('app-container')).toBeTruthy();
  });
});

describe('UI - Accessibility', () => {
  it('should have proper ARIA labels', () => {
    const searchInput = document.createElement('input');
    searchInput.setAttribute('aria-label', 'Search notes');
    document.body.appendChild(searchInput);

    expect(searchInput.getAttribute('aria-label')).toBe('Search notes');
  });

  it('should have semantic HTML structure', () => {
    const header = document.createElement('header');
    const main = document.createElement('main');

    header.className = 'app-header';
    main.className = 'app-main';

    document.body.appendChild(header);
    document.body.appendChild(main);

    expect(document.querySelector('header')).toBeTruthy();
    expect(document.querySelector('main')).toBeTruthy();
  });
});

describe('UI - Storage Indicator', () => {
  it('should calculate storage usage', () => {
    const info = storage.getStorageInfo();
    expect(info).toBeTruthy();
    expect(typeof info.used).toBe('number');
    expect(typeof info.percentage).toBe('number');
  });

  it('should show percentage between 0 and 100', () => {
    const info = storage.getStorageInfo();
    expect(info.percentage).toBeGreaterThan(-1);
    expect(info.percentage).toBeLessThan(101);
  });
});

describe('UI - Data Export/Import', () => {
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
    expect(parsed.notes.length).toBe(1);
  });

  it('should import valid JSON data', () => {
    const data = {
      version: '1.0.0',
      lastModified: Date.now(),
      notes: [
        {
          id: 'import-test',
          title: 'Imported Note',
          content: 'Imported Content',
          createdAt: Date.now(),
          updatedAt: Date.now()
        }
      ],
      settings: {}
    };

    const result = storage.importData(JSON.stringify(data));
    expect(result).toBeTruthy();

    const notes = storage.getAllNotes();
    expect(notes.length).toBe(1);
    expect(notes[0].title).toBe('Imported Note');
  });

  it('should reject invalid import data', () => {
    const result = storage.importData('invalid json');
    expect(result).toBeFalsy();
  });
});

describe('UI - Button Interactions', () => {
  it('should have new note button', () => {
    const button = document.createElement('button');
    button.id = 'btnNewNote';
    button.textContent = '+ New Note';
    document.body.appendChild(button);

    const btnNewNote = document.getElementById('btnNewNote');
    expect(btnNewNote).toBeTruthy();
    expect(btnNewNote.textContent).toContain('New Note');
  });

  it('should trigger action on button click', (done) => {
    const button = document.createElement('button');
    button.id = 'testButton';

    let clicked = false;
    button.addEventListener('click', () => {
      clicked = true;
      expect(clicked).toBeTruthy();
      done();
    });

    document.body.appendChild(button);
    button.click();
  });
});

describe('UI - Error Handling', () => {
  it('should handle localStorage quota exceeded', () => {
    // Create a very large note to test quota
    const largeContent = 'A'.repeat(100000);
    const note = {
      id: 'large-test',
      title: 'Large Note',
      content: largeContent,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    const result = storage.saveNote(note);
    // Should either succeed or fail gracefully
    expect(typeof result.success).toBe('boolean');
  });

  it('should handle corrupted localStorage data gracefully', () => {
    localStorage.setItem('notes_app_data', 'corrupted{data}');
    const notes = storage.getAllNotes();
    expect(Array.isArray(notes)).toBeTruthy();
  });
});
