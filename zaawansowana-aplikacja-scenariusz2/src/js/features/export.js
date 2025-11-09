/**
 * Export Module - Handles note export functionality
 * Phase 2 Implementation with PDF and email export
 */

class ExportManager {
    constructor() {
        this.supportedFormats = ['json', 'txt', 'html', 'markdown', 'pdf'];
    }

    async exportNote(noteId, format = 'json') {
        try {
            const noteResult = await window.notes.getNote(noteId);
            if (!noteResult.success) {
                throw new Error(noteResult.error);
            }

            const note = noteResult.note;

            switch (format) {
                case 'json':
                    return this.exportAsJSON(note);
                case 'txt':
                    return this.exportAsText(note);
                case 'html':
                    return this.exportAsHTML(note);
                case 'markdown':
                    return this.exportAsMarkdown(note);
                case 'pdf':
                    return this.exportAsPDF(note);
                default:
                    throw new Error(`Unsupported export format: ${format}`);
            }
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    exportAsJSON(note) {
        const exportData = {
            title: note.title,
            content: note.content,
            createdAt: note.createdAt,
            updatedAt: note.updatedAt,
            tags: note.tags || [],
            metadata: note.metadata || {}
        };

        const blob = new Blob([JSON.stringify(exportData, null, 2)], {
            type: 'application/json'
        });

        this.downloadFile(blob, `${this.sanitizeFilename(note.title)}.json`);

        return {
            success: true,
            message: 'Note exported as JSON'
        };
    }

    exportAsText(note) {
        const tags = note.tags && note.tags.length > 0 ? `\nTags: ${note.tags.join(', ')}\n` : '';
        const textContent = `${note.title}\n${'='.repeat(note.title.length)}${tags}\nCreated: ${new Date(note.createdAt).toLocaleDateString()}\nUpdated: ${new Date(note.updatedAt).toLocaleDateString()}\n\n${this.stripHTML(note.content)}`;

        const blob = new Blob([textContent], {
            type: 'text/plain'
        });

        this.downloadFile(blob, `${this.sanitizeFilename(note.title)}.txt`);

        return {
            success: true,
            message: 'Note exported as text'
        };
    }

    exportAsHTML(note) {
        const tags = note.tags && note.tags.length > 0 ?
            `<div class="tags">Tags: ${note.tags.map(tag => `<span class="tag">${tag}</span>`).join(', ')}</div>` : '';

        const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${note.title}</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            line-height: 1.6;
            color: #333;
        }
        h1 { color: #E97900; border-bottom: 2px solid #E97900; padding-bottom: 10px; }
        .metadata { color: #666; font-size: 0.9em; margin-bottom: 20px; }
        .tags { margin: 10px 0; }
        .tag { background: #E97900; color: white; padding: 2px 6px; border-radius: 3px; font-size: 0.8em; }
        .content { margin-top: 20px; }
        blockquote { border-left: 4px solid #E97900; padding-left: 20px; margin: 20px 0; }
        code { background: #f5f5f5; padding: 2px 4px; border-radius: 3px; }
        pre { background: #f5f5f5; padding: 15px; border-radius: 5px; overflow-x: auto; }
    </style>
</head>
<body>
    <h1>${note.title}</h1>
    <div class="metadata">
        <p>Created: ${new Date(note.createdAt).toLocaleDateString()}</p>
        <p>Updated: ${new Date(note.updatedAt).toLocaleDateString()}</p>
        ${tags}
    </div>
    <div class="content">
        ${note.content}
    </div>
</body>
</html>`;

        const blob = new Blob([htmlContent], {
            type: 'text/html'
        });

        this.downloadFile(blob, `${this.sanitizeFilename(note.title)}.html`);

        return {
            success: true,
            message: 'Note exported as HTML'
        };
    }

    exportAsMarkdown(note) {
        const tags = note.tags && note.tags.length > 0 ? `\n**Tags:** ${note.tags.join(', ')}\n` : '';
        const markdownContent = `# ${note.title}${tags}\n**Created:** ${new Date(note.createdAt).toLocaleDateString()}\n**Updated:** ${new Date(note.updatedAt).toLocaleDateString()}\n\n---\n\n${this.convertToMarkdown(note.content)}`;

        const blob = new Blob([markdownContent], {
            type: 'text/markdown'
        });

        this.downloadFile(blob, `${this.sanitizeFilename(note.title)}.md`);

        return {
            success: true,
            message: 'Note exported as Markdown'
        };
    }

    exportAsPDF(note) {
        try {
            if (typeof window.jsPDF === 'undefined') {
                throw new Error('PDF library not loaded');
            }

            const { jsPDF } = window.jsPDF;
            const doc = new jsPDF();

            // Set up fonts and colors
            doc.setFont('helvetica');
            doc.setFontSize(20);
            doc.setTextColor(233, 121, 0); // Orange color

            // Title
            doc.text(note.title, 20, 30);

            // Line under title
            doc.setDrawColor(233, 121, 0);
            doc.setLineWidth(0.5);
            doc.line(20, 35, 190, 35);

            // Reset text color for metadata
            doc.setTextColor(100, 100, 100);
            doc.setFontSize(10);

            let yPosition = 50;

            // Metadata
            doc.text(`Created: ${new Date(note.createdAt).toLocaleDateString()}`, 20, yPosition);
            yPosition += 6;
            doc.text(`Updated: ${new Date(note.updatedAt).toLocaleDateString()}`, 20, yPosition);
            yPosition += 6;

            if (note.tags && note.tags.length > 0) {
                doc.text(`Tags: ${note.tags.join(', ')}`, 20, yPosition);
                yPosition += 6;
            }

            yPosition += 10;

            // Content
            doc.setTextColor(0, 0, 0);
            doc.setFontSize(12);

            const content = this.stripHTML(note.content);
            const lines = doc.splitTextToSize(content, 170);

            // Check if content fits on one page
            if (yPosition + (lines.length * 6) > 280) {
                // Content spans multiple pages
                let currentY = yPosition;
                const pageHeight = 280;
                const lineHeight = 6;

                for (let i = 0; i < lines.length; i++) {
                    if (currentY + lineHeight > pageHeight) {
                        doc.addPage();
                        currentY = 20;
                    }
                    doc.text(lines[i], 20, currentY);
                    currentY += lineHeight;
                }
            } else {
                // Content fits on one page
                doc.text(lines, 20, yPosition);
            }

            // Add footer
            const pageCount = doc.internal.getNumberOfPages();
            for (let i = 1; i <= pageCount; i++) {
                doc.setPage(i);
                doc.setTextColor(150, 150, 150);
                doc.setFontSize(8);
                doc.text(`Generated by NoteNest - Page ${i} of ${pageCount}`, 20, 290);
            }

            // Save the PDF
            doc.save(`${this.sanitizeFilename(note.title)}.pdf`);

            return {
                success: true,
                message: 'Note exported as PDF'
            };

        } catch (error) {
            console.error('PDF export error:', error);
            return {
                success: false,
                error: 'Failed to export PDF: ' + error.message
            };
        }
    }

    // Email export functionality
    async prepareEmailExport(noteId, options = {}) {
        try {
            const noteResult = await window.notes.getNote(noteId);
            if (!noteResult.success) {
                throw new Error(noteResult.error);
            }

            const note = noteResult.note;
            const format = options.format || 'html';

            const emailData = {
                subject: `Note: ${note.title}`,
                body: this.generateEmailBody(note, format),
                attachments: []
            };

            if (options.includeAttachment) {
                // Create attachment based on format
                const exportResult = await this.exportNote(noteId, format);
                if (exportResult.success) {
                    emailData.attachments.push({
                        filename: `${this.sanitizeFilename(note.title)}.${format}`,
                        data: this.generateAttachmentData(note, format)
                    });
                }
            }

            return {
                success: true,
                emailData
            };

        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    generateEmailBody(note, format = 'html') {
        const tags = note.tags && note.tags.length > 0 ? note.tags.join(', ') : 'None';

        if (format === 'html') {
            return `
<div style="font-family: Arial, sans-serif; max-width: 600px;">
    <h2 style="color: #E97900; border-bottom: 2px solid #E97900; padding-bottom: 10px;">${note.title}</h2>

    <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
        <p><strong>Created:</strong> ${new Date(note.createdAt).toLocaleDateString()}</p>
        <p><strong>Updated:</strong> ${new Date(note.updatedAt).toLocaleDateString()}</p>
        <p><strong>Tags:</strong> ${tags}</p>
    </div>

    <div style="margin-top: 20px;">
        ${note.content}
    </div>

    <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; font-size: 12px;">
        <p>Sent from NoteNest</p>
    </div>
</div>
            `;
        } else {
            return `${note.title}\n${'='.repeat(note.title.length)}\n\nCreated: ${new Date(note.createdAt).toLocaleDateString()}\nUpdated: ${new Date(note.updatedAt).toLocaleDateString()}\nTags: ${tags}\n\n${this.stripHTML(note.content)}\n\n---\nSent from NoteNest`;
        }
    }

    openEmailClient(emailData) {
        const { subject, body } = emailData;
        const encodedSubject = encodeURIComponent(subject);
        const encodedBody = encodeURIComponent(body);

        const mailtoLink = `mailto:?subject=${encodedSubject}&body=${encodedBody}`;
        window.open(mailtoLink);

        return {
            success: true,
            message: 'Email client opened'
        };
    }

    // Bulk export functionality
    async exportAllNotes(format = 'json') {
        try {
            const notesResult = await window.notes.getUserNotes();
            if (!notesResult.success) {
                throw new Error(notesResult.error);
            }

            const notes = notesResult.notes;

            if (format === 'json') {
                return this.exportAllAsJSON(notes);
            } else {
                return this.exportAllAsZip(notes, format);
            }

        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    exportAllAsJSON(notes) {
        const exportData = {
            exportDate: new Date().toISOString(),
            version: '1.0',
            totalNotes: notes.length,
            notes: notes.map(note => ({
                title: note.title,
                content: note.content,
                createdAt: note.createdAt,
                updatedAt: note.updatedAt,
                tags: note.tags || [],
                metadata: note.metadata || {}
            }))
        };

        const blob = new Blob([JSON.stringify(exportData, null, 2)], {
            type: 'application/json'
        });

        this.downloadFile(blob, `notenest-export-${new Date().toISOString().split('T')[0]}.json`);

        return {
            success: true,
            message: `Exported ${notes.length} notes as JSON`
        };
    }

    // Utility methods
    stripHTML(html) {
        const div = document.createElement('div');
        div.innerHTML = html;
        return div.textContent || div.innerText || '';
    }

    convertToMarkdown(html) {
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

    sanitizeFilename(filename) {
        return filename.replace(/[^a-z0-9]/gi, '_').replace(/_+/g, '_').substring(0, 50);
    }

    downloadFile(blob, filename) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    generateAttachmentData(note, format) {
        // This would generate the actual file data for email attachments
        // Implementation depends on email service integration
        return null;
    }
}

window.exportManager = new ExportManager();