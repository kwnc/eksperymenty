/**
 * UI Components Module - Handles UI rendering and interactions
 */

class UIComponents {
    constructor() {
        this.currentView = 'login';
        this.currentNote = null;
    }

    // Initialize the application UI
    init() {
        this.renderApp();
        this.setupEventListeners();
    }

    // Main app container
    renderApp() {
        const app = document.getElementById('app');

        if (window.auth.isAuthenticated()) {
            this.renderMainApp();
        } else {
            this.renderAuthScreen();
        }
    }

    // Authentication screen
    renderAuthScreen() {
        const app = document.getElementById('app');
        app.innerHTML = `
            <div class="auth-container">
                <div class="auth-card card">
                    <div class="auth-header text-center">
                        <h1 class="text-primary">NoteNest</h1>
                        <p class="text-secondary">Your personal note-taking companion</p>
                    </div>

                    <div class="auth-tabs">
                        <button id="login-tab" class="auth-tab active">Login</button>
                        <button id="register-tab" class="auth-tab">Register</button>
                    </div>

                    <div id="login-form" class="auth-form">
                        <form id="login-form-element">
                            <div class="form-group">
                                <label for="login-username">Username</label>
                                <input type="text" id="login-username" name="username" required>
                            </div>
                            <div class="form-group">
                                <label for="login-password">Password</label>
                                <input type="password" id="login-password" name="password" required>
                            </div>
                            <button type="submit" class="btn-primary full-width">Login</button>
                        </form>
                    </div>

                    <div id="register-form" class="auth-form hidden">
                        <form id="register-form-element">
                            <div class="form-group">
                                <label for="register-username">Username</label>
                                <input type="text" id="register-username" name="username" required>
                            </div>
                            <div class="form-group">
                                <label for="register-email">Email</label>
                                <input type="email" id="register-email" name="email" required>
                            </div>
                            <div class="form-group">
                                <label for="register-firstname">First Name</label>
                                <input type="text" id="register-firstname" name="firstName">
                            </div>
                            <div class="form-group">
                                <label for="register-lastname">Last Name</label>
                                <input type="text" id="register-lastname" name="lastName">
                            </div>
                            <div class="form-group">
                                <label for="register-password">Password</label>
                                <input type="password" id="register-password" name="password" required>
                            </div>
                            <div class="form-group">
                                <label for="register-confirm-password">Confirm Password</label>
                                <input type="password" id="register-confirm-password" name="confirmPassword" required>
                            </div>
                            <button type="submit" class="btn-primary full-width">Register</button>
                        </form>
                    </div>

                    <div id="auth-message" class="auth-message hidden"></div>
                </div>
            </div>
        `;

        this.setupAuthEventListeners();
    }

