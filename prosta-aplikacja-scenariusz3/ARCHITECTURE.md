# Technical Architecture
## Local MVP Note Taking Application

---

## System Architecture

### Architectural Pattern
**Component-Based Architecture** without framework dependencies

```
┌─────────────────────────────────────┐
│         index.html (View)           │
├─────────────────────────────────────┤
│         app.js (Controller)         │
├─────────────────────────────────────┤
│   notesList.js  │  noteEditor.js    │
│   (Components)  │   (Components)    │
├─────────────────────────────────────┤
│     utils.js    │   storage.js      │
│    (Helpers)    │    (Data Layer)   │
├─────────────────────────────────────┤
│         localStorage API            │
└─────────────────────────────────────┘
```

---

## Module Specifications

### 1. storage.js - Data Persistence Layer

**Purpose**: Abstract localStorage operations and provide a clean API for data management

**Interface**:
```javascript
// Initialize storage
export function initStorage() -> boolean

// CRUD Operations
export function getAllNotes() -> Note[]
export function getNoteById(id) -> Note | null
export function saveNote(note) -> { success: boolean, note: Note }
export function deleteNote(id) -> boolean
export function updateNote(id, updates) -> { success: boolean, note: Note }

// Query Operations
export function searchNotes(query) -> Note[]
export function getRecentNotes(limit) -> Note[]

// Utility
export function getStorageInfo() -> { used: number, available: number, percentage: number }
export function exportData() -> string (JSON)
export function importData(jsonString) -> boolean
```

**Error Handling**:
- Catch QuotaExceededError
- Validate data structure on read
- Return error objects instead of throwing

**Data Validation**:
- Validate note structure before save
- Sanitize user input
- Ensure ID uniqueness

---

### 2. app.js - Application Controller

**Purpose**: Initialize application, manage state, coordinate components

**Responsibilities**:
```javascript
// Application lifecycle
function init()
function bindEvents()
function setState(newState)
function getState() -> AppState

// State management
const appState = {
  notes: Note[],
  currentNote: Note | null,
  searchQuery: string,
  view: 'list' | 'editor'
}

// Event handlers
function handleNoteSelect(noteId)
function handleNoteCreate()
function handleNoteDelete(noteId)
function handleSearch(query)
```

**Initialization Flow**:
1. Load notes from storage
2. Render initial view (notes list)
3. Bind event listeners
4. Set up auto-save timer
5. Check storage capacity

---

### 3. notesList.js - Notes List Component

**Purpose**: Render and manage the list of notes

**Interface**:
```javascript
export function renderNotesList(options) -> HTMLElement
// options: {
//   container: HTMLElement,
//   notes: Note[],
//   onSelect: (noteId) => void,
//   onDelete: (noteId) => void,
//   selectedNoteId: string | null
// }

export function updateNoteItem(noteId, updates)
export function addNoteToList(note)
export function removeNoteFromList(noteId)
```

**Features**:
- Display note title, preview, and timestamp
- Highlight selected note
- Sort by most recent
- Empty state message
- Delete button with confirmation

**HTML Structure**:
```html
<div class="notes-list">
  <div class="notes-list-header">
    <h2>My Notes</h2>
    <button class="btn-new-note">+ New Note</button>
  </div>
  <div class="notes-list-items">
    <div class="note-item" data-note-id="...">
      <div class="note-item-header">
        <h3 class="note-title">...</h3>
        <button class="btn-delete">×</button>
      </div>
      <p class="note-preview">...</p>
      <span class="note-timestamp">...</span>
    </div>
  </div>
</div>
```

---

### 4. noteEditor.js - Note Editor Component

**Purpose**: Provide interface for creating and editing notes

**Interface**:
```javascript
export function renderEditor(options) -> HTMLElement
// options: {
//   container: HTMLElement,
//   note: Note | null,
//   onSave: (note) => void,
//   autoSaveDelay: number (default: 1000ms)
// }

export function getEditorContent() -> { title: string, content: string }
export function setEditorContent(note)
export function clearEditor()
export function enableAutoSave()
export function disableAutoSave()
```

