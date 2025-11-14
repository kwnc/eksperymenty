/**
 * Application Controller
 * Main entry point and state management for the note-taking app
 *
 * @module app
 */

import * as storage from './storage.js';
import * as utils from './utils.js';
import { renderNotesList } from './components/notesList.js';
import { renderEditor, clearEditor } from './components/noteEditor.js';

// ============================================
// Application State
// ============================================

const appState = {
  notes: [],
  currentNote: null,
  searchQuery: '',
  view: 'list',
};

// ============================================
// Initialization
// ============================================

/**
 * Initialize the application
 */
function init() {
  console.log('Initializing application...');

  // Initialize storage
  const storageInitialized = storage.initStorage();
  if (!storageInitialized) {
    console.error('Failed to initialize storage');
    showToast('Failed to initialize storage', 3000);
    return;
  }

  // Load notes from storage
  appState.notes = storage.getAllNotes();
  console.log(`Loaded ${appState.notes.length} notes from storage`);

  // Bind event listeners
  bindEvents();

  // Render initial view (notes list)
  renderNotesListView();

  // Show empty editor
  clearEditor();

  // Update storage indicator
  updateStorageIndicator();

  console.log('Application initialized successfully');
}

/**
 * Bind event listeners to DOM elements
 */
function bindEvents() {
  // New note button
  const btnNewNote = document.getElementById('btnNewNote');
  if (btnNewNote) {
    btnNewNote.addEventListener('click', handleNoteCreate);
  }

  // Search input
  const searchInput = document.getElementById('searchInput');
  if (searchInput) {
    const debouncedSearch = utils.debounce((e) => {
      handleSearch(e.target.value);
    }, 300);
    searchInput.addEventListener('input', debouncedSearch);
  }

  // Modal cancel button
  const btnModalCancel = document.getElementById('btnModalCancel');
  if (btnModalCancel) {
    btnModalCancel.addEventListener('click', () => {
      hideModal();
    });
  }
}

// ============================================
// State Management
// ============================================

/**
 * Update application state
 * @param {Object} updates - Partial state updates
 */
function setState(updates) {
  Object.assign(appState, updates);

  // Re-render if notes changed
  if (updates.notes !== undefined) {
    renderNotesListView();
    updateStorageIndicator();
  }

  // Update editor if currentNote changed
  if (updates.currentNote !== undefined) {
    if (updates.currentNote) {
      renderEditorView(updates.currentNote);
    } else {
      clearEditor();
    }
  }
}

/**
 * Get current application state
 * @returns {Object} Current state
 */
function getState() {
  return appState;
}

// ============================================
// Event Handlers
// ============================================

/**
 * Handle note selection
 * @param {string} noteId - ID of selected note
 */
function handleNoteSelect(noteId) {
  const note = storage.getNoteById(noteId);
  if (!note) {
    console.error('Note not found:', noteId);
    return;
  }

  appState.currentNote = note;
  renderEditorView(note);

  // Update selected state in list
  document.querySelectorAll('.note-item').forEach(item => {
    if (item.dataset.noteId === noteId) {
      item.classList.add('active');
    } else {
      item.classList.remove('active');
    }
  });
}

/**
 * Handle new note creation
 */
function handleNoteCreate() {
  const newNote = {
    id: utils.generateId(),
    title: '',
    content: '',
    createdAt: Date.now(),
    updatedAt: Date.now()
  };

  const result = storage.saveNote(newNote);
  if (result.success) {
    appState.notes = storage.getAllNotes();
    appState.currentNote = result.note;

    renderNotesListView();
    renderEditorView(result.note);
    updateStorageIndicator();

    showToast('New note created', 2000);
  } else {
    showToast('Failed to create note: ' + result.error, 3000);
  }
}

/**
 * Handle note deletion
 * @param {string} noteId - ID of note to delete
 */
function handleNoteDelete(noteId) {
  const note = storage.getNoteById(noteId);
  if (!note) return;

  showConfirmModal(
    'Delete Note',
    `Are you sure you want to delete "${note.title || 'Untitled Note'}"?`,
    () => {
      const success = storage.deleteNote(noteId);
      if (success) {
        appState.notes = storage.getAllNotes();

        // If deleted note was active, clear editor
        if (appState.currentNote && appState.currentNote.id === noteId) {
          appState.currentNote = null;
          clearEditor();
        }

        renderNotesListView();
        updateStorageIndicator();
        showToast('Note deleted', 2000);
      } else {
        showToast('Failed to delete note', 3000);
      }
    }
  );
}

/**
 * Handle search input
 * @param {string} query - Search query
 */
function handleSearch(query) {
  appState.searchQuery = query;

  if (!query || query.trim() === '') {
    // Show all notes
    appState.notes = storage.getAllNotes();
  } else {
    // Search notes
    appState.notes = storage.searchNotes(query);
  }

  renderNotesListView();
}

