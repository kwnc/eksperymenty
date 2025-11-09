/**
 * Database Module - IndexedDB wrapper for NoteNest
 * Handles all database operations for users, notes, notebooks, and tags
 */

class NoteNestDB {
    constructor() {
        this.dbName = 'NoteNestDB';
        this.version = 1;
        this.db = null;
    }

    async init() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.version);

            request.onerror = () => reject(request.error);
            request.onsuccess = () => {
                this.db = request.result;
                resolve(this.db);
            };

            request.onupgradeneeded = (event) => {
                const db = event.target.result;

                // Users store
                if (!db.objectStoreNames.contains('users')) {
                    const userStore = db.createObjectStore('users', { keyPath: 'id', autoIncrement: true });
                    userStore.createIndex('username', 'username', { unique: true });
                    userStore.createIndex('email', 'email', { unique: true });
                }

                // Notebooks store
                if (!db.objectStoreNames.contains('notebooks')) {
                    const notebookStore = db.createObjectStore('notebooks', { keyPath: 'id', autoIncrement: true });
                    notebookStore.createIndex('userId', 'userId', { unique: false });
                    notebookStore.createIndex('name', 'name', { unique: false });
                }

                // Notes store
                if (!db.objectStoreNames.contains('notes')) {
                    const noteStore = db.createObjectStore('notes', { keyPath: 'id', autoIncrement: true });
                    noteStore.createIndex('userId', 'userId', { unique: false });
                    noteStore.createIndex('notebookId', 'notebookId', { unique: false });
                    noteStore.createIndex('title', 'title', { unique: false });
                    noteStore.createIndex('createdAt', 'createdAt', { unique: false });
                    noteStore.createIndex('updatedAt', 'updatedAt', { unique: false });
                }

                // Tags store
                if (!db.objectStoreNames.contains('tags')) {
                    const tagStore = db.createObjectStore('tags', { keyPath: 'id', autoIncrement: true });
                    tagStore.createIndex('userId', 'userId', { unique: false });
                    tagStore.createIndex('name', 'name', { unique: false });
                }

                // Note-Tag relationships
                if (!db.objectStoreNames.contains('noteTags')) {
                    const noteTagStore = db.createObjectStore('noteTags', { keyPath: 'id', autoIncrement: true });
                    noteTagStore.createIndex('noteId', 'noteId', { unique: false });
                    noteTagStore.createIndex('tagId', 'tagId', { unique: false });
                }
            };
        });
    }

    async create(storeName, data) {
        const transaction = this.db.transaction([storeName], 'readwrite');
        const store = transaction.objectStore(storeName);

        data.createdAt = new Date().toISOString();
        data.updatedAt = data.createdAt;

        return new Promise((resolve, reject) => {
            const request = store.add(data);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async read(storeName, id) {
        const transaction = this.db.transaction([storeName], 'readonly');
        const store = transaction.objectStore(storeName);

        return new Promise((resolve, reject) => {
            const request = store.get(id);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async update(storeName, data) {
        const transaction = this.db.transaction([storeName], 'readwrite');
        const store = transaction.objectStore(storeName);

        data.updatedAt = new Date().toISOString();

        return new Promise((resolve, reject) => {
            const request = store.put(data);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async delete(storeName, id) {
        const transaction = this.db.transaction([storeName], 'readwrite');
        const store = transaction.objectStore(storeName);

        return new Promise((resolve, reject) => {
            const request = store.delete(id);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async getAll(storeName) {
        const transaction = this.db.transaction([storeName], 'readonly');
        const store = transaction.objectStore(storeName);

        return new Promise((resolve, reject) => {
            const request = store.getAll();
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async getByIndex(storeName, indexName, value) {
        const transaction = this.db.transaction([storeName], 'readonly');
        const store = transaction.objectStore(storeName);
        const index = store.index(indexName);

        return new Promise((resolve, reject) => {
            const request = index.getAll(value);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async search(storeName, query) {
        const transaction = this.db.transaction([storeName], 'readonly');
        const store = transaction.objectStore(storeName);

        return new Promise((resolve, reject) => {
            const request = store.getAll();
            request.onsuccess = () => {
                const results = request.result.filter(item => {
                    const searchText = query.toLowerCase();
                    return (
                        (item.title && item.title.toLowerCase().includes(searchText)) ||
                        (item.content && item.content.toLowerCase().includes(searchText)) ||
                        (item.name && item.name.toLowerCase().includes(searchText))
                    );
                });
                resolve(results);
            };
            request.onerror = () => reject(request.error);
        });
    }
}

// Global database instance
window.noteNestDB = new NoteNestDB();