**Features**:
- Title input field
- Content textarea
- Auto-save indicator
- Character count
- Last saved timestamp
- Manual save button

**HTML Structure**:
```html
<div class="note-editor">
  <div class="editor-header">
    <input type="text" class="editor-title" placeholder="Note title...">
    <div class="editor-controls">
      <span class="save-status">Saved</span>
      <button class="btn-save">Save</button>
    </div>
  </div>
  <textarea class="editor-content" placeholder="Start typing..."></textarea>
  <div class="editor-footer">
    <span class="char-count">0 characters</span>
    <span class="last-saved">Last saved: ...</span>
  </div>
</div>
```

**Auto-Save Mechanism**:
- Debounce user input (1 second delay)
- Show "Saving..." indicator during save
- Show "Saved" on success
- Show "Error" on failure with retry option

---

### 5. utils.js - Utility Functions

**Purpose**: Provide reusable helper functions

**Functions**:
```javascript
// ID Generation
export function generateId() -> string (UUID v4)

// Date Formatting
export function formatTimestamp(timestamp) -> string
// Returns: "Just now", "2 minutes ago", "Nov 13, 2025"

// Text Processing
export function truncateText(text, maxLength) -> string
export function sanitizeHtml(html) -> string
export function stripHtml(html) -> string

// Validation
export function validateNote(note) -> { valid: boolean, errors: string[] }

// Debouncing
export function debounce(func, delay) -> function

// Storage Helpers
export function formatBytes(bytes) -> string
// Returns: "1.5 MB", "500 KB", etc.
```

---

## Data Flow

### Creating a Note
1. User clicks "New Note" button
2. `app.js` handles click event
3. Creates empty note with `generateId()`
4. Renders empty editor
5. User types content
6. Auto-save triggers after debounce
7. `storage.saveNote()` persists to localStorage
8. Updates `notesList` component
9. Shows "Saved" indicator

### Editing a Note
1. User clicks note in list
2. `app.js` loads note via `storage.getNoteById()`
3. Renders editor with note content
4. User modifies content
5. Auto-save updates the note
6. List view updates preview
7. Timestamp updates to current time

### Deleting a Note
1. User clicks delete button
2. Confirmation dialog appears
3. On confirm, `app.js` calls `storage.deleteNote()`
4. Note removed from DOM
5. If deleted note was active, show empty editor
6. localStorage updated

### Searching Notes
1. User types in search box
2. Debounced search triggers
3. `storage.searchNotes()` filters notes
4. List view re-renders with results
5. "No results" message if empty

---

## localStorage Schema

### Key: `notes_app_data`
```javascript
{
  "version": "1.0.0",
  "lastModified": 1699999999999,
  "notes": [
    {
      "id": "uuid-string",
      "title": "Note Title",
      "content": "Note content...",
      "createdAt": 1699999999999,
      "updatedAt": 1699999999999
    }
  ],
  "settings": {
    "theme": "light",
    "autoSaveDelay": 1000
  }
}
```

### Storage Operations
- **Read**: `JSON.parse(localStorage.getItem('notes_app_data'))`
- **Write**: `localStorage.setItem('notes_app_data', JSON.stringify(data))`
- **Clear**: `localStorage.removeItem('notes_app_data')`

### Error Handling
```javascript
try {
  localStorage.setItem(key, value);
} catch (error) {
  if (error.name === 'QuotaExceededError') {
    // Handle storage quota exceeded
    alert('Storage quota exceeded. Please delete some notes.');
  }
}
```

---

## CSS Architecture

### CSS Variables (styles.css)
```css
:root {
  /* Colors */
  --color-primary: #4A90E2;
  --color-secondary: #7B68EE;
  --color-success: #28A745;
  --color-danger: #DC3545;
  --color-warning: #FFC107;

  --color-text: #333;
  --color-text-light: #666;
  --color-border: #E0E0E0;
  --color-background: #F5F5F5;
  --color-surface: #FFFFFF;

  /* Spacing */
  --spacing-xs: 4px;
  --spacing-sm: 8px;
  --spacing-md: 16px;
  --spacing-lg: 24px;
  --spacing-xl: 32px;

  /* Typography */
  --font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
  --font-size-sm: 14px;
  --font-size-md: 16px;
  --font-size-lg: 18px;
  --font-size-xl: 24px;

  /* Borders */
  --border-radius: 8px;
  --border-width: 1px;

  /* Shadows */
  --shadow-sm: 0 2px 4px rgba(0, 0, 0, 0.1);
  --shadow-md: 0 4px 8px rgba(0, 0, 0, 0.15);
  --shadow-lg: 0 8px 16px rgba(0, 0, 0, 0.2);
}
```

