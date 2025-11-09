// NoteNest - Notes Management
class NotesManager {
    constructor() {
        this.storageManager = null;
        this.authManager = null;
        this.currentNote = null;
        this.notes = [];
        this.currentNotebook = 'all';
        this.sortBy = 'modifiedAt';
        this.sortOrder = 'desc';
        this.onNotesChanged = null;
        this.onCurrentNoteChanged = null;
        this.autoSaveTimer = null;
        this.autoSaveDelay = 2000; // 2 seconds
        this.init();
    }

    async init() {
        // Wait for required managers
        if (typeof StorageManager !== 'undefined' && typeof AuthManager !== 'undefined') {
            this.storageManager = new StorageManager();
            // AuthManager will be injected by app.js
        } else {
            setTimeout(() => this.init(), 100);
        }
    }

    setAuthManager(authManager) {
        this.authManager = authManager;
    }

    // Load notes for current user
    async loadNotes(options = {}) {
        try {
            if (!this.authManager || !this.authManager.isAuthenticated()) {
                throw new Error('Not authenticated');
            }

            const userId = this.authManager.getCurrentUser().id;
            const loadOptions = {
                sortBy: options.sortBy || this.sortBy,
                sortOrder: options.sortOrder || this.sortOrder,
                notebookId: options.notebookId === 'all' ? null : options.notebookId,
                includeArchived: options.includeArchived || false
            };

            this.notes = await this.storageManager.getUserNotes(userId, loadOptions);

            if (this.onNotesChanged) {
                this.onNotesChanged(this.notes);
            }

            return this.notes;

        } catch (error) {
            console.error('Error loading notes:', error);
            throw error;
        }
    }

    // Create new note
    async createNote(data = {}) {
        try {
            if (!this.authManager || !this.authManager.isAuthenticated()) {
                throw new Error('Not authenticated');
            }

            const userId = this.authManager.getCurrentUser().id;
            const noteData = {
                userId: userId,
                title: data.title || 'Untitled Note',
                content: data.content || '',
                notebookId: data.notebookId || this.currentNotebook === 'all' ? 'default' : this.currentNotebook,
                tags: data.tags || [],
                pinned: data.pinned || false
            };

            const newNote = await this.storageManager.saveNote(noteData);

            // Add to local notes array
            this.notes.unshift(newNote);
            this.currentNote = newNote;

            // Trigger callbacks
            if (this.onNotesChanged) {
                this.onNotesChanged(this.notes);
            }
            if (this.onCurrentNoteChanged) {
                this.onCurrentNoteChanged(this.currentNote);
            }

            return newNote;

        } catch (error) {
            console.error('Error creating note:', error);
            throw error;
        }
    }

    // Update existing note
    async updateNote(noteId, updates) {
        try {
            if (!this.authManager || !this.authManager.isAuthenticated()) {
                throw new Error('Not authenticated');
            }

            const existingNote = await this.storageManager.getNote(noteId);
            if (!existingNote) {
                throw new Error('Note not found');
            }

            // Verify ownership
            const userId = this.authManager.getCurrentUser().id;
            if (existingNote.userId !== userId) {
                throw new Error('Unauthorized');
            }

            const updatedNote = await this.storageManager.saveNote({
                ...existingNote,
                ...updates,
                id: noteId,
                userId: userId,
                modifiedAt: new Date().toISOString()
            });

            // Update local notes array
            const noteIndex = this.notes.findIndex(note => note.id === noteId);
            if (noteIndex !== -1) {
                this.notes[noteIndex] = updatedNote;

                // Re-sort if needed
                this.sortNotes();

                if (this.onNotesChanged) {
                    this.onNotesChanged(this.notes);
                }
            }

            // Update current note if it's the one being updated
            if (this.currentNote && this.currentNote.id === noteId) {
                this.currentNote = updatedNote;
                if (this.onCurrentNoteChanged) {
                    this.onCurrentNoteChanged(this.currentNote);
                }
            }

            return updatedNote;

        } catch (error) {
            console.error('Error updating note:', error);
            throw error;
        }
    }

