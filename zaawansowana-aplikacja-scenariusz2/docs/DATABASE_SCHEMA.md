# NoteNest Database Schema

## Overview
NoteNest uses IndexedDB for client-side data persistence. This document defines the complete database schema with all object stores, indexes, and relationships.

## Database Configuration
- **Database Name**: `NoteNestDB`
- **Version**: 1
- **Storage Type**: IndexedDB (with localStorage fallback for settings)

## Object Stores

### 1. users
Stores user account information and preferences.

```javascript
{
  keyPath: "id",
  autoIncrement: false,
  indexes: {
    "username": { unique: true },
    "email": { unique: true }
  }
}
```

**Schema:**
```javascript
{
  id: string,              // UUID v4
  username: string,        // Unique username
  email: string,           // Unique email address
  passwordHash: string,    // Hashed password (using Web Crypto API)
  salt: string,            // Password salt
  settings: {
    theme: string,         // "light" | "dark" | "sepia" | "high-contrast"
    defaultNotebook: string, // UUID of default notebook
    autoSave: boolean,     // Auto-save notes
    autoSaveInterval: number, // Interval in milliseconds
    editorFontSize: number,   // Font size for editor
    editorFontFamily: string, // Font family preference
    showLineNumbers: boolean, // Show line numbers in code blocks
    spellCheck: boolean,      // Enable spell checking
    wordWrap: boolean,        // Enable word wrapping
    notifications: boolean    // Enable notifications
  },
  createdAt: number,       // Unix timestamp
  updatedAt: number,       // Unix timestamp
  lastLoginAt: number      // Unix timestamp
}
```

### 2. notebooks
Stores notebook/folder information for organizing notes.

```javascript
{
  keyPath: "id",
  autoIncrement: false,
  indexes: {
    "userId": { unique: false },
    "name": { unique: false },
    "createdAt": { unique: false }
  }
}
```

**Schema:**
```javascript
{
  id: string,              // UUID v4
  userId: string,          // Foreign key to users.id
  name: string,            // Notebook name
  description: string,     // Optional description
  color: string,           // Hex color code for UI
  icon: string,            // Icon name/emoji
  isDefault: boolean,      // Is this the default notebook
  isArchived: boolean,     // Is notebook archived
  sortOrder: number,       // Display order
  createdAt: number,       // Unix timestamp
  updatedAt: number        // Unix timestamp
}
```

### 3. notes
Stores the actual note content and metadata.

```javascript
{
  keyPath: "id",
  autoIncrement: false,
  indexes: {
    "userId": { unique: false },
    "notebookId": { unique: false },
    "title": { unique: false },
    "createdAt": { unique: false },
    "updatedAt": { unique: false },
    "tags": { unique: false, multiEntry: true },
    "searchIndex": { unique: false }
  }
}
```

**Schema:**
```javascript
{
  id: string,              // UUID v4
  userId: string,          // Foreign key to users.id
  notebookId: string,      // Foreign key to notebooks.id
  title: string,           // Note title
  content: string,         // HTML content from rich text editor
  plainText: string,       // Plain text version for search
  tags: string[],          // Array of tag strings
  attachments: string[],   // Array of attachment IDs
  metadata: {
    wordCount: number,     // Calculated word count
    readingTime: number,   // Estimated reading time in minutes
    characterCount: number, // Character count
    language: string,      // Detected/set language
    lastAccessedAt: number // When note was last opened
  },
  searchIndex: string,     // Processed content for full-text search
  isStarred: boolean,      // Is note starred/favorited
  isArchived: boolean,     // Is note archived
  isPinned: boolean,       // Is note pinned to top
  version: number,         // Version number for conflict resolution
  createdAt: number,       // Unix timestamp
  updatedAt: number,       // Unix timestamp
  deletedAt: number | null // Soft delete timestamp
}
```

### 4. attachments
Stores file attachments with optional OCR text.

```javascript
{
  keyPath: "id",
  autoIncrement: false,
  indexes: {
    "noteId": { unique: false },
    "fileName": { unique: false },
    "fileType": { unique: false },
    "createdAt": { unique: false }
  }
}
```