### Component Styles (components.css)
- Isolated component styles
- BEM naming convention
- Mobile-first responsive design
- Consistent spacing and colors

---

## Security Considerations

### XSS Prevention
- **Never use `innerHTML` with user content**
- Use `textContent` or `createTextNode()`
- Sanitize any HTML if rich text is added later

### Input Validation
- Validate note structure
- Limit title length (100 chars)
- Limit content length (100,000 chars)
- Strip dangerous characters

### localStorage Security
- Data is not encrypted (browser-local only)
- Warn users about sensitive information
- Consider encryption for future versions

---

## Performance Optimization

### Lazy Loading
- Render only visible notes initially
- Implement virtual scrolling for 1000+ notes

### Debouncing
- Search input: 300ms debounce
- Auto-save: 1000ms debounce

### Efficient DOM Updates
- Use DocumentFragment for batch updates
- Cache DOM references
- Avoid layout thrashing

### localStorage Optimization
- Parse JSON once on load
- Keep in-memory cache
- Batch writes when possible

---

## Browser Compatibility

### Target Browsers
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

### Required Features
- localStorage API
- ES6+ JavaScript
- CSS Grid/Flexbox
- CSS Variables

### Polyfills
None required for target browsers

---

## Testing Strategy

### Unit Tests
- `storage.js`: All CRUD operations
- `utils.js`: All helper functions
- Edge cases: empty data, invalid input

### Integration Tests
- Full CRUD flow
- Search functionality
- Auto-save behavior
- localStorage persistence

### UI Tests
- Button clicks
- Form inputs
- Navigation
- Error states

### Performance Tests
- Load time with 1000 notes
- Search performance
- Memory usage

---

## Error Handling Strategy

### User-Facing Errors
- Storage quota exceeded
- Invalid data format
- Network issues (future)

### Developer Errors
- Console logging for debugging
- Validation errors
- State inconsistencies

### Error UI
- Toast notifications for transient errors
- Modal dialogs for critical errors
- Inline validation messages

---

## Development Workflow

### Phase 1: Foundation (Agent 1)
- Create file structure
- Write this documentation
- Define interfaces
- Create HTML skeleton

### Phase 2: Implementation (Agent 2)
- Implement storage layer
- Build components
- Wire up application
- Add styling

### Phase 3: Testing (Agent 3)
- Write test framework
- Create test suites
- Run validation
- Document issues

### Phase 4: Refinement (Agent 2)
- Fix bugs
- Optimize performance
- Polish UI

---

## API Contracts Summary

### storage.js → app.js
```javascript
storage.getAllNotes() -> Note[]
storage.saveNote(note) -> { success, note }
storage.deleteNote(id) -> boolean
storage.searchNotes(query) -> Note[]
```

### app.js → components
```javascript
notesList.render({ notes, onSelect, onDelete })
noteEditor.render({ note, onSave })
```

### components → app.js
```javascript
onSelect(noteId) // User selected a note
onSave(note)     // User saved changes
onDelete(noteId) // User deleted a note
```

---

## Success Metrics

### Functionality
- [ ] All CRUD operations work
- [ ] Search returns correct results
- [ ] Auto-save functions properly
- [ ] Data persists across sessions

### Performance
- [ ] Initial load < 100ms
- [ ] Search 1000 notes < 200ms
- [ ] No memory leaks
- [ ] Smooth 60fps UI

### Code Quality
- [ ] All tests passing
- [ ] No console errors
- [ ] Clean code structure
- [ ] Well-documented

---

*Document Version: 1.0*
*Last Updated: 2025-11-13*
*Owner: Agent 1 (Architect)*