    // Delete note
    async deleteNote(noteId) {
        try {
            if (!this.authManager || !this.authManager.isAuthenticated()) {
                throw new Error('Not authenticated');
            }

            const note = await this.storageManager.getNote(noteId);
            if (!note) {
                throw new Error('Note not found');
            }

            // Verify ownership
            const userId = this.authManager.getCurrentUser().id;
            if (note.userId !== userId) {
                throw new Error('Unauthorized');
            }

            await this.storageManager.deleteNote(noteId);

            // Remove from local notes array
            this.notes = this.notes.filter(n => n.id !== noteId);

            // Clear current note if it was deleted
            if (this.currentNote && this.currentNote.id === noteId) {
                this.currentNote = null;
                if (this.onCurrentNoteChanged) {
                    this.onCurrentNoteChanged(null);
                }
            }

            if (this.onNotesChanged) {
                this.onNotesChanged(this.notes);
            }

            return true;

        } catch (error) {
            console.error('Error deleting note:', error);
            throw error;
        }
    }

    // Get single note
    async getNote(noteId) {
        try {
            const note = await this.storageManager.getNote(noteId);
            if (!note) {
                throw new Error('Note not found');
            }

            // Verify ownership
            if (this.authManager && this.authManager.isAuthenticated()) {
                const userId = this.authManager.getCurrentUser().id;
                if (note.userId !== userId) {
                    throw new Error('Unauthorized');
                }
            }

            return note;

        } catch (error) {
            console.error('Error getting note:', error);
            throw error;
        }
    }

    // Set current note
    async setCurrentNote(noteId) {
        try {
            if (noteId === null) {
                this.currentNote = null;
                if (this.onCurrentNoteChanged) {
                    this.onCurrentNoteChanged(null);
                }
                return null;
            }

            const note = await this.getNote(noteId);
            this.currentNote = note;

            if (this.onCurrentNoteChanged) {
                this.onCurrentNoteChanged(this.currentNote);
            }

            return note;

        } catch (error) {
            console.error('Error setting current note:', error);
            throw error;
        }
    }

    // Get current note
    getCurrentNote() {
        return this.currentNote;
    }

    // Auto-save current note
    scheduleAutoSave(noteData) {
        if (this.autoSaveTimer) {
            clearTimeout(this.autoSaveTimer);
        }

        this.autoSaveTimer = setTimeout(async () => {
            if (this.currentNote) {
                try {
                    await this.updateNote(this.currentNote.id, noteData);
                } catch (error) {
                    console.error('Auto-save failed:', error);
                }
            }
        }, this.autoSaveDelay);
    }

    // Save current note immediately
    async saveCurrentNote(noteData) {
        if (!this.currentNote) {
            throw new Error('No note is currently selected');
        }

        return await this.updateNote(this.currentNote.id, noteData);
    }

    // Toggle note pin status
    async togglePin(noteId) {
        const note = await this.getNote(noteId);
        return await this.updateNote(noteId, { pinned: !note.pinned });
    }

    // Archive/unarchive note
    async toggleArchive(noteId) {
        const note = await this.getNote(noteId);
        return await this.updateNote(noteId, { archived: !note.archived });
    }

    // Duplicate note
    async duplicateNote(noteId) {
        try {
            const originalNote = await this.getNote(noteId);
            const duplicateData = {
                title: `${originalNote.title} (Copy)`,
                content: originalNote.content,
                notebookId: originalNote.notebookId,
                tags: [...originalNote.tags]
            };

            return await this.createNote(duplicateData);

        } catch (error) {
            console.error('Error duplicating note:', error);
            throw error;
        }
    }

    // Move note to different notebook
    async moveToNotebook(noteId, notebookId) {
        return await this.updateNote(noteId, { notebookId: notebookId });
    }

    // Add tag to note
    async addTag(noteId, tag) {
        const note = await this.getNote(noteId);
        const tags = [...note.tags];

        if (!tags.includes(tag)) {
            tags.push(tag);
            return await this.updateNote(noteId, { tags: tags });
        }

        return note;
    }

