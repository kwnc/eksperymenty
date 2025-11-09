/**
 * Notebooks Module - Handles notebook organization
 * Phase 2 Implementation
 */

class NotebooksManager {
    constructor() {
        this.currentNotebook = null;
    }

    // Create new notebook
    async createNotebook(notebookData) {
        try {
            if (!window.auth.isAuthenticated()) {
                throw new Error('Authentication required');
            }

            const user = window.auth.getCurrentUser();
            const newNotebook = {
                userId: user.id,
                name: notebookData.name || 'Untitled Notebook',
                description: notebookData.description || '',
                color: notebookData.color || this.generateNotebookColor(notebookData.name),
                isDefault: notebookData.isDefault || false,
                settings: {
                    sortBy: 'updatedAt',
                    sortOrder: 'desc',
                    viewMode: 'list'
                }
            };

            const notebookId = await window.storage.create('notebooks', newNotebook);
            const notebook = await window.storage.read('notebooks', notebookId);

            return {
                success: true,
                notebook,
                message: 'Notebook created successfully'
            };

        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    // Get notebook by ID
    async getNotebook(notebookId) {
        try {
            const notebook = await window.storage.read('notebooks', notebookId);
            if (!notebook) {
                throw new Error('Notebook not found');
            }

            // Check if user has access to this notebook
            const user = window.auth.getCurrentUser();
            if (user && notebook.userId !== user.id) {
                throw new Error('Access denied');
            }

            return {
                success: true,
                notebook
            };

        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    // Update notebook
    async updateNotebook(notebookId, updates) {
        try {
            if (!window.auth.isAuthenticated()) {
                throw new Error('Authentication required');
            }

            const notebookResult = await this.getNotebook(notebookId);
            if (!notebookResult.success) {
                throw new Error(notebookResult.error);
            }

            const notebook = notebookResult.notebook;

            // Update allowed fields
            const allowedFields = ['name', 'description', 'color', 'settings'];
            const updatedNotebook = { ...notebook };

            allowedFields.forEach(field => {
                if (updates[field] !== undefined) {
                    if (field === 'settings') {
                        updatedNotebook.settings = { ...notebook.settings, ...updates.settings };
                    } else {
                        updatedNotebook[field] = updates[field];
                    }
                }
            });

            await window.storage.update('notebooks', updatedNotebook);

            return {
                success: true,
                notebook: updatedNotebook,
                message: 'Notebook updated successfully'
            };

        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    // Delete notebook
    async deleteNotebook(notebookId) {
        try {
            const notebookResult = await this.getNotebook(notebookId);
            if (!notebookResult.success) {
                throw new Error(notebookResult.error);
            }

            const notebook = notebookResult.notebook;

            // Don't allow deletion of default notebook
            if (notebook.isDefault) {
                throw new Error('Cannot delete default notebook');
            }

            // Move all notes from this notebook to default notebook
            const defaultNotebook = await this.getDefaultNotebook();
            if (defaultNotebook.success) {
                const allNotes = await window.storage.getAll('notes');
                const notesToMove = allNotes.filter(note => note.notebookId === notebookId);

                for (const note of notesToMove) {
                    note.notebookId = defaultNotebook.notebook.id;
                    await window.storage.update('notes', note);
                }
            }

            // Delete the notebook
            await window.storage.delete('notebooks', notebookId);

            return {
                success: true,
                message: 'Notebook deleted successfully'
            };

        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    // Get all notebooks for current user
    async getUserNotebooks() {
        try {
            if (!window.auth.isAuthenticated()) {
                throw new Error('Authentication required');
            }

            const user = window.auth.getCurrentUser();
            let notebooks = await window.storage.getAll('notebooks');

            // Filter by user
            notebooks = notebooks.filter(notebook => notebook.userId === user.id);

            // Sort notebooks (default first, then alphabetically)
            notebooks.sort((a, b) => {
                if (a.isDefault && !b.isDefault) return -1;
                if (!a.isDefault && b.isDefault) return 1;
                return a.name.localeCompare(b.name);
            });

            // Get note counts for each notebook
            const allNotes = await window.storage.getAll('notes');
            notebooks.forEach(notebook => {
                notebook.noteCount = allNotes.filter(note =>
                    note.notebookId === notebook.id && note.userId === user.id
                ).length;
            });

            return {
                success: true,
                notebooks
            };

        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    // Get or create default notebook
    async getDefaultNotebook() {
        try {
            if (!window.auth.isAuthenticated()) {
                throw new Error('Authentication required');
            }

            const user = window.auth.getCurrentUser();
            const notebooks = await window.storage.getAll('notebooks');

            let defaultNotebook = notebooks.find(notebook =>
                notebook.userId === user.id && notebook.isDefault
            );

            if (!defaultNotebook) {
                // Create default notebook
                const result = await this.createNotebook({
                    name: 'General',
                    description: 'Default notebook for your notes',
                    isDefault: true,
                    color: '#E97900'
                });

                if (result.success) {
                    defaultNotebook = result.notebook;
                } else {
                    throw new Error('Failed to create default notebook');
                }
            }

            return {
                success: true,
                notebook: defaultNotebook
            };

        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    // Get notes in a specific notebook
    async getNotebookNotes(notebookId, filters = {}) {
        try {
            const notebookResult = await this.getNotebook(notebookId);
            if (!notebookResult.success) {
                throw new Error(notebookResult.error);
            }

            const notebook = notebookResult.notebook;
            const notesResult = await window.notes.getUserNotes({
                ...filters,
                notebookId: notebookId
            });

            if (notesResult.success) {
                // Sort according to notebook settings
                const sortBy = notebook.settings.sortBy || 'updatedAt';
                const sortOrder = notebook.settings.sortOrder || 'desc';

                notesResult.notes.sort((a, b) => {
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
            }

            return notesResult;

        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    // Move note to different notebook
    async moveNoteToNotebook(noteId, notebookId) {
        try {
            const noteResult = await window.notes.getNote(noteId);
            if (!noteResult.success) {
                throw new Error(noteResult.error);
            }

            const notebookResult = await this.getNotebook(notebookId);
            if (!notebookResult.success) {
                throw new Error(notebookResult.error);
            }

            const updateResult = await window.notes.updateNote(noteId, {
                notebookId: notebookId
            });

            return updateResult;

        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    // Set current notebook
    setCurrentNotebook(notebook) {
        this.currentNotebook = notebook;
    }

    getCurrentNotebook() {
        return this.currentNotebook;
    }

    // Generate color for notebook
    generateNotebookColor(name) {
        const colors = ['#E97900', '#81C4FF', '#4CAF50', '#FF5722', '#9C27B0', '#607D8B', '#FF9800', '#795548'];
        let hash = 0;
        for (let i = 0; i < name.length; i++) {
            hash = name.charCodeAt(i) + ((hash << 5) - hash);
        }
        return colors[Math.abs(hash) % colors.length];
    }

    // Initialize notebooks for new user
    async initializeUserNotebooks(userId) {
        try {
            const notebooks = await window.storage.getAll('notebooks');
            const userNotebooks = notebooks.filter(notebook => notebook.userId === userId);

            if (userNotebooks.length === 0) {
                // Create default notebook
                await this.createNotebook({
                    name: 'General',
                    description: 'Your default notebook',
                    isDefault: true,
                    color: '#E97900'
                });
            }

        } catch (error) {
            console.error('Failed to initialize user notebooks:', error);
        }
    }

    // Search notebooks
    async searchNotebooks(query) {
        try {
            const result = await this.getUserNotebooks();
            if (!result.success) {
                throw new Error(result.error);
            }

            const searchTerm = query.toLowerCase();
            const filteredNotebooks = result.notebooks.filter(notebook =>
                notebook.name.toLowerCase().includes(searchTerm) ||
                (notebook.description && notebook.description.toLowerCase().includes(searchTerm))
            );

            return {
                success: true,
                notebooks: filteredNotebooks
            };

        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }
}

window.notebooks = new NotebooksManager();