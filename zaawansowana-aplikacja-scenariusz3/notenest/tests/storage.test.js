// Storage Manager Tests
const fs = require('fs');
const path = require('path');

// Load the StorageManager class
const storageManagerCode = fs.readFileSync(
  path.join(process.cwd(), 'assets/js/storage.js'),
  'utf8'
);

// Mock IndexedDB for testing
class MockIDBRequest {
  constructor(result = null) {
    this.result = result;
    this.error = null;
    this.readyState = 'done';
  }
}

class MockIDBTransaction {
  constructor() {
    this.objectStore = jest.fn().mockReturnValue(new MockIDBObjectStore());
  }
}

class MockIDBObjectStore {
  constructor() {
    this.data = new Map();
  }

  add(data, key) {
    if (key && this.data.has(key)) {
      const request = new MockIDBRequest();
      setTimeout(() => {
        request.error = new Error('Key already exists');
        if (request.onerror) request.onerror();
      }, 0);
      return request;
    }

    const id = key || 'id_' + Date.now();
    this.data.set(id, { ...data, id });
    const request = new MockIDBRequest({ ...data, id });
    setTimeout(() => {
      if (request.onsuccess) request.onsuccess();
    }, 0);
    return request;
  }

  put(data, key) {
    const id = key || data.id || 'id_' + Date.now();
    this.data.set(id, { ...data, id });
    const request = new MockIDBRequest({ ...data, id });
    setTimeout(() => {
      if (request.onsuccess) request.onsuccess();
    }, 0);
    return request;
  }

  get(key) {
    const request = new MockIDBRequest(this.data.get(key) || null);
    setTimeout(() => {
      if (request.onsuccess) request.onsuccess();
    }, 0);
    return request;
  }

  delete(key) {
    const exists = this.data.has(key);
    this.data.delete(key);
    const request = new MockIDBRequest();
    setTimeout(() => {
      if (request.onsuccess) request.onsuccess();
    }, 0);
    return request;
  }

  getAll() {
    const request = new MockIDBRequest(Array.from(this.data.values()));
    setTimeout(() => {
      if (request.onsuccess) request.onsuccess();
    }, 0);
    return request;
  }

  createIndex() {
    return {};
  }

  index(name) {
    return {
      get: (key) => {
        const request = new MockIDBRequest(
          Array.from(this.data.values()).find(item =>
            item[name] === key
          ) || null
        );
        setTimeout(() => {
          if (request.onsuccess) request.onsuccess();
        }, 0);
        return request;
      }
    };
  }
}

class MockIDBDatabase {
  constructor() {
    this.objectStoreNames = ['users', 'notes', 'notebooks', 'sessions'];
    this.stores = {
      users: new MockIDBObjectStore(),
      notes: new MockIDBObjectStore(),
      notebooks: new MockIDBObjectStore(),
      sessions: new MockIDBObjectStore()
    };
  }

  transaction(storeNames, mode) {
    const transaction = new MockIDBTransaction();
    transaction.objectStore = (name) => this.stores[name] || new MockIDBObjectStore();
    return transaction;
  }

  createObjectStore(name, options) {
    this.stores[name] = new MockIDBObjectStore();
    return this.stores[name];
  }
}

// Mock IndexedDB
global.indexedDB = {
  open: jest.fn().mockImplementation(() => {
    const request = new MockIDBRequest();
    const db = new MockIDBDatabase();

    setTimeout(() => {
      request.result = db;
      if (request.onupgradeneeded) {
        request.onupgradeneeded({ target: { result: db } });
      }
      if (request.onsuccess) {
        request.onsuccess({ target: { result: db } });
      }
    }, 0);

    return request;
  })
};

// Execute the storage manager code to define the class
eval(storageManagerCode);

