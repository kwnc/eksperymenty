// NoteNest - Export Functionality
class ExportManager {
    constructor() {
        this.storageManager = null;
        this.authManager = null;
        this.notesManager = null;
        this.notebooksManager = null;
        this.onExportProgress = null;
        this.onExportComplete = null;
        this.init();
    }

    async init() {
        // Wait for required managers
        if (typeof StorageManager !== 'undefined') {
            this.storageManager = new StorageManager();
            // Other managers will be injected by app.js
        } else {
            setTimeout(() => this.init(), 100);
        }
    }

    setAuthManager(authManager) {
        this.authManager = authManager;
    }

    setNotesManager(notesManager) {
        this.notesManager = notesManager;
    }

    setNotebooksManager(notebooksManager) {
        this.notebooksManager = notebooksManager;
    }

    // Export single note as Markdown
    async exportNoteAsMarkdown(noteId) {
        try {
            const note = await this.storageManager.getNote(noteId);
            if (!note) {
                throw new Error('Note not found');
            }

            // Verify ownership
            if (this.authManager && this.authManager.isAuthenticated()) {
                const userId = this.authManager.getCurrentUser().id;
                if (note.userId !== userId) {
                    throw new Error('Unauthorized');
                }
            }

            const markdown = this.convertNoteToMarkdown(note);
            const filename = this.sanitizeFilename(note.title) + '.md';

            this.downloadFile(markdown, filename, 'text/markdown');

            return { success: true, filename: filename };

        } catch (error) {
            console.error('Error exporting note as Markdown:', error);
            throw error;
        }
    }

    // Export single note as PDF (using browser's print to PDF)
    async exportNoteAsPDF(noteId) {
        try {
            const note = await this.storageManager.getNote(noteId);
            if (!note) {
                throw new Error('Note not found');
            }

            // Verify ownership
            if (this.authManager && this.authManager.isAuthenticated()) {
                const userId = this.authManager.getCurrentUser().id;
                if (note.userId !== userId) {
                    throw new Error('Unauthorized');
                }
            }

            const html = this.convertNoteToPrintHTML(note);
            this.printHTML(html, this.sanitizeFilename(note.title));

            return { success: true, message: 'PDF export initiated' };

        } catch (error) {
            console.error('Error exporting note as PDF:', error);
            throw error;
        }
    }

    // Export multiple notes as ZIP file
    async exportNotesAsZip(noteIds, format = 'markdown') {
        try {
            if (!noteIds || noteIds.length === 0) {
                throw new Error('No notes specified for export');
            }

            this.reportProgress('Preparing notes for export...', 0);

            const notes = [];
            for (let i = 0; i < noteIds.length; i++) {
                const note = await this.storageManager.getNote(noteIds[i]);
                if (note) {
                    // Verify ownership
                    if (this.authManager && this.authManager.isAuthenticated()) {
                        const userId = this.authManager.getCurrentUser().id;
                        if (note.userId === userId) {
                            notes.push(note);
                        }
                    } else {
                        notes.push(note);
                    }
                }
                this.reportProgress(`Loading note ${i + 1} of ${noteIds.length}...`, (i / noteIds.length) * 30);
            }

            if (notes.length === 0) {
                throw new Error('No accessible notes found');
            }

            this.reportProgress('Converting notes...', 40);

            // Create ZIP file content
            const zipContent = await this.createZipFile(notes, format);

            this.reportProgress('Preparing download...', 90);

            const timestamp = new Date().toISOString().slice(0, 10);
            const filename = `notenest-export-${timestamp}.zip`;

            this.downloadFile(zipContent, filename, 'application/zip');

            this.reportProgress('Export complete!', 100);
            if (this.onExportComplete) {
                this.onExportComplete('notes', notes.length);
            }

            return { success: true, filename: filename, count: notes.length };

        } catch (error) {
            console.error('Error exporting notes as ZIP:', error);
            throw error;
        }
    }

