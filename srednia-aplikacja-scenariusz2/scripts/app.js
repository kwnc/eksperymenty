// Main Application Logic for NoteNest
// To be implemented by Agent 2

// Application state
let currentEditingNote = null;

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('NoteNest app loaded');
    initApp();
});

function initApp() {
    setupEventListeners();
    renderNotesList();
    updateTagsList();

    document.getElementById('note-title').focus();
}

function setupEventListeners() {
    const noteForm = document.getElementById('note-form');
    const allNotesFilter = document.querySelector('[data-tag="all"]');

    noteForm.addEventListener('submit', handleNoteSubmit);

    if (allNotesFilter) {
        allNotesFilter.addEventListener('click', () => {
            filterNotesByTagUI('all');
        });
    }
}

function handleNoteSubmit(event) {
    event.preventDefault();

    const titleInput = document.getElementById('note-title');
    const contentInput = document.getElementById('note-content');
    const tagsInput = document.getElementById('note-tags');

    const title = titleInput.value.trim();
    const content = contentInput.value.trim();
    const tagsString = tagsInput.value.trim();

    if (!title || !content) {
        showToast('Please fill in both title and content', 'error');
        return;
    }

    const tags = tagsString ? tagsString.split(',').map(tag => tag.trim()).filter(tag => tag) : [];

    try {
        if (currentEditingNote) {
            editNote(currentEditingNote.id, title, content, tags);
            showToast('Note updated successfully!', 'success');
            currentEditingNote = null;
            document.getElementById('save-note').textContent = 'Save Note';
            document.querySelector('#note-editor h2').textContent = 'Create New Note';
        } else {
            createNote(title, content, tags);
            showToast('Note created successfully!', 'success');
        }

        titleInput.value = '';
        contentInput.value = '';
        tagsInput.value = '';
        titleInput.focus();

        renderNotesList();
        updateTagsList();

    } catch (error) {
        showToast('Error saving note', 'error');
        console.error('Error saving note:', error);
    }
}

function renderNotesList(notes = null) {
    const notesToRender = notes || getAllNotes();
    const container = document.getElementById('notes-container');
    const noNotesMessage = document.getElementById('no-notes-message');

    if (notesToRender.length === 0) {
        noNotesMessage.style.display = 'block';
        container.innerHTML = '<p id="no-notes-message">No notes yet. Create your first note above!</p>';
        return;
    }

    if (noNotesMessage) {
        noNotesMessage.style.display = 'none';
    }

    const notesHTML = notesToRender.map(note => `
        <div class="note-item" data-note-id="${note.id}">
            <div class="note-title">${escapeHtml(note.title)}</div>
            <div class="note-content">${escapeHtml(note.content)}</div>
            <div class="note-meta">
                <div class="note-tags">
                    ${note.tags.map(tag => `<span class="tag">${escapeHtml(tag)}</span>`).join('')}
                </div>
                <div class="note-date">${formatDate(note.updatedAt)}</div>
            </div>
            <div class="note-actions" style="margin-top: 10px;">
                <button onclick="editNoteUI('${note.id}')" style="background: var(--primary-color); color: white; border: none; padding: 5px 10px; border-radius: 4px; margin-right: 5px; cursor: pointer;">Edit</button>
                <button onclick="deleteNoteUI('${note.id}')" style="background: #f44336; color: white; border: none; padding: 5px 10px; border-radius: 4px; cursor: pointer;">Delete</button>
            </div>
        </div>
    `).join('');

    container.innerHTML = notesHTML;
}

function editNoteUI(noteId) {
    const note = getNoteById(noteId);
    if (!note) return;

    currentEditingNote = note;

    document.getElementById('note-title').value = note.title;
    document.getElementById('note-content').value = note.content;
    document.getElementById('note-tags').value = note.tags.join(', ');

    document.getElementById('save-note').textContent = 'Update Note';
    document.querySelector('#note-editor h2').textContent = 'Edit Note';

    document.getElementById('note-title').focus();

    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function deleteNoteUI(noteId) {
    if (confirm('Are you sure you want to delete this note?')) {
        try {
            deleteNoteById(noteId);
            showToast('Note deleted successfully', 'success');
            renderNotesList();
            updateTagsList();

            if (currentEditingNote && currentEditingNote.id === noteId) {
                currentEditingNote = null;
                document.getElementById('note-form').reset();
                document.getElementById('save-note').textContent = 'Save Note';
                document.querySelector('#note-editor h2').textContent = 'Create New Note';
            }
        } catch (error) {
            showToast('Error deleting note', 'error');
            console.error('Error deleting note:', error);
        }
    }
}

function showToast(message, type = 'success') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;

    container.appendChild(toast);

    setTimeout(() => {
        toast.classList.add('show');
    }, 100);

    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => {
            if (container.contains(toast)) {
                container.removeChild(toast);
            }
        }, 300);
    }, 3000);
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Make functions globally available for inline event handlers
window.editNoteUI = editNoteUI;
window.deleteNoteUI = deleteNoteUI;