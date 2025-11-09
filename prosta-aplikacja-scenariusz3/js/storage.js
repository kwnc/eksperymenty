class NotesStorage {
    constructor() {
        this.storageKey = 'local-mvp-notes';
        this.notes = this.loadNotes();
    }

    loadNotes() {
        try {
            const stored = localStorage.getItem(this.storageKey);
            return stored ? JSON.parse(stored) : [];
        } catch (error) {
            console.error('Error loading notes from storage:', error);
            return [];
        }
    }

    saveNotes() {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(this.notes));
            return true;
        } catch (error) {
            console.error('Error saving notes to storage:', error);
            return false;
        }
    }

    getAllNotes() {
        return this.notes.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
    }

    getNoteById(id) {
        return this.notes.find(note => note.id === id);
    }

    createNote(title = 'Untitled Note', content = '') {
        const now = new Date().toISOString();
        const note = {
            id: this.generateId(),
            title: title.trim() || 'Untitled Note',
            content: content.trim(),
            createdAt: now,
            updatedAt: now
        };

        this.notes.push(note);
        this.saveNotes();
        return note;
    }

    updateNote(id, updates) {
        const noteIndex = this.notes.findIndex(note => note.id === id);
        if (noteIndex === -1) {
            return null;
        }

        const note = this.notes[noteIndex];
        const updatedNote = {
            ...note,
            ...updates,
            updatedAt: new Date().toISOString()
        };

        if (updatedNote.title) {
            updatedNote.title = updatedNote.title.trim() || 'Untitled Note';
        }
        if (updatedNote.content) {
            updatedNote.content = updatedNote.content.trim();
        }

        this.notes[noteIndex] = updatedNote;
        this.saveNotes();
        return updatedNote;
    }

    deleteNote(id) {
        const noteIndex = this.notes.findIndex(note => note.id === id);
        if (noteIndex === -1) {
            return false;
        }

        this.notes.splice(noteIndex, 1);
        this.saveNotes();
        return true;
    }

    searchNotes(query) {
        if (!query || query.trim() === '') {
            return this.getAllNotes();
        }

        const searchTerm = query.toLowerCase().trim();
        return this.notes.filter(note =>
            note.title.toLowerCase().includes(searchTerm) ||
            note.content.toLowerCase().includes(searchTerm)
        ).sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
    }

    generateId() {
        return 'note_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    getStorageInfo() {
        try {
            const notesJson = localStorage.getItem(this.storageKey);
            const sizeInBytes = notesJson ? new Blob([notesJson]).size : 0;
            return {
                notesCount: this.notes.length,
                storageSize: sizeInBytes,
                storageSizeFormatted: this.formatBytes(sizeInBytes)
            };
        } catch (error) {
            console.error('Error getting storage info:', error);
            return { notesCount: 0, storageSize: 0, storageSizeFormatted: '0 B' };
        }
    }

    formatBytes(bytes) {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    exportNotes() {
        return {
            exportedAt: new Date().toISOString(),
            notes: this.notes,
            metadata: this.getStorageInfo()
        };
    }

    importNotes(notesData) {
        try {
            if (!notesData || !Array.isArray(notesData.notes)) {
                throw new Error('Invalid notes data format');
            }

            this.notes = notesData.notes.map(note => ({
                ...note,
                id: note.id || this.generateId()
            }));

            this.saveNotes();
            return true;
        } catch (error) {
            console.error('Error importing notes:', error);
            return false;
        }
    }
}

window.NotesStorage = NotesStorage;