    // Export notebook with all its notes
    async exportNotebook(notebookId, format = 'markdown') {
        try {
            if (!this.authManager || !this.authManager.isAuthenticated()) {
                throw new Error('Not authenticated');
            }

            const userId = this.authManager.getCurrentUser().id;
            const notebook = this.notebooksManager.getNotebook(notebookId);

            if (!notebook) {
                throw new Error('Notebook not found');
            }

            this.reportProgress('Loading notebook notes...', 0);

            // Get all notes in the notebook
            const notes = await this.storageManager.getUserNotes(userId, {
                notebookId: notebookId,
                includeArchived: true
            });

            if (notes.length === 0) {
                throw new Error('No notes found in this notebook');
            }

            this.reportProgress('Converting notes...', 30);

            let exportContent;
            let filename;
            let mimeType;

            if (format === 'zip') {
                exportContent = await this.createZipFile(notes, 'markdown', notebook.name);
                filename = this.sanitizeFilename(`${notebook.name}-export.zip`);
                mimeType = 'application/zip';
            } else if (format === 'markdown') {
                exportContent = this.createNotebookMarkdown(notebook, notes);
                filename = this.sanitizeFilename(`${notebook.name}.md`);
                mimeType = 'text/markdown';
            } else {
                throw new Error('Unsupported export format');
            }

            this.reportProgress('Preparing download...', 90);

            this.downloadFile(exportContent, filename, mimeType);

            this.reportProgress('Export complete!', 100);
            if (this.onExportComplete) {
                this.onExportComplete('notebook', notes.length);
            }

            return { success: true, filename: filename, count: notes.length };

        } catch (error) {
            console.error('Error exporting notebook:', error);
            throw error;
        }
    }

    // Export all user data
    async exportAllData() {
        try {
            if (!this.authManager || !this.authManager.isAuthenticated()) {
                throw new Error('Not authenticated');
            }

            const userId = this.authManager.getCurrentUser().id;
            this.reportProgress('Preparing full data export...', 0);

            // Export all data using storage manager
            const exportData = await this.storageManager.exportData(userId);

            this.reportProgress('Creating backup file...', 70);

            const jsonContent = JSON.stringify(exportData, null, 2);
            const timestamp = new Date().toISOString().slice(0, 19).replace(/[:.]/g, '-');
            const filename = `notenest-backup-${timestamp}.json`;

            this.reportProgress('Preparing download...', 90);

            this.downloadFile(jsonContent, filename, 'application/json');

            this.reportProgress('Backup complete!', 100);
            if (this.onExportComplete) {
                this.onExportComplete('backup', exportData.notes.length);
            }

            return { success: true, filename: filename, data: exportData };

        } catch (error) {
            console.error('Error exporting all data:', error);
            throw error;
        }
    }

    // Import data from backup file
    async importData(file) {
        try {
            if (!this.authManager || !this.authManager.isAuthenticated()) {
                throw new Error('Not authenticated');
            }

            this.reportProgress('Reading import file...', 0);

            const fileContent = await this.readFileAsText(file);

            this.reportProgress('Parsing data...', 20);

            let importData;
            try {
                importData = JSON.parse(fileContent);
            } catch (parseError) {
                throw new Error('Invalid backup file format');
            }

            // Validate import data
            if (!importData.notes || !Array.isArray(importData.notes)) {
                throw new Error('Invalid backup file: missing or invalid notes data');
            }

            this.reportProgress('Importing data...', 40);

            const userId = this.authManager.getCurrentUser().id;
            await this.storageManager.importData(userId, importData);

            this.reportProgress('Refreshing application data...', 80);

            // Refresh all managers
            if (this.notesManager) {
                await this.notesManager.loadNotes();
            }
            if (this.notebooksManager) {
                await this.notebooksManager.loadNotebooks();
            }

            this.reportProgress('Import complete!', 100);
            if (this.onExportComplete) {
                this.onExportComplete('import', importData.notes.length);
            }

            return {
                success: true,
                imported: {
                    notes: importData.notes.length,
                    notebooks: importData.notebooks ? importData.notebooks.length : 0
                }
            };

        } catch (error) {
            console.error('Error importing data:', error);
            throw error;
        }
    }

