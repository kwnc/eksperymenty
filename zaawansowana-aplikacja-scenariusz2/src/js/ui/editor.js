/**
 * Rich Text Editor Module - Handles Quill.js integration
 */

class RichTextEditor {
    constructor() {
        this.quill = null;
        this.currentNoteId = null;
        this.autoSaveTimer = null;
        this.autoSaveInterval = 30000; // 30 seconds
        this.hasUnsavedChanges = false;
    }

    // Initialize the Quill editor
    init(containerId) {
        if (this.quill) {
            this.destroy();
        }

        // Quill configuration
        const toolbarOptions = [
            [{ 'header': [1, 2, 3, false] }],
            ['bold', 'italic', 'underline', 'strike'],
            [{ 'color': [] }, { 'background': [] }],
            [{ 'list': 'ordered'}, { 'list': 'bullet' }],
            [{ 'indent': '-1'}, { 'indent': '+1' }],
            ['blockquote', 'code-block'],
            ['link', 'image'],
            [{ 'align': [] }],
            ['clean']
        ];

        this.quill = new Quill(containerId, {
            theme: 'snow',
            modules: {
                toolbar: toolbarOptions,
                history: {
                    delay: 1000,
                    maxStack: 50,
                    userOnly: true
                }
            },
            placeholder: 'Start writing your note...',
            readOnly: false
        });

        // Set up event listeners
        this.setupEventListeners();

        return this.quill;
    }

    setupEventListeners() {
        if (!this.quill) return;

        // Content change events
        this.quill.on('text-change', (delta, oldDelta, source) => {
            if (source === 'user') {
                this.hasUnsavedChanges = true;
                this.markAsUnsaved();
                this.updateWordCount();

                // Debounced auto-save
                this.scheduleAutoSave();
            }
        });

        // Selection change events
        this.quill.on('selection-change', (range, oldRange, source) => {
            if (range) {
                // User focused on editor
                this.extendSession();
            }
        });

        // Handle paste events for better formatting
        this.quill.clipboard.addMatcher(Node.ELEMENT_NODE, (node, delta) => {
            // Clean up pasted content
            return delta.compose(new Delta().retain(delta.length()));
        });
    }

    // Load content into editor
    loadContent(content, format = 'html') {
        if (!this.quill) return;

        this.quill.root.innerHTML = '';

        if (format === 'html') {
            this.quill.clipboard.dangerouslyPasteHTML(content || '');
        } else if (format === 'delta') {
            this.quill.setContents(content || []);
        } else {
            this.quill.setText(content || '');
        }

        this.hasUnsavedChanges = false;
        this.markAsSaved();
        this.updateWordCount();
    }

    // Get content from editor
    getContent(format = 'html') {
        if (!this.quill) return '';

        switch (format) {
            case 'html':
                return this.quill.root.innerHTML;
            case 'text':
                return this.quill.getText();
            case 'delta':
                return this.quill.getContents();
            default:
                return this.quill.root.innerHTML;
        }
    }

    // Check if editor has content
    isEmpty() {
        if (!this.quill) return true;
        return this.quill.getText().trim().length === 0;
    }

    // Get word count
    getWordCount() {
        if (!this.quill) return 0;
        const text = this.quill.getText().trim();
        return text.length === 0 ? 0 : text.split(/\s+/).length;
    }

    // Update word count display
    updateWordCount() {
        const wordCount = this.getWordCount();
        const wordCountEl = document.getElementById('word-count');
        if (wordCountEl) {
            wordCountEl.textContent = `${wordCount} words`;
        }
    }

    // Auto-save functionality
    scheduleAutoSave() {
        if (this.autoSaveTimer) {
            clearTimeout(this.autoSaveTimer);
        }

        this.autoSaveTimer = setTimeout(() => {
            this.autoSave();
        }, this.autoSaveInterval);
    }

    async autoSave() {
        if (!this.hasUnsavedChanges || !this.currentNoteId) return;

        try {
            const content = this.getContent('html');
            const title = document.getElementById('note-title')?.value || 'Untitled Note';

            const result = await window.notes.updateNote(this.currentNoteId, {
                title,
                content
            });

            if (result.success) {
                this.hasUnsavedChanges = false;
                this.markAsSaved();

                // Update notes list
                if (window.ui) {
                    window.ui.loadNotesList();
                }
            }
        } catch (error) {
            console.error('Auto-save failed:', error);
        }
    }

    // Manual save
    async save() {
        if (!this.currentNoteId) return;

        try {
            const content = this.getContent('html');
            const title = document.getElementById('note-title')?.value || 'Untitled Note';

            const result = await window.notes.updateNote(this.currentNoteId, {
                title,
                content
            });

            if (result.success) {
                this.hasUnsavedChanges = false;
                this.markAsSaved();

                // Update notes list
                if (window.ui) {
                    window.ui.loadNotesList();
                }

                // Show success notification
                if (window.noteNestApp) {
                    window.noteNestApp.showNotification('Note saved successfully', 'success', 2000);
                }

                return result;
            } else {
                throw new Error(result.error);
            }
        } catch (error) {
            console.error('Save failed:', error);

            if (window.noteNestApp) {
                window.noteNestApp.showNotification('Failed to save note', 'error');
            }

            return { success: false, error: error.message };
        }
    }

