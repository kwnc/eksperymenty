// NoteNest - Local Storage Management
class StorageManager {
    constructor() {
        this.dbName = 'notenest-db';
        this.version = 1;
        this.db = null;
        this.isSupported = this.checkSupport();
        this.initPromise = this.init();
    }

    checkSupport() {
        return typeof Storage !== 'undefined' && 'indexedDB' in window;
    }

    async init() {
        if (!this.isSupported) {
            throw new Error('Storage not supported in this browser');
        }

        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.version);

            request.onerror = () => {
                console.error('IndexedDB error:', request.error);
                reject(request.error);
            };

            request.onsuccess = () => {
                this.db = request.result;
                console.log('IndexedDB initialized successfully');
                resolve(this.db);
            };

            request.onupgradeneeded = (event) => {
                const db = event.target.result;

                // Create users store
                if (!db.objectStoreNames.contains('users')) {
                    const usersStore = db.createObjectStore('users', { keyPath: 'id' });
                    usersStore.createIndex('email', 'email', { unique: true });
                }

                // Create notes store
                if (!db.objectStoreNames.contains('notes')) {
                    const notesStore = db.createObjectStore('notes', { keyPath: 'id' });
                    notesStore.createIndex('userId', 'userId', { unique: false });
                    notesStore.createIndex('notebookId', 'notebookId', { unique: false });
                    notesStore.createIndex('createdAt', 'createdAt', { unique: false });
                    notesStore.createIndex('modifiedAt', 'modifiedAt', { unique: false });
                    notesStore.createIndex('title', 'title', { unique: false });
                }

                // Create notebooks store
                if (!db.objectStoreNames.contains('notebooks')) {
                    const notebooksStore = db.createObjectStore('notebooks', { keyPath: 'id' });
                    notebooksStore.createIndex('userId', 'userId', { unique: false });
                    notebooksStore.createIndex('name', 'name', { unique: false });
                }

                // Create settings store
                if (!db.objectStoreNames.contains('settings')) {
                    db.createObjectStore('settings', { keyPath: 'userId' });
                }
            };
        });
    }

    async ensureReady() {
        if (!this.db) {
            await this.initPromise;
        }
    }

    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    // User Management
    async saveUser(user) {
        await this.ensureReady();

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['users'], 'readwrite');
            const store = transaction.objectStore('users');

            const userData = {
                id: user.id || this.generateId(),
                name: user.name,
                email: user.email,
                passwordHash: user.passwordHash,
                createdAt: user.createdAt || new Date().toISOString(),
                lastLogin: user.lastLogin || new Date().toISOString()
            };

            const request = store.put(userData);

            request.onsuccess = () => resolve(userData);
            request.onerror = () => reject(request.error);
        });
    }

    async getUserByEmail(email) {
        await this.ensureReady();

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['users'], 'readonly');
            const store = transaction.objectStore('users');
            const index = store.index('email');
            const request = index.get(email);

            request.onsuccess = () => resolve(request.result || null);
            request.onerror = () => reject(request.error);
        });
    }

    async updateUser(userId, updates) {
        await this.ensureReady();

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['users'], 'readwrite');
            const store = transaction.objectStore('users');

            const getRequest = store.get(userId);
            getRequest.onsuccess = () => {
                const user = getRequest.result;
                if (!user) {
                    reject(new Error('User not found'));
                    return;
                }

                const updatedUser = { ...user, ...updates };
                const putRequest = store.put(updatedUser);

                putRequest.onsuccess = () => resolve(updatedUser);
                putRequest.onerror = () => reject(putRequest.error);
            };
            getRequest.onerror = () => reject(getRequest.error);
        });
    }

    // Note Management
    async saveNote(note) {
        await this.ensureReady();

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['notes'], 'readwrite');
            const store = transaction.objectStore('notes');

            const noteData = {
                id: note.id || this.generateId(),
                userId: note.userId,
                notebookId: note.notebookId || 'default',
                title: note.title || 'Untitled Note',
                content: note.content || '',
                tags: note.tags || [],
                createdAt: note.createdAt || new Date().toISOString(),
                modifiedAt: new Date().toISOString(),
                pinned: note.pinned || false,
                archived: note.archived || false
            };

            const request = store.put(noteData);

            request.onsuccess = () => resolve(noteData);
            request.onerror = () => reject(request.error);
        });
    }

    async getNote(noteId) {
        await this.ensureReady();

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['notes'], 'readonly');
            const store = transaction.objectStore('notes');
            const request = store.get(noteId);

            request.onsuccess = () => resolve(request.result || null);
            request.onerror = () => reject(request.error);
        });
    }

    async getUserNotes(userId, options = {}) {
        await this.ensureReady();

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['notes'], 'readonly');
            const store = transaction.objectStore('notes');
            const index = store.index('userId');
            const request = index.getAll(userId);

            request.onsuccess = () => {
                let notes = request.result || [];

                // Filter by notebook if specified
                if (options.notebookId) {
                    notes = notes.filter(note => note.notebookId === options.notebookId);
                }

                // Filter archived notes unless specifically requested
                if (!options.includeArchived) {
                    notes = notes.filter(note => !note.archived);
                }

                // Sort notes
                const sortBy = options.sortBy || 'modifiedAt';
                const sortOrder = options.sortOrder || 'desc';

                notes.sort((a, b) => {
                    let aVal = a[sortBy];
                    let bVal = b[sortBy];

                    if (sortBy === 'title') {
                        aVal = aVal.toLowerCase();
                        bVal = bVal.toLowerCase();
                    }

                    if (sortOrder === 'asc') {
                        return aVal > bVal ? 1 : aVal < bVal ? -1 : 0;
                    } else {
                        return aVal < bVal ? 1 : aVal > bVal ? -1 : 0;
                    }
                });

                resolve(notes);
            };
            request.onerror = () => reject(request.error);
        });
    }

    async deleteNote(noteId) {
        await this.ensureReady();

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['notes'], 'readwrite');
            const store = transaction.objectStore('notes');
            const request = store.delete(noteId);

            request.onsuccess = () => resolve(true);
            request.onerror = () => reject(request.error);
        });
    }

    async searchNotes(userId, query) {
        await this.ensureReady();
        const notes = await this.getUserNotes(userId);

        const searchQuery = query.toLowerCase();
        return notes.filter(note => {
            const titleMatch = note.title.toLowerCase().includes(searchQuery);
            const contentMatch = note.content.toLowerCase().includes(searchQuery);
            const tagMatch = note.tags.some(tag => tag.toLowerCase().includes(searchQuery));

            return titleMatch || contentMatch || tagMatch;
        });
    }

    // Notebook Management
    async saveNotebook(notebook) {
        await this.ensureReady();

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['notebooks'], 'readwrite');
            const store = transaction.objectStore('notebooks');

            const notebookData = {
                id: notebook.id || this.generateId(),
                userId: notebook.userId,
                name: notebook.name,
                description: notebook.description || '',
                color: notebook.color || '#E97900',
                createdAt: notebook.createdAt || new Date().toISOString(),
                modifiedAt: new Date().toISOString()
            };

            const request = store.put(notebookData);

            request.onsuccess = () => resolve(notebookData);
            request.onerror = () => reject(request.error);
        });
    }

    async getUserNotebooks(userId) {
        await this.ensureReady();

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['notebooks'], 'readonly');
            const store = transaction.objectStore('notebooks');
            const index = store.index('userId');
            const request = index.getAll(userId);

            request.onsuccess = () => {
                const notebooks = request.result || [];
                // Sort by name
                notebooks.sort((a, b) => a.name.localeCompare(b.name));
                resolve(notebooks);
            };
            request.onerror = () => reject(request.error);
        });
    }

    async deleteNotebook(notebookId) {
        await this.ensureReady();

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['notebooks', 'notes'], 'readwrite');

            // Delete the notebook
            const notebookStore = transaction.objectStore('notebooks');
            notebookStore.delete(notebookId);

            // Move notes to default notebook
            const notesStore = transaction.objectStore('notes');
            const notesIndex = notesStore.index('notebookId');
            const notesRequest = notesIndex.getAll(notebookId);

            notesRequest.onsuccess = () => {
                const notes = notesRequest.result;
                notes.forEach(note => {
                    note.notebookId = 'default';
                    note.modifiedAt = new Date().toISOString();
                    notesStore.put(note);
                });
            };

            transaction.oncomplete = () => resolve(true);
            transaction.onerror = () => reject(transaction.error);
        });
    }

    // Settings Management
    async saveSettings(userId, settings) {
        await this.ensureReady();

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['settings'], 'readwrite');
            const store = transaction.objectStore('settings');

            const settingsData = {
                userId: userId,
                theme: settings.theme || 'light',
                fontSize: settings.fontSize || 'medium',
                sortBy: settings.sortBy || 'modifiedAt',
                sortOrder: settings.sortOrder || 'desc',
                ...settings
            };

            const request = store.put(settingsData);

            request.onsuccess = () => resolve(settingsData);
            request.onerror = () => reject(request.error);
        });
    }

    async getSettings(userId) {
        await this.ensureReady();

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['settings'], 'readonly');
            const store = transaction.objectStore('settings');
            const request = store.get(userId);

            request.onsuccess = () => {
                const settings = request.result || {
                    userId: userId,
                    theme: 'light',
                    fontSize: 'medium',
                    sortBy: 'modifiedAt',
                    sortOrder: 'desc'
                };
                resolve(settings);
            };
            request.onerror = () => reject(request.error);
        });
    }

    // Backup and Restore
    async exportData(userId) {
        await this.ensureReady();

        try {
            const [notes, notebooks, settings] = await Promise.all([
                this.getUserNotes(userId, { includeArchived: true }),
                this.getUserNotebooks(userId),
                this.getSettings(userId)
            ]);

            return {
                version: 1,
                exportDate: new Date().toISOString(),
                userId: userId,
                notes: notes,
                notebooks: notebooks,
                settings: settings
            };
        } catch (error) {
            throw new Error(`Export failed: ${error.message}`);
        }
    }

    async importData(userId, data) {
        await this.ensureReady();

        try {
            const transaction = this.db.transaction(['notes', 'notebooks', 'settings'], 'readwrite');

            // Import notebooks
            if (data.notebooks) {
                const notebooksStore = transaction.objectStore('notebooks');
                data.notebooks.forEach(notebook => {
                    notebook.userId = userId;
                    notebook.id = this.generateId();
                    notebooksStore.put(notebook);
                });
            }

            // Import notes
            if (data.notes) {
                const notesStore = transaction.objectStore('notes');
                data.notes.forEach(note => {
                    note.userId = userId;
                    note.id = this.generateId();
                    notesStore.put(note);
                });
            }

            // Import settings
            if (data.settings) {
                const settingsStore = transaction.objectStore('settings');
                data.settings.userId = userId;
                settingsStore.put(data.settings);
            }

            return new Promise((resolve, reject) => {
                transaction.oncomplete = () => resolve(true);
                transaction.onerror = () => reject(transaction.error);
            });
        } catch (error) {
            throw new Error(`Import failed: ${error.message}`);
        }
    }

    // Utility Methods
    async clearUserData(userId) {
        await this.ensureReady();

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['notes', 'notebooks', 'settings'], 'readwrite');

            // Clear notes
            const notesStore = transaction.objectStore('notes');
            const notesIndex = notesStore.index('userId');
            const notesRequest = notesIndex.getAll(userId);
            notesRequest.onsuccess = () => {
                notesRequest.result.forEach(note => {
                    notesStore.delete(note.id);
                });
            };

            // Clear notebooks
            const notebooksStore = transaction.objectStore('notebooks');
            const notebooksIndex = notebooksStore.index('userId');
            const notebooksRequest = notebooksIndex.getAll(userId);
            notebooksRequest.onsuccess = () => {
                notebooksRequest.result.forEach(notebook => {
                    notebooksStore.delete(notebook.id);
                });
            };

            // Clear settings
            const settingsStore = transaction.objectStore('settings');
            settingsStore.delete(userId);

            transaction.oncomplete = () => resolve(true);
            transaction.onerror = () => reject(transaction.error);
        });
    }

    // Session storage utilities for temporary data
    setSessionData(key, data) {
        if (typeof sessionStorage !== 'undefined') {
            sessionStorage.setItem(`notenest_${key}`, JSON.stringify(data));
        }
    }

    getSessionData(key) {
        if (typeof sessionStorage !== 'undefined') {
            const data = sessionStorage.getItem(`notenest_${key}`);
            return data ? JSON.parse(data) : null;
        }
        return null;
    }

    clearSessionData(key = null) {
        if (typeof sessionStorage !== 'undefined') {
            if (key) {
                sessionStorage.removeItem(`notenest_${key}`);
            } else {
                // Clear all NoteNest session data
                const keys = Object.keys(sessionStorage);
                keys.forEach(sessionKey => {
                    if (sessionKey.startsWith('notenest_')) {
                        sessionStorage.removeItem(sessionKey);
                    }
                });
            }
        }
    }
}

// Export for use in other modules
window.StorageManager = StorageManager;