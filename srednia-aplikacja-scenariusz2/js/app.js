/**
 * App Controller
 * Main application controller coordinating UI and modules
 *
 * @module app
 */

/**
 * Application state
 */
const AppState = {
    currentNoteId: null,  // ID of note being edited (null for new note)
    activeFilter: 'all',  // Current active tag filter
};

/**
 * Initialize the application
 * Sets up event listeners and loads initial data
 */
function initApp() {
    initStorage();

    notes = loadNotes();

    renderNotes();
    renderTagFilters();

    setupEventListeners();
}

/**
 * Set up all event listeners
 */
function setupEventListeners() {
    const form = document.getElementById('note-form');
    form.addEventListener('submit', handleFormSubmit);

    const cancelBtn = document.getElementById('cancel-btn');
    cancelBtn.addEventListener('click', handleFormClear);
}

/**
 * Handle form submission
 * Creates new note or updates existing note
 *
 * @param {Event} event - Form submit event
 */
function handleFormSubmit(event) {
    event.preventDefault();

    const title = document.getElementById('note-title').value.trim();
    const content = document.getElementById('note-content').value.trim();
    const tagsInput = document.getElementById('note-tags').value;
    const tags = parseTagString(tagsInput);

    if (!title || !content) {
        showToast('Please fill in title and content', 'warning');
        return;
    }

    if (AppState.currentNoteId) {
        const updatedNote = updateNote(AppState.currentNoteId, title, content, tags);
        if (updatedNote) {
            showToast('Note updated successfully', 'success');
        } else {
            showToast('Failed to update note', 'error');
            return;
        }
    } else {
        createNote(title, content, tags);
        showToast('Note created successfully', 'success');
    }

    handleFormClear();
    renderNotes();
    renderTagFilters();
}

/**
 * Handle form clear/cancel
 */
function handleFormClear() {
    document.getElementById('note-form').reset();
    AppState.currentNoteId = null;

    const submitBtn = document.querySelector('#note-form button[type="submit"]');
    submitBtn.textContent = 'Save Note';
}

/**
 * Handle edit note action
 *
 * @param {string} noteId - ID of note to edit
 */
function handleEditNote(noteId) {
    const note = getNoteById(noteId);
    if (!note) return;

    document.getElementById('note-title').value = note.title;
    document.getElementById('note-content').value = note.content;
    document.getElementById('note-tags').value = note.tags.join(', ');

    AppState.currentNoteId = noteId;

    const submitBtn = document.querySelector('#note-form button[type="submit"]');
    submitBtn.textContent = 'Update Note';

    document.getElementById('note-editor').scrollIntoView({ behavior: 'smooth' });
}

/**
 * Handle delete note action
 *
 * @param {string} noteId - ID of note to delete
 */
function handleDeleteNote(noteId) {
    if (!confirm('Are you sure you want to delete this note?')) {
        return;
    }

    const success = deleteNote(noteId);

    if (success) {
        if (AppState.currentNoteId === noteId) {
            handleFormClear();
        }

        renderNotes();
        renderTagFilters();
        showToast('Note deleted successfully', 'success');
    } else {
        showToast('Failed to delete note', 'error');
    }
}

/**
 * Handle tag filter click
 *
 * @param {string} tag - Tag to filter by ('all' for no filter)
 */
function handleTagFilter(tag) {
    AppState.activeFilter = tag;
    renderTagFilters();
    renderNotes();
}

/**
 * Render all notes to the DOM
 * Respects current filter state
 */
function renderNotes() {
    const notesContainer = document.getElementById('notes-list');
    notesContainer.innerHTML = '';

    let notesToRender;
    if (AppState.activeFilter === 'all') {
        notesToRender = getAllNotes();
    } else {
        notesToRender = getNotesByTag(AppState.activeFilter);
    }

    if (notesToRender.length === 0) {
        const emptyState = document.createElement('p');
        emptyState.className = 'empty-state';
        emptyState.textContent = AppState.activeFilter === 'all'
            ? 'No notes yet. Create your first note above!'
            : `No notes found with tag "${AppState.activeFilter}"`;
        notesContainer.appendChild(emptyState);
    } else {
        notesToRender.forEach(note => {
            const noteCard = createNoteCard(note);
            notesContainer.appendChild(noteCard);
        });
    }
}

