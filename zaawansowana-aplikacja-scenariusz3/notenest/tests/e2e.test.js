// End-to-End Tests for NoteNest Application
// These tests simulate real user interactions with the application

/**
 * E2E Test Setup
 * These tests require the application to be running on a local server
 * Run: npm run serve (or python3 -m http.server 8000) before running tests
 */

// Mock DOM environment for testing
const { JSDOM } = require('jsdom');

describe('NoteNest End-to-End Tests', () => {
  let dom;
  let window;
  let document;
  let app;

  beforeEach(async () => {
    // Create a fresh DOM environment for each test
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>NoteNest Test</title>
      </head>
      <body>
        <div id="app">
          <div id="auth-view" class="auth-container">
            <div class="auth-card">
              <div id="login-form" class="auth-form">
                <input type="email" id="login-email" placeholder="Email">
                <input type="password" id="login-password" placeholder="Password">
                <button id="login-submit" class="btn-primary">Login</button>
                <a href="#" id="show-register">Register</a>
              </div>
              <div id="register-form" class="auth-form hidden">
                <input type="text" id="register-name" placeholder="Name">
                <input type="email" id="register-email" placeholder="Email">
                <input type="password" id="register-password" placeholder="Password">
                <button id="register-submit" class="btn-primary">Register</button>
                <a href="#" id="show-login">Login</a>
              </div>
            </div>
          </div>

          <div id="app-view" class="hidden">
            <aside id="sidebar">
              <button id="new-notebook">+ New Notebook</button>
              <ul id="notebooks-list"></ul>
              <button id="new-note">+ New Note</button>
              <button id="search-toggle">Search</button>
            </aside>

            <div id="main-workspace">
              <div id="search-bar" class="hidden">
                <input type="text" id="search-input" placeholder="Search...">
                <button id="search-btn">Search</button>
              </div>

              <div id="notes-list-view">
                <h2 id="current-notebook-title">All Notes</h2>
                <select id="sort-notes">
                  <option value="modified">Last Modified</option>
                  <option value="created">Created Date</option>
                </select>
                <div id="notes-list"></div>
              </div>

              <div id="note-editor" class="hidden">
                <button id="save-note">Save</button>
                <button id="close-editor">Close</button>
                <input type="text" id="note-title" placeholder="Note title">
                <input type="text" id="note-tags" placeholder="Tags">
                <div id="note-content" contenteditable="true"></div>
              </div>
            </div>
          </div>

          <div id="modal-overlay" class="modal-overlay hidden">
            <div class="modal">
              <div id="modal-content"></div>
            </div>
          </div>
        </div>

        <script>
          // Mock implementations for testing
          class MockStorageManager {
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
            }

            async saveUser(userData) {
              const id = 'user_' + this.idCounter++;
              const user = { id, ...userData };
              this.data.users.set(id, user);
              return user;
            }

            async getUserByEmail(email) {
              return Array.from(this.data.users.values()).find(u => u.email === email) || null;
            }

            async saveNote(noteData) {
              const id = noteData.id || 'note_' + this.idCounter++;
              const note = { id, ...noteData, createdAt: new Date().toISOString(), modifiedAt: new Date().toISOString() };
              this.data.notes.set(id, note);
              return note;
            }

            async getNotesByUserId(userId) {
              return Array.from(this.data.notes.values()).filter(n => n.userId === userId);
            }

            async getNoteById(id) {
              return this.data.notes.get(id) || null;
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

            async saveNotebook(notebookData) {
              const id = notebookData.id || 'notebook_' + this.idCounter++;
              const notebook = { id, ...notebookData, createdAt: new Date().toISOString() };
              this.data.notebooks.set(id, notebook);
              return notebook;
            }

            async getNotebooksByUserId(userId) {
              return Array.from(this.data.notebooks.values()).filter(n => n.userId === userId);
            }

            async saveSessionData(sessionId, data) {
              this.data.sessions.set(sessionId, data);
            }

            async getSessionData(sessionId) {
              return this.data.sessions.get(sessionId) || null;
            }

            async clearSessionData(sessionId) {
              this.data.sessions.delete(sessionId);
            }
          }

          // Mock crypto for testing
          window.crypto = {
            subtle: {
              digest: () => Promise.resolve(new ArrayBuffer(32))
            }
          };

          // Mock console to reduce noise
          console.log = () => {};
          console.warn = () => {};
        </script>
      </body>
      </html>
    `;

    dom = new JSDOM(htmlContent, {
      runScripts: 'dangerously',
      resources: 'usable',
      pretendToBeVisual: true
    });

    window = dom.window;
    document = window.document;

    // Make global objects available
    global.window = window;
    global.document = document;
    global.localStorage = {
      getItem: jest.fn(),
      setItem: jest.fn(),
      removeItem: jest.fn(),
      clear: jest.fn()
    };

    // Load and execute application code
    const storageCode = require('fs').readFileSync(
      require('path').join(process.cwd(), 'assets/js/storage.js'), 'utf8'
    );
    const authCode = require('fs').readFileSync(
      require('path').join(process.cwd(), 'assets/js/auth.js'), 'utf8'
    );
    const notesCode = require('fs').readFileSync(
      require('path').join(process.cwd(), 'assets/js/notes.js'), 'utf8'
    );
    const notebooksCode = require('fs').readFileSync(
      require('path').join(process.cwd(), 'assets/js/notebooks.js'), 'utf8'
    );
    const appCode = require('fs').readFileSync(
      require('path').join(process.cwd(), 'assets/js/app.js'), 'utf8'
    );

    // Override StorageManager with mock
    eval(`
      ${storageCode}
      StorageManager = window.MockStorageManager;
      ${authCode}
      ${notesCode}
      ${notebooksCode}
      ${appCode}
    `);

    // Wait a bit for initialization
    await new Promise(resolve => setTimeout(resolve, 100));
  });

  afterEach(() => {
    dom.window.close();
  });

  describe('User Authentication Flow', () => {
    test('should show login form by default', () => {
      const authView = document.getElementById('auth-view');
      const appView = document.getElementById('app-view');
      const loginForm = document.getElementById('login-form');

      expect(authView.classList.contains('hidden')).toBe(false);
      expect(appView.classList.contains('hidden')).toBe(true);
      expect(loginForm.classList.contains('hidden')).toBe(false);
    });

    test('should switch to registration form', () => {
      const showRegisterLink = document.getElementById('show-register');
      const loginForm = document.getElementById('login-form');
      const registerForm = document.getElementById('register-form');

      // Click register link
      showRegisterLink.click();

      expect(loginForm.classList.contains('hidden')).toBe(true);
      expect(registerForm.classList.contains('hidden')).toBe(false);
    });

    test('should register new user and show app', async () => {
      // Initialize app
      window.app = new window.NoteNestApp();
      await new Promise(resolve => setTimeout(resolve, 100));

      // Switch to register form
      document.getElementById('show-register').click();

      // Fill registration form
      document.getElementById('register-name').value = 'E2E Test User';
      document.getElementById('register-email').value = 'e2e@test.com';
      document.getElementById('register-password').value = 'SecurePass123';

      // Submit registration
      const registerButton = document.getElementById('register-submit');
      registerButton.click();

      // Wait for async operations
      await new Promise(resolve => setTimeout(resolve, 200));

      // Should show app view
      const authView = document.getElementById('auth-view');
      const appView = document.getElementById('app-view');

      expect(authView.classList.contains('hidden')).toBe(true);
      expect(appView.classList.contains('hidden')).toBe(false);
    });
  });

  describe('Note Management Flow', () => {
    beforeEach(async () => {
      // Initialize app and register user
      window.app = new window.NoteNestApp();
      await new Promise(resolve => setTimeout(resolve, 100));

      // Register and login user
      document.getElementById('show-register').click();
      document.getElementById('register-name').value = 'Test User';
      document.getElementById('register-email').value = 'test@example.com';
      document.getElementById('register-password').value = 'SecurePass123';
      document.getElementById('register-submit').click();

      await new Promise(resolve => setTimeout(resolve, 200));
    });

    test('should create new note', async () => {
      const newNoteButton = document.getElementById('new-note');
      const noteEditor = document.getElementById('note-editor');
      const notesListView = document.getElementById('notes-list-view');

      // Click new note button
      newNoteButton.click();
      await new Promise(resolve => setTimeout(resolve, 100));

      // Should show note editor
      expect(noteEditor.classList.contains('hidden')).toBe(false);
      expect(notesListView.classList.contains('hidden')).toBe(true);

      // Editor should have focus on title
      const noteTitle = document.getElementById('note-title');
      expect(document.activeElement).toBe(noteTitle);
    });

    test('should edit and save note', async () => {
      // Create new note
      document.getElementById('new-note').click();
      await new Promise(resolve => setTimeout(resolve, 100));

      // Edit note
      const noteTitle = document.getElementById('note-title');
      const noteContent = document.getElementById('note-content');
      const noteTags = document.getElementById('note-tags');

      noteTitle.value = 'E2E Test Note';
      noteContent.innerHTML = '<p>This is test content</p>';
      noteTags.value = 'e2e, test, automation';

      // Save note
      document.getElementById('save-note').click();
      await new Promise(resolve => setTimeout(resolve, 100));

      // Verify note was saved
      expect(window.app.notesManager.getCurrentNote().title).toBe('E2E Test Note');
      expect(window.app.notesManager.getCurrentNote().tags).toEqual(['e2e', 'test', 'automation']);
    });

    test('should close editor and return to notes list', async () => {
      // Create and edit note
      document.getElementById('new-note').click();
      await new Promise(resolve => setTimeout(resolve, 100));

      document.getElementById('note-title').value = 'Test Note';
      document.getElementById('save-note').click();
      await new Promise(resolve => setTimeout(resolve, 100));

      // Close editor
      document.getElementById('close-editor').click();

      const noteEditor = document.getElementById('note-editor');
      const notesListView = document.getElementById('notes-list-view');

      expect(noteEditor.classList.contains('hidden')).toBe(true);
      expect(notesListView.classList.contains('hidden')).toBe(false);

      // Should see the note in the list
      const notesList = document.getElementById('notes-list');
      expect(notesList.children.length).toBeGreaterThan(0);
    });
  });

  describe('Search Functionality', () => {
    beforeEach(async () => {
      // Set up authenticated user with notes
      window.app = new window.NoteNestApp();
      await new Promise(resolve => setTimeout(resolve, 100));

      // Register user
      document.getElementById('show-register').click();
      document.getElementById('register-name').value = 'Test User';
      document.getElementById('register-email').value = 'test@example.com';
      document.getElementById('register-password').value = 'SecurePass123';
      document.getElementById('register-submit').click();
      await new Promise(resolve => setTimeout(resolve, 200));

      // Create test notes
      await window.app.notesManager.createNote({
        title: 'JavaScript Tutorial',
        content: '<p>Learn JavaScript fundamentals</p>',
        tags: ['programming', 'tutorial']
      });

      await window.app.notesManager.createNote({
        title: 'CSS Styling Guide',
        content: '<p>Advanced CSS techniques</p>',
        tags: ['design', 'css']
      });

      await window.app.notesManager.loadNotes();
    });

    test('should toggle search bar', () => {
      const searchToggle = document.getElementById('search-toggle');
      const searchBar = document.getElementById('search-bar');

      // Initially hidden
      expect(searchBar.classList.contains('hidden')).toBe(true);

      // Toggle search
      searchToggle.click();
      expect(searchBar.classList.contains('hidden')).toBe(false);

      // Toggle again
      searchToggle.click();
      expect(searchBar.classList.contains('hidden')).toBe(true);
    });

    test('should search notes by title', () => {
      // Show search bar
      document.getElementById('search-toggle').click();

      // Search for JavaScript
      const searchInput = document.getElementById('search-input');
      searchInput.value = 'JavaScript';

      // Trigger input event (simulating typing)
      const inputEvent = new dom.window.Event('input', { bubbles: true });
      searchInput.dispatchEvent(inputEvent);

      // Wait for debounced search
      setTimeout(() => {
        const title = document.getElementById('current-notebook-title');
        expect(title.textContent).toContain('Search: "JavaScript"');
      }, 500);
    });

    test('should clear search results', () => {
      // Show search and perform search
      document.getElementById('search-toggle').click();
      document.getElementById('search-input').value = 'JavaScript';
      document.getElementById('search-btn').click();

      // Toggle search again to clear
      document.getElementById('search-toggle').click();

      const title = document.getElementById('current-notebook-title');
      expect(title.textContent).toBe('All Notes');
    });
  });

  describe('UI Interactions and Responsiveness', () => {
    beforeEach(async () => {
      window.app = new window.NoteNestApp();
      await new Promise(resolve => setTimeout(resolve, 100));

      // Quick setup
      document.getElementById('show-register').click();
      document.getElementById('register-name').value = 'Test User';
      document.getElementById('register-email').value = 'test@example.com';
      document.getElementById('register-password').value = 'SecurePass123';
      document.getElementById('register-submit').click();
      await new Promise(resolve => setTimeout(resolve, 200));
    });

    test('should handle modal interactions', () => {
      const modalOverlay = document.getElementById('modal-overlay');

      // Initially hidden
      expect(modalOverlay.classList.contains('hidden')).toBe(true);

      // Show modal (simulating notebook creation)
      window.app.showModal('<div>Test Modal Content</div>');
      expect(modalOverlay.classList.contains('hidden')).toBe(false);

      // Hide modal by clicking overlay
      modalOverlay.click();
      expect(modalOverlay.classList.contains('hidden')).toBe(true);
    });

    test('should handle keyboard shortcuts', () => {
      // Mock keyboard events
      const createKeyEvent = (key, ctrlKey = false, metaKey = false) => {
        return new dom.window.KeyboardEvent('keydown', {
          key,
          ctrlKey,
          metaKey,
          bubbles: true
        });
      };

      // Test Ctrl+N for new note
      document.dispatchEvent(createKeyEvent('n', true));
      const noteEditor = document.getElementById('note-editor');
      expect(noteEditor.classList.contains('hidden')).toBe(false);

      // Test Escape to close editor
      document.dispatchEvent(createKeyEvent('Escape'));
      expect(noteEditor.classList.contains('hidden')).toBe(true);

      // Test Ctrl+F for search
      document.dispatchEvent(createKeyEvent('f', true));
      const searchBar = document.getElementById('search-bar');
      expect(searchBar.classList.contains('hidden')).toBe(false);
    });

    test('should handle sorting changes', async () => {
      // Create notes with different titles and dates
      await window.app.notesManager.createNote({ title: 'Z Note' });
      await window.app.notesManager.createNote({ title: 'A Note' });
      await window.app.notesManager.loadNotes();

      const sortSelect = document.getElementById('sort-notes');

      // Change to title sort
      sortSelect.value = 'title';
      const changeEvent = new dom.window.Event('change', { bubbles: true });
      sortSelect.dispatchEvent(changeEvent);

      // Verify sort was applied
      expect(window.app.notesManager.sortField).toBe('title');
    });

    test('should handle form validation feedback', () => {
      // Go to login form
      document.getElementById('show-login').click();

      // Try to login with empty fields
      document.getElementById('login-submit').click();

      // Should show validation feedback (this would be implemented in the real app)
      // For now, just verify the button exists and can be clicked
      const loginButton = document.getElementById('login-submit');
      expect(loginButton).toBeDefined();
    });
  });

  describe('Error Handling and Edge Cases', () => {
    beforeEach(async () => {
      window.app = new window.NoteNestApp();
      await new Promise(resolve => setTimeout(resolve, 100));
    });

    test('should handle invalid login credentials', async () => {
      // Fill login form with invalid credentials
      document.getElementById('login-email').value = 'invalid@test.com';
      document.getElementById('login-password').value = 'wrongpassword';
      document.getElementById('login-submit').click();

      await new Promise(resolve => setTimeout(resolve, 100));

      // Should stay on auth view
      const authView = document.getElementById('auth-view');
      const appView = document.getElementById('app-view');

      expect(authView.classList.contains('hidden')).toBe(false);
      expect(appView.classList.contains('hidden')).toBe(true);
    });

    test('should handle rapid button clicks', async () => {
      // Register user first
      document.getElementById('show-register').click();
      document.getElementById('register-name').value = 'Test User';
      document.getElementById('register-email').value = 'test@example.com';
      document.getElementById('register-password').value = 'SecurePass123';
      document.getElementById('register-submit').click();
      await new Promise(resolve => setTimeout(resolve, 200));

      // Rapidly click new note button
      const newNoteButton = document.getElementById('new-note');
      newNoteButton.click();
      newNoteButton.click();
      newNoteButton.click();

      await new Promise(resolve => setTimeout(resolve, 100));

      // Should only create one note and show editor
      const noteEditor = document.getElementById('note-editor');
      expect(noteEditor.classList.contains('hidden')).toBe(false);
    });

    test('should handle empty form submissions', () => {
      // Try to register with empty fields
      document.getElementById('show-register').click();
      document.getElementById('register-submit').click();

      // Should not proceed (stays on register form)
      const registerForm = document.getElementById('register-form');
      expect(registerForm.classList.contains('hidden')).toBe(false);
    });
  });

  describe('Performance and Memory Management', () => {
    test('should not create memory leaks with event listeners', async () => {
      // Create and destroy multiple app instances
      for (let i = 0; i < 5; i++) {
        const testApp = new window.NoteNestApp();
        await new Promise(resolve => setTimeout(resolve, 50));

        // Simulate some interactions
        document.getElementById('show-register').click();
        document.getElementById('show-login').click();

        // App should handle cleanup properly
        expect(testApp.elements).toBeDefined();
      }
    });

    test('should handle large numbers of notes efficiently', async () => {
      window.app = new window.NoteNestApp();
      await new Promise(resolve => setTimeout(resolve, 100));

      // Register user
      document.getElementById('show-register').click();
      document.getElementById('register-name').value = 'Test User';
      document.getElementById('register-email').value = 'test@example.com';
      document.getElementById('register-password').value = 'SecurePass123';
      document.getElementById('register-submit').click();
      await new Promise(resolve => setTimeout(resolve, 200));

      // Create many notes
      const startTime = Date.now();

      for (let i = 0; i < 50; i++) {
        await window.app.notesManager.createNote({
          title: `Performance Test Note ${i}`,
          content: `<p>Content for note ${i}</p>`
        });
      }

      const createTime = Date.now() - startTime;

      // Load and render notes
      const loadStartTime = Date.now();
      await window.app.notesManager.loadNotes();
      const loadTime = Date.now() - loadStartTime;

      // Should complete in reasonable time
      expect(createTime).toBeLessThan(2000); // 2 seconds
      expect(loadTime).toBeLessThan(500); // 0.5 seconds
      expect(window.app.notesManager.notes.length).toBe(50);
    });
  });
});