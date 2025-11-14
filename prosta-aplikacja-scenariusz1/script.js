// Note Storage Manager
class NoteManager {
    constructor() {
        this.notes = this.loadNotes();
    }

    loadNotes() {
        const stored = localStorage.getItem('notes');
        return stored ? JSON.parse(stored) : [];
    }

    saveNotes() {
        localStorage.setItem('notes', JSON.stringify(this.notes));
    }

    addNote(title, content) {
        const note = {
            id: Date.now(),
            title: title.trim() || 'Untitled Note',
            content: content.trim(),
            timestamp: new Date().toISOString()
        };
        this.notes.unshift(note);
        this.saveNotes();
        return note;
    }

    updateNote(id, title, content) {
        const note = this.notes.find(n => n.id === id);
        if (note) {
            note.title = title.trim() || 'Untitled Note';
            note.content = content.trim();
            note.timestamp = new Date().toISOString();
            this.saveNotes();
            return note;
        }
        return null;
    }

    deleteNote(id) {
        this.notes = this.notes.filter(n => n.id !== id);
        this.saveNotes();
    }

    getAllNotes() {
        return this.notes;
    }
}

// UI Controller
class NotesUI {
    constructor(noteManager) {
        this.noteManager = noteManager;
        this.notesList = document.getElementById('notesList');
        this.noteTitleInput = document.getElementById('noteTitle');
        this.noteContentInput = document.getElementById('noteContent');
        this.addNoteBtn = document.getElementById('addNoteBtn');

        this.init();
    }

    init() {
        this.addNoteBtn.addEventListener('click', () => this.handleAddNote());
        this.noteContentInput.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.key === 'Enter') {
                this.handleAddNote();
            }
        });

        this.renderNotes();
    }

    handleAddNote() {
        const title = this.noteTitleInput.value;
        const content = this.noteContentInput.value;

        if (!content.trim()) {
            alert('Please enter some content for your note!');
            return;
        }

        this.noteManager.addNote(title, content);
        this.noteTitleInput.value = '';
        this.noteContentInput.value = '';
        this.noteContentInput.focus();
        this.renderNotes();
    }

    renderNotes() {
        const notes = this.noteManager.getAllNotes();

        if (notes.length === 0) {
            this.notesList.innerHTML = '<div class="empty-state">No notes yet. Create your first note above!</div>';
            return;
        }

        this.notesList.innerHTML = notes.map(note => this.createNoteCard(note)).join('');
        this.attachNoteEventListeners();
    }

    createNoteCard(note) {
        const date = new Date(note.timestamp);
        const formattedDate = date.toLocaleString();

        return `
            <div class="note-card" data-id="${note.id}">
                <div class="note-header">
                    <div class="note-title">${this.escapeHtml(note.title)}</div>
                    <div class="note-actions">
                        <button class="btn-edit" title="Edit note">✏️</button>
                        <button class="btn-delete" title="Delete note">🗑️</button>
                    </div>
                </div>
                <div class="note-content">${this.escapeHtml(note.content)}</div>
                <div class="note-timestamp">Last edited: ${formattedDate}</div>
            </div>
        `;
    }

    createEditMode(note) {
        return `
            <div class="note-card edit-mode" data-id="${note.id}">
                <input type="text" class="note-title-input" value="${this.escapeHtml(note.title)}" maxlength="100">
                <textarea class="note-content-input" rows="4">${this.escapeHtml(note.content)}</textarea>
                <div class="edit-actions">
                    <button class="btn-save">Save</button>
                    <button class="btn-cancel">Cancel</button>
                </div>
            </div>
        `;
    }

    attachNoteEventListeners() {
        // Delete buttons
        document.querySelectorAll('.btn-delete').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const card = e.target.closest('.note-card');
                const id = parseInt(card.dataset.id);

                if (confirm('Are you sure you want to delete this note?')) {
                    this.noteManager.deleteNote(id);
                    this.renderNotes();
                }
            });
        });

        // Edit buttons
        document.querySelectorAll('.btn-edit').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const card = e.target.closest('.note-card');
                const id = parseInt(card.dataset.id);
                const note = this.noteManager.getAllNotes().find(n => n.id === id);

                if (note) {
                    card.outerHTML = this.createEditMode(note);
                    this.attachEditEventListeners(id);
                }
            });
        });
    }

    attachEditEventListeners(noteId) {
        const card = document.querySelector(`[data-id="${noteId}"]`);
        const titleInput = card.querySelector('.note-title-input');
        const contentInput = card.querySelector('.note-content-input');
        const saveBtn = card.querySelector('.btn-save');
        const cancelBtn = card.querySelector('.btn-cancel');

        titleInput.focus();

        saveBtn.addEventListener('click', () => {
            const title = titleInput.value;
            const content = contentInput.value;

            if (!content.trim()) {
                alert('Note content cannot be empty!');
                return;
            }

            this.noteManager.updateNote(noteId, title, content);
            this.renderNotes();
        });

        cancelBtn.addEventListener('click', () => {
            this.renderNotes();
        });

        contentInput.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.key === 'Enter') {
                saveBtn.click();
            }
        });
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Initialize the app
document.addEventListener('DOMContentLoaded', () => {
    const noteManager = new NoteManager();
    const notesUI = new NotesUI(noteManager);
});
