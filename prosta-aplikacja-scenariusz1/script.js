class NotesApp {
    constructor() {
        this.notes = JSON.parse(localStorage.getItem('notes')) || [];
        this.currentNote = null;
        this.init();
    }

    init() {
        this.bindEvents();
        this.renderNotesList();
        this.showEmptyState();
    }

    bindEvents() {
        document.getElementById('new-note-btn').addEventListener('click', () => this.createNewNote());
        document.getElementById('save-btn').addEventListener('click', () => this.saveCurrentNote());
        document.getElementById('delete-btn').addEventListener('click', () => this.deleteCurrentNote());
        document.getElementById('search-input').addEventListener('input', (e) => this.searchNotes(e.target.value));
        document.getElementById('note-title').addEventListener('input', () => this.autoSave());
        document.getElementById('note-content').addEventListener('input', () => this.autoSave());
    }

    createNewNote() {
        const newNote = {
            id: Date.now().toString(),
            title: 'Untitled Note',
            content: '',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        
        this.notes.unshift(newNote);
        this.saveToStorage();
        this.renderNotesList();
        this.selectNote(newNote.id);
        document.getElementById('note-title').focus();
    }

    selectNote(noteId) {
        this.currentNote = this.notes.find(note => note.id === noteId);
        if (!this.currentNote) return;

        document.querySelectorAll('.note-item').forEach(item => {
            item.classList.remove('active');
        });
        
        document.querySelector(`[data-note-id="${noteId}"]`).classList.add('active');
        
        document.getElementById('note-title').value = this.currentNote.title;
        document.getElementById('note-content').value = this.currentNote.content;
        
        this.showEditor();
    }

    saveCurrentNote() {
        if (!this.currentNote) return;

        const title = document.getElementById('note-title').value.trim();
        const content = document.getElementById('note-content').value.trim();

        this.currentNote.title = title || 'Untitled Note';
        this.currentNote.content = content;
        this.currentNote.updatedAt = new Date().toISOString();

        this.saveToStorage();
        this.renderNotesList();
        this.selectNote(this.currentNote.id);
        
        this.showSaveNotification();
    }

    autoSave() {
        if (!this.currentNote) return;
        
        clearTimeout(this.autoSaveTimeout);
        this.autoSaveTimeout = setTimeout(() => {
            this.saveCurrentNote();
        }, 1000);
    }

    deleteCurrentNote() {
        if (!this.currentNote) return;

        if (confirm('Are you sure you want to delete this note?')) {
            this.notes = this.notes.filter(note => note.id !== this.currentNote.id);
            this.saveToStorage();
            this.renderNotesList();
            this.showEmptyState();
            this.currentNote = null;
        }
    }

    searchNotes(query) {
        const filteredNotes = this.notes.filter(note => 
            note.title.toLowerCase().includes(query.toLowerCase()) ||
            note.content.toLowerCase().includes(query.toLowerCase())
        );
        this.renderNotesList(filteredNotes);
    }

    renderNotesList(notesToRender = this.notes) {
        const notesList = document.getElementById('notes-list');
        
        if (notesToRender.length === 0) {
            notesList.innerHTML = '<div class="empty-state"><p>No notes found</p></div>';
            return;
        }

        notesList.innerHTML = notesToRender.map(note => `
            <div class="note-item" data-note-id="${note.id}">
                <h3>${this.escapeHtml(note.title)}</h3>
                <p>${this.escapeHtml(note.content.substring(0, 100))}</p>
                <div class="note-date">${this.formatDate(note.updatedAt)}</div>
            </div>
        `).join('');

        notesList.addEventListener('click', (e) => {
            const noteItem = e.target.closest('.note-item');
            if (noteItem) {
                this.selectNote(noteItem.dataset.noteId);
            }
        });
    }

    showEditor() {
        const editorContainer = document.querySelector('.editor-container');
        const emptyState = editorContainer.querySelector('.empty-state');
        
        if (emptyState) {
            emptyState.remove();
        }
        
        document.getElementById('note-title').style.display = 'block';
        document.getElementById('note-content').style.display = 'block';
        document.querySelector('.editor-actions').style.display = 'flex';
    }

    showEmptyState() {
        if (this.notes.length === 0 || !this.currentNote) {
            const editorContainer = document.querySelector('.editor-container');
            const existingContent = editorContainer.querySelectorAll('#note-title, #note-content, .editor-actions');
            
            existingContent.forEach(el => el.style.display = 'none');
            
            if (!editorContainer.querySelector('.empty-state')) {
                const emptyState = document.createElement('div');
                emptyState.className = 'empty-state';
                emptyState.innerHTML = `
                    <h3>Welcome to Notes</h3>
                    <p>Select a note from the sidebar or create a new one to get started.</p>
                `;
                editorContainer.appendChild(emptyState);
            }
        }
    }

    showSaveNotification() {
        const saveBtn = document.getElementById('save-btn');
        const originalText = saveBtn.textContent;
        saveBtn.textContent = 'Saved!';
        saveBtn.style.background = '#48bb78';
        
        setTimeout(() => {
            saveBtn.textContent = originalText;
            saveBtn.style.background = '#48bb78';
        }, 1000);
    }

    saveToStorage() {
        localStorage.setItem('notes', JSON.stringify(this.notes));
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const diffInHours = (now - date) / (1000 * 60 * 60);
        
        if (diffInHours < 1) {
            return 'Just now';
        } else if (diffInHours < 24) {
            return `${Math.floor(diffInHours)} hours ago`;
        } else if (diffInHours < 24 * 7) {
            return `${Math.floor(diffInHours / 24)} days ago`;
        } else {
            return date.toLocaleDateString();
        }
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new NotesApp();
});