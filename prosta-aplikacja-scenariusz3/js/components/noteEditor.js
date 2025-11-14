/**
 * Note Editor Component
 * Manages the note editing interface and auto-save functionality
 *
 * @module components/noteEditor
 */

import { debounce, formatTimestamp } from '../utils.js';

// Editor state
let currentNote = null;
let autoSaveCallback = null;
let debouncedSave = null;
let isDirty = false;

/**
 * Render the note editor
 * @param {Object} options - Rendering options
 * @param {HTMLElement} options.container - Container element
 * @param {Note|null} options.note - Note to edit (null for empty editor)
 * @param {Function} options.onSave - Callback when note is saved
 * @param {number} options.autoSaveDelay - Auto-save delay in ms (default 1000)
 */
export function renderEditor(options) {
  const { container, note, onSave, autoSaveDelay = 1000 } = options;

  // Clear existing content
  container.innerHTML = '';

  // If no note, show empty editor state
  if (!note) {
    showEmptyEditor(container);
    currentNote = null;
    disableAutoSave();
    return;
  }

  // Store current note
  currentNote = note;

  // Create editor UI
  const editorElement = createEditorUI(note, onSave);
  container.appendChild(editorElement);

  // Set up auto-save
  enableAutoSave(onSave, autoSaveDelay);

  // Initialize character count
  updateCharCount();

  // Update last saved time
  updateLastSaved();

  // Focus on title if empty, otherwise on content
  setTimeout(() => {
    if (!note.title) {
      const titleInput = container.querySelector('.editor-title');
      if (titleInput) titleInput.focus();
    } else {
      const contentTextarea = container.querySelector('.editor-content');
      if (contentTextarea) contentTextarea.focus();
    }
  }, 100);

  isDirty = false;
}

/**
 * Create editor UI elements
 * @private
 * @param {Note} note - Note to edit
 * @param {Function} onSave - Save callback
 * @returns {HTMLElement} Editor element
 */
function createEditorUI(note, onSave) {
  const noteEditor = document.createElement('div');
  noteEditor.className = 'note-editor';

  // Editor header
  const editorHeader = document.createElement('div');
  editorHeader.className = 'editor-header';

  const editorTitle = document.createElement('input');
  editorTitle.type = 'text';
  editorTitle.className = 'editor-title';
  editorTitle.placeholder = 'Note title...';
  editorTitle.value = note.title || '';
  editorTitle.maxLength = 100;

  const editorControls = document.createElement('div');
  editorControls.className = 'editor-controls';

  const saveStatus = document.createElement('span');
  saveStatus.className = 'save-status saved';
  saveStatus.textContent = 'Saved';

  const btnSave = document.createElement('button');
  btnSave.className = 'btn btn-primary btn-save';
  btnSave.textContent = 'Save';
  btnSave.addEventListener('click', () => {
    if (onSave) {
      saveNow(onSave);
    }
  });

  editorControls.appendChild(saveStatus);
  editorControls.appendChild(btnSave);

  editorHeader.appendChild(editorTitle);
  editorHeader.appendChild(editorControls);

  // Editor content textarea
  const editorContent = document.createElement('textarea');
  editorContent.className = 'editor-content';
  editorContent.placeholder = 'Start typing...';
  editorContent.value = note.content || '';
  editorContent.maxLength = 100000;

  // Editor footer
  const editorFooter = document.createElement('div');
  editorFooter.className = 'editor-footer';

  const charCount = document.createElement('span');
  charCount.className = 'char-count';
  charCount.textContent = '0 characters';

  const lastSaved = document.createElement('span');
  lastSaved.className = 'last-saved';
  lastSaved.textContent = 'Last saved: Just now';

  editorFooter.appendChild(charCount);
  editorFooter.appendChild(lastSaved);

  // Assemble editor
  noteEditor.appendChild(editorHeader);
  noteEditor.appendChild(editorContent);
  noteEditor.appendChild(editorFooter);

  return noteEditor;
}

/**
 * Get current editor content
 * @returns {Object} { title: string, content: string }
 */
export function getEditorContent() {
  const titleInput = document.querySelector('.editor-title');
  const contentTextarea = document.querySelector('.editor-content');

  return {
    title: titleInput ? titleInput.value : '',
    content: contentTextarea ? contentTextarea.value : ''
  };
}

/**
 * Set editor content
 * @param {Note} note - Note to display
 */
export function setEditorContent(note) {
  const titleInput = document.querySelector('.editor-title');
  const contentTextarea = document.querySelector('.editor-content');

  if (titleInput) {
    titleInput.value = note.title || '';
  }

  if (contentTextarea) {
    contentTextarea.value = note.content || '';
  }

  currentNote = note;
  updateCharCount();
  updateLastSaved();
  isDirty = false;
}

