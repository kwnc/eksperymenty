// NoteNest - Notebooks Management
class NotebooksManager {
    constructor() {
        this.storageManager = null;
        this.authManager = null;
        this.notebooks = [];
        this.currentNotebook = null;
        this.onNotebooksChanged = null;
        this.onCurrentNotebookChanged = null;
        this.init();
    }

    async init() {
        // Wait for required managers
        if (typeof StorageManager !== 'undefined') {
            this.storageManager = new StorageManager();
            // AuthManager will be injected by app.js
        } else {
            setTimeout(() => this.init(), 100);
        }
    }

    setAuthManager(authManager) {
        this.authManager = authManager;
    }

    // Load notebooks for current user
    async loadNotebooks() {
        try {
            if (!this.authManager || !this.authManager.isAuthenticated()) {
                throw new Error('Not authenticated');
            }

            const userId = this.authManager.getCurrentUser().id;
            this.notebooks = await this.storageManager.getUserNotebooks(userId);

            // Ensure default notebook exists
            if (this.notebooks.length === 0) {
                await this.createDefaultNotebook();
            }

            if (this.onNotebooksChanged) {
                this.onNotebooksChanged(this.notebooks);
            }

            return this.notebooks;

        } catch (error) {
            console.error('Error loading notebooks:', error);
            throw error;
        }
    }

    // Create default notebook
    async createDefaultNotebook() {
        try {
            if (!this.authManager || !this.authManager.isAuthenticated()) {
                throw new Error('Not authenticated');
            }

            const userId = this.authManager.getCurrentUser().id;
            const defaultNotebook = {
                userId: userId,
                name: 'Personal Notes',
                description: 'Your default notebook for personal notes',
                color: '#E97900'
            };

            const notebook = await this.storageManager.saveNotebook(defaultNotebook);
            this.notebooks.push(notebook);

            if (this.onNotebooksChanged) {
                this.onNotebooksChanged(this.notebooks);
            }

            return notebook;

        } catch (error) {
            console.error('Error creating default notebook:', error);
            throw error;
        }
    }

    // Create new notebook
    async createNotebook(data) {
        try {
            if (!this.authManager || !this.authManager.isAuthenticated()) {
                throw new Error('Not authenticated');
            }

            // Validate required fields
            if (!data.name || data.name.trim() === '') {
                throw new Error('Notebook name is required');
            }

            const userId = this.authManager.getCurrentUser().id;

            // Check if notebook name already exists
            const existingNotebook = this.notebooks.find(nb =>
                nb.name.toLowerCase() === data.name.trim().toLowerCase()
            );
            if (existingNotebook) {
                throw new Error('A notebook with this name already exists');
            }

            const notebookData = {
                userId: userId,
                name: data.name.trim(),
                description: data.description || '',
                color: data.color || this.generateRandomColor()
            };

            const newNotebook = await this.storageManager.saveNotebook(notebookData);

            // Add to local notebooks array
            this.notebooks.push(newNotebook);
            this.notebooks.sort((a, b) => a.name.localeCompare(b.name));

            if (this.onNotebooksChanged) {
                this.onNotebooksChanged(this.notebooks);
            }

            return newNotebook;

        } catch (error) {
            console.error('Error creating notebook:', error);
            throw error;
        }
    }

    // Update notebook
    async updateNotebook(notebookId, updates) {
        try {
            if (!this.authManager || !this.authManager.isAuthenticated()) {
                throw new Error('Not authenticated');
            }

            const notebook = this.notebooks.find(nb => nb.id === notebookId);
            if (!notebook) {
                throw new Error('Notebook not found');
            }

            // Verify ownership
            const userId = this.authManager.getCurrentUser().id;
            if (notebook.userId !== userId) {
                throw new Error('Unauthorized');
            }

            // Validate name if being updated
            if (updates.name !== undefined) {
                if (!updates.name || updates.name.trim() === '') {
                    throw new Error('Notebook name cannot be empty');
                }

                // Check for duplicate names (excluding current notebook)
                const duplicateName = this.notebooks.find(nb =>
                    nb.id !== notebookId &&
                    nb.name.toLowerCase() === updates.name.trim().toLowerCase()
                );
                if (duplicateName) {
                    throw new Error('A notebook with this name already exists');
                }
            }

            const updatedNotebook = await this.storageManager.saveNotebook({
                ...notebook,
                ...updates,
                id: notebookId,
                userId: userId
            });

            // Update local notebooks array
            const notebookIndex = this.notebooks.findIndex(nb => nb.id === notebookId);
            if (notebookIndex !== -1) {
                this.notebooks[notebookIndex] = updatedNotebook;
                this.notebooks.sort((a, b) => a.name.localeCompare(b.name));
            }

            // Update current notebook if it's the one being updated
            if (this.currentNotebook && this.currentNotebook.id === notebookId) {
                this.currentNotebook = updatedNotebook;
                if (this.onCurrentNotebookChanged) {
                    this.onCurrentNotebookChanged(this.currentNotebook);
                }
            }

            if (this.onNotebooksChanged) {
                this.onNotebooksChanged(this.notebooks);
            }

            return updatedNotebook;

        } catch (error) {
            console.error('Error updating notebook:', error);
            throw error;
        }
    }