/**
 * Create a note card element
 *
 * @param {Object} note - Note object
 * @returns {HTMLElement} Note card element
 */
function createNoteCard(note) {
    const card = document.createElement('div');
    card.className = 'note-card fade-in';
    card.dataset.noteId = note.id;

    const header = document.createElement('div');
    header.className = 'note-card-header';

    const title = document.createElement('h3');
    title.className = 'note-card-title';
    title.textContent = note.title;
    header.appendChild(title);

    const content = document.createElement('p');
    content.className = 'note-card-content';
    content.textContent = truncateText(note.content, 150);

    const footer = document.createElement('div');
    footer.className = 'note-card-footer';

    const tagContainer = document.createElement('div');
    tagContainer.className = 'tag-container';

    note.tags.forEach(tag => {
        const tagSpan = document.createElement('span');
        tagSpan.className = 'tag';
        tagSpan.textContent = tag;
        tagContainer.appendChild(tagSpan);
    });

    const actions = document.createElement('div');
    actions.className = 'note-card-actions';

    const editBtn = document.createElement('button');
    editBtn.className = 'btn btn-secondary';
    editBtn.textContent = 'Edit';
    editBtn.onclick = () => handleEditNote(note.id);

    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'btn btn-secondary';
    deleteBtn.textContent = 'Delete';
    deleteBtn.onclick = () => handleDeleteNote(note.id);

    actions.appendChild(editBtn);
    actions.appendChild(deleteBtn);

    footer.appendChild(tagContainer);
    footer.appendChild(actions);

    card.appendChild(header);
    card.appendChild(content);
    card.appendChild(footer);

    return card;
}

/**
 * Render tag filter UI
 */
function renderTagFilters() {
    const tagList = document.getElementById('tag-list');
    tagList.innerHTML = '';

    const showAllTag = document.createElement('span');
    showAllTag.className = 'tag tag-all';
    showAllTag.textContent = 'Show All';
    showAllTag.dataset.tag = 'all';
    showAllTag.onclick = () => handleTagFilter('all');

    if (AppState.activeFilter === 'all') {
        showAllTag.classList.add('active');
    }

    tagList.appendChild(showAllTag);

    const tags = getAllTags();
    tags.forEach(tag => {
        const tagSpan = document.createElement('span');
        tagSpan.className = 'tag';
        tagSpan.textContent = tag;
        tagSpan.dataset.tag = tag;
        tagSpan.onclick = () => handleTagFilter(tag);

        if (AppState.activeFilter === tag) {
            tagSpan.classList.add('active');
        }

        tagList.appendChild(tagSpan);
    });
}

/**
 * Show toast notification
 *
 * @param {string} message - Message to display
 * @param {string} type - Toast type ('success', 'error', 'info', 'warning')
 */
function showToast(message, type = 'success') {
    const toastContainer = document.getElementById('toast-container');

    const toast = document.createElement('div');
    toast.className = `toast ${type} slide-in`;
    toast.textContent = message;

    toastContainer.appendChild(toast);

    setTimeout(() => {
        toast.classList.add('fade-out');
        setTimeout(() => {
            toastContainer.removeChild(toast);
        }, 250);
    }, 3000);
}

/**
 * Truncate text to specified length
 *
 * @param {string} text - Text to truncate
 * @param {number} maxLength - Maximum length
 * @returns {string} Truncated text with ellipsis
 */
function truncateText(text, maxLength = 100) {
    if (text.length <= maxLength) {
        return text;
    }
    return text.substring(0, maxLength) + '...';
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', initApp);