    // Convert note to Markdown format
    convertNoteToMarkdown(note) {
        let markdown = `# ${note.title}\n\n`;

        // Add metadata
        markdown += `**Created:** ${new Date(note.createdAt).toLocaleString()}\n`;
        markdown += `**Modified:** ${new Date(note.modifiedAt).toLocaleString()}\n`;

        if (note.tags && note.tags.length > 0) {
            markdown += `**Tags:** ${note.tags.map(tag => `#${tag}`).join(', ')}\n`;
        }

        markdown += '\n---\n\n';

        // Convert HTML content to Markdown (basic conversion)
        const content = this.htmlToMarkdown(note.content);
        markdown += content;

        return markdown;
    }

    // Convert HTML to Markdown (basic implementation)
    htmlToMarkdown(html) {
        if (!html) return '';

        let markdown = html;

        // Convert common HTML tags to Markdown
        markdown = markdown.replace(/<h([1-6])>(.*?)<\/h[1-6]>/gi, (match, level, text) => {
            return '#'.repeat(parseInt(level)) + ' ' + text + '\n\n';
        });

        markdown = markdown.replace(/<strong>(.*?)<\/strong>/gi, '**$1**');
        markdown = markdown.replace(/<b>(.*?)<\/b>/gi, '**$1**');
        markdown = markdown.replace(/<em>(.*?)<\/em>/gi, '*$1*');
        markdown = markdown.replace(/<i>(.*?)<\/i>/gi, '*$1*');
        markdown = markdown.replace(/<u>(.*?)<\/u>/gi, '_$1_');

        markdown = markdown.replace(/<ul>(.*?)<\/ul>/gis, (match, content) => {
            return content.replace(/<li>(.*?)<\/li>/gi, '- $1\n') + '\n';
        });

        markdown = markdown.replace(/<ol>(.*?)<\/ol>/gis, (match, content) => {
            let counter = 1;
            return content.replace(/<li>(.*?)<\/li>/gi, () => {
                return `${counter++}. $1\n`;
            }) + '\n';
        });

        markdown = markdown.replace(/<a href="(.*?)">(.*?)<\/a>/gi, '[$2]($1)');
        markdown = markdown.replace(/<img src="(.*?)".*?>/gi, '![]($1)');

        markdown = markdown.replace(/<br\s*\/?>/gi, '\n');
        markdown = markdown.replace(/<p>(.*?)<\/p>/gi, '$1\n\n');
        markdown = markdown.replace(/<div>(.*?)<\/div>/gi, '$1\n');

        // Remove remaining HTML tags
        markdown = markdown.replace(/<[^>]*>/g, '');

        // Decode HTML entities
        markdown = this.decodeHTMLEntities(markdown);

        return markdown.trim();
    }

    // Decode HTML entities
    decodeHTMLEntities(text) {
        const textarea = document.createElement('textarea');
        textarea.innerHTML = text;
        return textarea.value;
    }

    // Convert note to printable HTML
    convertNoteToPrintHTML(note) {
        return `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <title>${this.escapeHtml(note.title)}</title>
            <style>
                body {
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                    max-width: 800px;
                    margin: 0 auto;
                    padding: 2rem;
                    line-height: 1.6;
                }
                h1 { color: #E97900; border-bottom: 2px solid #E97900; padding-bottom: 0.5rem; }
                .meta { color: #666; font-size: 0.9rem; margin-bottom: 2rem; }
                .tags { margin-top: 1rem; }
                .tag { background: #E97900; color: white; padding: 0.2rem 0.5rem; border-radius: 3px; margin-right: 0.5rem; font-size: 0.8rem; }
                @media print { body { margin: 0; padding: 1rem; } }
            </style>
        </head>
        <body>
            <h1>${this.escapeHtml(note.title)}</h1>
            <div class="meta">
                <strong>Created:</strong> ${new Date(note.createdAt).toLocaleString()}<br>
                <strong>Modified:</strong> ${new Date(note.modifiedAt).toLocaleString()}
            </div>
            <div class="content">
                ${note.content}
            </div>
            ${note.tags && note.tags.length > 0 ? `
            <div class="tags">
                <strong>Tags:</strong><br>
                ${note.tags.map(tag => `<span class="tag">${this.escapeHtml(tag)}</span>`).join('')}
            </div>
            ` : ''}
        </body>
        </html>
        `;
    }