    // Set current note
    setCurrentNote(noteId) {
        this.currentNoteId = noteId;
    }

    // Visual indicators
    markAsUnsaved() {
        const indicator = document.getElementById('save-indicator');
        if (indicator) {
            indicator.textContent = 'Unsaved changes';
            indicator.className = 'save-indicator unsaved';
        }
    }

    markAsSaved() {
        const indicator = document.getElementById('save-indicator');
        if (indicator) {
            indicator.textContent = 'Saved';
            indicator.className = 'save-indicator saved';
        }
    }

    // Extend user session on activity
    extendSession() {
        if (window.auth && window.auth.extendSession) {
            window.auth.extendSession();
        }
    }

    // Format text utilities
    formatText(format, value = null) {
        if (!this.quill) return;

        const selection = this.quill.getSelection();
        if (!selection) return;

        switch (format) {
            case 'bold':
                this.quill.format('bold', !this.quill.getFormat().bold);
                break;
            case 'italic':
                this.quill.format('italic', !this.quill.getFormat().italic);
                break;
            case 'underline':
                this.quill.format('underline', !this.quill.getFormat().underline);
                break;
            case 'header':
                this.quill.format('header', value);
                break;
            case 'list':
                this.quill.format('list', value);
                break;
            default:
                this.quill.format(format, value);
        }
    }

    // Insert content
    insertContent(type, content) {
        if (!this.quill) return;

        const selection = this.quill.getSelection() || { index: this.quill.getLength() };

        switch (type) {
            case 'text':
                this.quill.insertText(selection.index, content);
                break;
            case 'link':
                this.quill.insertText(selection.index, content.text);
                this.quill.formatText(selection.index, content.text.length, 'link', content.url);
                break;
            case 'image':
                this.quill.insertEmbed(selection.index, 'image', content.src);
                break;
        }
    }

    // Export content
    exportContent(format) {
        switch (format) {
            case 'html':
                return this.getContent('html');
            case 'text':
                return this.getContent('text');
            case 'markdown':
                return this.convertToMarkdown();
            default:
                return this.getContent('html');
        }
    }

    // Convert to markdown (basic implementation)
    convertToMarkdown() {
        const html = this.getContent('html');

        // Basic HTML to Markdown conversion
        let markdown = html
            .replace(/<h1[^>]*>(.*?)<\/h1>/gi, '# $1\n\n')
            .replace(/<h2[^>]*>(.*?)<\/h2>/gi, '## $1\n\n')
            .replace(/<h3[^>]*>(.*?)<\/h3>/gi, '### $1\n\n')
            .replace(/<strong[^>]*>(.*?)<\/strong>/gi, '**$1**')
            .replace(/<b[^>]*>(.*?)<\/b>/gi, '**$1**')
            .replace(/<em[^>]*>(.*?)<\/em>/gi, '*$1*')
            .replace(/<i[^>]*>(.*?)<\/i>/gi, '*$1*')
            .replace(/<u[^>]*>(.*?)<\/u>/gi, '_$1_')
            .replace(/<blockquote[^>]*>(.*?)<\/blockquote>/gi, '> $1\n\n')
            .replace(/<code[^>]*>(.*?)<\/code>/gi, '`$1`')
            .replace(/<a[^>]*href="([^"]*)"[^>]*>(.*?)<\/a>/gi, '[$2]($1)')
            .replace(/<ul[^>]*>(.*?)<\/ul>/gi, '$1')
            .replace(/<ol[^>]*>(.*?)<\/ol>/gi, '$1')
            .replace(/<li[^>]*>(.*?)<\/li>/gi, '- $1\n')
            .replace(/<br[^>]*>/gi, '\n')
            .replace(/<p[^>]*>(.*?)<\/p>/gi, '$1\n\n')
            .replace(/<[^>]*>/g, '') // Remove remaining HTML tags
            .replace(/\n\s*\n\s*\n/g, '\n\n') // Clean up multiple newlines
            .trim();

        return markdown;
    }

    // Focus editor
    focus() {
        if (this.quill) {
            this.quill.focus();
        }
    }

    // Destroy editor
    destroy() {
        if (this.autoSaveTimer) {
            clearTimeout(this.autoSaveTimer);
            this.autoSaveTimer = null;
        }

        if (this.quill) {
            this.quill = null;
        }

        this.currentNoteId = null;
        this.hasUnsavedChanges = false;
    }

    // Get editor stats
    getStats() {
        if (!this.quill) return {};

        const text = this.quill.getText();
        const wordCount = this.getWordCount();
        const charCount = text.length;
        const charCountNoSpaces = text.replace(/\s/g, '').length;
        const readingTime = Math.ceil(wordCount / 200); // Average reading speed

        return {
            wordCount,
            charCount,
            charCountNoSpaces,
            readingTime
        };
    }
}

// Global rich text editor instance
window.richTextEditor = new RichTextEditor();