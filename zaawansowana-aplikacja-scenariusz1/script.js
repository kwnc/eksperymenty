class NoteNest {
    constructor() {
        this.currentUser = null;
        this.currentNote = null;
        this.currentNotebook = 'all';
        this.notes = [];
        this.notebooks = [];
        this.tags = [];

        this.init();
    }

    init() {
        this.loadFromStorage();
        this.setupEventListeners();
        this.checkAuthState();
    }

    loadFromStorage() {
        this.currentUser = JSON.parse(localStorage.getItem('noteNest_currentUser'));
        this.notes = JSON.parse(localStorage.getItem('noteNest_notes')) || [];
        this.notebooks = JSON.parse(localStorage.getItem('noteNest_notebooks')) || [];
        this.tags = JSON.parse(localStorage.getItem('noteNest_tags')) || [];
    }

    saveToStorage() {
        localStorage.setItem('noteNest_currentUser', JSON.stringify(this.currentUser));
        localStorage.setItem('noteNest_notes', JSON.stringify(this.notes));
        localStorage.setItem('noteNest_notebooks', JSON.stringify(this.notebooks));
        localStorage.setItem('noteNest_tags', JSON.stringify(this.tags));
    }

    setupEventListeners() {
        // Authentication
        document.getElementById('loginFormEl').addEventListener('submit', (e) => this.handleLogin(e));
        document.getElementById('registerFormEl').addEventListener('submit', (e) => this.handleRegister(e));
        document.getElementById('showRegister').addEventListener('click', () => this.showRegisterForm());
        document.getElementById('showLogin').addEventListener('click', () => this.showLoginForm());
        document.getElementById('logoutBtn').addEventListener('click', () => this.logout());

        // Modal controls
        document.querySelectorAll('.close').forEach(btn => {
            btn.addEventListener('click', (e) => this.closeModal(e.target.closest('.modal')));
        });

        // Main app functionality
        document.getElementById('newNoteBtn').addEventListener('click', () => this.createNewNote());
        document.getElementById('newNotebookBtn').addEventListener('click', () => this.showNotebookModal());
        document.getElementById('notebookForm').addEventListener('submit', (e) => this.handleCreateNotebook(e));
        document.getElementById('cancelNotebook').addEventListener('click', () => this.closeModal(document.getElementById('notebookModal')));

        // Note editor
        document.getElementById('saveNoteBtn').addEventListener('click', () => this.saveCurrentNote());
        document.getElementById('deleteNoteBtn').addEventListener('click', () => this.deleteCurrentNote());
        document.getElementById('exportBtn').addEventListener('click', () => this.showExportModal());
        document.getElementById('shareBtn').addEventListener('click', () => this.shareNote());

        // Rich text editor toolbar
        document.querySelectorAll('.toolbar-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.handleToolbarAction(e));
        });

        // Search
        document.getElementById('searchInput').addEventListener('input', (e) => this.handleSearch(e.target.value));

        // User menu
        document.getElementById('userMenuBtn').addEventListener('click', () => this.toggleUserMenu());

        // Note title and content
        document.getElementById('noteTitle').addEventListener('input', () => this.updateNoteContent());
        document.getElementById('richTextEditor').addEventListener('input', () => this.updateNoteContent());
        document.getElementById('noteTags').addEventListener('input', () => this.updateNoteTags());
        document.getElementById('noteNotebook').addEventListener('change', () => this.updateNoteNotebook());

        // Export options
        document.querySelectorAll('.export-option').forEach(btn => {
            btn.addEventListener('click', (e) => this.exportNote(e.target.closest('.export-option').dataset.format));
        });

        // Auto-save
        setInterval(() => {
            if (this.currentNote && this.hasUnsavedChanges) {
                this.saveCurrentNote();
            }
        }, 30000); // Auto-save every 30 seconds
    }

    checkAuthState() {
        if (this.currentUser) {
            this.showApp();
        } else {
            this.showAuthModal();
        }
    }

    showAuthModal() {
        document.getElementById('authModal').style.display = 'block';
        document.getElementById('app').classList.add('hidden');
    }

    showRegisterForm() {
        document.getElementById('loginForm').classList.add('hidden');
        document.getElementById('registerForm').classList.remove('hidden');
    }

    showLoginForm() {
        document.getElementById('registerForm').classList.add('hidden');
        document.getElementById('loginForm').classList.remove('hidden');
    }

    handleLogin(e) {
        e.preventDefault();
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;

        // Simple authentication (in real app, this would be server-side)
        const users = JSON.parse(localStorage.getItem('noteNest_users')) || [];
        const user = users.find(u => u.email === email && u.password === password);

        if (user) {
            this.currentUser = user;
            this.saveToStorage();
            this.showApp();
            this.closeModal(document.getElementById('authModal'));
        } else {
            alert('Invalid email or password');
        }
    }

    handleRegister(e) {
        e.preventDefault();
        const name = document.getElementById('registerName').value;
        const email = document.getElementById('registerEmail').value;
        const password = document.getElementById('registerPassword').value;
        const confirmPassword = document.getElementById('confirmPassword').value;

        if (password !== confirmPassword) {
            alert('Passwords do not match');
            return;
        }

        // Check if user already exists
        const users = JSON.parse(localStorage.getItem('noteNest_users')) || [];
        if (users.find(u => u.email === email)) {
            alert('User with this email already exists');
            return;
        }

        // Create new user
        const newUser = {
            id: Date.now().toString(),
            name,
            email,
            password, // In real app, this would be hashed
            createdAt: new Date().toISOString()
        };

        users.push(newUser);
        localStorage.setItem('noteNest_users', JSON.stringify(users));

        this.currentUser = newUser;
        this.saveToStorage();
        this.showApp();
        this.closeModal(document.getElementById('authModal'));
    }

    logout() {
        this.currentUser = null;
        this.currentNote = null;
        this.notes = [];
        this.notebooks = [];
        this.tags = [];
        localStorage.removeItem('noteNest_currentUser');
        this.showAuthModal();
    }

    showApp() {
        document.getElementById('app').classList.remove('hidden');
        document.getElementById('userName').textContent = this.currentUser.name;
        this.loadUserData();
        this.renderNotebooks();
        this.renderNotes();
        this.renderTags();
    }

    loadUserData() {
        // Load user-specific data
        const userKey = `noteNest_user_${this.currentUser.id}`;
        const userData = JSON.parse(localStorage.getItem(userKey)) || {};

        this.notes = userData.notes || [];
        this.notebooks = userData.notebooks || [
            { id: 'personal', name: 'Personal', description: 'Personal notes', createdAt: new Date().toISOString() },
            { id: 'work', name: 'Work', description: 'Work-related notes', createdAt: new Date().toISOString() }
        ];
        this.tags = userData.tags || [];
    }

    saveUserData() {
        const userKey = `noteNest_user_${this.currentUser.id}`;
        const userData = {
            notes: this.notes,
            notebooks: this.notebooks,
            tags: this.tags
        };
        localStorage.setItem(userKey, JSON.stringify(userData));
    }

    createNewNote() {
        const newNote = {
            id: Date.now().toString(),
            title: 'Untitled Note',
            content: '',
            notebook: this.currentNotebook === 'all' ? 'personal' : this.currentNotebook,
            tags: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            userId: this.currentUser.id
        };

        this.notes.unshift(newNote);
        this.currentNote = newNote;
        this.showNoteEditor();
        this.renderNotes();
        this.saveUserData();

        // Focus on title
        setTimeout(() => {
            document.getElementById('noteTitle').focus();
            document.getElementById('noteTitle').select();
        }, 100);
    }

    showNoteEditor() {
        document.getElementById('editorPlaceholder').classList.add('hidden');
        document.getElementById('noteEditor').classList.remove('hidden');

        if (this.currentNote) {
            document.getElementById('noteTitle').value = this.currentNote.title;
            document.getElementById('richTextEditor').innerHTML = this.currentNote.content;
            document.getElementById('noteTags').value = this.currentNote.tags.join(', ');

            // Populate notebook dropdown
            this.populateNotebookDropdown();
            document.getElementById('noteNotebook').value = this.currentNote.notebook;

            this.updateWordCount();
            this.updateLastSaved();
        }
    }

    populateNotebookDropdown() {
        const select = document.getElementById('noteNotebook');
        select.innerHTML = '<option value="">Select notebook...</option>';

        this.notebooks.forEach(notebook => {
            const option = document.createElement('option');
            option.value = notebook.id;
            option.textContent = notebook.name;
            select.appendChild(option);
        });
    }

    updateNoteContent() {
        if (!this.currentNote) return;

        this.currentNote.title = document.getElementById('noteTitle').value || 'Untitled Note';
        this.currentNote.content = document.getElementById('richTextEditor').innerHTML;
        this.currentNote.updatedAt = new Date().toISOString();
        this.hasUnsavedChanges = true;

        this.updateWordCount();
        this.renderNotes(); // Update the notes list to show new title
    }

    updateNoteTags() {
        if (!this.currentNote) return;

        const tagsInput = document.getElementById('noteTags').value;
        this.currentNote.tags = tagsInput.split(',').map(tag => tag.trim()).filter(tag => tag);
        this.updateTagsList();
        this.hasUnsavedChanges = true;
    }

    updateNoteNotebook() {
        if (!this.currentNote) return;

        this.currentNote.notebook = document.getElementById('noteNotebook').value;
        this.hasUnsavedChanges = true;
    }

    updateTagsList() {
        // Extract all unique tags from all notes
        const allTags = new Set();
        this.notes.forEach(note => {
            note.tags.forEach(tag => allTags.add(tag));
        });
        this.tags = Array.from(allTags);
        this.renderTags();
    }

    saveCurrentNote() {
        if (!this.currentNote) return;

        this.updateNoteContent();
        this.saveUserData();
        this.hasUnsavedChanges = false;
        this.updateLastSaved();

        // Show save feedback
        const saveBtn = document.getElementById('saveNoteBtn');
        const originalText = saveBtn.innerHTML;
        saveBtn.innerHTML = '<i class="fas fa-check"></i> Saved';
        setTimeout(() => {
            saveBtn.innerHTML = originalText;
        }, 1000);
    }

    deleteCurrentNote() {
        if (!this.currentNote) return;

        if (confirm('Are you sure you want to delete this note?')) {
            this.notes = this.notes.filter(note => note.id !== this.currentNote.id);
            this.currentNote = null;
            this.hideNoteEditor();
            this.renderNotes();
            this.saveUserData();
        }
    }

    hideNoteEditor() {
        document.getElementById('noteEditor').classList.add('hidden');
        document.getElementById('editorPlaceholder').classList.remove('hidden');
    }

    selectNote(noteId) {
        this.currentNote = this.notes.find(note => note.id === noteId);
        if (this.currentNote) {
            this.showNoteEditor();

            // Update active state in notes list
            document.querySelectorAll('.note-item').forEach(item => item.classList.remove('active'));
            document.querySelector(`[data-note-id="${noteId}"]`).classList.add('active');
        }
    }

    renderNotes() {
        const container = document.getElementById('notesList');
        const filteredNotes = this.getFilteredNotes();

        if (filteredNotes.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-sticky-note"></i>
                    <h3>No notes yet</h3>
                    <p>Create your first note to get started!</p>
                </div>
            `;
            return;
        }

        container.innerHTML = filteredNotes.map(note => `
            <div class="note-item ${note.id === this.currentNote?.id ? 'active' : ''}"
                 data-note-id="${note.id}" onclick="app.selectNote('${note.id}')">
                <h3>${this.escapeHtml(note.title)}</h3>
                <p>${this.getPlainTextPreview(note.content)}</p>
                <div class="note-meta">
                    <div class="note-tags">
                        ${note.tags.slice(0, 3).map(tag => `<span class="tag">${this.escapeHtml(tag)}</span>`).join('')}
                    </div>
                    <span>${this.formatDate(note.updatedAt)}</span>
                </div>
            </div>
        `).join('');
    }

    getFilteredNotes() {
        let filtered = this.notes;

        // Filter by notebook
        if (this.currentNotebook !== 'all') {
            filtered = filtered.filter(note => note.notebook === this.currentNotebook);
        }

        // Filter by search
        const searchTerm = document.getElementById('searchInput').value.toLowerCase();
        if (searchTerm) {
            filtered = filtered.filter(note =>
                note.title.toLowerCase().includes(searchTerm) ||
                note.content.toLowerCase().includes(searchTerm) ||
                note.tags.some(tag => tag.toLowerCase().includes(searchTerm))
            );
        }

        return filtered;
    }

    renderNotebooks() {
        const container = document.getElementById('notebooksList');

        // Add "All Notes" item
        const allNotesCount = this.notes.length;
        let html = `
            <li class="notebook-item ${this.currentNotebook === 'all' ? 'active' : ''}"
                data-notebook="all" onclick="app.selectNotebook('all')">
                <i class="fas fa-book"></i>
                <span>All Notes</span>
                <span class="note-count">${allNotesCount}</span>
            </li>
        `;

        // Add notebook items
        html += this.notebooks.map(notebook => {
            const noteCount = this.notes.filter(note => note.notebook === notebook.id).length;
            return `
                <li class="notebook-item ${this.currentNotebook === notebook.id ? 'active' : ''}"
                    data-notebook="${notebook.id}" onclick="app.selectNotebook('${notebook.id}')">
                    <i class="fas fa-folder"></i>
                    <span>${this.escapeHtml(notebook.name)}</span>
                    <span class="note-count">${noteCount}</span>
                </li>
            `;
        }).join('');

        container.innerHTML = html;
    }

    selectNotebook(notebookId) {
        this.currentNotebook = notebookId;
        this.renderNotebooks();
        this.renderNotes();

        // Update title
        const title = notebookId === 'all' ? 'All Notes' :
                     this.notebooks.find(nb => nb.id === notebookId)?.name || 'Notes';
        document.getElementById('notesPanelTitle').textContent = title;
    }

    renderTags() {
        const container = document.getElementById('tagsList');

        if (this.tags.length === 0) {
            container.innerHTML = '<li class="empty-state">No tags yet</li>';
            return;
        }

        container.innerHTML = this.tags.map(tag => {
            const tagCount = this.notes.filter(note => note.tags.includes(tag)).length;
            return `
                <li class="tag-item" onclick="app.searchByTag('${tag}')">
                    <i class="fas fa-tag"></i>
                    <span>${this.escapeHtml(tag)}</span>
                    <span class="tag-count">${tagCount}</span>
                </li>
            `;
        }).join('');
    }

    searchByTag(tag) {
        document.getElementById('searchInput').value = tag;
        this.handleSearch(tag);
    }

    handleSearch(searchTerm) {
        this.renderNotes();
    }

    showNotebookModal() {
        document.getElementById('notebookModal').style.display = 'block';
        document.getElementById('notebookName').focus();
    }

    handleCreateNotebook(e) {
        e.preventDefault();
        const name = document.getElementById('notebookName').value.trim();
        const description = document.getElementById('notebookDescription').value.trim();

        if (!name) return;

        const newNotebook = {
            id: Date.now().toString(),
            name,
            description,
            createdAt: new Date().toISOString()
        };

        this.notebooks.push(newNotebook);
        this.renderNotebooks();
        this.populateNotebookDropdown();
        this.saveUserData();
        this.closeModal(document.getElementById('notebookModal'));

        // Clear form
        document.getElementById('notebookForm').reset();
    }

    showExportModal() {
        if (!this.currentNote) return;
        document.getElementById('exportModal').style.display = 'block';
    }

    exportNote(format) {
        if (!this.currentNote) return;

        switch (format) {
            case 'pdf':
                this.exportToPDF();
                break;
            case 'markdown':
                this.exportToMarkdown();
                break;
            case 'html':
                this.exportToHTML();
                break;
        }

        this.closeModal(document.getElementById('exportModal'));
    }

    exportToPDF() {
        // Create a simple PDF export using print functionality
        const printWindow = window.open('', '_blank');
        printWindow.document.write(`
            <html>
                <head>
                    <title>${this.currentNote.title}</title>
                    <style>
                        body { font-family: Arial, sans-serif; margin: 40px; }
                        h1 { color: #E97900; border-bottom: 2px solid #E97900; padding-bottom: 10px; }
                        .meta { color: #666; font-size: 14px; margin-bottom: 20px; }
                    </style>
                </head>
                <body>
                    <h1>${this.escapeHtml(this.currentNote.title)}</h1>
                    <div class="meta">
                        Created: ${this.formatDate(this.currentNote.createdAt)} |
                        Updated: ${this.formatDate(this.currentNote.updatedAt)}
                        ${this.currentNote.tags.length ? ` | Tags: ${this.currentNote.tags.join(', ')}` : ''}
                    </div>
                    <div>${this.currentNote.content}</div>
                </body>
            </html>
        `);
        printWindow.document.close();
        printWindow.print();
    }

    exportToMarkdown() {
        const markdown = this.convertToMarkdown(this.currentNote);
        this.downloadFile(`${this.currentNote.title}.md`, markdown, 'text/markdown');
    }

    exportToHTML() {
        const html = `
<!DOCTYPE html>
<html>
<head>
    <title>${this.escapeHtml(this.currentNote.title)}</title>
    <meta charset="UTF-8">
    <style>
        body { font-family: Arial, sans-serif; max-width: 800px; margin: 40px auto; padding: 20px; }
        h1 { color: #E97900; border-bottom: 2px solid #E97900; padding-bottom: 10px; }
        .meta { color: #666; font-size: 14px; margin-bottom: 20px; }
    </style>
</head>
<body>
    <h1>${this.escapeHtml(this.currentNote.title)}</h1>
    <div class="meta">
        Created: ${this.formatDate(this.currentNote.createdAt)} |
        Updated: ${this.formatDate(this.currentNote.updatedAt)}
        ${this.currentNote.tags.length ? ` | Tags: ${this.currentNote.tags.join(', ')}` : ''}
    </div>
    <div>${this.currentNote.content}</div>
</body>
</html>
        `;
        this.downloadFile(`${this.currentNote.title}.html`, html, 'text/html');
    }

    convertToMarkdown(note) {
        let content = note.content;

        // Simple HTML to Markdown conversion
        content = content.replace(/<h1[^>]*>(.*?)<\/h1>/gi, '# $1\n\n');
        content = content.replace(/<h2[^>]*>(.*?)<\/h2>/gi, '## $1\n\n');
        content = content.replace(/<h3[^>]*>(.*?)<\/h3>/gi, '### $1\n\n');
        content = content.replace(/<strong[^>]*>(.*?)<\/strong>/gi, '**$1**');
        content = content.replace(/<b[^>]*>(.*?)<\/b>/gi, '**$1**');
        content = content.replace(/<em[^>]*>(.*?)<\/em>/gi, '*$1*');
        content = content.replace(/<i[^>]*>(.*?)<\/i>/gi, '*$1*');
        content = content.replace(/<ul[^>]*>(.*?)<\/ul>/gis, (match, content) => {
            return content.replace(/<li[^>]*>(.*?)<\/li>/gi, '- $1\n') + '\n';
        });
        content = content.replace(/<ol[^>]*>(.*?)<\/ol>/gis, (match, content) => {
            let counter = 1;
            return content.replace(/<li[^>]*>(.*?)<\/li>/gi, () => `${counter++}. $1\n`) + '\n';
        });
        content = content.replace(/<p[^>]*>(.*?)<\/p>/gi, '$1\n\n');
        content = content.replace(/<br[^>]*>/gi, '\n');
        content = content.replace(/<[^>]*>/g, ''); // Remove remaining HTML tags

        const frontMatter = `---
title: ${note.title}
created: ${note.createdAt}
updated: ${note.updatedAt}
tags: [${note.tags.join(', ')}]
notebook: ${this.notebooks.find(nb => nb.id === note.notebook)?.name || 'Unknown'}
---

`;

        return frontMatter + content;
    }

    downloadFile(filename, content, mimeType) {
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    shareNote() {
        if (!this.currentNote) return;

        if (navigator.share) {
            navigator.share({
                title: this.currentNote.title,
                text: this.getPlainTextPreview(this.currentNote.content),
                url: window.location.href
            });
        } else {
            // Fallback: copy to clipboard
            const text = `${this.currentNote.title}\n\n${this.getPlainTextPreview(this.currentNote.content)}`;
            navigator.clipboard.writeText(text).then(() => {
                alert('Note content copied to clipboard!');
            });
        }
    }

    handleToolbarAction(e) {
        e.preventDefault();
        const command = e.target.closest('.toolbar-btn').dataset.command;

        if (command === 'createLink') {
            const url = prompt('Enter URL:');
            if (url) {
                document.execCommand(command, false, url);
            }
        } else if (command === 'insertImage') {
            const url = prompt('Enter image URL:');
            if (url) {
                document.execCommand('insertImage', false, url);
            }
        } else {
            document.execCommand(command, false, null);
        }

        // Update button state
        this.updateToolbarState();
        this.updateNoteContent();
    }

    updateToolbarState() {
        document.querySelectorAll('.toolbar-btn').forEach(btn => {
            const command = btn.dataset.command;
            if (document.queryCommandState(command)) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
    }

    updateWordCount() {
        const content = document.getElementById('richTextEditor').textContent;
        const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;
        document.getElementById('wordCount').textContent = `${wordCount} words`;
    }

    updateLastSaved() {
        const now = new Date();
        document.getElementById('lastSaved').textContent = `Saved ${now.toLocaleTimeString()}`;
    }

    toggleUserMenu() {
        const dropdown = document.getElementById('userDropdown');
        dropdown.classList.toggle('hidden');
    }

    closeModal(modal) {
        modal.style.display = 'none';
    }

    // Utility functions
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    getPlainTextPreview(html) {
        const div = document.createElement('div');
        div.innerHTML = html;
        return div.textContent.substring(0, 100) + (div.textContent.length > 100 ? '...' : '');
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const diff = now - date;
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));

        if (days === 0) {
            return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        } else if (days === 1) {
            return 'Yesterday';
        } else if (days < 7) {
            return `${days} days ago`;
        } else {
            return date.toLocaleDateString();
        }
    }
}

// Initialize the app
const app = new NoteNest();

// Close modals when clicking outside
window.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal')) {
        app.closeModal(e.target);
    }
});

// Close user dropdown when clicking outside
document.addEventListener('click', (e) => {
    if (!e.target.closest('.user-menu')) {
        document.getElementById('userDropdown').classList.add('hidden');
    }
});

// Handle rich text editor focus for toolbar updates
document.getElementById('richTextEditor').addEventListener('focus', () => {
    app.updateToolbarState();
});

document.getElementById('richTextEditor').addEventListener('keyup', () => {
    app.updateToolbarState();
});

document.getElementById('richTextEditor').addEventListener('mouseup', () => {
    app.updateToolbarState();
});