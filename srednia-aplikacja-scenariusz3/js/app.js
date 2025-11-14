/**
 * app.js - Application Controller
 * Orchestrate application logic and coordinate between modules
 */

/**
 * Application state
 */
const appState = {
  initialized: false,
  currentView: 'list', // 'list' or 'editor'
  settings: null
};

/**
 * Initialize the application
 */
function init() {
  if (appState.initialized) return;

  // Check localStorage availability
  if (!isStorageAvailable()) {
    alert('localStorage is not available. The app will not work properly.');
    return;
  }

  // Initialize modules
  initNotes();
  appState.settings = loadSettings();
  initUI();

  // Restore last view if applicable
  if (appState.settings.lastActiveNote) {
    const note = getNoteById(appState.settings.lastActiveNote);
    if (note) {
      setCurrentNote(note.id);
      showNoteEditorView();
      renderNoteEditor(note);
    }
  }

  appState.initialized = true;
  console.log('NoteNest initialized successfully');
}

// Initialize on DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

/**
 * Handle new note button click
 */
function handleNewNote() {
  setCurrentNote(null);
  showNoteEditorView();
  renderNoteEditor(null);
}

/**
 * Handle show all notes
 */
function handleShowAllNotes() {
  filterNotesByTag(null);
  updateViewTitle('All Notes');
  renderView();
}

/**
 * Handle back to list button
 */
function handleBackToList() {
  showNotesListView();
  renderView();
}

/**
 * Handle save note
 */
function handleSaveNote() {
  const title = document.getElementById('note-title').value.trim();
  const content = document.getElementById('note-content').value.trim();
  const tagsString = document.getElementById('note-tags').value;
  const tags = parseTags(tagsString);

  if (!title) {
    showNotification('Please enter a note title', 'error');
    return;
  }

  const currentNote = getCurrentNote();

  if (currentNote) {
    // Update existing note
    const updated = updateNote(currentNote.id, { title, content, tags });
    if (updated) {
      showNotification('Note updated successfully', 'success');
      renderNoteEditor(updated);
    } else {
      showNotification('Failed to update note', 'error');
    }
  } else {
    // Create new note
    const created = createNote(title, content, tags);
    if (created) {
      showNotification('Note created successfully', 'success');
      setCurrentNote(created.id);
      renderNoteEditor(created);
    } else {
      showNotification('Failed to create note', 'error');
    }
  }

  // Update list view in background
  renderView();
}

/**
 * Handle auto-save on blur
 */
function handleAutoSave() {
  const currentNote = getCurrentNote();
  if (currentNote) {
    handleSaveNote();
  }
}

/**
 * Handle delete note button
 */
function handleDeleteNote() {
  showDeleteModal();
}

/**
 * Confirm delete
 */
function confirmDelete() {
  const currentNote = getCurrentNote();
  if (currentNote) {
    const success = deleteNote(currentNote.id);
    if (success) {
      showNotification('Note deleted successfully', 'success');
      hideDeleteModal();
      handleBackToList();
    } else {
      showNotification('Failed to delete note', 'error');
    }
  }
}

/**
 * Cancel delete
 */
function cancelDelete() {
  hideDeleteModal();
}

/**
 * Handle note card click
 * @param {string} noteId - Note ID
 */
function handleNoteClick(noteId) {
  const note = getNoteById(noteId);
  if (note) {
    setCurrentNote(noteId);
    showNoteEditorView();
    renderNoteEditor(note);

    // Save as last active note
    appState.settings.lastActiveNote = noteId;
    saveSettings(appState.settings);
  }
}

/**
 * Handle tag filter
 * @param {string} tag - Tag to filter by
 */
function handleTagFilter(tag) {
  const filtered = filterNotesByTag(tag);
  updateViewTitle(`Notes tagged with "${tag}"`);
  renderNotesList(filtered);
}

/**
 * Handle search
 * @param {Event} e - Input event
 */
function handleSearch(e) {
  const query = e.target.value.trim();
  const results = searchNotes(query);

  if (query) {
    updateViewTitle(`Search results for "${query}"`);
  } else {
    updateViewTitle('All Notes');
  }

  renderNotesList(results);
}
