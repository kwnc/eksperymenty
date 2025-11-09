class NotesApp {
    constructor() {
        this.storage = new NotesStorage();
        this.notesList = null;
        this.noteEditor = null;
        this.isInitialized = false;

        this.init();
    }

    init() {
        if (this.isInitialized) return;

        this.initComponents();
        this.bindGlobalEvents();
        this.loadInitialState();
        this.isInitialized = true;

        console.log('Notes App initialized');
    }

    initComponents() {
        this.noteEditor = new NoteEditor(
            this.storage,
            (note) => this.handleNoteSaved(note),
            (note) => this.handleNoteDeleted(note),
            () => this.handleEditCancelled()
        );

        this.notesList = new NotesList(
            this.storage,
            (note) => this.handleNoteSelected(note)
        );

        this.initUI();
    }

    initUI() {
        const newNoteBtn = document.getElementById('new-note-btn');
        newNoteBtn.addEventListener('click', () => this.createNewNote());

        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey || e.metaKey) {
                if (e.key === 'n') {
                    e.preventDefault();
                    this.createNewNote();
                }
            }
        });
    }

    bindGlobalEvents() {
        window.addEventListener('storage', (e) => {
            if (e.key === this.storage.storageKey) {
                this.handleStorageChange();
            }
        });

        window.addEventListener('beforeunload', (e) => {
            if (this.noteEditor && this.noteEditor.hasChanges()) {
                e.preventDefault();
                e.returnValue = '';
                return '';
            }
        });

        document.addEventListener('visibilitychange', () => {
            if (!document.hidden) {
                this.refreshData();
            }
        });
    }

    loadInitialState() {
        this.refreshData();

        const notes = this.storage.getAllNotes();
        if (notes.length === 0) {
            this.showWelcomeState();
        }
    }

    showWelcomeState() {
        this.noteEditor.hideEditor();
        this.notesList.clearSelection();
    }

    createNewNote() {
        this.noteEditor.createNewNote();
    }

    handleNoteSelected(note) {
        const loaded = this.noteEditor.loadNote(note);
        if (loaded) {
            this.notesList.selectNote(note.id);
        }
    }

    handleNoteSaved(note) {
        const isNewNote = !this.notesList.notes.some(n => n.id === note.id);

        if (isNewNote) {
            this.notesList.addNote(note);
        } else {
            this.notesList.updateNote(note);
        }

        this.notesList.selectNote(note.id);
        this.showNotification('Note saved successfully');
    }

    handleNoteDeleted(note) {
        this.notesList.removeNote(note.id);
        this.showWelcomeState();
        this.showNotification('Note deleted successfully');
    }

    handleEditCancelled() {
        this.notesList.clearSelection();
    }

    handleStorageChange() {
        console.log('Storage changed in another tab, refreshing...');
        this.refreshData();
    }

    refreshData() {
        this.notesList.refresh();

        const currentNote = this.noteEditor.getCurrentNote();
        if (currentNote) {
            const updatedNote = this.storage.getNoteById(currentNote.id);
            if (updatedNote) {
                if (this.hasNoteChanged(currentNote, updatedNote)) {
                    if (confirm('This note has been modified in another tab. Load the latest version?')) {
                        this.noteEditor.loadNote(updatedNote);
                    }
                }
            } else {
                this.showNotification('This note has been deleted in another tab');
                this.noteEditor.hideEditor();
            }
        }
    }

    hasNoteChanged(oldNote, newNote) {
        return oldNote.title !== newNote.title ||
               oldNote.content !== newNote.content ||
               oldNote.updatedAt !== newNote.updatedAt;
    }

    showNotification(message, type = 'info', duration = 3000) {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;

        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'error' ? '#dc3545' : type === 'success' ? '#28a745' : '#007bff'};
            color: white;
            padding: 12px 20px;
            border-radius: 4px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            z-index: 10000;
            font-size: 14px;
            font-weight: 500;
            max-width: 400px;
            transform: translateX(100%);
            transition: transform 0.3s ease;
        `;

        document.body.appendChild(notification);

        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 10);

        setTimeout(() => {
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, duration);
    }

    exportNotes() {
        try {
            const exportData = this.storage.exportNotes();
            const filename = `notes-export-${new Date().toISOString().split('T')[0]}.json`;
            Utils.downloadFile(JSON.stringify(exportData, null, 2), filename);
            this.showNotification('Notes exported successfully', 'success');
        } catch (error) {
            console.error('Export failed:', error);
            this.showNotification('Failed to export notes', 'error');
        }
    }

    importNotes(file) {
        Utils.readFileAsText(file)
            .then(content => {
                const data = JSON.parse(content);
                if (this.storage.importNotes(data)) {
                    this.refreshData();
                    this.showNotification('Notes imported successfully', 'success');
                } else {
                    throw new Error('Invalid file format');
                }
            })
            .catch(error => {
                console.error('Import failed:', error);
                this.showNotification('Failed to import notes', 'error');
            });
    }

    getAppStats() {
        const storageInfo = this.storage.getStorageInfo();
        const notesCount = this.notesList.getNotesCount();

        return {
            totalNotes: storageInfo.notesCount,
            filteredNotes: notesCount.filtered,
            storageUsed: storageInfo.storageSizeFormatted,
            isEditing: this.noteEditor.getEditorState().isEditing,
            hasUnsavedChanges: this.noteEditor.getEditorState().hasUnsavedChanges
        };
    }

    destroy() {
        this.isInitialized = false;
        console.log('Notes App destroyed');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.notesApp = new NotesApp();
});