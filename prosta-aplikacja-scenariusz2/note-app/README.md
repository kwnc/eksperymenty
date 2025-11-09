# Notes App - Local-First Note Taking Application

A complete, offline-first note-taking web application built with React, TypeScript, and modern web technologies. All data is stored locally in your browser using IndexedDB.

## Features

### Core Functionality
- ✅ **Create, Read, Update, Delete (CRUD) Notes** - Full note management with rich text editing
- ✅ **Folder Organization** - Organize notes into folders and subfolders
- ✅ **Advanced Search** - Search notes by title, content, or tags with relevance scoring
- ✅ **Rich Text Editor** - Format text with bold, italic, underline, headings, and lists
- ✅ **Tags System** - Tag notes for better organization and searchability

### Data Management
- ✅ **Export/Import** - Export notes to JSON (full backup), Markdown, or CSV formats
- ✅ **Local Storage** - All data stored locally using IndexedDB (no external dependencies)
- ✅ **Storage Monitoring** - Monitor storage usage and quota
- ✅ **Offline First** - Works completely offline with immediate feedback

### User Experience
- ✅ **Responsive Design** - Works on desktop, tablet, and mobile
- ✅ **Keyboard Shortcuts** - Efficient navigation and note creation
- ✅ **Auto-save** - Notes automatically save as you type
- ✅ **Clean UI** - Modern, intuitive interface with Tailwind CSS

## Quick Start

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start development server:**
   ```bash
   npm run dev
   ```

3. **Open in browser:**
   Navigate to `http://localhost:5173`

4. **Build for production:**
   ```bash
   npm run build
   ```

## Usage

### Basic Operations

**Creating Notes:**
- Click "New Note" button in sidebar or use `Ctrl/Cmd + N`
- Notes auto-save as you type

**Organizing with Folders:**
- Click "New Folder" in sidebar
- Drag notes into folders or use the folder dropdown in editor
- Create nested folder structures

**Search:**
- Use search bar in header or press `Ctrl/Cmd + /`
- Search across titles, content, and tags
- Results ranked by relevance

### Keyboard Shortcuts

- `Ctrl/Cmd + N` - Create new note
- `Ctrl/Cmd + /` - Focus search bar
- `Ctrl/Cmd + ,` - Open settings
- `Ctrl/Cmd + Shift + F` - Go to folders
- `Escape` - Return to notes list

### Rich Text Editing

- `Ctrl/Cmd + B` - Bold
- `Ctrl/Cmd + I` - Italic
- `Ctrl/Cmd + U` - Underline
- Toolbar buttons for headings, lists, and formatting

## Data Export/Import

### Export Options

1. **JSON (Recommended)** - Complete backup that can be re-imported
2. **Markdown** - Human-readable format for other applications
3. **CSV** - Spreadsheet format with metadata

### Import
- Only JSON format can be imported back into the application
- Import replaces all existing data (export first to backup)

## Technical Architecture

### Technologies Used
- **React 18** - UI framework
- **TypeScript** - Type safety and developer experience
- **Vite** - Fast development and optimized builds
- **Zustand** - Lightweight state management
- **Dexie** - IndexedDB wrapper for local data storage
- **React Router** - Client-side routing
- **Tailwind CSS** - Utility-first styling

### Project Structure
```
src/
├── components/     # Reusable UI components
├── pages/         # Route-based page components
├── stores/        # Zustand state stores
├── db/           # Dexie database schema
├── hooks/        # Custom React hooks
├── utils/        # Helper functions
└── types/        # TypeScript definitions
```

### Database Schema
- **Notes** - id, title, content, folderId, tags, createdAt, updatedAt
- **Folders** - id, name, parentId, createdAt, updatedAt

## Browser Compatibility

- Chrome/Edge 88+
- Firefox 85+
- Safari 14+

Requires IndexedDB support for data persistence.

## Storage

- Uses browser's IndexedDB for persistent storage
- No external server required
- Data remains local to your device
- Storage quota monitoring helps manage space usage

## Development

The application is built with offline-first principles:
- All functionality works without internet connection
- Immediate UI feedback for all operations
- Local data persistence ensures no data loss
- Progressive enhancement approach

## Privacy & Security

- **100% Local** - No data sent to external servers
- **Privacy First** - Your notes never leave your device
- **No Tracking** - No analytics or tracking scripts
- **Open Source** - Full source code available for review
