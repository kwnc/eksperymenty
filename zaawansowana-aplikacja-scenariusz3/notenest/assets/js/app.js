/**
 * NoteNest - Main Application Controller
 *
 * This class serves as the central orchestrator for the entire NoteNest application.
 * It manages initialization, view states, user interactions, and coordinates between
 * all other managers (auth, notes, notebooks, search, export).
 *
 * @class NoteNestApp
 * @version 1.0.0
 * @author NoteNest Development Team
 */
class NoteNestApp {
    /**
     * Initialize the NoteNest application instance
     * Sets up manager references, view state, and DOM element cache
     * Automatically calls init() to start the application
     */
    constructor() {
        this.authManager = null;
        this.storageManager = null;
        this.notesManager = null;
        this.notebooksManager = null;
        this.searchManager = null;
        this.exportManager = null;

        this.currentView = 'auth';
        this.currentTheme = 'light';

        // DOM elements
        this.elements = {};

        this.init();
    }

    /**
     * Initialize the application asynchronously
     *
     * This method handles the complete application startup process:
     * - Initialize all manager instances
     * - Cache DOM elements for performance
     * - Set up event listeners
     * - Configure manager callbacks
     * - Initialize theme system
     *
     * @async
     * @throws {Error} If initialization fails
     */
    async init() {
        try {
            // Initialize managers
            await this.initializeManagers();

            // Cache DOM elements
            this.cacheElements();

            // Setup event listeners
            this.setupEventListeners();

            // Setup manager callbacks
            this.setupManagerCallbacks();

            // Initialize theme
            this.initializeTheme();

            console.log('NoteNest application initialized successfully');

        } catch (error) {
            console.error('Failed to initialize NoteNest:', error);
            this.showError('Failed to initialize application. Please refresh the page.');
        }
    }

    /**
     * Initialize all manager instances in proper dependency order
     *
     * Sets up the core application managers and establishes their
     * interdependencies. The order is important as some managers
     * depend on others being initialized first.
     *
     * @async
     * @private
     */
    async initializeManagers() {
        // Initialize managers in dependency order
        this.storageManager = new StorageManager();
        this.authManager = new AuthManager();
        this.notesManager = new NotesManager();
        this.notebooksManager = new NotebooksManager();
        this.searchManager = new SearchManager();
        this.exportManager = new ExportManager();

        // Set up manager dependencies
        this.notesManager.setAuthManager(this.authManager);
        this.notebooksManager.setAuthManager(this.authManager);
        this.searchManager.setAuthManager(this.authManager);
        this.searchManager.setNotesManager(this.notesManager);
        this.exportManager.setAuthManager(this.authManager);
        this.exportManager.setNotesManager(this.notesManager);
        this.exportManager.setNotebooksManager(this.notebooksManager);

        // Wait for storage to be ready
        await this.storageManager.initPromise;
    }

    /**
     * Cache frequently used DOM elements for performance
     *
     * This method finds and stores references to all major DOM elements
     * used throughout the application to avoid repeated querySelector calls.
     * Elements are grouped by functionality (auth, main app, editor, etc.)
     *
     * @private
     */
    cacheElements() {
        this.elements = {
            // Views
            authView: document.getElementById('auth-view'),
            appView: document.getElementById('app-view'),
            mainHeader: document.getElementById('main-header'),

            // Authentication elements
            loginForm: document.getElementById('login-form'),
            registerForm: document.getElementById('register-form'),
            showRegister: document.getElementById('show-register'),
            showLogin: document.getElementById('show-login'),

            loginEmail: document.getElementById('login-email'),
            loginPassword: document.getElementById('login-password'),
            loginSubmit: document.getElementById('login-submit'),

            registerName: document.getElementById('register-name'),
            registerEmail: document.getElementById('register-email'),
            registerPassword: document.getElementById('register-password'),
            registerSubmit: document.getElementById('register-submit'),

            // Main application elements
            sidebar: document.getElementById('sidebar'),
            notebooksList: document.getElementById('notebooks-list'),
            newNotebook: document.getElementById('new-notebook'),
            newNote: document.getElementById('new-note'),

            searchToggle: document.getElementById('search-toggle'),
            searchBar: document.getElementById('search-bar'),
            searchInput: document.getElementById('search-input'),
            searchBtn: document.getElementById('search-btn'),

            notesListView: document.getElementById('notes-list-view'),
            notesList: document.getElementById('notes-list'),
            currentNotebookTitle: document.getElementById('current-notebook-title'),
            sortNotes: document.getElementById('sort-notes'),

            noteEditor: document.getElementById('note-editor'),
            noteTitle: document.getElementById('note-title'),
            noteTags: document.getElementById('note-tags'),
            noteContent: document.getElementById('note-content'),
            saveNote: document.getElementById('save-note'),
            closeEditor: document.getElementById('close-editor'),

            // Header elements
            themeToggle: document.getElementById('theme-toggle'),
            userMenu: document.getElementById('user-menu'),
            logoutBtn: document.getElementById('logout-btn'),
            exportNotes: document.getElementById('export-notes'),

            // Modal
            modalOverlay: document.getElementById('modal-overlay'),
            modalContent: document.getElementById('modal-content')
        };
    }