**Schema:**
```javascript
{
  id: string,              // UUID v4
  noteId: string,          // Foreign key to notes.id
  fileName: string,        // Original file name
  fileType: string,        // MIME type
  fileSize: number,        // File size in bytes
  blob: Blob,              // File data
  thumbnail: Blob | null,  // Thumbnail for images
  ocrText: string,         // Extracted text from OCR
  ocrProcessed: boolean,   // Has OCR been processed
  metadata: {
    width: number | null,  // Image width
    height: number | null, // Image height
    duration: number | null, // Video/audio duration
    pages: number | null   // PDF page count
  },
  createdAt: number,       // Unix timestamp
  updatedAt: number        // Unix timestamp
}
```

### 5. tags
Stores tag information and usage statistics.

```javascript
{
  keyPath: "id",
  autoIncrement: false,
  indexes: {
    "userId": { unique: false },
    "name": { unique: false },
    "usageCount": { unique: false }
  }
}
```

**Schema:**
```javascript
{
  id: string,              // UUID v4
  userId: string,          // Foreign key to users.id
  name: string,            // Tag name (lowercase)
  displayName: string,     // Display name (original case)
  color: string,           // Hex color code
  usageCount: number,      // Number of notes using this tag
  createdAt: number,       // Unix timestamp
  lastUsedAt: number       // Unix timestamp
}
```

### 6. sessions
Stores user session information for authentication.

```javascript
{
  keyPath: "id",
  autoIncrement: false,
  indexes: {
    "userId": { unique: false },
    "expiresAt": { unique: false }
  }
}
```

**Schema:**
```javascript
{
  id: string,              // Session token (UUID v4)
  userId: string,          // Foreign key to users.id
  deviceInfo: {
    userAgent: string,     // Browser user agent
    platform: string,     // Operating system
    language: string       // Browser language
  },
  createdAt: number,       // Unix timestamp
  expiresAt: number,       // Unix timestamp
  lastActivityAt: number   // Unix timestamp
}
```

## Relationships

### One-to-Many Relationships
- `users` → `notebooks` (one user has many notebooks)
- `users` → `notes` (one user has many notes)
- `users` → `tags` (one user has many tags)
- `users` → `sessions` (one user has many sessions)
- `notebooks` → `notes` (one notebook contains many notes)
- `notes` → `attachments` (one note has many attachments)

### Many-to-Many Relationships
- `notes` ↔ `tags` (implemented via tags array in notes)

## Indexes and Performance

### Primary Indexes
All object stores use UUID-based primary keys for optimal performance and data integrity.

### Secondary Indexes
- **User-based queries**: All stores with `userId` index for user data isolation
- **Time-based queries**: `createdAt` and `updatedAt` indexes for chronological ordering
- **Search queries**: `title`, `searchIndex`, and `tags` indexes for fast searching
- **Category queries**: `notebookId` index for notebook-based filtering

### Compound Indexes (Future Enhancement)
```javascript
// For complex queries
"userId_notebookId": ["userId", "notebookId"]
"userId_createdAt": ["userId", "createdAt"]
"userId_tags": ["userId", "tags"]
```

## Data Validation

### Required Fields
- All entities require `id`, `createdAt`, `updatedAt`
- User-owned entities require `userId`
- Notes require `title`, `content`, `notebookId`

### Constraints
- Usernames and emails must be unique
- One default notebook per user
- File size limits for attachments (configurable)
- Tag name normalization (lowercase, trimmed)

## Migration Strategy

### Version 1 → 2 (Future)
```javascript
// Example migration for adding new fields
if (event.oldVersion < 2) {
  // Add new indexes or modify schema
  const transaction = event.target.transaction;
  const notesStore = transaction.objectStore('notes');
  notesStore.createIndex('isPinned', 'isPinned', { unique: false });
}
```

## Backup and Export Format

### JSON Export Structure
```javascript
{
  version: "1.0",
  exportDate: "2024-01-01T00:00:00.000Z",
  user: { /* user object */ },
  notebooks: [ /* array of notebooks */ ],
  notes: [ /* array of notes */ ],
  tags: [ /* array of tags */ ],
  attachments: [ /* array of attachments with base64 blobs */ ]
}
```

## Security Considerations

### Data Encryption
- Passwords hashed with PBKDF2 + salt
- Sensitive note content can be encrypted (future feature)
- No plain text storage of credentials

### Data Isolation
- All queries filtered by `userId`
- Session-based access control
- No cross-user data access

### Privacy
- No telemetry or analytics data stored
- Local-only storage by default
- Optional cloud sync (future feature)