/**
 * Storage Module - Handles all localStorage operations for NoteNest
 *
 * Provides a clean API for managing notes and tags in browser localStorage.
 * Includes error handling, data validation, and automatic cleanup.
 *
 * @module Storage
 * @version 1.0.0
 */
const Storage = {
    NOTES_KEY: 'notenest_notes',
    TAGS_KEY: 'notenest_tags',

    init() {
        this.ensureStorageExists();
    },

    ensureStorageExists() {
        if (!localStorage.getItem(this.NOTES_KEY)) {
            localStorage.setItem(this.NOTES_KEY, JSON.stringify([]));
        }
        if (!localStorage.getItem(this.TAGS_KEY)) {
            localStorage.setItem(this.TAGS_KEY, JSON.stringify([]));
        }
    },

    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    },

    loadNotes() {
        try {
            const notes = JSON.parse(localStorage.getItem(this.NOTES_KEY) || '[]');
            return notes.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
        } catch (error) {
            console.error('Error loading notes:', error);
            return [];
        }
    },

    saveNote(noteData) {
        try {
            const notes = this.loadNotes();
            const note = {
                id: this.generateId(),
                title: noteData.title,
                content: noteData.content,
                tags: noteData.tags || [],
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };

            notes.unshift(note);
            localStorage.setItem(this.NOTES_KEY, JSON.stringify(notes));
            this.updateTagsList(noteData.tags);
            return note;
        } catch (error) {
            console.error('Error saving note:', error);
            throw error;
        }
    },

    updateNote(id, noteData) {
        try {
            const notes = this.loadNotes();
            const noteIndex = notes.findIndex(note => note.id === id);

            if (noteIndex === -1) {
                throw new Error('Note not found');
            }

            notes[noteIndex] = {
                ...notes[noteIndex],
                title: noteData.title,
                content: noteData.content,
                tags: noteData.tags || [],
                updatedAt: new Date().toISOString()
            };

            localStorage.setItem(this.NOTES_KEY, JSON.stringify(notes));
            this.updateTagsList(noteData.tags);
            return notes[noteIndex];
        } catch (error) {
            console.error('Error updating note:', error);
            throw error;
        }
    },

    deleteNote(id) {
        try {
            const notes = this.loadNotes();
            const filteredNotes = notes.filter(note => note.id !== id);
            localStorage.setItem(this.NOTES_KEY, JSON.stringify(filteredNotes));
            this.cleanupUnusedTags();
            return true;
        } catch (error) {
            console.error('Error deleting note:', error);
            return false;
        }
    },

    loadTags() {
        try {
            return JSON.parse(localStorage.getItem(this.TAGS_KEY) || '[]');
        } catch (error) {
            console.error('Error loading tags:', error);
            return [];
        }
    },

    updateTagsList(newTags) {
        if (!newTags || newTags.length === 0) return;

        try {
            const existingTags = this.loadTags();
            const allTags = [...new Set([...existingTags, ...newTags])];
            localStorage.setItem(this.TAGS_KEY, JSON.stringify(allTags));
        } catch (error) {
            console.error('Error updating tags:', error);
        }
    },

    cleanupUnusedTags() {
        try {
            const notes = this.loadNotes();
            const usedTags = new Set();

            notes.forEach(note => {
                note.tags.forEach(tag => usedTags.add(tag));
            });

            localStorage.setItem(this.TAGS_KEY, JSON.stringify([...usedTags]));
        } catch (error) {
            console.error('Error cleaning up tags:', error);
        }
    },

    searchNotes(query) {
        const notes = this.loadNotes();
        const lowerQuery = query.toLowerCase();

        return notes.filter(note =>
            note.title.toLowerCase().includes(lowerQuery) ||
            note.content.toLowerCase().includes(lowerQuery) ||
            note.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
        );
    },

    filterNotesByTags(selectedTags) {
        const notes = this.loadNotes();

        if (!selectedTags || selectedTags.length === 0) {
            return notes;
        }

        return notes.filter(note =>
            selectedTags.every(tag => note.tags.includes(tag))
        );
    },

    clearAllData() {
        localStorage.removeItem(this.NOTES_KEY);
        localStorage.removeItem(this.TAGS_KEY);
        this.ensureStorageExists();
    }
};

Storage.init();