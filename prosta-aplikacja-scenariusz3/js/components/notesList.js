/**
 * Notes List Component
 * Manages the display and interaction of the notes list
 *
 * @module components/notesList
 */

import { formatTimestamp, truncateText } from '../utils.js';

/**
 * Render the notes list
 * @param {Object} options - Rendering options
 * @param {HTMLElement} options.container - Container element to render into
 * @param {Array<Note>} options.notes - Array of notes to display
 * @param {Function} options.onSelect - Callback when note is selected
 * @param {Function} options.onDelete - Callback when note is deleted
 * @param {string} options.selectedNoteId - ID of currently selected note
 */
export function renderNotesList(options) {
  const { container, notes, onSelect, onDelete, selectedNoteId } = options;

  // Clear existing content
  container.innerHTML = '';

  // Create notes list wrapper
  const notesList = document.createElement('div');
  notesList.className = 'notes-list';

  // If no notes, show empty state
  if (!notes || notes.length === 0) {
    showEmptyState(notesList);
    container.appendChild(notesList);
    return;
  }

  // Create notes list items container
  const notesListItems = document.createElement('div');
  notesListItems.className = 'notes-list-items';

  // Create note items
  notes.forEach(note => {
    const isSelected = note.id === selectedNoteId;
    const noteItem = createNoteItem(note, isSelected, onSelect, onDelete);
    notesListItems.appendChild(noteItem);
  });

  notesList.appendChild(notesListItems);
  container.appendChild(notesList);
}

/**
 * Create a single note item element
 * @private
 * @param {Note} note - Note object
 * @param {boolean} isSelected - Whether note is currently selected
 * @param {Function} onSelect - Selection callback
 * @param {Function} onDelete - Deletion callback
 * @returns {HTMLElement} Note item element
 */
function createNoteItem(note, isSelected, onSelect, onDelete) {
  const noteItem = document.createElement('div');
  noteItem.className = 'note-item';
  if (isSelected) {
    noteItem.classList.add('active');
  }
  noteItem.dataset.noteId = note.id;

  // Note item header (title + delete button)
  const noteItemHeader = document.createElement('div');
  noteItemHeader.className = 'note-item-header';

  const noteTitle = document.createElement('h3');
  noteTitle.className = 'note-title';
  noteTitle.textContent = note.title || 'Untitled Note';

  const btnDelete = document.createElement('button');
  btnDelete.className = 'btn-delete';
  btnDelete.textContent = '×';
  btnDelete.setAttribute('aria-label', 'Delete note');
  btnDelete.addEventListener('click', (e) => {
    e.stopPropagation(); // Prevent note selection when deleting
    if (onDelete) {
      onDelete(note.id);
    }
  });

  noteItemHeader.appendChild(noteTitle);
  noteItemHeader.appendChild(btnDelete);

  // Note preview
  const notePreview = document.createElement('p');
  notePreview.className = 'note-preview';
  const preview = note.content ? truncateText(note.content, 100) : 'No content';
  notePreview.textContent = preview;

  // Note timestamp
  const noteTimestamp = document.createElement('span');
  noteTimestamp.className = 'note-timestamp';
  noteTimestamp.textContent = formatTimestamp(note.updatedAt);

  // Click listener for selection
  noteItem.addEventListener('click', () => {
    if (onSelect) {
      onSelect(note.id);
    }
  });

  // Assemble the note item
  noteItem.appendChild(noteItemHeader);
  noteItem.appendChild(notePreview);
  noteItem.appendChild(noteTimestamp);

  return noteItem;
}

/**
 * Update a specific note item in the list
 * @param {string} noteId - Note ID to update
 * @param {Object} updates - Updates to apply
 */
export function updateNoteItem(noteId, updates) {
  const noteItem = document.querySelector(`.note-item[data-note-id="${noteId}"]`);
  if (!noteItem) return;

  // Update title if provided
  if (updates.title !== undefined) {
    const titleElement = noteItem.querySelector('.note-title');
    if (titleElement) {
      titleElement.textContent = updates.title || 'Untitled Note';
    }
  }

  // Update content preview if provided
  if (updates.content !== undefined) {
    const previewElement = noteItem.querySelector('.note-preview');
    if (previewElement) {
      const preview = updates.content ? truncateText(updates.content, 100) : 'No content';
      previewElement.textContent = preview;
    }
  }

  // Update timestamp if provided
  if (updates.updatedAt !== undefined) {
    const timestampElement = noteItem.querySelector('.note-timestamp');
    if (timestampElement) {
      timestampElement.textContent = formatTimestamp(updates.updatedAt);
    }
  }
}

/**
 * Add a new note to the list
 * @param {Note} note - Note to add
 */
export function addNoteToList(note) {
  const notesListItems = document.querySelector('.notes-list-items');
  if (!notesListItems) return;

  // Remove empty state if it exists
  const emptyState = document.querySelector('.empty-state');
  if (emptyState) {
    emptyState.remove();
  }

  // Create note item (will need callbacks, but for now create basic element)
  const noteItem = createNoteItem(note, false, null, null);

  // Insert at top of list (most recent first)
  notesListItems.insertBefore(noteItem, notesListItems.firstChild);
}

/**
 * Remove a note from the list
 * @param {string} noteId - Note ID to remove
 */
export function removeNoteFromList(noteId) {
  const noteItem = document.querySelector(`.note-item[data-note-id="${noteId}"]`);
  if (noteItem) {
    noteItem.remove();
  }

  // Check if list is now empty
  const notesListItems = document.querySelector('.notes-list-items');
  if (notesListItems && notesListItems.children.length === 0) {
    const notesList = document.querySelector('.notes-list');
    if (notesList) {
      showEmptyState(notesList);
    }
  }
}

/**
 * Update entire notes list (for search results)
 * @param {Array<Note>} notes - Filtered notes array
 */
export function updateNotesList(notes) {
  const container = document.querySelector('#notesList');
  if (!container) return;

  // This function will be called from app.js which has access to callbacks
  // For now, just clear and show message
  const notesList = container.querySelector('.notes-list');
  if (notesList) {
    if (!notes || notes.length === 0) {
      notesList.innerHTML = '';
      showEmptyState(notesList, 'No notes found.');
    }
  }
}

/**
 * Show empty state in notes list
 * @private
 * @param {HTMLElement} container - Container element
 * @param {string} message - Optional custom message
 */
function showEmptyState(container, message = 'No notes yet.') {
  const emptyState = document.createElement('div');
  emptyState.className = 'empty-state';

  const emptyMessage = document.createElement('p');
  emptyMessage.textContent = message;

  const emptyHint = document.createElement('p');
  emptyHint.className = 'empty-state-hint';
  emptyHint.textContent = 'Click "New Note" to get started!';

  emptyState.appendChild(emptyMessage);
  if (message === 'No notes yet.') {
    emptyState.appendChild(emptyHint);
  }

  container.appendChild(emptyState);
}
