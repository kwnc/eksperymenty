/**
 * App Module - Main application controller for NoteNest
 *
 * Coordinates between Storage and UI modules, handles application lifecycle,
 * provides high-level API methods, and manages cross-tab synchronization.
 *
 * @module App
 * @version 1.0.0
 */
const App = {
    version: '1.0.0',

    init() {
        console.log(`NoteNest v${this.version} - Local Note Taking Application`);
        console.log('✓ Storage module loaded');
        console.log('✓ UI module loaded');
        console.log('✓ Application initialized successfully');

        this.setupEventListeners();
        this.loadInitialData();
    },

    setupEventListeners() {
        window.addEventListener('storage', (e) => {
            if (e.key === Storage.NOTES_KEY || e.key === Storage.TAGS_KEY) {
                this.handleStorageChange();
            }
        });

        window.addEventListener('beforeunload', () => {
            this.cleanup();
        });

        window.addEventListener('error', (e) => {
            console.error('Application error:', e.error);
            UI.showToast('An error occurred. Please refresh the page.', 'error');
        });
    },

    loadInitialData() {
        try {
            const notes = Storage.loadNotes();
            const tags = Storage.loadTags();

            console.log(`Loaded ${notes.length} notes and ${tags.length} tags from storage`);

            if (notes.length === 0) {
                this.showWelcomeMessage();
            }
        } catch (error) {
            console.error('Error loading initial data:', error);
            UI.showToast('Error loading data from storage', 'error');
        }
    },

    handleStorageChange() {
        console.log('Storage changed externally, refreshing UI...');
        UI.renderNotes();
        UI.updateTagFilters();
        UI.updateNoteCount();
    },

    showWelcomeMessage() {
        console.log('Welcome to NoteNest! Create your first note to get started.');
    },

    createNote(title, content, tags = []) {
        try {
            const note = Storage.saveNote({ title, content, tags });
            UI.renderNotes();
            UI.updateTagFilters();
            UI.showToast('Note created successfully!', 'success');
            return note;
        } catch (error) {
            console.error('Error creating note:', error);
            UI.showToast('Error creating note', 'error');
            throw error;
        }
    },

    updateNote(id, title, content, tags = []) {
        try {
            const note = Storage.updateNote(id, { title, content, tags });
            UI.renderNotes();
            UI.updateTagFilters();
            UI.showToast('Note updated successfully!', 'success');
            return note;
        } catch (error) {
            console.error('Error updating note:', error);
            UI.showToast('Error updating note', 'error');
            throw error;
        }
    },

    deleteNote(id) {
        try {
            Storage.deleteNote(id);
            UI.renderNotes();
            UI.updateTagFilters();
            UI.showToast('Note deleted successfully!', 'success');
        } catch (error) {
            console.error('Error deleting note:', error);
            UI.showToast('Error deleting note', 'error');
        }
    },

    searchNotes(query) {
        try {
            const results = Storage.searchNotes(query);
            UI.renderNotes(results);
            return results;
        } catch (error) {
            console.error('Error searching notes:', error);
            UI.showToast('Error searching notes', 'error');
            return [];
        }
    },

    filterByTags(tags) {
        try {
            const results = Storage.filterNotesByTags(tags);
            UI.renderNotes(results);
            return results;
        } catch (error) {
            console.error('Error filtering notes:', error);
            UI.showToast('Error filtering notes', 'error');
            return [];
        }
    },

    exportData() {
        try {
            const notes = Storage.loadNotes();
            const tags = Storage.loadTags();
            const exportData = {
                notes,
                tags,
                exportDate: new Date().toISOString(),
                version: this.version
            };

            const blob = new Blob([JSON.stringify(exportData, null, 2)], {
                type: 'application/json'
            });

            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `notenest-backup-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            UI.showToast('Data exported successfully!', 'success');
        } catch (error) {
            console.error('Error exporting data:', error);
            UI.showToast('Error exporting data', 'error');
        }
    },

    importData(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();

            reader.onload = (e) => {
                try {
                    const data = JSON.parse(e.target.result);

                    if (!data.notes || !Array.isArray(data.notes)) {
                        throw new Error('Invalid backup file format');
                    }

                    data.notes.forEach(note => {
                        Storage.saveNote(note);
                    });

                    UI.renderNotes();
                    UI.updateTagFilters();
                    UI.showToast(`Imported ${data.notes.length} notes successfully!`, 'success');
                    resolve(data);
                } catch (error) {
                    console.error('Error importing data:', error);
                    UI.showToast('Error importing data: ' + error.message, 'error');
                    reject(error);
                }
            };

            reader.onerror = () => {
                const error = new Error('Error reading file');
                console.error('File read error:', error);
                UI.showToast('Error reading file', 'error');
                reject(error);
            };

            reader.readAsText(file);
        });
    },

    clearAllData() {
        if (confirm('Are you sure you want to delete all notes and data? This cannot be undone.')) {
            try {
                Storage.clearAllData();
                UI.renderNotes();
                UI.updateTagFilters();
                UI.showToast('All data cleared successfully!', 'success');
            } catch (error) {
                console.error('Error clearing data:', error);
                UI.showToast('Error clearing data', 'error');
            }
        }
    },

    getStats() {
        const notes = Storage.loadNotes();
        const tags = Storage.loadTags();

        return {
            totalNotes: notes.length,
            totalTags: tags.length,
            totalWords: notes.reduce((sum, note) => sum + note.content.trim().split(/\s+/).filter(word => word.length > 0).length, 0),
            oldestNote: notes.length > 0 ? new Date(Math.min(...notes.map(n => new Date(n.createdAt)))) : null,
            newestNote: notes.length > 0 ? new Date(Math.max(...notes.map(n => new Date(n.createdAt)))) : null
        };
    },

    cleanup() {
        console.log('Application cleanup completed');
    }
};

document.addEventListener('DOMContentLoaded', () => {
    App.init();
});