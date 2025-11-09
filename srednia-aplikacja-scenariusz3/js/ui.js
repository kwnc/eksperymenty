/**
 * UI Module - Handles all user interface interactions for NoteNest
 *
 * Manages DOM manipulation, event handling, modal dialogs, and user feedback.
 * Provides the complete user interface layer for the note-taking application.
 *
 * @module UI
 * @version 1.0.0
 */
const UI = {
    elements: {},
    currentFilters: {
        search: '',
        tags: []
    },
    editingNoteId: null,

    init() {
        this.cacheElements();
        this.bindEvents();
        this.renderNotes();
        this.updateTagFilters();
        this.updateNoteCount();
    },

    cacheElements() {
        this.elements = {
            newNoteBtn: document.getElementById('new-note-btn'),
            searchInput: document.getElementById('search-input'),
            tagFilters: document.getElementById('tag-filters'),
            clearFiltersBtn: document.getElementById('clear-filters-btn'),
            noteCount: document.getElementById('note-count'),
            notesList: document.getElementById('notes-list'),
            emptyState: document.getElementById('empty-state'),
            noteModal: document.getElementById('note-modal'),
            modalTitle: document.getElementById('modal-title'),
            closeModalBtn: document.getElementById('close-modal-btn'),
            noteForm: document.getElementById('note-form'),
            noteTitle: document.getElementById('note-title'),
            noteContent: document.getElementById('note-content'),
            noteTags: document.getElementById('note-tags'),
            cancelBtn: document.getElementById('cancel-btn'),
            saveBtn: document.getElementById('save-btn'),
            toastContainer: document.getElementById('toast-container')
        };
    },

    bindEvents() {
        this.elements.newNoteBtn.addEventListener('click', () => this.showNoteModal());
        this.elements.searchInput.addEventListener('input', (e) => this.handleSearch(e.target.value));
        this.elements.clearFiltersBtn.addEventListener('click', () => this.clearFilters());
        this.elements.closeModalBtn.addEventListener('click', () => this.hideNoteModal());
        this.elements.cancelBtn.addEventListener('click', () => this.hideNoteModal());
        this.elements.noteForm.addEventListener('submit', (e) => this.handleNoteSubmit(e));

        document.addEventListener('click', (e) => {
            if (e.target === this.elements.noteModal) {
                this.hideNoteModal();
            }
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.elements.noteModal.classList.contains('active')) {
                this.hideNoteModal();
            }
        });

        this.elements.emptyState.querySelector('.btn').addEventListener('click', () => this.showNoteModal());
    },

    renderNotes(notesToRender = null) {
        const notes = notesToRender || this.getFilteredNotes();
        const notesList = this.elements.notesList;
        const emptyState = this.elements.emptyState;

        if (notes.length === 0) {
            notesList.style.display = 'none';
            emptyState.style.display = 'block';
        } else {
            notesList.style.display = 'grid';
            emptyState.style.display = 'none';
            notesList.innerHTML = notes.map(note => this.createNoteCard(note)).join('');
        }

        this.updateNoteCount(notes.length);
    },

    createNoteCard(note) {
        const formattedDate = new Date(note.updatedAt).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });

        const tagsHtml = note.tags.length > 0
            ? `<div class="note-tags">${note.tags.map(tag => `<span class="note-tag">${tag}</span>`).join('')}</div>`
            : '';

        return `
            <div class="note-card fade-in" data-id="${note.id}">
                <h3 class="note-title">${this.escapeHtml(note.title)}</h3>
                <p class="note-content">${this.escapeHtml(note.content)}</p>
                <div class="note-meta">
                    ${tagsHtml}
                    <span class="note-date">${formattedDate}</span>
                </div>
                <div class="note-actions" style="margin-top: 1rem; display: flex; gap: 0.5rem;">
                    <button class="btn btn-secondary" onclick="UI.editNote('${note.id}')" style="font-size: 0.8rem; padding: 0.3rem 0.6rem;">Edit</button>
                    <button class="btn" onclick="UI.deleteNote('${note.id}')" style="background: #dc3545; color: white; font-size: 0.8rem; padding: 0.3rem 0.6rem;">Delete</button>
                </div>
            </div>
        `;
    },

    getFilteredNotes() {
        let notes = Storage.loadNotes();

        if (this.currentFilters.search) {
            notes = Storage.searchNotes(this.currentFilters.search);
        }

        if (this.currentFilters.tags.length > 0) {
            notes = notes.filter(note =>
                this.currentFilters.tags.every(tag => note.tags.includes(tag))
            );
        }

        return notes;
    },

    showNoteModal(noteId = null) {
        this.editingNoteId = noteId;

        if (noteId) {
            const note = Storage.loadNotes().find(n => n.id === noteId);
            if (note) {
                this.elements.modalTitle.textContent = 'Edit Note';
                this.elements.noteTitle.value = note.title;
                this.elements.noteContent.value = note.content;
                this.elements.noteTags.value = note.tags.join(', ');
                this.elements.saveBtn.textContent = 'Update Note';
            }
        } else {
            this.elements.modalTitle.textContent = 'New Note';
            this.elements.noteForm.reset();
            this.elements.saveBtn.textContent = 'Save Note';
        }

        this.elements.noteModal.classList.add('active');
        this.elements.noteTitle.focus();
    },

    hideNoteModal() {
        this.elements.noteModal.classList.remove('active');
        this.elements.noteForm.reset();
        this.editingNoteId = null;
    },

    handleNoteSubmit(e) {
        e.preventDefault();

        const title = this.elements.noteTitle.value.trim();
        const content = this.elements.noteContent.value.trim();
        const tagsString = this.elements.noteTags.value.trim();
        const tags = tagsString ? tagsString.split(',').map(tag => tag.trim()).filter(tag => tag) : [];

        if (!title || !content) {
            this.showToast('Please fill in both title and content', 'error');
            return;
        }

        try {
            const noteData = { title, content, tags };

            if (this.editingNoteId) {
                Storage.updateNote(this.editingNoteId, noteData);
                this.showToast('Note updated successfully!', 'success');
            } else {
                Storage.saveNote(noteData);
                this.showToast('Note created successfully!', 'success');
            }

            this.hideNoteModal();
            this.renderNotes();
            this.updateTagFilters();
        } catch (error) {
            this.showToast('Error saving note: ' + error.message, 'error');
        }
    },

    editNote(noteId) {
        this.showNoteModal(noteId);
    },

    deleteNote(noteId) {
        if (confirm('Are you sure you want to delete this note?')) {
            try {
                Storage.deleteNote(noteId);
                this.showToast('Note deleted successfully!', 'success');
                this.renderNotes();
                this.updateTagFilters();
            } catch (error) {
                this.showToast('Error deleting note: ' + error.message, 'error');
            }
        }
    },

    handleSearch(query) {
        this.currentFilters.search = query;
        this.renderNotes();
    },

    updateTagFilters() {
        const tags = Storage.loadTags();
        const tagFiltersContainer = this.elements.tagFilters;

        if (tags.length === 0) {
            tagFiltersContainer.innerHTML = '<p style="color: #999; font-size: 0.8rem;">No tags yet</p>';
            return;
        }

        tagFiltersContainer.innerHTML = tags.map(tag => `
            <button class="tag-filter" data-tag="${tag}" onclick="UI.toggleTagFilter('${tag}')">
                ${this.escapeHtml(tag)}
            </button>
        `).join('');
    },

    toggleTagFilter(tag) {
        const index = this.currentFilters.tags.indexOf(tag);

        if (index === -1) {
            this.currentFilters.tags.push(tag);
        } else {
            this.currentFilters.tags.splice(index, 1);
        }

        this.updateTagFilterUI();
        this.renderNotes();
    },

    updateTagFilterUI() {
        const tagButtons = this.elements.tagFilters.querySelectorAll('.tag-filter');

        tagButtons.forEach(button => {
            const tag = button.dataset.tag;
            if (this.currentFilters.tags.includes(tag)) {
                button.classList.add('active');
            } else {
                button.classList.remove('active');
            }
        });
    },

    clearFilters() {
        this.currentFilters.search = '';
        this.currentFilters.tags = [];
        this.elements.searchInput.value = '';
        this.updateTagFilterUI();
        this.renderNotes();
    },

    updateNoteCount(count = null) {
        const totalNotes = count !== null ? count : Storage.loadNotes().length;
        const text = totalNotes === 1 ? '1 note' : `${totalNotes} notes`;
        this.elements.noteCount.textContent = text;
    },

    showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;

        this.elements.toastContainer.appendChild(toast);

        setTimeout(() => {
            toast.classList.add('show');
        }, 100);

        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.parentNode.removeChild(toast);
                }
            }, 300);
        }, 3000);
    },

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
};

document.addEventListener('DOMContentLoaded', () => {
    UI.init();
});