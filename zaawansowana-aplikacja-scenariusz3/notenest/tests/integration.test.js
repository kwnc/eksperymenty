// Integration Tests for User Workflows
const fs = require('fs');
const path = require('path');

// Load all required classes
const storageManagerCode = fs.readFileSync(path.join(process.cwd(), 'assets/js/storage.js'), 'utf8');
const authManagerCode = fs.readFileSync(path.join(process.cwd(), 'assets/js/auth.js'), 'utf8');
const notesManagerCode = fs.readFileSync(path.join(process.cwd(), 'assets/js/notes.js'), 'utf8');
const notebooksManagerCode = fs.readFileSync(path.join(process.cwd(), 'assets/js/notebooks.js'), 'utf8');

// Enhanced IndexedDB mock for integration testing
class IntegrationMockStorageManager {
  constructor() {
    this.data = {
      users: new Map(),
      notes: new Map(),
      notebooks: new Map(),
      sessions: new Map()
    };
    this.idCounter = 1;
    this.initPromise = Promise.resolve();
    this.isReady = true;
    this.db = { transaction: () => ({}) };
    this.dbName = 'NoteNestDB';
    this.version = 1;
  }

  generateId(prefix = 'id') {
    return `${prefix}_${this.idCounter++}`;
  }

  // User operations
  async saveUser(userData) {
    const id = this.generateId('user');
    const user = { id, ...userData };
    this.data.users.set(id, user);
    return user;
  }

  async getUserByEmail(email) {
    return Array.from(this.data.users.values()).find(user => user.email === email) || null;
  }

  async getUserById(id) {
    return this.data.users.get(id) || null;
  }

  // Note operations
  async saveNote(noteData) {
    const id = noteData.id || this.generateId('note');
    const note = {
      id,
      ...noteData,
      createdAt: noteData.createdAt || new Date().toISOString(),
      modifiedAt: new Date().toISOString()
    };
    this.data.notes.set(id, note);
    return note;
  }

  async getNoteById(id) {
    return this.data.notes.get(id) || null;
  }

  async getNotesByUserId(userId) {
    return Array.from(this.data.notes.values()).filter(note => note.userId === userId);
  }

  async updateNote(id, noteData) {
    const existing = this.data.notes.get(id);
    if (!existing) throw new Error('Note not found');

    const updated = { ...existing, ...noteData, modifiedAt: new Date().toISOString() };
    this.data.notes.set(id, updated);
    return updated;
  }

  async deleteNote(id) {
    return this.data.notes.delete(id);
  }

  // Notebook operations
  async saveNotebook(notebookData) {
    const id = notebookData.id || this.generateId('notebook');
    const notebook = {
      id,
      ...notebookData,
      createdAt: notebookData.createdAt || new Date().toISOString()
    };
    this.data.notebooks.set(id, notebook);
    return notebook;
  }

  async getNotebookById(id) {
    return this.data.notebooks.get(id) || null;
  }

  async getNotebooksByUserId(userId) {
    return Array.from(this.data.notebooks.values()).filter(notebook => notebook.userId === userId);
  }

  async updateNotebook(id, notebookData) {
    const existing = this.data.notebooks.get(id);
    if (!existing) throw new Error('Notebook not found');

    const updated = { ...existing, ...notebookData };
    this.data.notebooks.set(id, updated);
    return updated;
  }

  async deleteNotebook(id) {
    return this.data.notebooks.delete(id);
  }

  // Session operations
  async saveSessionData(sessionId, data) {
    this.data.sessions.set(sessionId, data);
  }

  async getSessionData(sessionId) {
    return this.data.sessions.get(sessionId) || null;
  }

  async clearSessionData(sessionId) {
    this.data.sessions.delete(sessionId);
  }

  // Utility methods
  async clearAll() {
    this.data.users.clear();
    this.data.notes.clear();
    this.data.notebooks.clear();
    this.data.sessions.clear();
  }
}

// Set up global mocks
global.StorageManager = IntegrationMockStorageManager;
global.crypto = {
  subtle: {
    digest: jest.fn().mockResolvedValue(new ArrayBuffer(32))
  }
};

// Execute the manager code to define classes
eval(storageManagerCode);
eval(authManagerCode);
eval(notesManagerCode);
eval(notebooksManagerCode);

