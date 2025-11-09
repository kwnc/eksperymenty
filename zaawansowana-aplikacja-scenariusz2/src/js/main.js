/**
 * Main Application Entry Point
 * Initializes NoteNest and starts the application
 */

class NoteNestApp {
    constructor() {
        this.isInitialized = false;
    }

    async init() {
        try {
            // Show loading screen
            this.showLoading('Initializing NoteNest...');

            // Initialize storage
            await window.storage.init();
            console.log('Storage initialized');

            // Initialize authentication
            await window.auth.init();
            console.log('Authentication initialized');

            // Initialize theme manager
            window.themeManager.init();
            console.log('Theme manager initialized');

            // Initialize UI
            window.ui.init();
            console.log('UI initialized');

            // Initialize code highlighting
            if (window.codeHighlightManager) {
                await window.codeHighlightManager.init();
                console.log('Code highlighting initialized');
            }

            // Hide loading screen
            this.hideLoading();

            this.isInitialized = true;
            console.log('NoteNest application initialized successfully');

        } catch (error) {
            console.error('Failed to initialize NoteNest:', error);
            this.showError('Failed to initialize application. Please refresh and try again.');
        }
    }

    showLoading(message = 'Loading...') {
        const loadingEl = document.getElementById('loading');
        if (loadingEl) {
            loadingEl.innerHTML = `
                <div class="loading-container">
                    <div class="loading-spinner"></div>
                    <span>${message}</span>
                </div>
            `;
            loadingEl.style.display = 'flex';
        }
    }

    hideLoading() {
        const loadingEl = document.getElementById('loading');
        if (loadingEl) {
            loadingEl.style.display = 'none';
        }
    }

    showError(message) {
        const app = document.getElementById('app');
        app.innerHTML = `
            <div class="error-container">
                <div class="error-card card">
                    <h2 class="text-primary">Application Error</h2>
                    <p class="text-secondary">${message}</p>
                    <button onclick="location.reload()" class="btn-primary">Reload Application</button>
                </div>
            </div>
        `;
    }

    // Handle application errors
    handleError(error, context = 'Unknown') {
        console.error(`Error in ${context}:`, error);

        // Show user-friendly error message
        this.showNotification('An error occurred. Please try again.', 'error');
    }

    showNotification(message, type = 'info', duration = 5000) {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <span>${message}</span>
                <button class="notification-close">&times;</button>
            </div>
        `;

        // Add to page
        document.body.appendChild(notification);

        // Auto-remove after duration
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, duration);

        // Close button handler
        notification.querySelector('.notification-close').addEventListener('click', () => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        });
    }

    // Check if browser supports required features
    checkBrowserSupport() {
        const required = [
            'localStorage',
            'JSON',
            'Promise',
            'fetch'
        ];

        const missing = required.filter(feature => !(feature in window));

        if (missing.length > 0) {
            this.showError(`Your browser doesn't support required features: ${missing.join(', ')}. Please use a modern browser.`);
            return false;
        }

        return true;
    }

    // Application lifecycle methods
    onBeforeUnload() {
        // Auto-save current note if editing
        if (window.ui && window.ui.currentNote) {
            window.ui.saveCurrentNote();
        }
    }

    onVisibilityChange() {
        if (document.hidden) {
            // Page became hidden - pause auto-save timers
            if (window.notes) {
                window.notes.stopAutoSave();
            }
        } else {
            // Page became visible - resume auto-save if editing
            if (window.ui && window.ui.currentNote && window.notes) {
                window.notes.startAutoSave(window.ui.currentNote.id);
            }
        }
    }

    // Set up global event listeners
    setupGlobalListeners() {
        // Handle page unload
        window.addEventListener('beforeunload', (e) => {
            this.onBeforeUnload();
        });

        // Handle visibility changes
        document.addEventListener('visibilitychange', () => {
            this.onVisibilityChange();
        });

        // Global error handler
        window.addEventListener('error', (e) => {
            this.handleError(e.error, 'Global');
        });

        // Unhandled promise rejection handler
        window.addEventListener('unhandledrejection', (e) => {
            this.handleError(e.reason, 'Promise');
            e.preventDefault();
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            this.handleKeyboardShortcuts(e);
        });
    }

    handleKeyboardShortcuts(e) {
        // Only handle shortcuts when authenticated
        if (!window.auth?.isAuthenticated()) return;

        // Ctrl/Cmd + N - New note
        if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
            e.preventDefault();
            if (window.ui) {
                window.ui.createNewNote();
            }
        }

        // Ctrl/Cmd + S - Save note
        if ((e.ctrlKey || e.metaKey) && e.key === 's') {
            e.preventDefault();
            if (window.ui) {
                window.ui.saveCurrentNote();
            }
        }

        // Ctrl/Cmd + F - Focus search
        if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
            e.preventDefault();
            const searchInput = document.getElementById('search-input');
            if (searchInput) {
                searchInput.focus();
            }
        }
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', async () => {
    const app = new NoteNestApp();

    // Check browser support
    if (!app.checkBrowserSupport()) {
        return;
    }

    // Set up global listeners
    app.setupGlobalListeners();

    // Initialize the application
    await app.init();

    // Make app instance globally available for debugging
    window.noteNestApp = app;
});

// Service Worker registration (for future PWA support)
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        // Service worker registration can be added here later
        console.log('Service Worker support detected');
    });
}