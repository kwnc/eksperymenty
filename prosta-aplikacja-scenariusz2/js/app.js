/**
 * Main Application Logic
 * Initializes the app and handles user interactions
 */

// Global state
let currentNoteId = null;

/**
 * Initialize the application
 */
function init() {
    console.log('SimpleNote Local initialized');

    // Set up event listeners
    setupEventListeners();

    // Load and display all notes
    loadNotes();

    // Show empty state if no notes exist
    const notes = getAllNotes();
    if (notes.length === 0) {
        renderNoteEditor(null);
    }
}

/**
 * Set up all event listeners
 */
function setupEventListeners() {
    // 1. New Note Buttons (both in sidebar and empty state)
    const newNoteBtn = document.getElementById('newNoteBtn');
    const emptyNewNoteBtn = document.getElementById('emptyNewNoteBtn');

    newNoteBtn.addEventListener('click', handleNewNote);
    emptyNewNoteBtn.addEventListener('click', handleNewNote);

    // 2. Save Note Button
    const saveNoteBtn = document.getElementById('saveNoteBtn');
    saveNoteBtn.addEventListener('click', handleSaveNote);

    // 3. Delete Note Button
    const deleteNoteBtn = document.getElementById('deleteNoteBtn');
    deleteNoteBtn.addEventListener('click', handleDeleteNote);

    // 4. Search Input (with debounce)
    const searchInput = document.getElementById('searchInput');
    const debouncedSearch = debounce((e) => {
        handleSearch(e.target.value);
    }, 300);
    searchInput.addEventListener('input', debouncedSearch);

    // 5. Auto-save on title and content changes (with debounce)
    const noteTitle = document.getElementById('noteTitle');
    const noteContent = document.getElementById('noteContent');

    const debouncedAutoSave = debounce(handleAutoSave, 1500);

    noteTitle.addEventListener('input', debouncedAutoSave);
    noteContent.addEventListener('input', debouncedAutoSave);
}

/**
 * Handle creating a new note
 */
function handleNewNote() {
    clearEditor();
    // clearEditor already sets currentNoteId to null and focuses on title
}

/**
 * Handle opening an existing note
 * @param {string} noteId - ID of note to open
 */
function handleOpenNote(noteId) {
    const note = getNoteById(noteId);
    if (note) {
        renderNoteEditor(note);
        updateActiveNote(noteId);
    }
}

/**
 * Handle saving the current note
 */
function handleSaveNote() {
    const noteTitle = document.getElementById('noteTitle');
    const noteContent = document.getElementById('noteContent');

    const title = noteTitle.value.trim();
    const content = noteContent.value.trim();

    // Validate that we have at least a title or content
    if (!title && !content) {
        showMessage('Please enter a title or content', 'error');
        return;
    }

    try {
        if (currentNoteId === null) {
            // Create new note
            const newNote = createNote(title || 'Untitled Note', content);
            currentNoteId = newNote.id;
            showMessage('Note created successfully!', 'success');
            renderNoteEditor(newNote);
        } else {
            // Update existing note
            const updatedNote = updateNote(currentNoteId, { title, content });
            if (updatedNote) {
                showMessage('Note saved successfully!', 'success');
                renderNoteEditor(updatedNote);
            } else {
                showMessage('Failed to save note', 'error');
            }
        }

        // Refresh note list
        loadNotes();
    } catch (error) {
        console.error('Error saving note:', error);
        showMessage('Error saving note', 'error');
    }
}

/**
 * Handle deleting the current note
 */
function handleDeleteNote() {
    if (!currentNoteId) {
        showMessage('No note to delete', 'error');
        return;
    }

    const confirmed = confirmAction('Are you sure you want to delete this note? This action cannot be undone.');

    if (!confirmed) {
        return;
    }

    try {
        const deleted = deleteNote(currentNoteId);

        if (deleted) {
            showMessage('Note deleted successfully', 'success');
            currentNoteId = null;

            // Refresh note list
            loadNotes();

            // Show empty state or first note
            const notes = getAllNotes();
            if (notes.length > 0) {
                handleOpenNote(notes[0].id);
            } else {
                renderNoteEditor(null);
            }
        } else {
            showMessage('Failed to delete note', 'error');
        }
    } catch (error) {
        console.error('Error deleting note:', error);
        showMessage('Error deleting note', 'error');
    }
}

/**
 * Handle search input
 * @param {string} query - Search query
 */
function handleSearch(query) {
    const notes = searchNotes(query);
    renderNoteList(notes);
}

/**
 * Handle auto-save (called on input with debounce)
 */
function handleAutoSave() {
    // Only auto-save if we're editing an existing note
    if (!currentNoteId) {
        return;
    }

    const noteTitle = document.getElementById('noteTitle');
    const noteContent = document.getElementById('noteContent');

    const title = noteTitle.value.trim();
    const content = noteContent.value.trim();

    try {
        const updatedNote = updateNote(currentNoteId, { title, content });
        if (updatedNote) {
            // Refresh note list to show updated preview
            loadNotes();
            // Update metadata in editor
            const noteMetadata = document.getElementById('noteMetadata');
            const createdDate = formatDate(updatedNote.createdAt);
            const updatedDate = formatDate(updatedNote.updatedAt);
            noteMetadata.textContent = `Created: ${createdDate} | Updated: ${updatedDate}`;
        }
    } catch (error) {
        console.error('Error auto-saving note:', error);
    }
}

/**
 * Load and display all notes
 */
function loadNotes() {
    const notes = getAllNotes();
    renderNoteList(notes);
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', init);

// TODO [Agent 2]: Additional suggestions:
// - Consider adding keyboard shortcuts (Ctrl+N for new note, Ctrl+S for save, etc.)
// - Consider adding a character/word count indicator
// - Consider highlighting search terms in results
// - Add error handling for storage quota exceeded