/**
 * Clear the editor
 */
export function clearEditor() {
  const container = document.querySelector('#noteEditor');
  if (container) {
    container.innerHTML = '';
    showEmptyEditor(container);
  }

  disableAutoSave();
  currentNote = null;
  isDirty = false;
}

/**
 * Enable auto-save functionality
 * @param {Function} onSave - Save callback
 * @param {number} delay - Debounce delay in ms
 */
export function enableAutoSave(onSave, delay = 1000) {
  // Disable existing auto-save if any
  disableAutoSave();

  // Store callback
  autoSaveCallback = onSave;

  // Create debounced save function
  debouncedSave = debounce(() => {
    if (!currentNote) return;

    updateSaveStatus('saving');

    const content = getEditorContent();
    const updatedNote = {
      ...currentNote,
      title: content.title,
      content: content.content,
      updatedAt: Date.now()
    };

    if (onSave) {
      onSave(updatedNote);
      updateSaveStatus('saved');
      updateLastSaved();
      isDirty = false;
    }
  }, delay);

  // Attach to title and content inputs
  const titleInput = document.querySelector('.editor-title');
  const contentTextarea = document.querySelector('.editor-content');

  if (titleInput) {
    titleInput.addEventListener('input', handleInputChange);
  }

  if (contentTextarea) {
    contentTextarea.addEventListener('input', handleInputChange);
  }
}

/**
 * Disable auto-save
 */
export function disableAutoSave() {
  // Remove event listeners
  const titleInput = document.querySelector('.editor-title');
  const contentTextarea = document.querySelector('.editor-content');

  if (titleInput) {
    titleInput.removeEventListener('input', handleInputChange);
  }

  if (contentTextarea) {
    contentTextarea.removeEventListener('input', handleInputChange);
  }

  debouncedSave = null;
  autoSaveCallback = null;
}

/**
 * Manually save current note
 * @param {Function} onSave - Save callback
 */
export function saveNow(onSave) {
  if (!currentNote) return;

  updateSaveStatus('saving');

  const content = getEditorContent();
  const updatedNote = {
    ...currentNote,
    title: content.title,
    content: content.content,
    updatedAt: Date.now()
  };

  if (onSave) {
    onSave(updatedNote);
    updateSaveStatus('saved');
    updateLastSaved();
    isDirty = false;
  }
}

/**
 * Update character count display
 * @private
 */
function updateCharCount() {
  const contentTextarea = document.querySelector('.editor-content');
  const charCountElement = document.querySelector('.char-count');

  if (!contentTextarea || !charCountElement) return;

  const length = contentTextarea.value.length;
  charCountElement.textContent = `${length.toLocaleString()} character${length !== 1 ? 's' : ''}`;

  // Add warning if approaching limit (90% of 100,000)
  if (length > 90000) {
    charCountElement.style.color = 'var(--color-warning)';
  } else {
    charCountElement.style.color = '';
  }
}

/**
 * Update save status indicator
 * @private
 * @param {string} status - 'saving', 'saved', or 'error'
 */
function updateSaveStatus(status) {
  const saveStatusElement = document.querySelector('.save-status');
  if (!saveStatusElement) return;

  // Remove all status classes
  saveStatusElement.classList.remove('saving', 'saved', 'error');

  // Add new status class
  saveStatusElement.classList.add(status);

  // Update text
  switch (status) {
    case 'saving':
      saveStatusElement.textContent = 'Saving...';
      break;
    case 'saved':
      saveStatusElement.textContent = 'Saved';
      break;
    case 'error':
      saveStatusElement.textContent = 'Error';
      break;
    default:
      saveStatusElement.textContent = 'Saved';
  }
}

/**
 * Update last saved timestamp display
 * @private
 */
function updateLastSaved() {
  const lastSavedElement = document.querySelector('.last-saved');
  if (!lastSavedElement || !currentNote) return;

  const timeStr = formatTimestamp(currentNote.updatedAt);
  lastSavedElement.textContent = `Last saved: ${timeStr}`;
}

/**
 * Show empty editor state
 * @private
 * @param {HTMLElement} container - Container element
 */
function showEmptyEditor(container) {
  const noteEditor = document.createElement('div');
  noteEditor.className = 'note-editor';

  const emptyEditorState = document.createElement('div');
  emptyEditorState.className = 'empty-editor-state';

  const message = document.createElement('p');
  message.textContent = 'Select a note or create a new one to start writing.';

  emptyEditorState.appendChild(message);
  noteEditor.appendChild(emptyEditorState);
  container.appendChild(noteEditor);
}

/**
 * Handle input change
 * @private
 */
function handleInputChange() {
  isDirty = true;
  updateCharCount();

  // Trigger debounced auto-save
  if (debouncedSave) {
    debouncedSave();
  }
}
