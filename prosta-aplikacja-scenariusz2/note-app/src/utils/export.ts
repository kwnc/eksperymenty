import type { Note, Folder, ExportData } from '../types';

export const exportUtils = {
  // Export to JSON
  exportToJSON: (notes: Note[], folders: Folder[]): ExportData => {
    return {
      notes,
      folders,
      exportDate: new Date().toISOString(),
      version: '1.0.0',
    };
  },

  // Export to Markdown
  exportToMarkdown: (notes: Note[], folders: Folder[]): string => {
    const folderMap = new Map(folders.map(folder => [folder.id, folder]));

    let markdown = '# Notes Export\n\n';
    markdown += `Exported on: ${new Date().toLocaleString()}\n\n`;

    // Group notes by folder
    const notesByFolder = notes.reduce((acc, note) => {
      const folderId = note.folderId || 'root';
      if (!acc[folderId]) acc[folderId] = [];
      acc[folderId].push(note);
      return acc;
    }, {} as Record<string, Note[]>);

    // Export root notes first
    if (notesByFolder.root) {
      markdown += '## Uncategorized Notes\n\n';
      notesByFolder.root.forEach(note => {
        markdown += `### ${note.title || 'Untitled'}\n\n`;
        markdown += `${convertHtmlToMarkdown(note.content)}\n\n`;
        if (note.tags && note.tags.length > 0) {
          markdown += `Tags: ${note.tags.map(tag => `\`${tag}\``).join(', ')}\n\n`;
        }
        markdown += `---\n\n`;
      });
    }

    // Export folder notes
    Object.entries(notesByFolder).forEach(([folderId, folderNotes]) => {
      if (folderId === 'root') return;

      const folder = folderMap.get(folderId);
      markdown += `## ${folder?.name || 'Unknown Folder'}\n\n`;

      folderNotes.forEach(note => {
        markdown += `### ${note.title || 'Untitled'}\n\n`;
        markdown += `${convertHtmlToMarkdown(note.content)}\n\n`;
        if (note.tags && note.tags.length > 0) {
          markdown += `Tags: ${note.tags.map(tag => `\`${tag}\``).join(', ')}\n\n`;
        }
        markdown += `---\n\n`;
      });
    });

    return markdown;
  },

  // Export to CSV (metadata only)
  exportToCSV: (notes: Note[]): string => {
    const headers = ['Title', 'Created', 'Updated', 'Folder', 'Tags', 'Content Preview'];
    const rows = notes.map(note => [
      note.title || 'Untitled',
      new Date(note.createdAt).toLocaleString(),
      new Date(note.updatedAt).toLocaleString(),
      note.folderId || '',
      note.tags?.join('; ') || '',
      note.content.replace(/<[^>]*>/g, '').substring(0, 100),
    ]);

    return [headers, ...rows]
      .map(row => row.map(cell => `"${cell.replace(/"/g, '""')}"`).join(','))
      .join('\n');
  },

  // Download file helper
  downloadFile: (content: string, filename: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  },
};

// Helper function to convert HTML to Markdown (basic conversion)
function convertHtmlToMarkdown(html: string): string {
  return html
    .replace(/<h1[^>]*>(.*?)<\/h1>/gi, '# $1')
    .replace(/<h2[^>]*>(.*?)<\/h2>/gi, '## $1')
    .replace(/<h3[^>]*>(.*?)<\/h3>/gi, '### $1')
    .replace(/<strong[^>]*>(.*?)<\/strong>/gi, '**$1**')
    .replace(/<b[^>]*>(.*?)<\/b>/gi, '**$1**')
    .replace(/<em[^>]*>(.*?)<\/em>/gi, '*$1*')
    .replace(/<i[^>]*>(.*?)<\/i>/gi, '*$1*')
    .replace(/<u[^>]*>(.*?)<\/u>/gi, '_$1_')
    .replace(/<ul[^>]*>(.*?)<\/ul>/gis, (_match, content) => {
      return content.replace(/<li[^>]*>(.*?)<\/li>/gi, '- $1\n');
    })
    .replace(/<ol[^>]*>(.*?)<\/ol>/gis, (_match, content) => {
      let counter = 1;
      return content.replace(/<li[^>]*>(.*?)<\/li>/gi, () => `${counter++}. $1\n`);
    })
    .replace(/<br[^>]*>/gi, '\n')
    .replace(/<p[^>]*>(.*?)<\/p>/gi, '$1\n\n')
    .replace(/<[^>]*>/g, '') // Remove any remaining HTML tags
    .replace(/\n\s*\n\s*\n/g, '\n\n') // Clean up excessive newlines
    .trim();
}