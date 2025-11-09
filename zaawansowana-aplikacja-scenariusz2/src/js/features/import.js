/**
 * Import Module - Handles Markdown and HTML import functionality
 * Phase 3 Implementation
 */

class ImportManager {
    constructor() {
        this.supportedFormats = ['text/markdown', 'text/html', 'text/plain', '.md', '.html', '.txt'];
        this.maxFileSize = 5 * 1024 * 1024; // 5MB
    }

    // Import files from user selection
    async importFiles(files) {
        if (!files || files.length === 0) {
            return {
                success: false,
                error: 'No files selected'
            };
        }

        const results = [];
        const errors = [];

        for (let i = 0; i < files.length; i++) {
            const file = files[i];

            try {
                const result = await this.importSingleFile(file);
                if (result.success) {
                    results.push(result);
                } else {
                    errors.push(`${file.name}: ${result.error}`);
                }
            } catch (error) {
                errors.push(`${file.name}: ${error.message}`);
            }
        }

        return {
            success: results.length > 0,
            imported: results,
            errors: errors,
            summary: {
                total: files.length,
                successful: results.length,
                failed: errors.length
            }
        };
    }

    // Import single file
    async importSingleFile(file) {
        try {
            // Validate file
            const validation = this.validateFile(file);
            if (!validation.isValid) {
                return {
                    success: false,
                    error: validation.error
                };
            }

            // Read file content
            const content = await this.readFileContent(file);

            // Process based on file type
            const processedContent = this.processFileContent(content, file);

            // Create note from imported content
            const noteData = {
                title: this.generateTitle(file.name, processedContent.title),
                content: processedContent.content,
                tags: processedContent.tags || [],
                metadata: {
                    imported: true,
                    importDate: new Date().toISOString(),
                    originalFileName: file.name,
                    originalFileType: file.type || this.getFileExtension(file.name),
                    fileSize: file.size
                }
            };

            // Create the note
            const result = await window.notes.createNote(noteData);

            if (result.success) {
                return {
                    success: true,
                    note: result.note,
                    fileName: file.name,
                    contentType: processedContent.type
                };
            } else {
                return {
                    success: false,
                    error: result.error
                };
            }

        } catch (error) {
            console.error('Error importing file:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    // Validate file for import
    validateFile(file) {
        if (!file) {
            return { isValid: false, error: 'No file provided' };
        }

        if (file.size > this.maxFileSize) {
            return {
                isValid: false,
                error: `File too large. Maximum size: ${this.maxFileSize / (1024 * 1024)}MB`
            };
        }

        const fileExtension = this.getFileExtension(file.name);
        const isValidType = this.supportedFormats.includes(file.type) ||
                           this.supportedFormats.includes(fileExtension);

        if (!isValidType) {
            return {
                isValid: false,
                error: `Unsupported file format. Supported formats: ${this.supportedFormats.join(', ')}`
            };
        }

        return { isValid: true };
    }

    // Read file content as text
    readFileContent(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = () => reject(new Error('Failed to read file'));
            reader.readAsText(file);
        });
    }

    // Process file content based on type
    processFileContent(content, file) {
        const fileExtension = this.getFileExtension(file.name);
        const fileType = file.type || fileExtension;

        if (fileType === 'text/markdown' || fileExtension === '.md') {
            return this.processMarkdown(content);
        } else if (fileType === 'text/html' || fileExtension === '.html') {
            return this.processHTML(content);
        } else {
            return this.processPlainText(content);
        }
    }

    // Process Markdown content
    processMarkdown(content) {
        // Extract title from first h1 header if present
        const titleMatch = content.match(/^#\s+(.+)$/m);
        let title = titleMatch ? titleMatch[1].trim() : null;

        // Extract tags from markdown (looking for #tags or tags: metadata)
        const tags = this.extractTagsFromMarkdown(content);

        // Convert markdown to HTML for rich text editor
        const htmlContent = this.markdownToHTML(content);

        return {
            type: 'markdown',
            title: title,
            content: htmlContent,
            tags: tags,
            originalMarkdown: content
        };
    }

    // Process HTML content
    processHTML(content) {
        // Create temporary DOM to parse HTML
        const parser = new DOMParser();
        const doc = parser.parseFromString(content, 'text/html');

        // Extract title from h1, title tag, or first heading
        let title = null;
        const h1 = doc.querySelector('h1');
        const titleTag = doc.querySelector('title');

        if (h1) {
            title = h1.textContent.trim();
        } else if (titleTag) {
            title = titleTag.textContent.trim();
        }

        // Extract body content
        const body = doc.querySelector('body');
        const bodyContent = body ? body.innerHTML : content;

        // Clean up the HTML
        const cleanedContent = this.cleanHTML(bodyContent);

        return {
            type: 'html',
            title: title,
            content: cleanedContent,
            tags: []
        };
    }

    // Process plain text content
    processPlainText(content) {
        // Use first line as potential title if it's short
        const lines = content.split('\n');
        let title = null;

        if (lines.length > 0 && lines[0].length < 100 && lines[0].length > 0) {
            title = lines[0].trim();
        }

        // Convert line breaks to HTML
        const htmlContent = content
            .split('\n')
            .map(line => `<p>${this.escapeHTML(line)}</p>`)
            .join('');

        return {
            type: 'text',
            title: title,
            content: htmlContent,
            tags: []
        };
    }

    // Simple markdown to HTML converter
    markdownToHTML(markdown) {
        let html = markdown;

        // Headers
        html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>');
        html = html.replace(/^## (.*$)/gim, '<h2>$1</h2>');
        html = html.replace(/^# (.*$)/gim, '<h1>$1</h1>');

        // Bold
        html = html.replace(/\*\*(.*)\*\*/gim, '<strong>$1</strong>');
        html = html.replace(/__(.*?)__/gim, '<strong>$1</strong>');

        // Italic
        html = html.replace(/\*(.*)\*/gim, '<em>$1</em>');
        html = html.replace(/_(.*?)_/gim, '<em>$1</em>');

        // Code blocks
        html = html.replace(/```([\s\S]*?)```/gim, '<pre><code>$1</code></pre>');

        // Inline code
        html = html.replace(/`(.*?)`/gim, '<code>$1</code>');

        // Links
        html = html.replace(/\[([^\]]*)\]\(([^\)]*)\)/gim, '<a href="$2">$1</a>');

        // Lists
        html = html.replace(/^\* (.*$)/gim, '<li>$1</li>');
        html = html.replace(/^\- (.*$)/gim, '<li>$1</li>');
        html = html.replace(/^\+ (.*$)/gim, '<li>$1</li>');

        // Wrap lists
        html = html.replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>');

        // Line breaks
        html = html.replace(/\n/gim, '<br>');

        return html;
    }

    // Extract tags from markdown content
    extractTagsFromMarkdown(content) {
        const tags = [];

        // Look for hashtags (but not markdown headers)
        const hashtagMatches = content.match(/(?<!^|\s)#(\w+)/g);
        if (hashtagMatches) {
            hashtagMatches.forEach(match => {
                const tag = match.replace('#', '');
                if (!tags.includes(tag)) {
                    tags.push(tag);
                }
            });
        }

        // Look for YAML frontmatter tags
        const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
        if (frontmatterMatch) {
            const frontmatter = frontmatterMatch[1];
            const tagsMatch = frontmatter.match(/tags:\s*\[(.*?)\]/);
            if (tagsMatch) {
                const yamlTags = tagsMatch[1].split(',').map(tag => tag.trim().replace(/['"]/g, ''));
                yamlTags.forEach(tag => {
                    if (tag && !tags.includes(tag)) {
                        tags.push(tag);
                    }
                });
            }
        }

        return tags;
    }

    // Clean HTML content
    cleanHTML(html) {
        // Remove script tags
        html = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');

        // Remove style tags
        html = html.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');

        // Remove on* event attributes
        html = html.replace(/\s*on\w+\s*=\s*"[^"]*"/gi, '');
        html = html.replace(/\s*on\w+\s*=\s*'[^']*'/gi, '');

        return html.trim();
    }

    // Escape HTML special characters
    escapeHTML(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Generate title from filename and content
    generateTitle(fileName, contentTitle) {
        if (contentTitle) {
            return contentTitle;
        }

        // Remove extension and clean up filename
        const nameWithoutExt = fileName.replace(/\.[^/.]+$/, '');
        return nameWithoutExt
            .replace(/[-_]/g, ' ')
            .replace(/\b\w/g, l => l.toUpperCase());
    }

    // Get file extension
    getFileExtension(fileName) {
        const lastDot = fileName.lastIndexOf('.');
        return lastDot === -1 ? '' : fileName.substring(lastDot);
    }

    // Import from URL
    async importFromURL(url) {
        try {
            if (!url) {
                throw new Error('URL is required');
            }

            // Basic URL validation
            try {
                new URL(url);
            } catch {
                throw new Error('Invalid URL format');
            }

            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const content = await response.text();
            const contentType = response.headers.get('content-type') || '';

            // Create a virtual file object
            const virtualFile = {
                name: this.getFileNameFromURL(url),
                type: contentType,
                size: content.length
            };

            // Process the content
            const processedContent = this.processFileContent(content, virtualFile);

            // Create note
            const noteData = {
                title: this.generateTitle(virtualFile.name, processedContent.title),
                content: processedContent.content,
                tags: processedContent.tags || [],
                metadata: {
                    imported: true,
                    importDate: new Date().toISOString(),
                    sourceURL: url,
                    contentType: contentType
                }
            };

            const result = await window.notes.createNote(noteData);

            if (result.success) {
                return {
                    success: true,
                    note: result.note,
                    url: url,
                    contentType: processedContent.type
                };
            } else {
                return {
                    success: false,
                    error: result.error
                };
            }

        } catch (error) {
            console.error('Error importing from URL:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    // Get filename from URL
    getFileNameFromURL(url) {
        try {
            const urlObj = new URL(url);
            const pathname = urlObj.pathname;
            const fileName = pathname.substring(pathname.lastIndexOf('/') + 1);
            return fileName || 'imported-content';
        } catch {
            return 'imported-content';
        }
    }

    // Batch import from multiple URLs
    async importFromURLs(urls) {
        const results = [];
        const errors = [];

        for (const url of urls) {
            try {
                const result = await this.importFromURL(url);
                if (result.success) {
                    results.push(result);
                } else {
                    errors.push(`${url}: ${result.error}`);
                }
            } catch (error) {
                errors.push(`${url}: ${error.message}`);
            }
        }

        return {
            success: results.length > 0,
            imported: results,
            errors: errors,
            summary: {
                total: urls.length,
                successful: results.length,
                failed: errors.length
            }
        };
    }

    // Get import statistics
    getImportStatistics() {
        return {
            supportedFormats: this.supportedFormats,
            maxFileSize: this.maxFileSize,
            capabilities: {
                markdown: true,
                html: true,
                plainText: true,
                urlImport: true,
                batchImport: true,
                tagExtraction: true,
                titleExtraction: true
            }
        };
    }
}

// Global import manager instance
window.importManager = new ImportManager();