    // Remove tag from note
    async removeTag(noteId, tag) {
        const note = await this.getNote(noteId);
        const tags = note.tags.filter(t => t !== tag);
        return await this.updateNote(noteId, { tags: tags });
    }

    // Get all unique tags across all notes
    getAllTags() {
        const tagSet = new Set();
        this.notes.forEach(note => {
            note.tags.forEach(tag => tagSet.add(tag));
        });
        return Array.from(tagSet).sort();
    }

    // Filter notes by tag
    getNotesWithTag(tag) {
        return this.notes.filter(note => note.tags.includes(tag));
    }

    // Set current notebook filter
    setCurrentNotebook(notebookId) {
        this.currentNotebook = notebookId;
    }

    // Set sort options
    setSortOptions(sortBy, sortOrder) {
        this.sortBy = sortBy;
        this.sortOrder = sortOrder;
        this.sortNotes();

        if (this.onNotesChanged) {
            this.onNotesChanged(this.notes);
        }
    }

    // Sort current notes array
    sortNotes() {
        this.notes.sort((a, b) => {
            // Pinned notes always come first
            if (a.pinned !== b.pinned) {
                return b.pinned - a.pinned;
            }

            let aVal = a[this.sortBy];
            let bVal = b[this.sortBy];

            if (this.sortBy === 'title') {
                aVal = aVal.toLowerCase();
                bVal = bVal.toLowerCase();
            }

            if (this.sortOrder === 'asc') {
                return aVal > bVal ? 1 : aVal < bVal ? -1 : 0;
            } else {
                return aVal < bVal ? 1 : aVal > bVal ? -1 : 0;
            }
        });
    }

    // Search notes
    async searchNotes(query) {
        try {
            if (!this.authManager || !this.authManager.isAuthenticated()) {
                throw new Error('Not authenticated');
            }

            const userId = this.authManager.getCurrentUser().id;
            return await this.storageManager.searchNotes(userId, query);

        } catch (error) {
            console.error('Error searching notes:', error);
            throw error;
        }
    }

    // Get notes statistics
    getNotesStats() {
        const stats = {
            total: this.notes.length,
            pinned: this.notes.filter(note => note.pinned).length,
            archived: this.notes.filter(note => note.archived).length,
            tags: this.getAllTags().length,
            notebooks: new Set(this.notes.map(note => note.notebookId)).size
        };

        // Recent activity (last 7 days)
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        stats.recentlyModified = this.notes.filter(note =>
            new Date(note.modifiedAt) > weekAgo
        ).length;

        return stats;
    }

    // Get note preview text
    getNotePreview(noteId, maxLength = 150) {
        const note = this.notes.find(n => n.id === noteId);
        if (!note) return '';

        // Strip HTML and get plain text
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = note.content;
        const plainText = tempDiv.textContent || tempDiv.innerText || '';

        return plainText.length > maxLength
            ? plainText.substring(0, maxLength) + '...'
            : plainText;
    }

    // Format relative date
    formatRelativeDate(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now - date;
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        const diffMinutes = Math.floor(diffMs / (1000 * 60));

        if (diffMinutes < 1) {
            return 'Just now';
        } else if (diffMinutes < 60) {
            return `${diffMinutes}m ago`;
        } else if (diffHours < 24) {
            return `${diffHours}h ago`;
        } else if (diffDays === 1) {
            return 'Yesterday';
        } else if (diffDays < 7) {
            return `${diffDays} days ago`;
        } else {
            return date.toLocaleDateString();
        }
    }

    // Set callback for notes changes
    setNotesChangedCallback(callback) {
        this.onNotesChanged = callback;
    }

    // Set callback for current note changes
    setCurrentNoteChangedCallback(callback) {
        this.onCurrentNoteChanged = callback;
    }

    // Cleanup
    destroy() {
        if (this.autoSaveTimer) {
            clearTimeout(this.autoSaveTimer);
        }
        this.onNotesChanged = null;
        this.onCurrentNoteChanged = null;
    }
}

// Export for use in other modules
window.NotesManager = NotesManager;