    /**
     * Set up all event listeners for the application
     *
     * Registers event handlers for:
     * - Authentication forms (login/register)
     * - Main navigation and actions
     * - Note editor functionality
     * - Search and filtering
     * - Keyboard shortcuts
     * - Theme switching
     *
     * @private
     */
    setupEventListeners() {
        // Authentication events
        if (this.elements.showRegister) {
            this.elements.showRegister.addEventListener('click', (e) => {
                e.preventDefault();
                this.showRegisterForm();
            });
        }

        if (this.elements.showLogin) {
            this.elements.showLogin.addEventListener('click', (e) => {
                e.preventDefault();
                this.showLoginForm();
            });
        }

        if (this.elements.loginSubmit) {
            this.elements.loginSubmit.addEventListener('click', (e) => {
                e.preventDefault();
                this.handleLogin();
            });
        }

        if (this.elements.registerSubmit) {
            this.elements.registerSubmit.addEventListener('click', (e) => {
                e.preventDefault();
                this.handleRegister();
            });
        }

        // Main application events
        if (this.elements.logoutBtn) {
            this.elements.logoutBtn.addEventListener('click', () => {
                this.handleLogout();
            });
        }

        if (this.elements.themeToggle) {
            this.elements.themeToggle.addEventListener('click', () => {
                this.toggleTheme();
            });
        }

        if (this.elements.newNotebook) {
            this.elements.newNotebook.addEventListener('click', () => {
                this.showNewNotebookDialog();
            });
        }

        if (this.elements.newNote) {
            this.elements.newNote.addEventListener('click', () => {
                this.createNewNote();
            });
        }

        // Search events
        if (this.elements.searchToggle) {
            this.elements.searchToggle.addEventListener('click', () => {
                this.toggleSearch();
            });
        }

        if (this.elements.searchInput) {
            this.elements.searchInput.addEventListener('input', (e) => {
                this.searchManager.debounceSearch(e.target.value);
            });
        }

        if (this.elements.searchBtn) {
            this.elements.searchBtn.addEventListener('click', () => {
                this.searchManager.search(this.elements.searchInput.value);
            });
        }

        // Note editor events
        if (this.elements.noteTitle) {
            this.elements.noteTitle.addEventListener('input', () => {
                this.scheduleAutoSave();
            });
        }

        if (this.elements.noteTags) {
            this.elements.noteTags.addEventListener('input', () => {
                this.scheduleAutoSave();
            });
        }

        if (this.elements.noteContent) {
            this.elements.noteContent.addEventListener('input', () => {
                this.scheduleAutoSave();
            });
        }

        if (this.elements.saveNote) {
            this.elements.saveNote.addEventListener('click', () => {
                this.saveCurrentNote();
            });
        }

        if (this.elements.closeEditor) {
            this.elements.closeEditor.addEventListener('click', () => {
                this.closeNoteEditor();
            });
        }

        // Sort notes
        if (this.elements.sortNotes) {
            this.elements.sortNotes.addEventListener('change', (e) => {
                this.handleSortChange(e.target.value);
            });
        }

        // Export button
        if (this.elements.exportNotes) {
            this.elements.exportNotes.addEventListener('click', () => {
                this.showExportDialog();
            });
        }

        // Modal overlay click to close
        if (this.elements.modalOverlay) {
            this.elements.modalOverlay.addEventListener('click', (e) => {
                if (e.target === this.elements.modalOverlay) {
                    this.hideModal();
                }
            });
        }

        // Formatting buttons
        document.querySelectorAll('[data-command]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const command = e.target.getAttribute('data-command');
                this.executeFormatCommand(command);
            });
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            this.handleKeyboardShortcuts(e);
        });
    }

    /**
     * Configure callbacks for manager state changes
     *
     * Sets up callback functions to handle state changes from various managers:
     * - Auth state changes (login/logout)
     * - Notes changes (create/update/delete)
     * - Notebook changes
     * - Search results
     *
     * @private
     */
    setupManagerCallbacks() {
        // Auth state changes
        this.authManager.setAuthStateChangeCallback((user) => {
            if (user) {
                this.handleUserAuthenticated(user);
            } else {
                this.handleUserLoggedOut();
            }
        });

        // Notes changes
        this.notesManager.setNotesChangedCallback((notes) => {
            this.renderNotesList(notes);
        });

        this.notesManager.setCurrentNoteChangedCallback((note) => {
            if (note) {
                this.showNoteEditor(note);
            } else {
                this.hideNoteEditor();
            }
        });

        // Notebooks changes
        this.notebooksManager.setNotebooksChangedCallback((notebooks) => {
            this.renderNotebooksList(notebooks);
        });

        this.notebooksManager.setCurrentNotebookChangedCallback((notebook) => {
            this.updateCurrentNotebookTitle(notebook);
        });

        // Search results
        this.searchManager.setSearchResultsCallback((results, query) => {
            if (query) {
                this.renderSearchResults(results, query);
            } else {
                this.notesManager.loadNotes();
            }
        });
    }

    initializeTheme() {
        const savedTheme = localStorage.getItem('notenest-theme') || 'light';
        this.setTheme(savedTheme);
    }

    // Authentication methods
    showLoginForm() {
        this.elements.loginForm.classList.remove('hidden');
        this.elements.registerForm.classList.add('hidden');
    }

    showRegisterForm() {
        this.elements.registerForm.classList.remove('hidden');
        this.elements.loginForm.classList.add('hidden');
    }

    /**
     * Handle user login form submission
     *
     * Validates form data, calls authentication manager, and provides
     * user feedback through loading states and toast notifications.
     *
     * @async
     * @private
     */
    async handleLogin() {
        const email = this.elements.loginEmail.value;
        const password = this.elements.loginPassword.value;

        this.setButtonLoading(this.elements.loginSubmit, true);

        try {
            const result = await this.authManager.login(email, password);
            if (result.success) {
                this.showToast('Login successful!', 'success');
            } else {
                this.showToast(result.message, 'error');
            }
        } catch (error) {
            this.showToast('Login failed. Please try again.', 'error');
        } finally {
            this.setButtonLoading(this.elements.loginSubmit, false);
        }
    }

    /**
     * Handle user registration form submission
     *
     * Validates form data, calls authentication manager to create account,
     * and provides appropriate user feedback.
     *
     * @async
     * @private
     */
    async handleRegister() {
        const name = this.elements.registerName.value;
        const email = this.elements.registerEmail.value;
        const password = this.elements.registerPassword.value;

        this.setButtonLoading(this.elements.registerSubmit, true);

        try {
            const result = await this.authManager.register(name, email, password);
            if (result.success) {
                this.showToast('Account created successfully!', 'success');
            } else {
                this.showToast(result.message, 'error');
            }
        } catch (error) {
            this.showToast('Registration failed. Please try again.', 'error');
        } finally {
            this.setButtonLoading(this.elements.registerSubmit, false);
        }
    }

    async handleLogout() {
        const result = await this.authManager.logout();
        if (result.success) {
            this.showToast('Logged out successfully', 'success');
        }
    }

    async handleUserAuthenticated(user) {
        this.currentView = 'app';
        this.showAppView();

        // Load user data
        await Promise.all([
            this.notebooksManager.loadNotebooks(),
            this.notesManager.loadNotes()
        ]);
    }

    handleUserLoggedOut() {
        this.currentView = 'auth';
        this.showAuthView();
        this.clearForms();
    }

    // View management
    showAuthView() {
        this.elements.authView.classList.remove('hidden');
        this.elements.appView.classList.add('hidden');
        this.elements.mainHeader.classList.add('hidden');
    }

    showAppView() {
        this.elements.authView.classList.add('hidden');
        this.elements.appView.classList.remove('hidden');
        this.elements.mainHeader.classList.remove('hidden');
    }

    // Theme management
    toggleTheme() {
        const newTheme = this.currentTheme === 'light' ? 'dark' : 'light';
        this.setTheme(newTheme);
    }

    setTheme(theme) {
        this.currentTheme = theme;
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('notenest-theme', theme);

        // Update theme toggle icon
        if (this.elements.themeToggle) {
            const icon = this.elements.themeToggle.querySelector('svg');
            if (icon) {
                icon.style.transform = theme === 'dark' ? 'rotate(180deg)' : 'rotate(0deg)';
            }
        }
    }

    // Notebooks management
    renderNotebooksList(notebooks) {
        if (!this.elements.notebooksList) return;

        this.elements.notebooksList.innerHTML = '';

        // Add "All Notes" option
        const allNotesItem = this.createNotebookListItem({
            id: 'all',
            name: 'All Notes',
            count: this.notesManager.notes.length
        }, true);
        this.elements.notebooksList.appendChild(allNotesItem);

        // Add each notebook
        notebooks.forEach(notebook => {
            const notesCount = this.notesManager.notes.filter(
                note => note.notebookId === notebook.id
            ).length;

            const item = this.createNotebookListItem({
                ...notebook,
                count: notesCount
            });

            this.elements.notebooksList.appendChild(item);
        });
    }

    createNotebookListItem(notebook, isAllNotes = false) {
        const li = document.createElement('li');
        const button = document.createElement('button');
        button.className = 'notebook-item';
        button.innerHTML = `
            <div class="notebook-info">
                <span class="notebook-icon" ${!isAllNotes ? `style="color: ${notebook.color}"` : ''}>
                    📁
                </span>
                <span class="notebook-name">${notebook.name}</span>
            </div>
            <span class="notebook-count">${notebook.count || 0}</span>
        `;

        button.addEventListener('click', () => {
            this.selectNotebook(notebook.id);
        });

        li.appendChild(button);
        return li;
    }

    async selectNotebook(notebookId) {
        // Update active state
        document.querySelectorAll('.notebook-item').forEach(item => {
            item.classList.remove('active');
        });
        event.target.closest('.notebook-item').classList.add('active');

        // Set current notebook
        this.notebooksManager.setCurrentNotebook(notebookId);

        // Load notes for notebook
        await this.notesManager.loadNotes({
            notebookId: notebookId === 'all' ? null : notebookId
        });
    }

    updateCurrentNotebookTitle(notebook) {
        if (this.elements.currentNotebookTitle) {
            this.elements.currentNotebookTitle.textContent = notebook ? notebook.name : 'All Notes';
        }
    }

    async showNewNotebookDialog() {
        const html = `
            <div class="modal-header">
                <h3 class="modal-title">Create New Notebook</h3>
            </div>
            <div class="modal-content">
                <div class="auth-form">
                    <input type="text" id="new-notebook-name" placeholder="Notebook name" required>
                    <textarea id="new-notebook-description" placeholder="Description (optional)" rows="3"></textarea>
                    <div class="modal-actions">
                        <button type="button" class="btn-secondary" onclick="app.hideModal()">Cancel</button>
                        <button type="button" class="btn-primary" onclick="app.createNotebook()">Create</button>
                    </div>
                </div>
            </div>
        `;

        this.showModal(html);
        document.getElementById('new-notebook-name').focus();
    }

    async createNotebook() {
        const name = document.getElementById('new-notebook-name').value;
        const description = document.getElementById('new-notebook-description').value;

        if (!name.trim()) {
            this.showToast('Please enter a notebook name', 'error');
            return;
        }

        try {
            await this.notebooksManager.createNotebook({
                name: name.trim(),
                description: description.trim()
            });

            this.hideModal();
            this.showToast('Notebook created successfully!', 'success');
        } catch (error) {
            this.showToast(error.message, 'error');
        }
    }

    // Notes management
    renderNotesList(notes) {
        if (!this.elements.notesList) return;

        this.elements.notesList.innerHTML = '';

        if (notes.length === 0) {
            this.elements.notesList.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">📝</div>
                    <div class="empty-state-title">No notes yet</div>
                    <div class="empty-state-description">Create your first note to get started</div>
                </div>
            `;
            return;
        }

        notes.forEach(note => {
            const noteCard = this.createNoteCard(note);
            this.elements.notesList.appendChild(noteCard);
        });
    }

    createNoteCard(note) {
        const div = document.createElement('div');
        div.className = 'note-card';
        div.setAttribute('data-note-id', note.id);

        const preview = this.notesManager.getNotePreview(note.id);
        const relativeDate = this.notesManager.formatRelativeDate(note.modifiedAt);

        div.innerHTML = `
            <div class="note-card-header">
                <h3 class="note-card-title">${this.escapeHtml(note.title)}</h3>
                <span class="note-card-date">${relativeDate}</span>
            </div>
            <div class="note-card-preview">${this.escapeHtml(preview)}</div>
            ${note.tags.length > 0 ? `
                <div class="note-card-tags">
                    ${note.tags.map(tag => `<span class="note-tag">#${this.escapeHtml(tag)}</span>`).join('')}
                </div>
            ` : ''}
        `;

        div.addEventListener('click', () => {
            this.openNote(note.id);
        });

        return div;
    }

    async createNewNote() {
        try {
            const currentNotebook = this.notebooksManager.getCurrentNotebook();
            const note = await this.notesManager.createNote({
                notebookId: currentNotebook ? currentNotebook.id : 'default'
            });
            this.openNote(note.id);
        } catch (error) {
            this.showToast('Failed to create note', 'error');
        }
    }

    async openNote(noteId) {
        try {
            await this.notesManager.setCurrentNote(noteId);
        } catch (error) {
            this.showToast('Failed to open note', 'error');
        }
    }

    showNoteEditor(note) {
        if (!note) return;

        this.elements.notesListView.classList.add('hidden');
        this.elements.noteEditor.classList.remove('hidden');

        this.elements.noteTitle.value = note.title;
        this.elements.noteTags.value = note.tags.join(', ');
        this.elements.noteContent.innerHTML = note.content;

        this.elements.noteTitle.focus();
    }

    hideNoteEditor() {
        this.elements.noteEditor.classList.add('hidden');
        this.elements.notesListView.classList.remove('hidden');
    }

    closeNoteEditor() {
        this.notesManager.setCurrentNote(null);
    }

    scheduleAutoSave() {
        const noteData = {
            title: this.elements.noteTitle.value,
            content: this.elements.noteContent.innerHTML,
            tags: this.elements.noteTags.value.split(',').map(tag => tag.trim()).filter(tag => tag)
        };

        this.notesManager.scheduleAutoSave(noteData);
    }

    async saveCurrentNote() {
        try {
            const noteData = {
                title: this.elements.noteTitle.value,
                content: this.elements.noteContent.innerHTML,
                tags: this.elements.noteTags.value.split(',').map(tag => tag.trim()).filter(tag => tag)
            };

            await this.notesManager.saveCurrentNote(noteData);
            this.showToast('Note saved!', 'success');
        } catch (error) {
            this.showToast('Failed to save note', 'error');
        }
    }

    // Search management
    toggleSearch() {
        const isVisible = !this.elements.searchBar.classList.contains('hidden');

        if (isVisible) {
            this.elements.searchBar.classList.add('hidden');
            this.searchManager.clearSearch();
        } else {
            this.elements.searchBar.classList.remove('hidden');
            this.elements.searchInput.focus();
        }
    }

    renderSearchResults(results, query) {
        this.renderNotesList(results);
        this.elements.currentNotebookTitle.textContent = `Search: "${query}" (${results.length} results)`;
    }

    // Export management
    showExportDialog() {
        const html = `
            <div class="modal-header">
                <h3 class="modal-title">Export Data</h3>
            </div>
            <div class="modal-content">
                <div class="auth-form">
                    <h4>Export Options</h4>
                    <button type="button" class="btn-primary" onclick="app.exportAllData()" style="margin-bottom: 0.5rem; width: 100%;">
                        Export All Data (JSON Backup)
                    </button>
                    <button type="button" class="btn-secondary" onclick="app.exportCurrentNotebook()" style="margin-bottom: 0.5rem; width: 100%;">
                        Export Current Notebook (Markdown)
                    </button>
                    <div class="modal-actions">
                        <button type="button" class="btn-secondary" onclick="app.hideModal()">Cancel</button>
                    </div>
                </div>
            </div>
        `;

        this.showModal(html);
    }

    async exportAllData() {
        try {
            await this.exportManager.exportAllData();
            this.hideModal();
        } catch (error) {
            this.showToast('Export failed: ' + error.message, 'error');
        }
    }

    async exportCurrentNotebook() {
        try {
            const currentNotebook = this.notebooksManager.getCurrentNotebook();
            if (!currentNotebook) {
                this.showToast('Please select a notebook first', 'error');
                return;
            }

            await this.exportManager.exportNotebook(currentNotebook.id);
            this.hideModal();
        } catch (error) {
            this.showToast('Export failed: ' + error.message, 'error');
        }
    }

    // Utility methods
    executeFormatCommand(command) {
        document.execCommand(command, false, null);
        this.elements.noteContent.focus();
        this.scheduleAutoSave();
    }

    handleSortChange(sortBy) {
        const [field, order] = sortBy.split('_');
        this.notesManager.setSortOptions(field || 'modifiedAt', order || 'desc');
    }

    handleKeyboardShortcuts(e) {
        // Ctrl/Cmd + N: New note
        if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
            e.preventDefault();
            if (this.currentView === 'app') {
                this.createNewNote();
            }
        }

        // Ctrl/Cmd + S: Save note
        if ((e.ctrlKey || e.metaKey) && e.key === 's') {
            e.preventDefault();
            if (this.notesManager.getCurrentNote()) {
                this.saveCurrentNote();
            }
        }

        // Ctrl/Cmd + F: Search
        if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
            e.preventDefault();
            if (this.currentView === 'app') {
                this.toggleSearch();
            }
        }

        // Escape: Close editor or search
        if (e.key === 'Escape') {
            if (this.notesManager.getCurrentNote()) {
                this.closeNoteEditor();
            } else if (!this.elements.searchBar.classList.contains('hidden')) {
                this.toggleSearch();
            }
        }
    }

    // UI utility methods
    showModal(html) {
        this.elements.modalContent.innerHTML = html;
        this.elements.modalOverlay.classList.remove('hidden');
    }

    hideModal() {
        this.elements.modalOverlay.classList.add('hidden');
    }

    /**
     * Display a toast notification to the user
     *
     * Creates and shows a temporary notification with automatic dismissal.
     * Supports different types for styling (info, success, error, warning).
     *
     * @param {string} message - The message to display
     * @param {string} [type='info'] - Type of toast (info, success, error, warning)
     * @public
     */
    showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast ${type} show`;
        toast.innerHTML = `
            <div class="toast-content">
                <div class="toast-message">${this.escapeHtml(message)}</div>
                <button class="toast-close" onclick="this.parentElement.parentElement.remove()">×</button>
            </div>
        `;

        document.body.appendChild(toast);

        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (toast.parentElement) {
                toast.remove();
            }
        }, 5000);
    }

    showError(message) {
        this.showToast(message, 'error');
    }

    setButtonLoading(button, loading) {
        if (loading) {
            button.disabled = true;
            button.innerHTML = '<div class="spinner"></div>';
        } else {
            button.disabled = false;
            button.innerHTML = button.getAttribute('data-original-text') || 'Submit';
        }
    }

    clearForms() {
        // Clear login form
        if (this.elements.loginEmail) this.elements.loginEmail.value = '';
        if (this.elements.loginPassword) this.elements.loginPassword.value = '';

        // Clear register form
        if (this.elements.registerName) this.elements.registerName.value = '';
        if (this.elements.registerEmail) this.elements.registerEmail.value = '';
        if (this.elements.registerPassword) this.elements.registerPassword.value = '';
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Initialize the application when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.app = new NoteNestApp();
});

// Export for use in other modules
window.NoteNestApp = NoteNestApp;