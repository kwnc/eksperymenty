/**
 * UI Management Module
 * Handles all DOM manipulation and rendering
 */

/**
 * Render the list of notes in the sidebar
 * @param {Array<Object>} notes - Array of note objects
 */
function renderNoteList(notes) {
    const noteList = document.getElementById('noteList');
    noteList.innerHTML = '';

    if (notes.length === 0) {
        noteList.innerHTML = '<p class="empty-list">No notes yet. Create your first note!</p>';
        return;
    }

    notes.forEach(note => {
        const noteItem = document.createElement('div');
        noteItem.className = 'note-item';
        noteItem.dataset.noteId = note.id;

        // Add active class if this is the current note
        if (note.id === currentNoteId) {
            noteItem.classList.add('active');
        }

        const title = document.createElement('div');
        title.className = 'note-item-title';
        title.textContent = note.title;

        const preview = document.createElement('div');
        preview.className = 'note-item-preview';
        preview.textContent = truncateText(note.content, 60);

        const date = document.createElement('div');
        date.className = 'note-item-date';
        date.textContent = formatDate(note.updatedAt);

        noteItem.appendChild(title);
        noteItem.appendChild(preview);
        noteItem.appendChild(date);

        // Add click event to open note
        noteItem.addEventListener('click', () => {
            handleOpenNote(note.id);
        });

        noteList.appendChild(noteItem);
    });
}

/**
 * Render the note editor with a specific note
 * @param {Object|null} note - Note object to edit, or null for new note
 */
function renderNoteEditor(note) {
    const emptyState = document.getElementById('emptyState');
    const editorArea = document.getElementById('editorArea');
    const noteTitle = document.getElementById('noteTitle');
    const noteContent = document.getElementById('noteContent');
    const noteMetadata = document.getElementById('noteMetadata');

    if (!note) {
        emptyState.style.display = 'flex';
        editorArea.style.display = 'none';
        setCurrentNoteId(null);
        return;
    }

    emptyState.style.display = 'none';
    editorArea.style.display = 'flex';

    noteTitle.value = note.title;
    noteContent.value = note.content;

    const createdDate = formatDate(note.createdAt);
    const updatedDate = formatDate(note.updatedAt);
    noteMetadata.textContent = `Created: ${createdDate} | Updated: ${updatedDate}`;

    setCurrentNoteId(note.id);
}

/**
 * Show a temporary message/notification
 * @param {string} message - Message text
 * @param {string} type - Message type: 'success' or 'error'
 */
function showMessage(message, type = 'success') {
    const messageContainer = document.getElementById('messageContainer');

    const messageDiv = document.createElement('div');
    messageDiv.className = `message message-${type}`;
    messageDiv.textContent = message;

    messageContainer.appendChild(messageDiv);

    // Auto-remove after 3 seconds
    setTimeout(() => {
        messageDiv.remove();
    }, 3000);
}

/**
 * Clear the editor (for new note)
 */
function clearEditor() {
    const emptyState = document.getElementById('emptyState');
    const editorArea = document.getElementById('editorArea');
    const noteTitle = document.getElementById('noteTitle');
    const noteContent = document.getElementById('noteContent');
    const noteMetadata = document.getElementById('noteMetadata');

    noteTitle.value = '';
    noteContent.value = '';
    noteMetadata.textContent = '';

    setCurrentNoteId(null);

    emptyState.style.display = 'none';
    editorArea.style.display = 'flex';

    // Focus on title input
    noteTitle.focus();
}

/**
 * Get the current note being edited
 * @returns {string|null} Current note ID or null
 */
function getCurrentNoteId() {
    return currentNoteId;
}

/**
 * Set the current note being edited
 * @param {string|null} noteId - Note ID to set as current
 */
function setCurrentNoteId(noteId) {
    currentNoteId = noteId;
}

/**
 * Confirm action with user
 * @param {string} message - Confirmation message
 * @returns {boolean} True if confirmed
 */
function confirmAction(message) {
    // TODO [Agent 2]: Implement confirmAction
    // Use window.confirm() for simple confirmation dialog
    return window.confirm(message);
}

/**
 * Update the active note in the list UI
 * @param {string} noteId - ID of note to mark as active
 */
function updateActiveNote(noteId) {
    const allNoteItems = document.querySelectorAll('.note-item');
    allNoteItems.forEach(item => {
        item.classList.remove('active');
    });

    if (noteId) {
        const activeItem = document.querySelector(`.note-item[data-note-id="${noteId}"]`);
        if (activeItem) {
            activeItem.classList.add('active');
        }
    }
}