describe('NoteNest Integration Tests', () => {
  let storageManager;
  let authManager;
  let notesManager;
  let notebooksManager;

  beforeEach(async () => {
    jest.clearAllMocks();

    // Initialize managers
    storageManager = new IntegrationMockStorageManager();
    authManager = new AuthManager();
    notesManager = new NotesManager();
    notebooksManager = new NotebooksManager();

    // Set up dependencies
    authManager.storageManager = storageManager;
    notesManager.setAuthManager(authManager);
    notebooksManager.setAuthManager(authManager);

    // Override storage managers to use our mock
    notesManager.storageManager = storageManager;
    notebooksManager.storageManager = storageManager;
  });

  describe('User Registration and Login Workflow', () => {
    const testUser = {
      name: 'Integration Test User',
      email: 'integration@test.com',
      password: 'SecurePass123'
    };

    test('should complete full registration and login workflow', async () => {
      // Step 1: Register new user
      const registrationResult = await authManager.register(
        testUser.name,
        testUser.email,
        testUser.password
      );

      expect(registrationResult.success).toBe(true);
      expect(registrationResult.user.email).toBe(testUser.email.toLowerCase());

      // Step 2: User should be automatically logged in
      expect(authManager.getCurrentUser()).toBeDefined();
      expect(authManager.getCurrentUser().email).toBe(testUser.email.toLowerCase());

      // Step 3: Logout
      const logoutResult = await authManager.logout();
      expect(logoutResult.success).toBe(true);
      expect(authManager.getCurrentUser()).toBeNull();

      // Step 4: Login again
      const loginResult = await authManager.login(testUser.email, testUser.password);
      expect(loginResult.success).toBe(true);
      expect(authManager.getCurrentUser()).toBeDefined();
    });

    test('should persist user data across sessions', async () => {
      // Register and logout
      await authManager.register(testUser.name, testUser.email, testUser.password);
      await authManager.logout();

      // Create new auth manager instance (simulating app restart)
      const newAuthManager = new AuthManager();
      newAuthManager.storageManager = storageManager;

      // Login should work with persisted data
      const loginResult = await newAuthManager.login(testUser.email, testUser.password);
      expect(loginResult.success).toBe(true);
      expect(newAuthManager.getCurrentUser().name).toBe(testUser.name);
    });
  });

  describe('Note Creation and Management Workflow', () => {
    beforeEach(async () => {
      // Set up authenticated user
      await authManager.register('Test User', 'test@example.com', 'SecurePass123');
    });

    test('should create, edit, and delete notes workflow', async () => {
      // Step 1: Create new note
      const noteData = {
        title: 'Integration Test Note',
        content: '<p>This is integration test content</p>',
        tags: ['integration', 'test']
      };

      const createdNote = await notesManager.createNote(noteData);

      expect(createdNote.id).toBeDefined();
      expect(createdNote.title).toBe(noteData.title);
      expect(createdNote.userId).toBe(authManager.getCurrentUser().id);

      // Step 2: Load notes and verify
      await notesManager.loadNotes();
      expect(notesManager.notes).toHaveLength(1);
      expect(notesManager.notes[0].id).toBe(createdNote.id);

      // Step 3: Set current note and edit
      await notesManager.setCurrentNote(createdNote.id);
      expect(notesManager.getCurrentNote().id).toBe(createdNote.id);

      const updatedData = {
        title: 'Updated Integration Test Note',
        content: '<p>Updated content</p>',
        tags: ['updated', 'integration']
      };

      const updatedNote = await notesManager.saveCurrentNote(updatedData);
      expect(updatedNote.title).toBe(updatedData.title);
      expect(updatedNote.tags).toEqual(updatedData.tags);

      // Step 4: Delete note
      await notesManager.deleteNote(createdNote.id);
      await notesManager.loadNotes();
      expect(notesManager.notes).toHaveLength(0);
      expect(notesManager.getCurrentNote()).toBeNull();
    });

    test('should handle multiple notes with search and sorting', async () => {
      // Create multiple notes
      const notes = [
        { title: 'First Note', content: '<p>JavaScript content</p>', tags: ['js', 'programming'] },
        { title: 'Second Note', content: '<p>CSS styling tips</p>', tags: ['css', 'design'] },
        { title: 'Third Note', content: '<p>HTML structure</p>', tags: ['html', 'markup'] }
      ];

      for (const noteData of notes) {
        await notesManager.createNote(noteData);
      }

      await notesManager.loadNotes();
      expect(notesManager.notes).toHaveLength(3);

      // Test search functionality
      const searchResults = notesManager.searchNotes('JavaScript');
      expect(searchResults).toHaveLength(1);
      expect(searchResults[0].title).toBe('First Note');

      // Test tag search
      const tagResults = notesManager.searchNotes('design');
      expect(tagResults).toHaveLength(1);
      expect(tagResults[0].tags).toContain('design');

      // Test sorting
      notesManager.setSortOptions('title', 'asc');
      await notesManager.loadNotes();
      expect(notesManager.notes[0].title).toBe('First Note');
      expect(notesManager.notes[1].title).toBe('Second Note');
    });
  });

  describe('Notebook Organization Workflow', () => {
    beforeEach(async () => {
      await authManager.register('Test User', 'test@example.com', 'SecurePass123');
    });

    test('should create notebooks and organize notes', async () => {
      // Step 1: Create notebooks
      const workNotebook = await notebooksManager.createNotebook({
        name: 'Work Notes',
        description: 'Professional notes',
        color: '#E97900'
      });

      const personalNotebook = await notebooksManager.createNotebook({
        name: 'Personal Notes',
        description: 'Personal thoughts',
        color: '#2ECC71'
      });

      await notebooksManager.loadNotebooks();
      expect(notebooksManager.notebooks).toHaveLength(2);

      // Step 2: Create notes in different notebooks
      const workNote = await notesManager.createNote({
        title: 'Work Task',
        content: '<p>Important work item</p>',
        notebookId: workNotebook.id
      });

      const personalNote = await notesManager.createNote({
        title: 'Personal Thought',
        content: '<p>Random idea</p>',
        notebookId: personalNotebook.id
      });

      // Step 3: Verify notes are in correct notebooks
      await notesManager.loadNotes({ notebookId: workNotebook.id });
      expect(notesManager.notes).toHaveLength(1);
      expect(notesManager.notes[0].id).toBe(workNote.id);

      await notesManager.loadNotes({ notebookId: personalNotebook.id });
      expect(notesManager.notes).toHaveLength(1);
      expect(notesManager.notes[0].id).toBe(personalNote.id);

      // Step 4: Load all notes
      await notesManager.loadNotes();
      expect(notesManager.notes).toHaveLength(2);
    });

    test('should handle notebook deletion with note reassignment', async () => {
      // Create notebook with notes
      const notebook = await notebooksManager.createNotebook({
        name: 'Temporary Notebook'
      });

      await notesManager.createNote({
        title: 'Note in temp notebook',
        notebookId: notebook.id
      });

      await notesManager.loadNotes({ notebookId: notebook.id });
      expect(notesManager.notes).toHaveLength(1);

      // Delete notebook
      await notebooksManager.deleteNotebook(notebook.id);

      // Verify notebook is gone
      await notebooksManager.loadNotebooks();
      expect(notebooksManager.notebooks.find(n => n.id === notebook.id)).toBeUndefined();

      // Note should still exist but moved to default notebook
      await notesManager.loadNotes();
      expect(notesManager.notes).toHaveLength(1);
      expect(notesManager.notes[0].notebookId).toBe('default');
    });
  });

  describe('Cross-Manager Data Consistency', () => {
    beforeEach(async () => {
      await authManager.register('Test User', 'test@example.com', 'SecurePass123');
    });

    test('should maintain data consistency across managers', async () => {
      // Create notebook
      const notebook = await notebooksManager.createNotebook({
        name: 'Test Consistency',
        description: 'Testing data consistency'
      });

      // Create note in notebook
      const note = await notesManager.createNote({
        title: 'Consistency Test',
        content: '<p>Testing</p>',
        notebookId: notebook.id
      });

      // Verify data exists in storage
      const storedNote = await storageManager.getNoteById(note.id);
      const storedNotebook = await storageManager.getNotebookById(notebook.id);

      expect(storedNote.notebookId).toBe(notebook.id);
      expect(storedNotebook.id).toBe(notebook.id);

      // Update note and verify consistency
      await notesManager.setCurrentNote(note.id);
      await notesManager.saveCurrentNote({
        title: 'Updated Consistency Test',
        tags: ['consistency', 'updated']
      });

      const updatedStoredNote = await storageManager.getNoteById(note.id);
      expect(updatedStoredNote.title).toBe('Updated Consistency Test');
      expect(updatedStoredNote.tags).toContain('consistency');
    });

    test('should handle user logout and data clearing', async () => {
      // Create data
      await notebooksManager.createNotebook({ name: 'Test Notebook' });
      await notesManager.createNote({ title: 'Test Note' });

      await notebooksManager.loadNotebooks();
      await notesManager.loadNotes();

      expect(notebooksManager.notebooks).toHaveLength(1);
      expect(notesManager.notes).toHaveLength(1);

      // Logout user
      await authManager.logout();

      // Managers should clear their data
      expect(authManager.getCurrentUser()).toBeNull();

      // Create new instances (simulating new session)
      const newNotesManager = new NotesManager();
      const newNotebooksManager = new NotebooksManager();

      newNotesManager.setAuthManager(authManager);
      newNotebooksManager.setAuthManager(authManager);

      // Should not be able to load data without authentication
      await expect(newNotesManager.loadNotes()).rejects.toThrow('User not authenticated');
      await expect(newNotebooksManager.loadNotebooks()).rejects.toThrow('User not authenticated');
    });
  });

  describe('Error Handling and Recovery', () => {
    beforeEach(async () => {
      await authManager.register('Test User', 'test@example.com', 'SecurePass123');
    });

    test('should handle storage errors gracefully', async () => {
      // Simulate storage failure
      const originalSaveNote = storageManager.saveNote;
      storageManager.saveNote = jest.fn().mockRejectedValue(new Error('Storage error'));

      // Should handle error gracefully
      await expect(notesManager.createNote({ title: 'Test' }))
        .rejects.toThrow('Storage error');

      // Restore storage and verify recovery
      storageManager.saveNote = originalSaveNote;
      const note = await notesManager.createNote({ title: 'Recovery Test' });
      expect(note.title).toBe('Recovery Test');
    });

    test('should handle concurrent operations', async () => {
      // Create note
      const note = await notesManager.createNote({
        title: 'Concurrent Test',
        content: '<p>Original</p>'
      });

      // Simulate concurrent updates
      const updates1 = notesManager.updateNote(note.id, {
        title: 'Update 1',
        content: '<p>Content 1</p>'
      });

      const updates2 = notesManager.updateNote(note.id, {
        title: 'Update 2',
        content: '<p>Content 2</p>'
      });

      // Both should complete without error
      await Promise.all([updates1, updates2]);

      // Final state should be consistent
      const finalNote = await storageManager.getNoteById(note.id);
      expect(finalNote).toBeDefined();
      expect(finalNote.title).toMatch(/Update [12]/);
    });
  });

  describe('Auto-save and Data Persistence', () => {
    beforeEach(async () => {
      await authManager.register('Test User', 'test@example.com', 'SecurePass123');
    });

    test('should auto-save note changes', async () => {
      jest.useFakeTimers();

      const note = await notesManager.createNote({
        title: 'Auto-save Test',
        content: '<p>Original content</p>'
      });

      await notesManager.setCurrentNote(note.id);

      // Schedule auto-save
      const updates = {
        title: 'Auto-saved Title',
        content: '<p>Auto-saved content</p>'
      };

      notesManager.scheduleAutoSave(updates);

      // Fast-forward time to trigger auto-save
      jest.advanceTimersByTime(2000);
      await Promise.resolve(); // Allow promises to resolve

      // Verify auto-save occurred
      const savedNote = await storageManager.getNoteById(note.id);
      expect(savedNote.title).toBe('Auto-saved Title');

      jest.useRealTimers();
    });

    test('should handle rapid auto-save scheduling', async () => {
      jest.useFakeTimers();

      const note = await notesManager.createNote({ title: 'Rapid Test' });
      await notesManager.setCurrentNote(note.id);

      // Schedule multiple rapid auto-saves
      notesManager.scheduleAutoSave({ title: 'Update 1' });
      notesManager.scheduleAutoSave({ title: 'Update 2' });
      notesManager.scheduleAutoSave({ title: 'Final Update' });

      // Fast-forward time
      jest.advanceTimersByTime(2000);
      await Promise.resolve();

      // Should only save the final update
      const savedNote = await storageManager.getNoteById(note.id);
      expect(savedNote.title).toBe('Final Update');

      jest.useRealTimers();
    });
  });
});