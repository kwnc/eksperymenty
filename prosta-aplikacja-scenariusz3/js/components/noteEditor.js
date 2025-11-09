class NoteEditor {
    constructor(storage, onSave, onDelete, onCancel) {
        this.storage = storage;
        this.onSave = onSave;
        this.onDelete = onDelete;
        this.onCancel = onCancel;

        this.currentNote = null;
        this.isEditing = false;
        this.hasUnsavedChanges = false;

        this.initElements();
        this.bindEvents();
    }

    initElements() {
        this.editorContainer = document.getElementById('note-editor');
        this.titleInput = document.getElementById('note-title');
        this.contentInput = document.getElementById('note-content');
        this.saveBtn = document.getElementById('save-note-btn');
        this.deleteBtn = document.getElementById('delete-note-btn');
        this.cancelBtn = document.getElementById('cancel-edit-btn');
        this.welcomeScreen = document.getElementById('welcome-screen');
    }

    bindEvents() {
        this.saveBtn.addEventListener('click', () => this.saveNote());
        this.deleteBtn.addEventListener('click', () => this.deleteNote());
        this.cancelBtn.addEventListener('click', () => this.cancelEdit());

        this.titleInput.addEventListener('input', () => this.markAsChanged());
        this.contentInput.addEventListener('input', () => this.markAsChanged());

        this.titleInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                this.contentInput.focus();
            }
        });

        this.contentInput.addEventListener('keydown', (e) => {
            if (e.key === 'Tab') {
                e.preventDefault();
                const start = this.contentInput.selectionStart;
                const end = this.contentInput.selectionEnd;
                this.contentInput.value = this.contentInput.value.substring(0, start) + '    ' + this.contentInput.value.substring(end);
                this.contentInput.selectionStart = this.contentInput.selectionEnd = start + 4;
                this.markAsChanged();
            }
        });

        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey || e.metaKey) {
                if (e.key === 's') {
                    e.preventDefault();
                    if (this.isEditing) {
                        this.saveNote();
                    }
                }
            }
        });

        window.addEventListener('beforeunload', (e) => {
            if (this.hasUnsavedChanges) {
                e.preventDefault();
                e.returnValue = '';
                return '';
            }
        });
    }

    showEditor() {
        this.editorContainer.classList.remove('hidden');
        this.welcomeScreen.classList.add('hidden');
    }

    hideEditor() {
        this.editorContainer.classList.add('hidden');
        this.welcomeScreen.classList.remove('hidden');
        this.currentNote = null;
        this.isEditing = false;
        this.hasUnsavedChanges = false;
    }

    createNewNote() {
        if (this.hasUnsavedChanges && !this.confirmDiscard()) {
            return;
        }

        this.currentNote = null;
        this.isEditing = true;
        this.hasUnsavedChanges = false;

        this.titleInput.value = '';
        this.contentInput.value = '';

        this.showEditor();
        this.updateButtonStates();
        this.titleInput.focus();
    }

    loadNote(note) {
        if (this.hasUnsavedChanges && !this.confirmDiscard()) {
            return false;
        }

        this.currentNote = note;
        this.isEditing = true;
        this.hasUnsavedChanges = false;

        this.titleInput.value = note.title;
        this.contentInput.value = note.content;

        this.showEditor();
        this.updateButtonStates();
        this.titleInput.focus();

        return true;
    }

    saveNote() {
        const title = this.titleInput.value.trim() || 'Untitled Note';
        const content = this.contentInput.value.trim();

        if (!title && !content) {
            return;
        }

        let savedNote;

        if (this.currentNote) {
            savedNote = this.storage.updateNote(this.currentNote.id, { title, content });
        } else {
            savedNote = this.storage.createNote(title, content);
        }

        if (savedNote) {
            this.currentNote = savedNote;
            this.hasUnsavedChanges = false;
            this.updateButtonStates();
            this.onSave(savedNote);
        }
    }

    deleteNote() {
        if (!this.currentNote) {
            return;
        }

        if (confirm('Are you sure you want to delete this note? This action cannot be undone.')) {
            const deleted = this.storage.deleteNote(this.currentNote.id);
            if (deleted) {
                this.onDelete(this.currentNote);
                this.hideEditor();
            }
        }
    }

    cancelEdit() {
        if (this.hasUnsavedChanges && !this.confirmDiscard()) {
            return;
        }

        this.onCancel();
        this.hideEditor();
    }

    markAsChanged() {
        this.hasUnsavedChanges = true;
        this.updateButtonStates();
    }

    updateButtonStates() {
        this.saveBtn.disabled = !this.hasUnsavedChanges && !(!this.currentNote && (this.titleInput.value.trim() || this.contentInput.value.trim()));
        this.deleteBtn.disabled = !this.currentNote;

        if (this.hasUnsavedChanges) {
            this.saveBtn.textContent = 'Save*';
        } else {
            this.saveBtn.textContent = 'Save';
        }
    }

    confirmDiscard() {
        return confirm('You have unsaved changes. Are you sure you want to discard them?');
    }

    getCurrentNote() {
        return this.currentNote;
    }

    hasChanges() {
        return this.hasUnsavedChanges;
    }

    getEditorState() {
        return {
            isEditing: this.isEditing,
            hasUnsavedChanges: this.hasUnsavedChanges,
            currentNote: this.currentNote
        };
    }
}

window.NoteEditor = NoteEditor;