describe('StorageManager', () => {
  let storageManager;

  beforeEach(async () => {
    jest.clearAllMocks();
    storageManager = new StorageManager();
    await storageManager.initPromise;
  });

  describe('initialization', () => {
    test('should initialize successfully', () => {
      expect(storageManager.db).toBeDefined();
      expect(storageManager.isReady).toBe(true);
    });

    test('should have correct version and name', () => {
      expect(storageManager.dbName).toBe('NoteNestDB');
      expect(storageManager.version).toBe(1);
    });
  });

  describe('user operations', () => {
    const testUser = {
      name: 'Test User',
      email: 'test@example.com',
      passwordHash: 'hashed-password',
      createdAt: '2023-01-01T00:00:00.000Z'
    };

    test('should save user successfully', async () => {
      const savedUser = await storageManager.saveUser(testUser);

      expect(savedUser).toBeDefined();
      expect(savedUser.id).toBeDefined();
      expect(savedUser.email).toBe(testUser.email);
      expect(savedUser.name).toBe(testUser.name);
    });

    test('should get user by email', async () => {
      await storageManager.saveUser(testUser);
      const retrievedUser = await storageManager.getUserByEmail(testUser.email);

      expect(retrievedUser).toBeDefined();
      expect(retrievedUser.email).toBe(testUser.email);
    });

    test('should return null for non-existent email', async () => {
      const user = await storageManager.getUserByEmail('nonexistent@example.com');
      expect(user).toBeNull();
    });

    test('should get user by ID', async () => {
      const savedUser = await storageManager.saveUser(testUser);
      const retrievedUser = await storageManager.getUserById(savedUser.id);

      expect(retrievedUser).toBeDefined();
      expect(retrievedUser.id).toBe(savedUser.id);
    });
  });

  describe('notes operations', () => {
    const testNote = {
      title: 'Test Note',
      content: '<p>Test content</p>',
      tags: ['test', 'mock'],
      notebookId: 'test-notebook-id',
      userId: 'test-user-id',
      createdAt: '2023-01-01T00:00:00.000Z',
      modifiedAt: '2023-01-01T00:00:00.000Z'
    };

    test('should save note successfully', async () => {
      const savedNote = await storageManager.saveNote(testNote);

      expect(savedNote).toBeDefined();
      expect(savedNote.id).toBeDefined();
      expect(savedNote.title).toBe(testNote.title);
    });

    test('should get note by ID', async () => {
      const savedNote = await storageManager.saveNote(testNote);
      const retrievedNote = await storageManager.getNoteById(savedNote.id);

      expect(retrievedNote).toBeDefined();
      expect(retrievedNote.id).toBe(savedNote.id);
      expect(retrievedNote.title).toBe(testNote.title);
    });

    test('should get notes by user ID', async () => {
      await storageManager.saveNote(testNote);
      await storageManager.saveNote({
        ...testNote,
        title: 'Second Note',
        userId: testNote.userId
      });

      const userNotes = await storageManager.getNotesByUserId(testNote.userId);

      expect(userNotes).toHaveLength(2);
      expect(userNotes[0].userId).toBe(testNote.userId);
      expect(userNotes[1].userId).toBe(testNote.userId);
    });

    test('should update existing note', async () => {
      const savedNote = await storageManager.saveNote(testNote);
      const updatedNote = {
        ...savedNote,
        title: 'Updated Title',
        content: '<p>Updated content</p>'
      };

      const result = await storageManager.updateNote(savedNote.id, updatedNote);

      expect(result).toBeDefined();
      expect(result.title).toBe('Updated Title');
    });

    test('should delete note', async () => {
      const savedNote = await storageManager.saveNote(testNote);
      await storageManager.deleteNote(savedNote.id);

      const deletedNote = await storageManager.getNoteById(savedNote.id);
      expect(deletedNote).toBeNull();
    });
  });

  describe('notebooks operations', () => {
    const testNotebook = {
      name: 'Test Notebook',
      description: 'Test description',
      color: '#E97900',
      userId: 'test-user-id',
      createdAt: '2023-01-01T00:00:00.000Z'
    };

    test('should save notebook successfully', async () => {
      const savedNotebook = await storageManager.saveNotebook(testNotebook);

      expect(savedNotebook).toBeDefined();
      expect(savedNotebook.id).toBeDefined();
      expect(savedNotebook.name).toBe(testNotebook.name);
    });

    test('should get notebook by ID', async () => {
      const savedNotebook = await storageManager.saveNotebook(testNotebook);
      const retrievedNotebook = await storageManager.getNotebookById(savedNotebook.id);

      expect(retrievedNotebook).toBeDefined();
      expect(retrievedNotebook.id).toBe(savedNotebook.id);
    });

    test('should get notebooks by user ID', async () => {
      await storageManager.saveNotebook(testNotebook);
      await storageManager.saveNotebook({
        ...testNotebook,
        name: 'Second Notebook'
      });

      const userNotebooks = await storageManager.getNotebooksByUserId(testNotebook.userId);

      expect(userNotebooks).toHaveLength(2);
      expect(userNotebooks[0].userId).toBe(testNotebook.userId);
    });

    test('should update existing notebook', async () => {
      const savedNotebook = await storageManager.saveNotebook(testNotebook);
      const updatedNotebook = {
        ...savedNotebook,
        name: 'Updated Notebook',
        description: 'Updated description'
      };

      const result = await storageManager.updateNotebook(savedNotebook.id, updatedNotebook);

      expect(result).toBeDefined();
      expect(result.name).toBe('Updated Notebook');
    });

    test('should delete notebook', async () => {
      const savedNotebook = await storageManager.saveNotebook(testNotebook);
      await storageManager.deleteNotebook(savedNotebook.id);

      const deletedNotebook = await storageManager.getNotebookById(savedNotebook.id);
      expect(deletedNotebook).toBeNull();
    });
  });

  describe('session operations', () => {
    const testSessionData = {
      userId: 'test-user-id',
      loginTime: '2023-01-01T00:00:00.000Z',
      lastActivity: '2023-01-01T00:00:00.000Z'
    };

    test('should save session data', async () => {
      const sessionId = 'test-session-id';
      await storageManager.saveSessionData(sessionId, testSessionData);

      const retrievedData = await storageManager.getSessionData(sessionId);

      expect(retrievedData).toBeDefined();
      expect(retrievedData.userId).toBe(testSessionData.userId);
    });

    test('should clear session data', async () => {
      const sessionId = 'test-session-id';
      await storageManager.saveSessionData(sessionId, testSessionData);
      await storageManager.clearSessionData(sessionId);

      const clearedData = await storageManager.getSessionData(sessionId);
      expect(clearedData).toBeNull();
    });
  });

  describe('error handling', () => {
    test('should handle database errors gracefully', async () => {
      // Simulate database error by setting db to null
      storageManager.db = null;

      await expect(storageManager.saveUser(createMockUser()))
        .rejects.toThrow('Database not initialized');
    });

    test('should handle invalid data gracefully', async () => {
      await expect(storageManager.saveUser(null))
        .rejects.toThrow();

      await expect(storageManager.saveNote(null))
        .rejects.toThrow();
    });
  });
});