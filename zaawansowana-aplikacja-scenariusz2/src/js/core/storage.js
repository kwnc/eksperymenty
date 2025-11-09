/**
 * Storage Module - Handles data persistence with fallback mechanisms
 * Primary: IndexedDB, Fallback: localStorage
 */

class StorageManager {
    constructor() {
        this.hasIndexedDB = 'indexedDB' in window;
        this.hasLocalStorage = 'localStorage' in window;
        this.currentUser = null;
    }

    async init() {
        if (this.hasIndexedDB) {
            try {
                await window.noteNestDB.init();
                console.log('IndexedDB initialized successfully');
                return true;
            } catch (error) {
                console.warn('IndexedDB initialization failed, falling back to localStorage:', error);
                this.hasIndexedDB = false;
            }
        }

        if (this.hasLocalStorage) {
            console.log('Using localStorage as storage backend');
            this.initLocalStorage();
            return true;
        }

        throw new Error('No storage mechanism available');
    }

    initLocalStorage() {
        const defaultData = {
            users: [],
            notebooks: [],
            notes: [],
            tags: [],
            noteTags: [],
            currentUserId: null,
            settings: {
                theme: 'light',
                autoSave: true,
                autoSaveInterval: 30000
            }
        };

        Object.keys(defaultData).forEach(key => {
            if (!localStorage.getItem(`noteNest_${key}`)) {
                localStorage.setItem(`noteNest_${key}`, JSON.stringify(defaultData[key]));
            }
        });
    }

    // User management
    async createUser(userData) {
        if (this.hasIndexedDB) {
            return await window.noteNestDB.create('users', userData);
        } else {
            const users = this.getLocalData('users');
            const newUser = {
                id: Date.now(),
                ...userData,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };
            users.push(newUser);
            this.setLocalData('users', users);
            return newUser.id;
        }
    }

    async getUser(userId) {
        if (this.hasIndexedDB) {
            return await window.noteNestDB.read('users', userId);
        } else {
            const users = this.getLocalData('users');
            return users.find(user => user.id === userId);
        }
    }

    async getUserByUsername(username) {
        if (this.hasIndexedDB) {
            const results = await window.noteNestDB.getByIndex('users', 'username', username);
            return results[0] || null;
        } else {
            const users = this.getLocalData('users');
            return users.find(user => user.username === username) || null;
        }
    }

    // Current user session
    setCurrentUser(user) {
        this.currentUser = user;
        if (this.hasLocalStorage) {
            localStorage.setItem('noteNest_currentUserId', user ? user.id : null);
        }
    }

    getCurrentUser() {
        if (this.currentUser) return this.currentUser;

        if (this.hasLocalStorage) {
            const userId = localStorage.getItem('noteNest_currentUserId');
            if (userId) {
                return this.getUser(parseInt(userId));
            }
        }
        return null;
    }

    async logout() {
        this.currentUser = null;
        if (this.hasLocalStorage) {
            localStorage.removeItem('noteNest_currentUserId');
        }
    }

    // Generic data operations
    async create(storeName, data) {
        if (this.hasIndexedDB) {
            return await window.noteNestDB.create(storeName, data);
        } else {
            const items = this.getLocalData(storeName);
            const newItem = {
                id: Date.now(),
                ...data,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };
            items.push(newItem);
            this.setLocalData(storeName, items);
            return newItem.id;
        }
    }

    async read(storeName, id) {
        if (this.hasIndexedDB) {
            return await window.noteNestDB.read(storeName, id);
        } else {
            const items = this.getLocalData(storeName);
            return items.find(item => item.id === id);
        }
    }

    async update(storeName, data) {
        if (this.hasIndexedDB) {
            return await window.noteNestDB.update(storeName, data);
        } else {
            const items = this.getLocalData(storeName);
            const index = items.findIndex(item => item.id === data.id);
            if (index !== -1) {
                items[index] = {
                    ...data,
                    updatedAt: new Date().toISOString()
                };
                this.setLocalData(storeName, items);
                return data.id;
            }
            throw new Error(`Item with id ${data.id} not found`);
        }
    }

    async delete(storeName, id) {
        if (this.hasIndexedDB) {
            return await window.noteNestDB.delete(storeName, id);
        } else {
            const items = this.getLocalData(storeName);
            const filteredItems = items.filter(item => item.id !== id);
            this.setLocalData(storeName, filteredItems);
            return id;
        }
    }

    async getAll(storeName) {
        if (this.hasIndexedDB) {
            return await window.noteNestDB.getAll(storeName);
        } else {
            return this.getLocalData(storeName);
        }
    }

    async search(storeName, query) {
        if (this.hasIndexedDB) {
            return await window.noteNestDB.search(storeName, query);
        } else {
            const items = this.getLocalData(storeName);
            const searchText = query.toLowerCase();
            return items.filter(item => {
                return (
                    (item.title && item.title.toLowerCase().includes(searchText)) ||
                    (item.content && item.content.toLowerCase().includes(searchText)) ||
                    (item.name && item.name.toLowerCase().includes(searchText))
                );
            });
        }
    }

    // localStorage helpers
    getLocalData(key) {
        try {
            return JSON.parse(localStorage.getItem(`noteNest_${key}`)) || [];
        } catch (error) {
            console.error(`Error reading localStorage key: noteNest_${key}`, error);
            return [];
        }
    }

    setLocalData(key, data) {
        try {
            localStorage.setItem(`noteNest_${key}`, JSON.stringify(data));
        } catch (error) {
            console.error(`Error writing localStorage key: noteNest_${key}`, error);
            throw error;
        }
    }

    // Settings management
    getSetting(key, defaultValue = null) {
        if (this.hasLocalStorage) {
            const settings = this.getLocalData('settings');
            return settings[key] !== undefined ? settings[key] : defaultValue;
        }
        return defaultValue;
    }

    setSetting(key, value) {
        if (this.hasLocalStorage) {
            const settings = this.getLocalData('settings');
            settings[key] = value;
            this.setLocalData('settings', settings);
        }
    }

    // Data export/import
    async exportAllData() {
        const data = {};
        const stores = ['users', 'notebooks', 'notes', 'tags', 'noteTags'];

        for (const store of stores) {
            data[store] = await this.getAll(store);
        }

        if (this.hasLocalStorage) {
            data.settings = this.getLocalData('settings');
        }

        return {
            exportDate: new Date().toISOString(),
            version: '1.0',
            data
        };
    }

    async importData(importData) {
        if (!importData.data) throw new Error('Invalid import data format');

        const stores = ['users', 'notebooks', 'notes', 'tags', 'noteTags'];

        for (const store of stores) {
            if (importData.data[store]) {
                this.setLocalData(store, importData.data[store]);
            }
        }

        if (importData.data.settings) {
            this.setLocalData('settings', importData.data.settings);
        }

        // Reinitialize if using IndexedDB
        if (this.hasIndexedDB) {
            await this.init();
        }
    }
}

// Global storage instance
window.storage = new StorageManager();