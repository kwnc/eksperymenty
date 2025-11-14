// NoteNest - Simple Note Taking App
// Local storage management

class NoteApp {
    constructor() {
        this.notes = [];
        this.currentEditId = null;
        this.init();
    }

    init() {
        this.loadNotes();
        this.setupEventListeners();
        this.renderNotes();
        this.updateTagFilter();
    }

    // Load notes from localStorage
    loadNotes() {
        const storedNotes = localStorage.getItem('noteNestNotes');
        if (storedNotes) {
            try {
                this.notes = JSON.parse(storedNotes);
            } catch (error) {
                console.error('Error loading notes:', error);
                this.notes = [];
            }
        }
    }

    // Save notes to localStorage
    saveNotes() {
        try {
            localStorage.setItem('noteNestNotes', JSON.stringify(this.notes));
        } catch (error) {
            console.error('Error saving notes:', error);
            this.showToast('Error saving notes', 'error');
        }
    }

    // Setup event listeners
    setupEventListeners() {
        const saveBtn = document.getElementById('save-note-btn');
        const cancelBtn = document.getElementById('cancel-edit-btn');
        const tagFilter = document.getElementById('tag-filter-select');

        saveBtn.addEventListener('click', () => this.saveNote());
        cancelBtn.addEventListener('click', () => this.cancelEdit());
        tagFilter.addEventListener('change', (e) => this.filterByTag(e.target.value));

        // Allow saving with Ctrl/Cmd + Enter
        document.getElementById('note-content').addEventListener('keydown', (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                this.saveNote();
            }
        });
    }

    // Create or update a note
    saveNote() {
        const title = document.getElementById('note-title').value.trim();
        const content = document.getElementById('note-content').value.trim();
        const tagsInput = document.getElementById('note-tags').value.trim();

        if (!title || !content) {
            this.showToast('Please enter both title and content', 'error');
            return;
        }

        // Process tags
        const tags = tagsInput
            .split(',')
            .map(tag => tag.trim())
            .filter(tag => tag.length > 0);

        if (this.currentEditId !== null) {
            // Update existing note
            const noteIndex = this.notes.findIndex(note => note.id === this.currentEditId);
            if (noteIndex !== -1) {
                this.notes[noteIndex] = {
                    ...this.notes[noteIndex],
                    title,
                    content,
                    tags,
                    updatedAt: new Date().toISOString()
                };
                this.showToast('Note updated successfully', 'success');
            }
            this.currentEditId = null;
        } else {
            // Create new note
            const newNote = {
                id: Date.now(),
                title,
                content,
                tags,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };
            this.notes.unshift(newNote);
            this.showToast('Note created successfully', 'success');
        }

        this.saveNotes();
        this.clearForm();
        this.renderNotes();
        this.updateTagFilter();
    }

    // Edit a note
    editNote(id) {
        const note = this.notes.find(note => note.id === id);
        if (!note) return;

        this.currentEditId = id;
        document.getElementById('note-title').value = note.title;
        document.getElementById('note-content').value = note.content;
        document.getElementById('note-tags').value = note.tags.join(', ');

        document.getElementById('editor-title').textContent = 'Edit Note';
        document.getElementById('save-note-btn').textContent = 'Update Note';
        document.getElementById('cancel-edit-btn').style.display = 'inline-block';

        // Scroll to editor
        document.querySelector('.note-editor').scrollIntoView({ behavior: 'smooth' });
    }

    // Cancel editing
    cancelEdit() {
        this.currentEditId = null;
        this.clearForm();
    }

    // Delete a note
    deleteNote(id) {
        if (!confirm('Are you sure you want to delete this note?')) {
            return;
        }

        this.notes = this.notes.filter(note => note.id !== id);
        this.saveNotes();
        this.renderNotes();
        this.updateTagFilter();
        this.showToast('Note deleted successfully', 'success');
    }

    // Clear the form
    clearForm() {
        document.getElementById('note-title').value = '';
        document.getElementById('note-content').value = '';
        document.getElementById('note-tags').value = '';
        document.getElementById('editor-title').textContent = 'Create New Note';
        document.getElementById('save-note-btn').textContent = 'Save Note';
        document.getElementById('cancel-edit-btn').style.display = 'none';
    }

    // Filter notes by tag
    filterByTag(tag) {
        if (tag === 'all') {
            this.renderNotes();
        } else {
            this.renderNotes(tag);
        }
    }

    // Render notes to the DOM
    renderNotes(filterTag = null) {
        const container = document.getElementById('notes-container');

        let notesToRender = this.notes;
        if (filterTag) {
            notesToRender = this.notes.filter(note => note.tags.includes(filterTag));
        }

        if (notesToRender.length === 0) {
            container.innerHTML = '<p class="empty-state">No notes found. Create your first note above!</p>';
            return;
        }

        container.innerHTML = notesToRender.map(note => this.createNoteCard(note)).join('');

        // Add event listeners to buttons
        notesToRender.forEach(note => {
            document.querySelector(`[data-edit-id="${note.id}"]`).addEventListener('click', () => this.editNote(note.id));
            document.querySelector(`[data-delete-id="${note.id}"]`).addEventListener('click', () => this.deleteNote(note.id));
        });
    }

    // Create HTML for a note card
    createNoteCard(note) {
        const tagsHtml = note.tags.length > 0
            ? `<div class="note-tags">
                ${note.tags.map(tag => `<span class="tag">${this.escapeHtml(tag)}</span>`).join('')}
               </div>`
            : '';

        const date = new Date(note.updatedAt).toLocaleString();

        return `
            <div class="note-card">
                <h3>${this.escapeHtml(note.title)}</h3>
                <p>${this.escapeHtml(note.content)}</p>
                ${tagsHtml}
                <small style="color: #888; display: block; margin-bottom: 10px;">Last updated: ${date}</small>
                <div class="note-actions">
                    <button class="btn-edit" data-edit-id="${note.id}">Edit</button>
                    <button class="btn-delete" data-delete-id="${note.id}">Delete</button>
                </div>
            </div>
        `;
    }

    // Update tag filter dropdown
    updateTagFilter() {
        const select = document.getElementById('tag-filter-select');
        const allTags = new Set();

        this.notes.forEach(note => {
            note.tags.forEach(tag => allTags.add(tag));
        });

        const currentValue = select.value;

        select.innerHTML = '<option value="all">All Notes</option>';

        Array.from(allTags).sort().forEach(tag => {
            const option = document.createElement('option');
            option.value = tag;
            option.textContent = tag;
            select.appendChild(option);
        });

        // Restore previous selection if still valid
        if (currentValue !== 'all' && allTags.has(currentValue)) {
            select.value = currentValue;
        }
    }

    // Show toast notification
    showToast(message, type = 'success') {
        const toast = document.getElementById('toast');
        toast.textContent = message;
        toast.className = `toast ${type} show`;

        setTimeout(() => {
            toast.classList.remove('show');
        }, 3000);
    }

    // Escape HTML to prevent XSS
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new NoteApp();
});