/**
 * Handle note save
 * @param {Object} noteData - Note data to save
 */
function handleNoteSave(noteData) {
  const result = storage.saveNote(noteData);
  if (result.success) {
    appState.currentNote = result.note;
    appState.notes = storage.getAllNotes();

    // Update note in list without full re-render
    const noteItem = document.querySelector(`.note-item[data-note-id="${result.note.id}"]`);
    if (noteItem) {
      // Update title
      const titleElement = noteItem.querySelector('.note-title');
      if (titleElement) {
        titleElement.textContent = result.note.title || 'Untitled Note';
      }

      // Update preview
      const previewElement = noteItem.querySelector('.note-preview');
      if (previewElement) {
        const preview = result.note.content ? utils.truncateText(result.note.content, 100) : 'No content';
        previewElement.textContent = preview;
      }

      // Update timestamp
      const timestampElement = noteItem.querySelector('.note-timestamp');
      if (timestampElement) {
        timestampElement.textContent = utils.formatTimestamp(result.note.updatedAt);
      }
    }

    updateStorageIndicator();
  } else {
    console.error('Failed to save note:', result.error);
    showToast('Failed to save note: ' + result.error, 3000);
  }
}

// ============================================
// UI Rendering
// ============================================

/**
 * Render notes list view
 */
function renderNotesListView() {
  const container = document.getElementById('notesList');
  if (!container) return;

  renderNotesList({
    container,
    notes: appState.notes,
    onSelect: handleNoteSelect,
    onDelete: handleNoteDelete,
    selectedNoteId: appState.currentNote ? appState.currentNote.id : null
  });
}

/**
 * Render editor view with note
 * @param {Note} note - Note to edit
 */
function renderEditorView(note) {
  const container = document.getElementById('noteEditor');
  if (!container) return;

  renderEditor({
    container,
    note,
    onSave: handleNoteSave,
    autoSaveDelay: 1000
  });
}

// ============================================
// UI Updates
// ============================================

/**
 * Update storage indicator in footer
 */
function updateStorageIndicator() {
  const indicator = document.getElementById('storageIndicator');
  if (!indicator) return;

  const info = storage.getStorageInfo();
  const formatted = utils.formatBytes(info.used);

  indicator.textContent = `Storage: ${formatted} used`;

  // Add warning class if over 80%
  if (info.percentage > 80) {
    indicator.classList.add('warning');
  } else {
    indicator.classList.remove('warning');
  }

  // Add danger class if over 95%
  if (info.percentage > 95) {
    indicator.classList.add('danger');
  } else {
    indicator.classList.remove('danger');
  }
}

/**
 * Show toast notification
 * @param {string} message - Message to display
 * @param {number} duration - Duration in ms (default 3000)
 */
function showToast(message, duration = 3000) {
  const toast = document.getElementById('toast');
  const toastMessage = document.getElementById('toastMessage');

  if (!toast || !toastMessage) return;

  toastMessage.textContent = message;
  toast.setAttribute('aria-hidden', 'false');

  setTimeout(() => {
    toast.setAttribute('aria-hidden', 'true');
  }, duration);
}

/**
 * Show confirmation modal
 * @param {string} title - Modal title
 * @param {string} message - Modal message
 * @param {Function} onConfirm - Callback when confirmed
 */
function showConfirmModal(title, message, onConfirm) {
  const modal = document.getElementById('confirmModal');
  const modalTitle = document.getElementById('modalTitle');
  const modalMessage = document.getElementById('modalMessage');
  const btnConfirm = document.getElementById('btnModalConfirm');

  if (!modal || !modalTitle || !modalMessage || !btnConfirm) return;

  modalTitle.textContent = title;
  modalMessage.textContent = message;
  modal.setAttribute('aria-hidden', 'false');

  // Remove previous listeners
  const newBtnConfirm = btnConfirm.cloneNode(true);
  btnConfirm.parentNode.replaceChild(newBtnConfirm, btnConfirm);

  // Add new listener
  newBtnConfirm.addEventListener('click', () => {
    if (onConfirm) {
      onConfirm();
    }
    hideModal();
  });

  // Close on overlay click
  const overlay = modal.querySelector('.modal-overlay');
  if (overlay) {
    overlay.addEventListener('click', hideModal, { once: true });
  }
}

/**
 * Hide confirmation modal
 */
function hideModal() {
  const modal = document.getElementById('confirmModal');
  if (modal) {
    modal.setAttribute('aria-hidden', 'true');
  }
}

// ============================================
// Start the application
// ============================================

// Wait for DOM to be ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

// Export for testing purposes
export {
  init,
  bindEvents,
  setState,
  getState,
  handleNoteSelect,
  handleNoteCreate,
  handleNoteDelete,
  handleSearch,
  handleNoteSave,
  showToast,
  showConfirmModal,
};