    // Delete notebook
    async deleteNotebook(notebookId) {
        try {
            if (!this.authManager || !this.authManager.isAuthenticated()) {
                throw new Error('Not authenticated');
            }

            const notebook = this.notebooks.find(nb => nb.id === notebookId);
            if (!notebook) {
                throw new Error('Notebook not found');
            }

            // Verify ownership
            const userId = this.authManager.getCurrentUser().id;
            if (notebook.userId !== userId) {
                throw new Error('Unauthorized');
            }

            // Prevent deletion of last notebook
            if (this.notebooks.length <= 1) {
                throw new Error('Cannot delete the last notebook');
            }

            // Delete from storage (this will move notes to default notebook)
            await this.storageManager.deleteNotebook(notebookId);

            // Remove from local notebooks array
            this.notebooks = this.notebooks.filter(nb => nb.id !== notebookId);

            // Clear current notebook if it was deleted
            if (this.currentNotebook && this.currentNotebook.id === notebookId) {
                this.currentNotebook = null;
                if (this.onCurrentNotebookChanged) {
                    this.onCurrentNotebookChanged(null);
                }
            }

            if (this.onNotebooksChanged) {
                this.onNotebooksChanged(this.notebooks);
            }

            return true;

        } catch (error) {
            console.error('Error deleting notebook:', error);
            throw error;
        }
    }

    // Get notebook by ID
    getNotebook(notebookId) {
        return this.notebooks.find(nb => nb.id === notebookId) || null;
    }

    // Get notebook by name
    getNotebookByName(name) {
        return this.notebooks.find(nb =>
            nb.name.toLowerCase() === name.toLowerCase()
        ) || null;
    }

    // Set current notebook
    setCurrentNotebook(notebookId) {
        if (notebookId === null || notebookId === 'all') {
            this.currentNotebook = null;
            if (this.onCurrentNotebookChanged) {
                this.onCurrentNotebookChanged(null);
            }
            return null;
        }

        const notebook = this.getNotebook(notebookId);
        if (notebook) {
            this.currentNotebook = notebook;
            if (this.onCurrentNotebookChanged) {
                this.onCurrentNotebookChanged(this.currentNotebook);
            }
        }

        return this.currentNotebook;
    }

    // Get current notebook
    getCurrentNotebook() {
        return this.currentNotebook;
    }

    // Get all notebooks
    getAllNotebooks() {
        return this.notebooks;
    }

    // Get notebook statistics
    async getNotebookStats(notebookId) {
        try {
            if (!this.authManager || !this.authManager.isAuthenticated()) {
                throw new Error('Not authenticated');
            }

            const userId = this.authManager.getCurrentUser().id;
            const notes = await this.storageManager.getUserNotes(userId, {
                notebookId: notebookId,
                includeArchived: true
            });

            const stats = {
                totalNotes: notes.length,
                activeNotes: notes.filter(note => !note.archived).length,
                archivedNotes: notes.filter(note => note.archived).length,
                pinnedNotes: notes.filter(note => note.pinned).length,
                lastModified: notes.length > 0 ? Math.max(...notes.map(note =>
                    new Date(note.modifiedAt).getTime()
                )) : null
            };

            if (stats.lastModified) {
                stats.lastModified = new Date(stats.lastModified).toISOString();
            }

            return stats;

        } catch (error) {
            console.error('Error getting notebook stats:', error);
            throw error;
        }
    }

    // Get all notebook statistics
    async getAllNotebookStats() {
        const statsPromises = this.notebooks.map(async notebook => {
            const stats = await this.getNotebookStats(notebook.id);
            return {
                id: notebook.id,
                name: notebook.name,
                color: notebook.color,
                ...stats
            };
        });

        return await Promise.all(statsPromises);
    }

    // Move notes between notebooks
    async moveNotesToNotebook(noteIds, targetNotebookId) {
        try {
            if (!this.authManager || !this.authManager.isAuthenticated()) {
                throw new Error('Not authenticated');
            }

            const targetNotebook = this.getNotebook(targetNotebookId);
            if (!targetNotebook) {
                throw new Error('Target notebook not found');
            }

            const userId = this.authManager.getCurrentUser().id;
            const updatePromises = noteIds.map(async noteId => {
                const note = await this.storageManager.getNote(noteId);
                if (!note || note.userId !== userId) {
                    throw new Error(`Note ${noteId} not found or unauthorized`);
                }

                return await this.storageManager.saveNote({
                    ...note,
                    notebookId: targetNotebookId,
                    modifiedAt: new Date().toISOString()
                });
            });

            await Promise.all(updatePromises);
            return true;

        } catch (error) {
            console.error('Error moving notes:', error);
            throw error;
        }
    }

