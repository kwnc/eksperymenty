/**
 * Notes Module - Handles note creation, editing, and management
 */

class NotesManager {
    constructor() {
        this.currentNote = null;
        this.autoSaveTimer = null;
        this.autoSaveInterval = 30000; // 30 seconds
    }

    // Create new note
    async createNote(noteData) {
        try {
            if (!window.auth.isAuthenticated()) {
                throw new Error('Authentication required');
            }

            const user = window.auth.getCurrentUser();
            const newNote = {
                userId: user.id,
                title: noteData.title || 'Untitled Note',
                content: noteData.content || '',
                notebookId: noteData.notebookId || null,
                tags: noteData.tags || [],
                isFavorite: false,
                isArchived: false,
                isPinned: false,
                metadata: {
                    wordCount: this.countWords(noteData.content || ''),
                    readingTime: this.calculateReadingTime(noteData.content || ''),
                    lastEditedBy: user.id
                }
            };

            const noteId = await window.storage.create('notes', newNote);
            const note = await window.storage.read('notes', noteId);

            // Create tag associations
            if (noteData.tags && noteData.tags.length > 0) {
                await this.addTagsToNote(noteId, noteData.tags);
            }

            return {
                success: true,
                note,
                message: 'Note created successfully'
            };

        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    // Get note by ID
    async getNote(noteId) {
        try {
            const note = await window.storage.read('notes', noteId);
            if (!note) {
                throw new Error('Note not found');
            }

            // Check if user has access to this note
            const user = window.auth.getCurrentUser();
            if (user && note.userId !== user.id) {
                throw new Error('Access denied');
            }

            // Get associated tags
            note.tags = await this.getNoteTags(noteId);

            return {
                success: true,
                note
            };

        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    // Update note
    async updateNote(noteId, updates) {
        try {
            if (!window.auth.isAuthenticated()) {
                throw new Error('Authentication required');
            }

            const noteResult = await this.getNote(noteId);
            if (!noteResult.success) {
                throw new Error(noteResult.error);
            }

            const note = noteResult.note;
            const user = window.auth.getCurrentUser();

            // Update allowed fields
            const allowedFields = ['title', 'content', 'notebookId', 'isFavorite', 'isArchived', 'isPinned'];
            const updatedNote = { ...note };

            allowedFields.forEach(field => {
                if (updates[field] !== undefined) {
                    updatedNote[field] = updates[field];
                }
            });

            // Update metadata
            if (updates.content !== undefined) {
                updatedNote.metadata.wordCount = this.countWords(updates.content);
                updatedNote.metadata.readingTime = this.calculateReadingTime(updates.content);
            }
            updatedNote.metadata.lastEditedBy = user.id;

            await window.storage.update('notes', updatedNote);

            // Update tags if provided
            if (updates.tags !== undefined) {
                await this.updateNoteTags(noteId, updates.tags);
                updatedNote.tags = await this.getNoteTags(noteId);
            }

            return {
                success: true,
                note: updatedNote,
                message: 'Note updated successfully'
            };

        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    // Delete note
    async deleteNote(noteId) {
        try {
            const noteResult = await this.getNote(noteId);
            if (!noteResult.success) {
                throw new Error(noteResult.error);
            }

            // Remove tag associations
            await this.removeAllTagsFromNote(noteId);

            // Delete the note
            await window.storage.delete('notes', noteId);

            return {
                success: true,
                message: 'Note deleted successfully'
            };

        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    // Get all notes for current user
    async getUserNotes(filters = {}) {
        try {
            if (!window.auth.isAuthenticated()) {
                throw new Error('Authentication required');
            }

            const user = window.auth.getCurrentUser();
            let notes = await window.storage.getAll('notes');

            // Filter by user
            notes = notes.filter(note => note.userId === user.id);

            // Apply filters
            if (filters.notebookId) {
                notes = notes.filter(note => note.notebookId === filters.notebookId);
            }

            if (filters.isFavorite) {
                notes = notes.filter(note => note.isFavorite);
            }

            if (filters.isArchived !== undefined) {
                notes = notes.filter(note => note.isArchived === filters.isArchived);
            }

            if (filters.isPinned) {
                notes = notes.filter(note => note.isPinned);
            }

            if (filters.search) {
                const searchTerm = filters.search.toLowerCase();
                notes = notes.filter(note =>
                    note.title.toLowerCase().includes(searchTerm) ||
                    note.content.toLowerCase().includes(searchTerm)
                );
            }

            // Get tags for each note
            for (const note of notes) {
                note.tags = await this.getNoteTags(note.id);
            }

            // Sort notes
            const sortBy = filters.sortBy || 'updatedAt';
            const sortOrder = filters.sortOrder || 'desc';

            notes.sort((a, b) => {
                let aValue = a[sortBy];
                let bValue = b[sortBy];

                if (sortBy === 'title') {
                    aValue = aValue.toLowerCase();
                    bValue = bValue.toLowerCase();
                }

                if (sortOrder === 'desc') {
                    return aValue < bValue ? 1 : -1;
                } else {
                    return aValue > bValue ? 1 : -1;
                }
            });

            return {
                success: true,
                notes
            };

        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    // Auto-save functionality
    startAutoSave(noteId) {
        this.stopAutoSave();

        this.autoSaveTimer = setInterval(async () => {
            const content = this.getCurrentNoteContent();
            if (content && this.hasUnsavedChanges()) {
                await this.updateNote(noteId, { content });
                this.markAsSaved();
            }
        }, this.autoSaveInterval);
    }

    stopAutoSave() {
        if (this.autoSaveTimer) {
            clearInterval(this.autoSaveTimer);
            this.autoSaveTimer = null;
        }
    }

    // Helper methods
    countWords(text) {
        return text.trim().split(/\s+/).filter(word => word.length > 0).length;
    }

    calculateReadingTime(text) {
        const wordsPerMinute = 200;
        const wordCount = this.countWords(text);
        return Math.ceil(wordCount / wordsPerMinute);
    }

    getCurrentNoteContent() {
        // This will be implemented when we have the editor
        const editor = document.querySelector('#note-editor');
        return editor ? editor.value || editor.innerHTML : '';
    }

    hasUnsavedChanges() {
        // This will be implemented with the editor
        return false;
    }

    markAsSaved() {
        // Visual indicator that note is saved
        const saveIndicator = document.querySelector('#save-indicator');
        if (saveIndicator) {
            saveIndicator.textContent = 'Saved';
            saveIndicator.className = 'save-indicator saved';
        }
    }

    // Tag management for notes
    async addTagsToNote(noteId, tagNames) {
        const user = window.auth.getCurrentUser();

        for (const tagName of tagNames) {
            let tag = await this.findOrCreateTag(tagName, user.id);

            // Check if association already exists
            const noteTags = await window.storage.getAll('noteTags');
            const existingAssociation = noteTags.find(nt =>
                nt.noteId === noteId && nt.tagId === tag.id
            );

            if (!existingAssociation) {
                await window.storage.create('noteTags', {
                    noteId: noteId,
                    tagId: tag.id
                });
            }
        }
    }

    async removeTagFromNote(noteId, tagId) {
        const noteTags = await window.storage.getAll('noteTags');
        const association = noteTags.find(nt =>
            nt.noteId === noteId && nt.tagId === tagId
        );

        if (association) {
            await window.storage.delete('noteTags', association.id);
        }
    }

    async removeAllTagsFromNote(noteId) {
        const noteTags = await window.storage.getAll('noteTags');
        const associations = noteTags.filter(nt => nt.noteId === noteId);

        for (const association of associations) {
            await window.storage.delete('noteTags', association.id);
        }
    }

    async updateNoteTags(noteId, newTagNames) {
        await this.removeAllTagsFromNote(noteId);
        if (newTagNames.length > 0) {
            await this.addTagsToNote(noteId, newTagNames);
        }
    }

    async getNoteTags(noteId) {
        const noteTags = await window.storage.getAll('noteTags');
        const tags = await window.storage.getAll('tags');

        const noteTagAssociations = noteTags.filter(nt => nt.noteId === noteId);
        const noteTags_ = noteTagAssociations.map(nta => {
            return tags.find(tag => tag.id === nta.tagId);
        }).filter(tag => tag !== undefined);

        return noteTags_.map(tag => tag.name);
    }

    async findOrCreateTag(tagName, userId) {
        const tags = await window.storage.getAll('tags');
        let tag = tags.find(t => t.name === tagName && t.userId === userId);

        if (!tag) {
            const tagId = await window.storage.create('tags', {
                name: tagName,
                userId: userId,
                color: this.generateTagColor(tagName)
            });
            tag = await window.storage.read('tags', tagId);
        }

        return tag;
    }

    generateTagColor(tagName) {
        const colors = ['#E97900', '#81C4FF', '#4CAF50', '#FF5722', '#9C27B0', '#607D8B'];
        let hash = 0;
        for (let i = 0; i < tagName.length; i++) {
            hash = tagName.charCodeAt(i) + ((hash << 5) - hash);
        }
        return colors[Math.abs(hash) % colors.length];
    }
}

// Global notes instance
window.notes = new NotesManager();