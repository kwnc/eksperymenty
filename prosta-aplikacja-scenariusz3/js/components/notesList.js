class NotesList {
    constructor(storage, onNoteSelect) {
        this.storage = storage;
        this.onNoteSelect = onNoteSelect;
        this.notes = [];
        this.filteredNotes = [];
        this.selectedNoteId = null;
        this.searchQuery = '';

        this.initElements();
        this.bindEvents();
        this.loadNotes();
    }

    initElements() {
        this.container = document.getElementById('notes-list');
        this.searchInput = document.getElementById('search-input');
    }

    bindEvents() {
        this.searchInput.addEventListener('input', (e) => {
            this.searchQuery = e.target.value;
            this.filterNotes();
        });

        this.searchInput.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.searchInput.value = '';
                this.searchQuery = '';
                this.filterNotes();
                this.searchInput.blur();
            }
        });
    }

    loadNotes() {
        this.notes = this.storage.getAllNotes();
        this.filteredNotes = [...this.notes];
        this.render();
    }

    filterNotes() {
        if (!this.searchQuery.trim()) {
            this.filteredNotes = [...this.notes];
        } else {
            this.filteredNotes = this.storage.searchNotes(this.searchQuery);
        }
        this.render();
    }

    render() {
        this.container.innerHTML = '';

        if (this.filteredNotes.length === 0) {
            this.renderEmptyState();
            return;
        }

        this.filteredNotes.forEach(note => {
            const noteElement = this.createNoteElement(note);
            this.container.appendChild(noteElement);
        });
    }

    renderEmptyState() {
        const emptyState = document.createElement('div');
        emptyState.className = 'notes-list-empty';

        if (this.searchQuery.trim()) {
            emptyState.innerHTML = `
                <h3>No notes found</h3>
                <p>Try adjusting your search terms</p>
            `;
        } else {
            emptyState.innerHTML = `
                <h3>No notes yet</h3>
                <p>Create your first note to get started!</p>
            `;
        }

        this.container.appendChild(emptyState);
    }

    createNoteElement(note) {
        const element = document.createElement('div');
        element.className = 'note-item';
        element.dataset.noteId = note.id;

        if (note.id === this.selectedNoteId) {
            element.classList.add('active');
        }

        const title = this.highlightSearchTerm(note.title);
        const preview = this.getContentPreview(note.content);
        const highlightedPreview = this.highlightSearchTerm(preview);
        const formattedDate = this.formatDate(note.updatedAt);

        element.innerHTML = `
            <div class="note-item-title">${title}</div>
            <div class="note-item-preview">${highlightedPreview}</div>
            <div class="note-item-date">${formattedDate}</div>
        `;

        element.addEventListener('click', () => {
            this.selectNote(note.id);
            this.onNoteSelect(note);
        });

        return element;
    }

    selectNote(noteId) {
        this.selectedNoteId = noteId;

        const allItems = this.container.querySelectorAll('.note-item');
        allItems.forEach(item => item.classList.remove('active'));

        const selectedItem = this.container.querySelector(`[data-note-id="${noteId}"]`);
        if (selectedItem) {
            selectedItem.classList.add('active');
        }
    }

    getContentPreview(content, maxLength = 100) {
        if (!content) return 'No content';

        const cleanContent = content.replace(/\n+/g, ' ').trim();
        if (cleanContent.length <= maxLength) {
            return cleanContent;
        }

        return cleanContent.substring(0, maxLength) + '...';
    }

    highlightSearchTerm(text) {
        if (!this.searchQuery.trim()) {
            return text;
        }

        const regex = new RegExp(`(${this.escapeRegex(this.searchQuery)})`, 'gi');
        return text.replace(regex, '<span class="search-highlight">$1</span>');
    }

    escapeRegex(string) {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const diffTime = Math.abs(now - date);
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
        const diffMinutes = Math.floor(diffTime / (1000 * 60));

        if (diffMinutes < 1) {
            return 'Just now';
        } else if (diffMinutes < 60) {
            return `${diffMinutes} min ago`;
        } else if (diffHours < 24) {
            return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
        } else if (diffDays === 1) {
            return 'Yesterday';
        } else if (diffDays < 7) {
            return `${diffDays} days ago`;
        } else {
            return date.toLocaleDateString();
        }
    }

    addNote(note) {
        this.notes.unshift(note);
        this.filterNotes();
        this.selectNote(note.id);
    }

    updateNote(updatedNote) {
        const index = this.notes.findIndex(note => note.id === updatedNote.id);
        if (index !== -1) {
            this.notes[index] = updatedNote;
            this.notes.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
            this.filterNotes();
        }
    }

    removeNote(noteId) {
        this.notes = this.notes.filter(note => note.id !== noteId);
        this.filterNotes();

        if (this.selectedNoteId === noteId) {
            this.selectedNoteId = null;
        }
    }

    refresh() {
        this.loadNotes();
    }

    clearSelection() {
        this.selectedNoteId = null;
        const allItems = this.container.querySelectorAll('.note-item');
        allItems.forEach(item => item.classList.remove('active'));
    }

    getSelectedNote() {
        return this.notes.find(note => note.id === this.selectedNoteId);
    }

    getNotesCount() {
        return {
            total: this.notes.length,
            filtered: this.filteredNotes.length
        };
    }

    clearSearch() {
        this.searchInput.value = '';
        this.searchQuery = '';
        this.filterNotes();
    }
}

window.NotesList = NotesList;