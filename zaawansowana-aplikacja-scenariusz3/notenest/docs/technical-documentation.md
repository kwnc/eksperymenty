# NoteNest Technical Documentation

## Table of Contents
1. [Architecture Overview](#architecture-overview)
2. [Core Modules](#core-modules)
3. [Data Storage](#data-storage)
4. [Security Implementation](#security-implementation)
5. [Testing Framework](#testing-framework)
6. [Build and Deployment](#build-and-deployment)
7. [API Reference](#api-reference)
8. [Development Guidelines](#development-guidelines)

## Architecture Overview

### Technology Stack
- **Frontend**: Vanilla HTML5, CSS3, JavaScript (ES6+)
- **Storage**: LocalStorage + IndexedDB for persistence
- **Testing**: Jest with JSDOM environment
- **Build**: npm scripts for task automation
- **Styling**: CSS3 with CSS Grid and Flexbox

### Design Principles
- **Local-first**: All data stored and processed locally
- **Progressive Enhancement**: Works without JavaScript for basic functionality
- **Responsive Design**: Mobile and desktop compatible
- **Accessibility**: WCAG 2.1 AA compliant
- **Performance**: Optimized for fast loading and smooth interactions

### Directory Structure
```
notenest/
├── index.html              # Main application entry point
├── assets/
│   ├── css/
│   │   ├── main.css        # Core application styles
│   │   ├── themes.css      # Theme system (light/dark)
│   │   └── components.css  # Component-specific styles
│   ├── js/
│   │   ├── app.js          # Main application controller
│   │   ├── auth.js         # Authentication module
│   │   ├── notes.js        # Note management
│   │   ├── notebooks.js    # Notebook organization
│   │   ├── search.js       # Search functionality
│   │   ├── export.js       # Export/import features
│   │   └── storage.js      # Storage abstraction layer
│   └── icons/              # SVG icon assets
├── auth/                   # Authentication page templates
├── components/             # Reusable UI components
├── templates/              # HTML template fragments
├── docs/                   # Documentation files
└── tests/                  # Test suite
```

## Core Modules

### 1. Application Controller (`app.js`)
**Purpose**: Main application orchestration and lifecycle management

**Key Features**:
- Application initialization and routing
- View state management
- Event delegation and handling
- Module coordination

**Main Classes**:
```javascript
class App {
  constructor()           // Initialize application
  init()                 // Setup and start application
  showView(viewName)     // Navigate between views
  handleAuth()           // Authentication state handling
}
```

### 2. Authentication Module (`auth.js`)
**Purpose**: Local user authentication and session management

**Key Features**:
- User registration and login
- Password hashing and validation
- Session management with localStorage
- Security best practices implementation

**Main Classes**:
```javascript
class AuthManager {
  register(name, email, password)    // Create new user account
  login(email, password)             // Authenticate user
  logout()                          // End user session
  getCurrentUser()                  // Get current authenticated user
  isAuthenticated()                 // Check authentication status
}
```

### 3. Note Management (`notes.js`)
**Purpose**: Core note creation, editing, and management functionality

**Key Features**:
- CRUD operations for notes
- Rich text editing with formatting
- Auto-save functionality
- Note versioning and timestamps

**Main Classes**:
```javascript
class NotesManager {
  createNote(noteData)              // Create new note
  updateNote(noteId, updates)       // Update existing note
  deleteNote(noteId)               // Delete note
  getNotes(filters)                // Retrieve notes with filtering
  saveNote(note)                   // Persist note to storage
}

class RichTextEditor {
  init(element)                    // Initialize editor on DOM element
  setContent(html)                 // Set editor content
  getContent()                     // Get current content
  formatText(command)              // Apply text formatting
}
```

### 4. Notebook Organization (`notebooks.js`)
**Purpose**: Hierarchical organization system for notes

**Key Features**:
- Notebook creation and management
- Note categorization
- Color coding and theming
- Nested organization support

**Main Classes**:
```javascript
class NotebookManager {
  createNotebook(name, color)      // Create new notebook
  updateNotebook(id, updates)      // Update notebook properties
  deleteNotebook(id)               // Delete notebook
  moveNote(noteId, notebookId)     // Move note between notebooks
  getNotebooks()                   // Get all notebooks
}
```

### 5. Search System (`search.js`)
**Purpose**: Full-text search and filtering capabilities

**Key Features**:
- Real-time search as you type
- Full-text indexing
- Tag-based filtering
- Advanced search operators

**Main Classes**:
```javascript
class SearchManager {
  indexNote(note)                  // Add note to search index
  search(query, options)           // Perform search query
  filterByTag(tag)                 // Filter notes by specific tag
  buildIndex()                     // Rebuild search index
}
```

### 6. Export/Import (`export.js`)
**Purpose**: Data portability and backup functionality

**Key Features**:
- Multiple export formats (PDF, Markdown, HTML)
- Batch export capabilities
- Import from various formats
- Data validation and sanitization

**Main Classes**:
```javascript
class ExportManager {
  exportToPDF(notes)               // Export notes to PDF
  exportToMarkdown(notes)          // Export to Markdown format
  exportToHTML(notes)              // Export to HTML format
  importFromFile(file, format)     // Import from external file
}
```

### 7. Storage Layer (`storage.js`)
**Purpose**: Data persistence and storage management

**Key Features**:
- LocalStorage and IndexedDB abstraction
- Data migration and versioning
- Storage quota management
- Backup and restore capabilities

**Main Classes**:
```javascript
class StorageManager {
  save(key, data)                  // Store data
  load(key)                        // Retrieve data
  delete(key)                      // Remove data
  clear()                          // Clear all data
  getStorageInfo()                 // Get storage usage stats
}
```

## Data Storage

### Storage Architecture
NoteNest uses a hybrid storage approach:

1. **LocalStorage**: User preferences, session data, small metadata
2. **IndexedDB**: Note content, large data objects, search indexes

### Data Models

#### User Model
```javascript
{
  id: "uuid-string",
  name: "User Display Name",
  email: "user@example.com",
  passwordHash: "bcrypt-hash",
  preferences: {
    theme: "light|dark|auto",
    autoSave: true,
    fontSize: "medium"
  },
  createdAt: "ISO-date-string",
  lastLoginAt: "ISO-date-string"
}
```

#### Note Model
```javascript
{
  id: "uuid-string",
  title: "Note Title",
  content: "HTML content string",
  plainText: "Plain text for search",
  tags: ["tag1", "tag2"],
  notebookId: "notebook-uuid",
  userId: "user-uuid",
  createdAt: "ISO-date-string",
  updatedAt: "ISO-date-string",
  version: 1
}
```

#### Notebook Model
```javascript
{
  id: "uuid-string",
  name: "Notebook Name",
  color: "#hex-color",
  userId: "user-uuid",
  noteCount: 0,
  createdAt: "ISO-date-string",
  updatedAt: "ISO-date-string"
}
```

### Storage Operations
```javascript
// Save note to IndexedDB
await storageManager.notes.put(note);

// Query notes with filters
const notes = await storageManager.notes
  .where('userId').equals(currentUserId)
  .and(note => note.tags.includes('important'))
  .toArray();

// Update note
await storageManager.notes.update(noteId, {
  content: newContent,
  updatedAt: new Date().toISOString()
});
```

## Security Implementation

### Local Authentication
- **Password Hashing**: bcrypt with salt rounds (cost factor: 12)
- **Session Management**: Secure token stored in sessionStorage
- **Input Validation**: Client-side validation with server-style checks
- **XSS Prevention**: Content sanitization and CSP headers

### Data Protection
```javascript
// Password hashing example
const hashPassword = async (password) => {
  const salt = await bcrypt.genSalt(12);
  return bcrypt.hash(password, salt);
};

// Content sanitization
const sanitizeHTML = (html) => {
  const allowedTags = ['p', 'br', 'strong', 'em', 'ul', 'ol', 'li'];
  return DOMPurify.sanitize(html, { ALLOWED_TAGS: allowedTags });
};
```

### Storage Security
- **Encryption**: Sensitive data encrypted before storage
- **Access Control**: User-scoped data isolation
- **Data Validation**: Schema validation on all stored data

## Testing Framework

### Test Structure
```
tests/
├── auth.test.js              # Authentication tests
├── notes.test.js             # Note management tests
├── search.test.js            # Search functionality tests
├── storage.test.js           # Storage layer tests
├── integration.test.js       # Cross-module integration tests
├── e2e.test.js              # End-to-end user workflow tests
├── security.test.js          # Security and validation tests
├── performance.test.js       # Performance benchmarks
└── browser-compatibility.test.js  # Cross-browser tests
```

### Test Categories

#### Unit Tests
- Individual function testing
- Module isolation
- Mock dependencies
- Code coverage reporting

#### Integration Tests
- Module interaction testing
- Data flow validation
- API contract testing

#### End-to-End Tests
- Complete user workflows
- UI interaction testing
- Cross-browser validation

### Running Tests
```bash
# Run all tests
npm test

# Run specific test file
npm test -- auth.test.js

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch
```

## Build and Deployment

### Development Setup
```bash
# Install dependencies
npm install

# Start development server (if available)
npm run dev

# Run linting
npm run lint

# Run type checking
npm run type-check
```

### Production Build
```bash
# Create production build
npm run build

# Minify assets
npm run minify

# Run production tests
npm run test:prod
```

### Deployment Options

#### Static File Serving
1. Copy all files to web server
2. Ensure proper MIME types for all file extensions
3. Configure security headers (CSP, HSTS)

#### Local Installation
1. Download/clone repository
2. Open `index.html` in modern web browser
3. No additional setup required

## API Reference

### Core Application API

#### App Controller
```javascript
// Initialize application
const app = new App();
await app.init();

// Navigate to different views
app.showView('notes');
app.showView('settings');
```

#### Authentication
```javascript
// Register new user
await authManager.register('John Doe', 'john@example.com', 'SecurePass123');

// Login
const user = await authManager.login('john@example.com', 'SecurePass123');

// Check authentication status
if (authManager.isAuthenticated()) {
  // User is logged in
}
```

#### Note Management
```javascript
// Create note
const note = await notesManager.createNote({
  title: 'New Note',
  content: '<p>Note content</p>',
  tags: ['important', 'work']
});

// Update note
await notesManager.updateNote(note.id, {
  title: 'Updated Title',
  content: '<p>Updated content</p>'
});

// Delete note
await notesManager.deleteNote(note.id);
```

#### Search
```javascript
// Search notes
const results = await searchManager.search('project deadline', {
  tags: ['work'],
  notebook: 'work-notebook-id'
});

// Filter by tag
const taggedNotes = await searchManager.filterByTag('important');
```

### Event System

#### Custom Events
```javascript
// Listen for note events
document.addEventListener('noteCreated', (event) => {
  console.log('New note created:', event.detail.note);
});

document.addEventListener('noteUpdated', (event) => {
  console.log('Note updated:', event.detail.note);
});

// Dispatch custom events
document.dispatchEvent(new CustomEvent('noteCreated', {
  detail: { note: newNote }
}));
```

## Development Guidelines

### Code Style
- **ES6+**: Use modern JavaScript features
- **Async/Await**: Prefer over Promises and callbacks
- **Modules**: Use ES6 modules for organization
- **Comments**: JSDoc format for all public APIs
- **Naming**: camelCase for variables/functions, PascalCase for classes

### Performance Best Practices
- **Lazy Loading**: Load modules and data on demand
- **Debouncing**: Use for search and auto-save operations
- **Virtual Scrolling**: For large note lists
- **Memory Management**: Clean up event listeners and observers

### Browser Compatibility
- **Target**: ES6+ compatible browsers
- **Polyfills**: Include for newer features if needed
- **Progressive Enhancement**: Ensure basic functionality without modern features
- **Testing**: Test across major browser versions

### Security Considerations
- **Input Validation**: Validate all user inputs
- **Output Encoding**: Escape HTML content appropriately
- **CSP**: Implement Content Security Policy
- **Storage**: Encrypt sensitive data before storage

### Contributing Guidelines
1. **Fork and Branch**: Create feature branches from main
2. **Testing**: Add tests for all new functionality
3. **Documentation**: Update docs for API changes
4. **Code Review**: Submit pull requests for review
5. **Linting**: Ensure code passes all lint rules

---

*Last updated: September 2024*
*NoteNest Technical Documentation v1.0.0*