    // Duplicate notebook
    async duplicateNotebook(notebookId, newName) {
        try {
            if (!this.authManager || !this.authManager.isAuthenticated()) {
                throw new Error('Not authenticated');
            }

            const originalNotebook = this.getNotebook(notebookId);
            if (!originalNotebook) {
                throw new Error('Notebook not found');
            }

            // Create new notebook
            const duplicateNotebook = await this.createNotebook({
                name: newName || `${originalNotebook.name} (Copy)`,
                description: originalNotebook.description,
                color: originalNotebook.color
            });

            // Get all notes from original notebook
            const userId = this.authManager.getCurrentUser().id;
            const originalNotes = await this.storageManager.getUserNotes(userId, {
                notebookId: notebookId,
                includeArchived: true
            });

            // Duplicate all notes to new notebook
            const notePromises = originalNotes.map(note => {
                return this.storageManager.saveNote({
                    userId: userId,
                    notebookId: duplicateNotebook.id,
                    title: `${note.title} (Copy)`,
                    content: note.content,
                    tags: [...note.tags],
                    pinned: false,
                    archived: false
                });
            });

            await Promise.all(notePromises);

            return duplicateNotebook;

        } catch (error) {
            console.error('Error duplicating notebook:', error);
            throw error;
        }
    }

    // Generate random color for notebook
    generateRandomColor() {
        const colors = [
            '#E97900', '#DC2626', '#7C3AED', '#059669',
            '#2563EB', '#EA580C', '#BE185D', '#0891B2',
            '#65A30D', '#CA8A04', '#4338CA', '#9333EA'
        ];
        return colors[Math.floor(Math.random() * colors.length)];
    }

    // Validate notebook color
    isValidColor(color) {
        const hexRegex = /^#[0-9A-Fa-f]{6}$/;
        return hexRegex.test(color);
    }

    // Get notebook color palette
    getColorPalette() {
        return [
            { name: 'Orange', value: '#E97900' },
            { name: 'Red', value: '#DC2626' },
            { name: 'Purple', value: '#7C3AED' },
            { name: 'Green', value: '#059669' },
            { name: 'Blue', value: '#2563EB' },
            { name: 'Orange Alt', value: '#EA580C' },
            { name: 'Pink', value: '#BE185D' },
            { name: 'Cyan', value: '#0891B2' },
            { name: 'Lime', value: '#65A30D' },
            { name: 'Yellow', value: '#CA8A04' },
            { name: 'Indigo', value: '#4338CA' },
            { name: 'Violet', value: '#9333EA' }
        ];
    }

    // Export notebook data
    async exportNotebook(notebookId) {
        try {
            if (!this.authManager || !this.authManager.isAuthenticated()) {
                throw new Error('Not authenticated');
            }

            const notebook = this.getNotebook(notebookId);
            if (!notebook) {
                throw new Error('Notebook not found');
            }

            const userId = this.authManager.getCurrentUser().id;
            const notes = await this.storageManager.getUserNotes(userId, {
                notebookId: notebookId,
                includeArchived: true
            });

            return {
                version: 1,
                exportDate: new Date().toISOString(),
                notebook: notebook,
                notes: notes,
                totalNotes: notes.length
            };

        } catch (error) {
            console.error('Error exporting notebook:', error);
            throw error;
        }
    }

    // Import notebook data
    async importNotebook(data) {
        try {
            if (!this.authManager || !this.authManager.isAuthenticated()) {
                throw new Error('Not authenticated');
            }

            if (!data.notebook || !data.notes) {
                throw new Error('Invalid notebook data');
            }

            const userId = this.authManager.getCurrentUser().id;

            // Create notebook with unique name if needed
            let notebookName = data.notebook.name;
            let counter = 1;
            while (this.getNotebookByName(notebookName)) {
                notebookName = `${data.notebook.name} (${counter})`;
                counter++;
            }

            const newNotebook = await this.createNotebook({
                name: notebookName,
                description: data.notebook.description,
                color: data.notebook.color
            });

            // Import notes
            const notePromises = data.notes.map(note => {
                return this.storageManager.saveNote({
                    userId: userId,
                    notebookId: newNotebook.id,
                    title: note.title,
                    content: note.content,
                    tags: note.tags || [],
                    pinned: false,
                    archived: false
                });
            });

            await Promise.all(notePromises);

            return {
                notebook: newNotebook,
                importedNotes: data.notes.length
            };

        } catch (error) {
            console.error('Error importing notebook:', error);
            throw error;
        }
    }

    // Set callbacks
    setNotebooksChangedCallback(callback) {
        this.onNotebooksChanged = callback;
    }

    setCurrentNotebookChangedCallback(callback) {
        this.onCurrentNotebookChanged = callback;
    }

    // Cleanup
    destroy() {
        this.onNotebooksChanged = null;
        this.onCurrentNotebookChanged = null;
    }
}

// Export for use in other modules
window.NotebooksManager = NotebooksManager;