    // Main application interface
    renderMainApp() {
        const app = document.getElementById('app');
        const user = window.auth.getCurrentUser();

        app.innerHTML = `
            <div class="app-layout">
                <header class="app-header">
                    <div class="header-content flex justify-between items-center">
                        <div class="header-left flex items-center gap-md">
                            <h1 class="app-title text-primary">NoteNest</h1>
                            <button id="new-note-btn" class="btn-primary">
                                <span>+ New Note</span>
                            </button>
                            <div class="import-dropdown">
                                <button id="import-btn" class="btn-secondary">📥 Import ▼</button>
                                <div id="import-menu" class="import-menu hidden">
                                    <button id="import-files-btn">Import Files</button>
                                    <button id="import-url-btn">Import from URL</button>
                                </div>
                            </div>
                        </div>
                        <div class="header-right flex items-center gap-md">
                            <div class="search-container">
                                <input type="text" id="search-input" placeholder="Search notes..." class="search-input">
                            </div>
                            <div class="theme-selector">
                                <button id="theme-toggle-btn" class="theme-toggle" title="Change theme">
                                    ☀️
                                </button>
                                <div id="theme-menu" class="theme-menu hidden">
                                    <div class="theme-menu-header">Choose Theme</div>
                                    <div id="theme-options" class="theme-options">
                                        <!-- Theme options will be populated here -->
                                    </div>
                                </div>
                            </div>
                            <div class="user-menu">
                                <button id="user-menu-btn" class="btn-secondary">
                                    ${user.firstName || user.username}
                                </button>
                                <div id="user-menu-dropdown" class="user-menu-dropdown hidden">
                                    <button id="profile-btn">Profile</button>
                                    <button id="settings-btn">Settings</button>
                                    <button id="logout-btn">Logout</button>
                                </div>
                            </div>
                        </div>
                    </div>
                </header>

                <div class="app-main">
                    <aside class="sidebar">
                        <nav class="sidebar-nav">
                            <button id="all-notes-btn" class="nav-item active">All Notes</button>
                            <button id="favorites-btn" class="nav-item">Favorites</button>
                            <button id="archived-btn" class="nav-item">Archived</button>
                        </nav>

                        <div class="notebooks-section">
                            <div class="notebooks-header">
                                <h3>Notebooks</h3>
                                <button id="new-notebook-btn" class="btn-secondary btn-sm">+</button>
                            </div>
                            <div id="notebooks-list" class="notebooks-list">
                                <!-- Notebooks will be rendered here -->
                            </div>
                        </div>

                        <div class="notes-list-container">
                            <div class="notes-list-header">
                                <h3 id="current-view-title">All Notes</h3>
                                <div class="notes-list-actions">
                                    <button id="sort-notes-btn" class="btn-secondary btn-sm">Sort</button>
                                </div>
                            </div>
                            <div class="view-controls">
                                <button class="view-btn active" data-view="list">📋 List</button>
                                <button class="view-btn" data-view="calendar">📅 Calendar</button>
                                <button class="view-btn" data-view="kanban">📊 Kanban</button>
                            </div>
                            <div id="notes-list" class="notes-list">
                                <!-- Notes will be rendered here -->
                            </div>
                        </div>
                    </aside>

                    <main class="main-content">
                        <div id="note-editor-container" class="note-editor-container">
                            <div id="welcome-screen" class="welcome-screen">
                                <div class="welcome-content text-center">
                                    <h2>Welcome to NoteNest</h2>
                                    <p class="text-secondary">Select a note from the sidebar or create a new one to get started.</p>
                                    <button id="welcome-new-note-btn" class="btn-primary">Create Your First Note</button>
                                </div>
                            </div>

                            <div id="note-editor" class="note-editor hidden">
                                <div class="note-editor-header">
                                    <input type="text" id="note-title" placeholder="Note title..." class="note-title-input">
                                    <div class="note-actions">
                                        <button id="save-note-btn" class="btn-accent">Save</button>
                                        <div class="export-dropdown">
                                            <button id="export-btn" class="btn-secondary">Export ▼</button>
                                            <div id="export-menu" class="export-menu hidden">
                                                <button data-format="pdf">Export as PDF</button>
                                                <button data-format="html">Export as HTML</button>
                                                <button data-format="markdown">Export as Markdown</button>
                                                <button data-format="txt">Export as Text</button>
                                                <button data-format="json">Export as JSON</button>
                                                <div class="export-separator"></div>
                                                <button id="email-note-btn">Email Note</button>
                                            </div>
                                        </div>
                                        <button id="delete-note-btn" class="btn-secondary">Delete</button>
                                    </div>
                                </div>

                                <div class="note-metadata">
                                    <div class="note-tags-section">
                                        <label for="note-tags">Tags:</label>
                                        <input type="text" id="note-tags" placeholder="Add tags (comma separated)..." class="note-tags-input">
                                        <div id="note-tags-display" class="note-tags-display"></div>
                                    </div>

                                    <div class="note-ai-section">
                                        <div class="ai-actions">
                                            <button id="summarize-btn" class="btn-sm btn-secondary" title="Generate AI summary">📝 Summarize</button>
                                            <button id="improve-note-btn" class="btn-sm btn-secondary" title="Improve writing with AI">✨ Improve</button>
                                            <button id="generate-tags-btn" class="btn-sm btn-secondary" title="Generate AI tags">🏷️ Auto-tag</button>
                                        </div>
                                        <div id="ai-summary-display" class="ai-summary-display hidden"></div>
                                    </div>

                                    <div class="note-attachments-section">
                                        <div class="attachments-header">
                                            <label>Attachments:</label>
                                            <button id="add-attachment-btn" class="btn-sm btn-secondary">📎 Add Image</button>
                                        </div>
                                        <div id="attachments-list" class="attachments-list"></div>
                                        <input type="file" id="attachment-input" accept="image/*" multiple style="display: none;">
                                    </div>
                                </div>

                                <div class="code-toolbar-container">
                                    <div id="code-toolbar" class="code-toolbar">
                                        <div class="toolbar-group">
                                            <label>Language:</label>
                                            <select id="code-language-select" class="language-select">
                                                <option value="javascript">JavaScript</option>
                                                <option value="python">Python</option>
                                                <option value="java">Java</option>
                                                <option value="css">CSS</option>
                                                <option value="html">HTML</option>
                                                <option value="sql">SQL</option>
                                                <option value="json">JSON</option>
                                                <option value="bash">Bash</option>
                                                <option value="typescript">TypeScript</option>
                                                <option value="php">PHP</option>
                                                <option value="ruby">Ruby</option>
                                                <option value="go">Go</option>
                                                <option value="rust">Rust</option>
                                                <option value="cpp">C++</option>
                                                <option value="c">C</option>
                                            </select>
                                            <button id="insert-code-btn" class="btn-sm btn-secondary">💻 Insert Code</button>
                                        </div>
                                        <div class="toolbar-group">
                                            <label>Diagram:</label>
                                            <select id="diagram-type-select" class="diagram-select">
                                                <option value="flowchart">Flowchart</option>
                                                <option value="sequence">Sequence</option>
                                                <option value="gantt">Gantt Chart</option>
                                                <option value="pie">Pie Chart</option>
                                                <option value="mindmap">Mind Map</option>
                                                <option value="timeline">Timeline</option>
                                            </select>
                                            <button id="insert-diagram-btn" class="btn-sm btn-secondary">📊 Insert Diagram</button>
                                        </div>
                                    </div>
                                </div>

                                <div class="note-editor-content">
                                    <div id="note-content" class="note-content-editor"></div>
                                </div>

                                <div class="note-editor-footer">
                                    <div class="note-stats">
                                        <span id="word-count">0 words</span>
                                        <span id="save-indicator">Unsaved</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </main>
                </div>

                <!-- Hidden file input for import -->
                <input type="file" id="import-file-input" accept=".md,.html,.txt,text/markdown,text/html,text/plain" multiple style="display: none;">

                <!-- URL Import Modal -->
                <div id="url-import-modal" class="modal hidden">
                    <div class="modal-overlay"></div>
                    <div class="modal-content">
                        <div class="modal-header">
                            <h3>Import from URL</h3>
                            <button class="modal-close" id="close-url-modal">×</button>
                        </div>
                        <div class="modal-body">
                            <div class="form-group">
                                <label for="import-url-input">URL:</label>
                                <input type="url" id="import-url-input" placeholder="https://example.com/document.md" class="form-input">
                            </div>
                            <div class="form-group">
                                <small class="text-secondary">Supported formats: Markdown (.md), HTML (.html), Plain text (.txt)</small>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button id="cancel-url-import" class="btn-secondary">Cancel</button>
                            <button id="confirm-url-import" class="btn-primary">Import</button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        this.setupMainAppEventListeners();
        this.loadNotebooksList();
        this.loadNotesList();
        this.initializeThemeSelector();
    }

    // Authentication event listeners
    setupAuthEventListeners() {
        // Tab switching
        document.getElementById('login-tab').addEventListener('click', () => {
            this.switchAuthTab('login');
        });

        document.getElementById('register-tab').addEventListener('click', () => {
            this.switchAuthTab('register');
        });

        // Form submissions
        document.getElementById('login-form-element').addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.handleLogin(e);
        });

        document.getElementById('register-form-element').addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.handleRegister(e);
        });
    }

    // Main app event listeners
    setupMainAppEventListeners() {
        // New note button
        document.getElementById('new-note-btn').addEventListener('click', () => {
            this.createNewNote();
        });

        document.getElementById('welcome-new-note-btn').addEventListener('click', () => {
            this.createNewNote();
        });

        // User menu
        document.getElementById('user-menu-btn').addEventListener('click', () => {
            this.toggleUserMenu();
        });

        document.getElementById('logout-btn').addEventListener('click', () => {
            this.handleLogout();
        });

        // Navigation
        document.getElementById('all-notes-btn').addEventListener('click', () => {
            this.switchView('all-notes');
        });

        document.getElementById('favorites-btn').addEventListener('click', () => {
            this.switchView('favorites');
        });

        document.getElementById('archived-btn').addEventListener('click', () => {
            this.switchView('archived');
        });

        // Search
        document.getElementById('search-input').addEventListener('input', (e) => {
            this.handleSearch(e.target.value);
        });

        // Notebook management
        document.getElementById('new-notebook-btn').addEventListener('click', () => {
            this.createNewNotebook();
        });

        // Theme management
        document.getElementById('theme-toggle-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggleThemeMenu();
        });

        // Note editor
        const saveBtn = document.getElementById('save-note-btn');
        if (saveBtn) {
            saveBtn.addEventListener('click', () => {
                this.saveCurrentNote();
            });
        }

        const deleteBtn = document.getElementById('delete-note-btn');
        if (deleteBtn) {
            deleteBtn.addEventListener('click', () => {
                this.deleteCurrentNote();
            });
        }

        // Export functionality
        const exportBtn = document.getElementById('export-btn');
        if (exportBtn) {
            exportBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.toggleExportMenu();
            });
        }

        const exportMenu = document.getElementById('export-menu');
        if (exportMenu) {
            exportMenu.addEventListener('click', (e) => {
                if (e.target.dataset.format) {
                    this.exportCurrentNote(e.target.dataset.format);
                }
            });
        }

        const emailBtn = document.getElementById('email-note-btn');
        if (emailBtn) {
            emailBtn.addEventListener('click', () => {
                this.emailCurrentNote();
            });
        }

        // Initialize rich text editor
        this.initializeEditor();

        const noteTitle = document.getElementById('note-title');
        if (noteTitle) {
            noteTitle.addEventListener('input', () => {
                this.markAsUnsaved();
            });
        }

        // Tag management
        const noteTagsInput = document.getElementById('note-tags');
        if (noteTagsInput) {
            noteTagsInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    this.addTagsFromInput();
                }
            });

            noteTagsInput.addEventListener('blur', () => {
                this.addTagsFromInput();
            });
        }

        // AI functionality
        const summarizeBtn = document.getElementById('summarize-btn');
        if (summarizeBtn) {
            summarizeBtn.addEventListener('click', () => {
                this.generateAISummary();
            });
        }

        const improveBtn = document.getElementById('improve-note-btn');
        if (improveBtn) {
            improveBtn.addEventListener('click', () => {
                this.improveNoteWithAI();
            });
        }

        const generateTagsBtn = document.getElementById('generate-tags-btn');
        if (generateTagsBtn) {
            generateTagsBtn.addEventListener('click', () => {
                this.generateAITags();
            });
        }

        // OCR/Attachment functionality
        const addAttachmentBtn = document.getElementById('add-attachment-btn');
        if (addAttachmentBtn) {
            addAttachmentBtn.addEventListener('click', () => {
                document.getElementById('attachment-input').click();
            });
        }

        const attachmentInput = document.getElementById('attachment-input');
        if (attachmentInput) {
            attachmentInput.addEventListener('change', (e) => {
                this.handleAttachmentUpload(e.target.files);
            });
        }

        // View controls
        document.querySelectorAll('.view-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const viewType = btn.dataset.view;
                if (window.viewsManager) {
                    window.viewsManager.switchView(viewType);
                }
            });
        });

        // Import functionality
        const importBtn = document.getElementById('import-btn');
        if (importBtn) {
            importBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.toggleImportMenu();
            });
        }

        const importFilesBtn = document.getElementById('import-files-btn');
        if (importFilesBtn) {
            importFilesBtn.addEventListener('click', () => {
                this.showFileImportDialog();
            });
        }

        const importUrlBtn = document.getElementById('import-url-btn');
        if (importUrlBtn) {
            importUrlBtn.addEventListener('click', () => {
                this.showUrlImportDialog();
            });
        }

        const importFileInput = document.getElementById('import-file-input');
        if (importFileInput) {
            importFileInput.addEventListener('change', (e) => {
                this.handleFileImport(e.target.files);
            });
        }

        // URL import modal
        const confirmUrlImport = document.getElementById('confirm-url-import');
        if (confirmUrlImport) {
            confirmUrlImport.addEventListener('click', () => {
                this.handleUrlImport();
            });
        }

        const cancelUrlImport = document.getElementById('cancel-url-import');
        if (cancelUrlImport) {
            cancelUrlImport.addEventListener('click', () => {
                this.hideUrlImportDialog();
            });
        }

        const closeUrlModal = document.getElementById('close-url-modal');
        if (closeUrlModal) {
            closeUrlModal.addEventListener('click', () => {
                this.hideUrlImportDialog();
            });
        }

        // Code toolbar functionality
        const insertCodeBtn = document.getElementById('insert-code-btn');
        if (insertCodeBtn) {
            insertCodeBtn.addEventListener('click', () => {
                const languageSelect = document.getElementById('code-language-select');
                const language = languageSelect ? languageSelect.value : 'javascript';
                if (window.codeHighlightManager) {
                    window.codeHighlightManager.insertCodeBlock(language);
                }
            });
        }

        const insertDiagramBtn = document.getElementById('insert-diagram-btn');
        if (insertDiagramBtn) {
            insertDiagramBtn.addEventListener('click', () => {
                const diagramSelect = document.getElementById('diagram-type-select');
                const diagramType = diagramSelect ? diagramSelect.value : 'flowchart';
                if (window.codeHighlightManager) {
                    window.codeHighlightManager.insertMermaidDiagram(diagramType);
                }
            });
        }
    }

    // Initialize rich text editor
    initializeEditor() {
        const editorContainer = document.getElementById('note-content');
        if (editorContainer && window.richTextEditor) {
            window.richTextEditor.init('#note-content');
        }
    }

    // Authentication handlers
    switchAuthTab(tab) {
        const loginTab = document.getElementById('login-tab');
        const registerTab = document.getElementById('register-tab');
        const loginForm = document.getElementById('login-form');
        const registerForm = document.getElementById('register-form');

        if (tab === 'login') {
            loginTab.classList.add('active');
            registerTab.classList.remove('active');
            loginForm.classList.remove('hidden');
            registerForm.classList.add('hidden');
        } else {
            registerTab.classList.add('active');
            loginTab.classList.remove('active');
            registerForm.classList.remove('hidden');
            loginForm.classList.add('hidden');
        }
    }

    async handleLogin(e) {
        const formData = new FormData(e.target);
        const username = formData.get('username');
        const password = formData.get('password');

        const result = await window.auth.login(username, password);

        if (result.success) {
            this.renderApp();
        } else {
            this.showAuthMessage(result.error, 'error');
        }
    }

    async handleRegister(e) {
        const formData = new FormData(e.target);
        const password = formData.get('password');
        const confirmPassword = formData.get('confirmPassword');

        if (password !== confirmPassword) {
            this.showAuthMessage('Passwords do not match', 'error');
            return;
        }

        const userData = {
            username: formData.get('username'),
            email: formData.get('email'),
            firstName: formData.get('firstName'),
            lastName: formData.get('lastName'),
            password: password
        };

        const result = await window.auth.register(userData);

        if (result.success) {
            this.showAuthMessage('Account created successfully! Please login.', 'success');
            this.switchAuthTab('login');
        } else {
            this.showAuthMessage(result.error, 'error');
        }
    }

    showAuthMessage(message, type) {
        const messageEl = document.getElementById('auth-message');
        messageEl.textContent = message;
        messageEl.className = `auth-message ${type}`;
        messageEl.classList.remove('hidden');

        setTimeout(() => {
            messageEl.classList.add('hidden');
        }, 5000);
    }

    // Main app handlers
    async handleLogout() {
        const result = await window.auth.logout();
        if (result.success) {
            this.renderApp();
        }
    }

    toggleUserMenu() {
        const dropdown = document.getElementById('user-menu-dropdown');
        dropdown.classList.toggle('hidden');
    }

    async loadNotebooksList() {
        // Ensure default notebook exists
        await window.notebooks.getDefaultNotebook();

        const result = await window.notebooks.getUserNotebooks();
        if (result.success) {
            this.renderNotebooksList(result.notebooks);
        }
    }

    renderNotebooksList(notebooks) {
        const notebooksList = document.getElementById('notebooks-list');

        if (notebooks.length === 0) {
            notebooksList.innerHTML = '<div class="no-notebooks">No notebooks found</div>';
            return;
        }

        notebooksList.innerHTML = notebooks.map(notebook => `
            <div class="notebook-item" data-notebook-id="${notebook.id}">
                <div class="notebook-color" style="background-color: ${notebook.color}"></div>
                <div class="notebook-info">
                    <div class="notebook-name">${notebook.name}</div>
                    <div class="notebook-count">${notebook.noteCount || 0} notes</div>
                </div>
                ${!notebook.isDefault ? '<button class="notebook-menu-btn">⋮</button>' : ''}
            </div>
        `).join('');

        // Add click listeners to notebook items
        notebooksList.querySelectorAll('.notebook-item').forEach(item => {
            item.addEventListener('click', (e) => {
                if (!e.target.classList.contains('notebook-menu-btn')) {
                    const notebookId = parseInt(item.dataset.notebookId);
                    this.switchToNotebook(notebookId);
                }
            });
        });
    }

    async loadNotesList() {
        const result = await window.notes.getUserNotes();
        if (result.success) {
            this.renderNotesList(result.notes);
        }
    }

    renderNotesList(notes) {
        const notesList = document.getElementById('notes-list');

        if (notes.length === 0) {
            notesList.innerHTML = '<div class="no-notes">No notes found</div>';
            return;
        }

        notesList.innerHTML = notes.map(note => `
            <div class="note-item" data-note-id="${note.id}">
                <div class="note-item-header">
                    <h3 class="note-item-title">${note.title}</h3>
                    <span class="note-item-date">${new Date(note.updatedAt).toLocaleDateString()}</span>
                </div>
                <div class="note-item-preview">${this.getPreview(note.content)}</div>
                <div class="note-item-meta">
                    <span class="word-count">${note.metadata.wordCount} words</span>
                </div>
            </div>
        `).join('');

        // Add click listeners to note items
        notesList.querySelectorAll('.note-item').forEach(item => {
            item.addEventListener('click', () => {
                const noteId = parseInt(item.dataset.noteId);
                this.loadNote(noteId);
            });
        });
    }

    getPreview(content, maxLength = 100) {
        return content.length > maxLength
            ? content.substring(0, maxLength) + '...'
            : content;
    }

    async loadNote(noteId) {
        const result = await window.notes.getNote(noteId);
        if (result.success) {
            this.currentNote = result.note;
            this.renderNoteEditor(result.note);
        }
    }

    renderNoteEditor(note) {
        const welcomeScreen = document.getElementById('welcome-screen');
        const noteEditor = document.getElementById('note-editor');

        welcomeScreen.classList.add('hidden');
        noteEditor.classList.remove('hidden');

        // Set note title
        document.getElementById('note-title').value = note.title;

        // Load content into rich text editor
        if (window.richTextEditor) {
            window.richTextEditor.setCurrentNote(note.id);
            window.richTextEditor.loadContent(note.content, 'html');

            // Highlight code and process diagrams after content is loaded
            setTimeout(() => {
                if (window.codeHighlightManager) {
                    window.codeHighlightManager.highlightAll();
                }
            }, 500);
        }

        // Load tags
        this.renderNoteTags(note.tags || []);

        // Load attachments
        this.loadNoteAttachments(note.id);

        this.currentNote = note;
        this.markAsSaved();
    }

    async createNewNote() {
        // Get current notebook or default notebook
        let notebookId = null;
        const currentNotebook = window.notebooks.getCurrentNotebook();

        if (currentNotebook) {
            notebookId = currentNotebook.id;
        } else {
            const defaultNotebook = await window.notebooks.getDefaultNotebook();
            if (defaultNotebook.success) {
                notebookId = defaultNotebook.notebook.id;
            }
        }

        const result = await window.notes.createNote({
            title: 'Untitled Note',
            content: '',
            notebookId: notebookId
        });

        if (result.success) {
            this.currentNote = result.note;
            this.renderNoteEditor(result.note);
            this.loadNotesList();
            this.loadNotebooksList(); // Update notebook counts

            // Focus on title input
            setTimeout(() => {
                document.getElementById('note-title').focus();
            }, 100);
        }
    }

    async saveCurrentNote() {
        if (!this.currentNote) return;

        // Use rich text editor's save method
        if (window.richTextEditor) {
            const result = await window.richTextEditor.save();
            if (result && result.success) {
                this.currentNote = result.note;
                this.loadNotesList();
            }
        }
    }

    updateWordCount() {
        // Word count is now handled by the rich text editor
        if (window.richTextEditor) {
            window.richTextEditor.updateWordCount();
        }
    }

    markAsUnsaved() {
        // Now handled by rich text editor
        if (window.richTextEditor) {
            window.richTextEditor.markAsUnsaved();
        }
    }

    markAsSaved() {
        // Now handled by rich text editor
        if (window.richTextEditor) {
            window.richTextEditor.markAsSaved();
        }
    }

    switchView(view) {
        // Update active nav item
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
        });
        document.getElementById(`${view}-btn`).classList.add('active');

        // Load notes based on view
        const filters = {};
        if (view === 'favorites') {
            filters.isFavorite = true;
        } else if (view === 'archived') {
            filters.isArchived = true;
        } else {
            filters.isArchived = false;
        }

        this.loadNotesWithFilters(filters);
    }

    async loadNotesWithFilters(filters) {
        const result = await window.notes.getUserNotes(filters);
        if (result.success) {
            this.renderNotesList(result.notes);
        }
    }

    async handleSearch(query) {
        if (!query.trim()) {
            this.loadNotesList();
            return;
        }

        try {
            const result = await window.search.search(query);
            if (result.success) {
                this.renderNotesList(result.results);
                this.updateViewTitle(`Search: "${query}" (${result.results.length} results)`);
            } else {
                console.error('Search failed:', result.error);
            }
        } catch (error) {
            console.error('Search error:', error);
        }
    }

    updateViewTitle(title) {
        const titleEl = document.getElementById('current-view-title');
        if (titleEl) {
            titleEl.textContent = title;
        }
    }

    // Notebook management methods
    async createNewNotebook() {
        const name = prompt('Enter notebook name:');
        if (!name || name.trim() === '') return;

        const result = await window.notebooks.createNotebook({
            name: name.trim()
        });

        if (result.success) {
            this.loadNotebooksList();
            if (window.noteNestApp) {
                window.noteNestApp.showNotification('Notebook created successfully', 'success', 2000);
            }
        } else {
            if (window.noteNestApp) {
                window.noteNestApp.showNotification(result.error, 'error');
            }
        }
    }

    async switchToNotebook(notebookId) {
        const notebookResult = await window.notebooks.getNotebook(notebookId);
        if (!notebookResult.success) return;

        const notebook = notebookResult.notebook;
        window.notebooks.setCurrentNotebook(notebook);

        // Update view title
        document.getElementById('current-view-title').textContent = notebook.name;

        // Update active nav items
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
        });

        document.querySelectorAll('.notebook-item').forEach(item => {
            item.classList.remove('active');
        });

        document.querySelector(`[data-notebook-id="${notebookId}"]`)?.classList.add('active');

        // Load notes for this notebook
        const notesResult = await window.notebooks.getNotebookNotes(notebookId);
        if (notesResult.success) {
            this.renderNotesList(notesResult.notes);
        }
    }

    // Tag management methods
    renderNoteTags(tags) {
        const tagsDisplay = document.getElementById('note-tags-display');
        if (!tagsDisplay) return;

        if (tags.length === 0) {
            tagsDisplay.innerHTML = '<span class="no-tags">No tags</span>';
            return;
        }

        tagsDisplay.innerHTML = tags.map(tag => `
            <span class="tag-item">
                ${tag}
                <button class="tag-remove" data-tag="${tag}">×</button>
            </span>
        `).join('');

        // Add click listeners to remove buttons
        tagsDisplay.querySelectorAll('.tag-remove').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const tag = btn.dataset.tag;
                this.removeTag(tag);
            });
        });
    }

    addTagsFromInput() {
        const tagsInput = document.getElementById('note-tags');
        if (!tagsInput || !tagsInput.value.trim()) return;

        const newTags = tagsInput.value
            .split(',')
            .map(tag => tag.trim())
            .filter(tag => tag.length > 0);

        if (newTags.length > 0) {
            this.addTags(newTags);
            tagsInput.value = '';
        }
    }

    addTags(newTags) {
        if (!this.currentNote) return;

        const currentTags = this.currentNote.tags || [];
        const uniqueNewTags = newTags.filter(tag =>
            !currentTags.includes(tag)
        );

        if (uniqueNewTags.length > 0) {
            const updatedTags = [...currentTags, ...uniqueNewTags];
            this.updateNoteTags(updatedTags);
        }
    }

    removeTag(tagToRemove) {
        if (!this.currentNote) return;

        const currentTags = this.currentNote.tags || [];
        const updatedTags = currentTags.filter(tag => tag !== tagToRemove);
        this.updateNoteTags(updatedTags);
    }

    async updateNoteTags(tags) {
        if (!this.currentNote) return;

        this.currentNote.tags = tags;
        this.renderNoteTags(tags);
        this.markAsUnsaved();

        // Auto-save tags
        try {
            const result = await window.notes.updateNote(this.currentNote.id, {
                tags: tags
            });

            if (result.success) {
                this.currentNote = result.note;
                this.markAsSaved();
            }
        } catch (error) {
            console.error('Failed to save tags:', error);
        }
    }

    // Export functionality methods
    toggleExportMenu() {
        const exportMenu = document.getElementById('export-menu');
        if (exportMenu) {
            exportMenu.classList.toggle('hidden');
        }
    }

    async exportCurrentNote(format) {
        if (!this.currentNote) {
            if (window.noteNestApp) {
                window.noteNestApp.showNotification('No note selected', 'error');
            }
            return;
        }

        try {
            // Save current changes first
            await this.saveCurrentNote();

            const result = await window.exportManager.exportNote(this.currentNote.id, format);

            if (result.success) {
                if (window.noteNestApp) {
                    window.noteNestApp.showNotification(result.message, 'success', 3000);
                }
            } else {
                if (window.noteNestApp) {
                    window.noteNestApp.showNotification(result.error, 'error');
                }
            }

        } catch (error) {
            console.error('Export error:', error);
            if (window.noteNestApp) {
                window.noteNestApp.showNotification('Export failed', 'error');
            }
        }

        // Hide export menu
        const exportMenu = document.getElementById('export-menu');
        if (exportMenu) {
            exportMenu.classList.add('hidden');
        }
    }

    async emailCurrentNote() {
        if (!this.currentNote) {
            if (window.noteNestApp) {
                window.noteNestApp.showNotification('No note selected', 'error');
            }
            return;
        }

        try {
            // Save current changes first
            await this.saveCurrentNote();

            const result = await window.exportManager.prepareEmailExport(this.currentNote.id, {
                format: 'html'
            });

            if (result.success) {
                window.exportManager.openEmailClient(result.emailData);
                if (window.noteNestApp) {
                    window.noteNestApp.showNotification('Email client opened', 'success', 2000);
                }
            } else {
                if (window.noteNestApp) {
                    window.noteNestApp.showNotification(result.error, 'error');
                }
            }

        } catch (error) {
            console.error('Email export error:', error);
            if (window.noteNestApp) {
                window.noteNestApp.showNotification('Email export failed', 'error');
            }
        }

        // Hide export menu
        const exportMenu = document.getElementById('export-menu');
        if (exportMenu) {
            exportMenu.classList.add('hidden');
        }
    }

    async deleteCurrentNote() {
        if (!this.currentNote) return;

        const confirmed = confirm(`Are you sure you want to delete "${this.currentNote.title}"?`);
        if (!confirmed) return;

        try {
            const result = await window.notes.deleteNote(this.currentNote.id);

            if (result.success) {
                // Hide editor and show welcome screen
                const welcomeScreen = document.getElementById('welcome-screen');
                const noteEditor = document.getElementById('note-editor');

                noteEditor.classList.add('hidden');
                welcomeScreen.classList.remove('hidden');

                this.currentNote = null;
                this.loadNotesList();
                this.loadNotebooksList();

                if (window.noteNestApp) {
                    window.noteNestApp.showNotification('Note deleted successfully', 'success', 2000);
                }
            } else {
                if (window.noteNestApp) {
                    window.noteNestApp.showNotification(result.error, 'error');
                }
            }

        } catch (error) {
            console.error('Delete error:', error);
            if (window.noteNestApp) {
                window.noteNestApp.showNotification('Failed to delete note', 'error');
            }
        }
    }

    // Theme management methods
    initializeThemeSelector() {
        if (!window.themeManager) return;

        this.populateThemeOptions();
        this.updateThemeToggleIcon();

        // Listen for theme changes
        window.addEventListener('themeChanged', (e) => {
            this.updateThemeToggleIcon();
            this.updateActiveThemeOption();
        });
    }

    populateThemeOptions() {
        const themeOptions = document.getElementById('theme-options');
        if (!themeOptions || !window.themeManager) return;

        const themes = window.themeManager.getAvailableThemes();

        themeOptions.innerHTML = themes.map(theme => `
            <button class="theme-option" data-theme="${theme.id}">
                <span class="theme-icon">${theme.icon}</span>
                <span class="theme-name">${theme.name}</span>
            </button>
        `).join('');

        // Add click listeners
        themeOptions.addEventListener('click', (e) => {
            const themeBtn = e.target.closest('.theme-option');
            if (themeBtn) {
                const themeId = themeBtn.dataset.theme;
                window.themeManager.setTheme(themeId);
                this.hideThemeMenu();
            }
        });

        this.updateActiveThemeOption();
    }

    updateActiveThemeOption() {
        if (!window.themeManager) return;

        const currentTheme = window.themeManager.getCurrentTheme();
        const themeOptions = document.querySelectorAll('.theme-option');

        themeOptions.forEach(option => {
            option.classList.toggle('active', option.dataset.theme === currentTheme);
        });
    }

    updateThemeToggleIcon() {
        if (!window.themeManager) return;

        const toggleBtn = document.getElementById('theme-toggle-btn');
        if (!toggleBtn) return;

        const currentTheme = window.themeManager.getCurrentTheme();
        const themeInfo = window.themeManager.getThemeInfo(currentTheme);

        if (themeInfo) {
            toggleBtn.textContent = themeInfo.icon;
            toggleBtn.title = `Current theme: ${themeInfo.name}`;
        }
    }

    toggleThemeMenu() {
        const themeMenu = document.getElementById('theme-menu');
        if (themeMenu) {
            themeMenu.classList.toggle('hidden');
        }
    }

    hideThemeMenu() {
        const themeMenu = document.getElementById('theme-menu');
        if (themeMenu) {
            themeMenu.classList.add('hidden');
        }
    }

    // AI functionality methods
    async generateAISummary() {
        if (!this.currentNote) {
            this.showNotification('No note selected', 'error');
            return;
        }

        if (!window.aiManager.isAvailable()) {
            this.showAIConfigDialog();
            return;
        }

        try {
            await this.saveCurrentNote(); // Save before processing

            this.showNotification('Generating AI summary...', 'info');

            const result = await window.aiManager.summarizeNote(this.currentNote.id, {
                style: 'concise',
                maxLength: 150
            });

            if (result.success) {
                this.displayAISummary(result.summary, result.metadata);
                window.aiManager.updateUsageStats('summary', result.metadata.tokensUsed);
                this.showNotification('AI summary generated successfully', 'success', 3000);
            } else {
                this.showNotification(`AI Error: ${result.error}`, 'error');
            }

        } catch (error) {
            console.error('AI summary error:', error);
            this.showNotification('Failed to generate summary', 'error');
        }
    }

    async improveNoteWithAI() {
        if (!this.currentNote) {
            this.showNotification('No note selected', 'error');
            return;
        }

        if (!window.aiManager.isAvailable()) {
            this.showAIConfigDialog();
            return;
        }

        try {
            await this.saveCurrentNote();

            this.showNotification('Improving note with AI...', 'info');

            const result = await window.aiManager.improveNote(this.currentNote.id, {
                focusAreas: ['clarity', 'grammar', 'structure'],
                preserveStyle: true
            });

            if (result.success) {
                // Show improvement in a modal or replace content
                const useImprovement = confirm(
                    'AI has suggested improvements to your note. Would you like to apply them?\n\n' +
                    'Original length: ' + result.originalContent.length + ' characters\n' +
                    'Improved length: ' + result.improvedContent.length + ' characters'
                );

                if (useImprovement && window.richTextEditor) {
                    window.richTextEditor.loadContent(result.improvedContent, 'html');
                    window.aiManager.updateUsageStats('improve', result.metadata.tokensUsed);
                    this.showNotification('Note improved with AI', 'success', 3000);
                }
            } else {
                this.showNotification(`AI Error: ${result.error}`, 'error');
            }

        } catch (error) {
            console.error('AI improve error:', error);
            this.showNotification('Failed to improve note', 'error');
        }
    }

    async generateAITags() {
        if (!this.currentNote) {
            this.showNotification('No note selected', 'error');
            return;
        }

        if (!window.aiManager.isAvailable()) {
            this.showAIConfigDialog();
            return;
        }

        try {
            await this.saveCurrentNote();

            this.showNotification('Generating AI tags...', 'info');

            const result = await window.aiManager.generateTags(this.currentNote.id);

            if (result.success) {
                this.addTags(result.tags);
                window.aiManager.updateUsageStats('tags', result.metadata.tokensUsed);
                this.showNotification(`Generated ${result.tags.length} AI tags`, 'success', 3000);
            } else {
                this.showNotification(`AI Error: ${result.error}`, 'error');
            }

        } catch (error) {
            console.error('AI tags error:', error);
            this.showNotification('Failed to generate tags', 'error');
        }
    }

    displayAISummary(summary, metadata) {
        const summaryDisplay = document.getElementById('ai-summary-display');
        if (!summaryDisplay) return;

        summaryDisplay.innerHTML = `
            <div class="ai-summary-content">
                <div class="ai-summary-header">
                    <strong>AI Summary</strong>
                    <span class="ai-metadata">${metadata.model} • ${metadata.compressionRatio}% compression</span>
                </div>
                <div class="ai-summary-text">${summary}</div>
            </div>
        `;

        summaryDisplay.classList.remove('hidden');
    }

    showAIConfigDialog() {
        const apiKey = prompt(
            'OpenAI API Key required for AI features.\n\n' +
            'Please enter your OpenAI API key:\n' +
            '(Get one at https://platform.openai.com/api-keys)'
        );

        if (apiKey && apiKey.trim()) {
            window.aiManager.configure(apiKey.trim());
            this.showNotification('AI configured successfully', 'success', 2000);
        }
    }

    // OCR/Attachment functionality methods
    async handleAttachmentUpload(files) {
        if (!files || files.length === 0) return;

        if (!this.currentNote) {
            this.showNotification('Please create or select a note first', 'error');
            return;
        }

        for (const file of files) {
            await this.processAttachment(file);
        }

        // Clear the input
        document.getElementById('attachment-input').value = '';
    }

    async processAttachment(file) {
        try {
            this.showNotification(`Processing ${file.name} with OCR...`, 'info');

            const result = await window.ocrManager.createAttachmentWithOCR(file, this.currentNote.id);

            if (result.success) {
                this.displayAttachment(result.attachment);

                if (result.ocrResult.text.trim()) {
                    // Show option to append OCR text to note
                    const addToNote = confirm(
                        `OCR extracted text from ${file.name}:\n\n` +
                        `"${result.ocrResult.text.substring(0, 200)}..."\n\n` +
                        `Confidence: ${result.ocrResult.confidence}%\n\n` +
                        'Would you like to add this text to your note?'
                    );

                    if (addToNote && window.richTextEditor) {
                        const currentContent = window.richTextEditor.getContent('html');
                        const newContent = currentContent +
                            `<hr><p><strong>From ${file.name}:</strong></p><p>${result.ocrResult.text}</p>`;
                        window.richTextEditor.loadContent(newContent, 'html');
                    }
                }

                this.showNotification(`${file.name} processed successfully`, 'success', 3000);
            } else {
                this.showNotification(`OCR Error: ${result.error}`, 'error');
            }

        } catch (error) {
            console.error('Attachment processing error:', error);
            this.showNotification(`Failed to process ${file.name}`, 'error');
        }
    }

    displayAttachment(attachment) {
        const attachmentsList = document.getElementById('attachments-list');
        if (!attachmentsList) return;

        const attachmentEl = document.createElement('div');
        attachmentEl.className = 'attachment-item';
        attachmentEl.innerHTML = `
            <div class="attachment-content">
                <img src="${attachment.data}" alt="${attachment.fileName}" class="attachment-preview">
                <div class="attachment-info">
                    <div class="attachment-name">${attachment.fileName}</div>
                    <div class="attachment-details">
                        ${(attachment.fileSize / 1024).toFixed(1)}KB •
                        Confidence: ${attachment.ocrConfidence}%
                    </div>
                    <div class="attachment-ocr-preview">
                        "${attachment.ocrText.substring(0, 100)}..."
                    </div>
                </div>
                <button class="attachment-remove" data-attachment-id="${attachment.id}">×</button>
            </div>
        `;

        attachmentsList.appendChild(attachmentEl);

        // Add remove functionality
        attachmentEl.querySelector('.attachment-remove').addEventListener('click', () => {
            this.removeAttachment(attachment.id, attachmentEl);
        });
    }

    async removeAttachment(attachmentId, element) {
        try {
            await window.storage.delete('attachments', attachmentId);
            element.remove();
            this.showNotification('Attachment removed', 'success', 2000);
        } catch (error) {
            console.error('Remove attachment error:', error);
            this.showNotification('Failed to remove attachment', 'error');
        }
    }

    async loadNoteAttachments(noteId) {
        const result = await window.ocrManager.getNoteAttachments(noteId);
        if (result.success && result.attachments.length > 0) {
            const attachmentsList = document.getElementById('attachments-list');
            if (attachmentsList) {
                attachmentsList.innerHTML = '';
                result.attachments.forEach(attachment => {
                    this.displayAttachment(attachment);
                });
            }
        }
    }

    showNotification(message, type = 'info', duration = 5000) {
        if (window.noteNestApp) {
            window.noteNestApp.showNotification(message, type, duration);
        } else {
            console.log(`${type.toUpperCase()}: ${message}`);
        }
    }

    // Import functionality methods
    toggleImportMenu() {
        const importMenu = document.getElementById('import-menu');
        if (importMenu) {
            importMenu.classList.toggle('hidden');
        }
    }

    showFileImportDialog() {
        const importMenu = document.getElementById('import-menu');
        if (importMenu) {
            importMenu.classList.add('hidden');
        }

        const fileInput = document.getElementById('import-file-input');
        if (fileInput) {
            fileInput.click();
        }
    }

    showUrlImportDialog() {
        const importMenu = document.getElementById('import-menu');
        if (importMenu) {
            importMenu.classList.add('hidden');
        }

        const modal = document.getElementById('url-import-modal');
        if (modal) {
            modal.classList.remove('hidden');
            const urlInput = document.getElementById('import-url-input');
            if (urlInput) {
                urlInput.focus();
            }
        }
    }

    hideUrlImportDialog() {
        const modal = document.getElementById('url-import-modal');
        if (modal) {
            modal.classList.add('hidden');
            const urlInput = document.getElementById('import-url-input');
            if (urlInput) {
                urlInput.value = '';
            }
        }
    }

    async handleFileImport(files) {
        if (!files || files.length === 0) return;

        try {
            this.showNotification('Importing files...', 'info');

            const result = await window.importManager.importFiles(files);

            if (result.success) {
                const message = `Successfully imported ${result.summary.successful} of ${result.summary.total} files`;
                this.showNotification(message, 'success');

                // Refresh notes list
                await this.loadNotesList();

                // Show errors if any
                if (result.errors.length > 0) {
                    console.warn('Import errors:', result.errors);
                }
            } else {
                this.showNotification('Failed to import files', 'error');
            }

            // Reset file input
            const fileInput = document.getElementById('import-file-input');
            if (fileInput) {
                fileInput.value = '';
            }

        } catch (error) {
            console.error('Import error:', error);
            this.showNotification('Import failed: ' + error.message, 'error');
        }
    }

    async handleUrlImport() {
        const urlInput = document.getElementById('import-url-input');
        if (!urlInput) return;

        const url = urlInput.value.trim();
        if (!url) {
            this.showNotification('Please enter a URL', 'error');
            return;
        }

        try {
            this.showNotification('Importing from URL...', 'info');

            const result = await window.importManager.importFromURL(url);

            if (result.success) {
                this.showNotification('Successfully imported from URL', 'success');

                // Refresh notes list
                await this.loadNotesList();

                // Close modal
                this.hideUrlImportDialog();
            } else {
                this.showNotification('Failed to import from URL: ' + result.error, 'error');
            }

        } catch (error) {
            console.error('URL import error:', error);
            this.showNotification('Import failed: ' + error.message, 'error');
        }
    }

    // Setup global event listeners
    setupEventListeners() {
        // Close dropdowns when clicking outside
        document.addEventListener('click', (e) => {
            const userMenu = document.getElementById('user-menu-dropdown');
            const userMenuBtn = document.getElementById('user-menu-btn');
            const exportMenu = document.getElementById('export-menu');
            const exportBtn = document.getElementById('export-btn');
            const themeMenu = document.getElementById('theme-menu');
            const themeBtn = document.getElementById('theme-toggle-btn');

            if (userMenu && !userMenu.contains(e.target) && !userMenuBtn?.contains(e.target)) {
                userMenu.classList.add('hidden');
            }

            if (exportMenu && !exportMenu.contains(e.target) && !exportBtn?.contains(e.target)) {
                exportMenu.classList.add('hidden');
            }

            if (themeMenu && !themeMenu.contains(e.target) && !themeBtn?.contains(e.target)) {
                themeMenu.classList.add('hidden');
            }
        });

        // Session expired handler
        window.addEventListener('sessionExpired', () => {
            alert('Your session has expired. Please log in again.');
            this.renderApp();
        });
    }
}

// Global UI instance
window.ui = new UIComponents();