    // Create notebook Markdown document
    createNotebookMarkdown(notebook, notes) {
        let markdown = `# ${notebook.name}\n\n`;

        if (notebook.description) {
            markdown += `${notebook.description}\n\n`;
        }

        markdown += `**Exported:** ${new Date().toLocaleString()}\n`;
        markdown += `**Notes Count:** ${notes.length}\n\n`;
        markdown += '---\n\n';

        notes.forEach((note, index) => {
            markdown += `## ${note.title}\n\n`;
            markdown += `**Created:** ${new Date(note.createdAt).toLocaleString()}  \n`;
            markdown += `**Modified:** ${new Date(note.modifiedAt).toLocaleString()}\n\n`;

            if (note.tags && note.tags.length > 0) {
                markdown += `**Tags:** ${note.tags.map(tag => `#${tag}`).join(', ')}\n\n`;
            }

            const content = this.htmlToMarkdown(note.content);
            markdown += content + '\n\n';

            if (index < notes.length - 1) {
                markdown += '---\n\n';
            }
        });

        return markdown;
    }

    // Create ZIP file (simplified - using JSZip would be better in production)
    async createZipFile(notes, format = 'markdown', folderName = 'notenest-export') {
        // This is a simplified implementation
        // In production, you'd want to use a library like JSZip
        const files = [];

        if (format === 'markdown') {
            notes.forEach(note => {
                const content = this.convertNoteToMarkdown(note);
                const filename = this.sanitizeFilename(note.title) + '.md';
                files.push({ name: filename, content: content });
            });
        }

        // Create a simple text-based "zip" representation
        // In production, replace this with actual ZIP creation
        let zipContent = `NoteNest Export Archive\n`;
        zipContent += `Created: ${new Date().toISOString()}\n`;
        zipContent += `Files: ${files.length}\n`;
        zipContent += `${'='.repeat(50)}\n\n`;

        files.forEach(file => {
            zipContent += `FILE: ${file.name}\n`;
            zipContent += `${'='.repeat(file.name.length + 6)}\n`;
            zipContent += file.content;
            zipContent += `\n\n${'='.repeat(50)}\n\n`;
        });

        return zipContent;
    }

    // Sanitize filename for download
    sanitizeFilename(filename) {
        return filename
            .replace(/[^\w\s-]/g, '') // Remove special characters
            .replace(/\s+/g, '-') // Replace spaces with hyphens
            .replace(/-+/g, '-') // Replace multiple hyphens with single
            .trim()
            .toLowerCase()
            .slice(0, 100); // Limit length
    }

    // Escape HTML entities
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Download file
    downloadFile(content, filename, mimeType) {
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

    // Print HTML content
    printHTML(html, filename = 'note') {
        const printWindow = window.open('', '_blank');
        printWindow.document.write(html);
        printWindow.document.close();
        printWindow.focus();

        // Auto-trigger print dialog after content loads
        printWindow.addEventListener('load', () => {
            setTimeout(() => {
                printWindow.print();
            }, 250);
        });
    }

    // Read file as text
    readFileAsText(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = (e) => reject(new Error('Failed to read file'));
            reader.readAsText(file);
        });
    }

    // Report progress to callback
    reportProgress(message, percentage) {
        if (this.onExportProgress) {
            this.onExportProgress(message, percentage);
        }
    }

    // Set progress callback
    setProgressCallback(callback) {
        this.onExportProgress = callback;
    }

    // Set completion callback
    setCompletionCallback(callback) {
        this.onExportComplete = callback;
    }

    // Get supported export formats
    getSupportedFormats() {
        return {
            note: ['markdown', 'pdf', 'html'],
            notebook: ['markdown', 'zip'],
            all: ['json']
        };
    }

    // Cleanup
    destroy() {
        this.onExportProgress = null;
        this.onExportComplete = null;
    }
}

// Export for use in other modules
window.ExportManager = ExportManager;