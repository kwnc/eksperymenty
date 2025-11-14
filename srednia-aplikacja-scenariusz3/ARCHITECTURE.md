# NoteNest - Technical Architecture Specification

**Version**: 1.0
**Date**: 2025-11-13
**Author**: Agent 1 (Architect)
**Status**: Ready for Implementation

---

## Table of Contents
1. [System Overview](#system-overview)
2. [Data Architecture](#data-architecture)
3. [Module Specifications](#module-specifications)
4. [API Documentation](#api-documentation)
5. [UI/UX Specifications](#uiux-specifications)
6. [State Management](#state-management)
7. [Error Handling](#error-handling)
8. [Performance Considerations](#performance-considerations)

---

## 1. System Overview

### 1.1 Architecture Pattern
NoteNest follows a modular JavaScript architecture with clear separation of concerns:

```
┌─────────────────────────────────────────┐
│           User Interface (UI)           │
│         (DOM Manipulation & Events)     │
└──────────────┬──────────────────────────┘
               │
┌──────────────▼──────────────────────────┐
│      Application Controller (App)       │
│     (Business Logic Orchestration)      │
└──────────────┬──────────────────────────┘
               │
       ┌───────┴───────┐
       │               │
┌──────▼──────┐ ┌─────▼──────┐
│   Notes     │ │  Storage   │
│  (Business  │ │ (Data Layer)│
│   Logic)    │ │             │
└─────────────┘ └─────────────┘
       │               │
       └───────┬───────┘
               │
┌──────────────▼──────────────────────────┐
│          localStorage API               │
└─────────────────────────────────────────┘
```

### 1.2 Technology Stack
- **Frontend**: HTML5, CSS3, Vanilla JavaScript (ES6+)
- **Storage**: Web Storage API (localStorage)
- **Build**: None required (pure frontend, no compilation)
- **Testing**: Custom lightweight test framework

### 1.3 Browser Support
- Chrome/Edge: Latest 2 versions
- Firefox: Latest 2 versions
- Safari: Latest 2 versions
- Mobile browsers: iOS Safari 12+, Chrome Mobile

---

## 2. Data Architecture

### 2.1 Data Models

#### Note Model
```javascript
/**
 * @typedef {Object} Note
 * @property {string} id - Unique identifier (timestamp-based or UUID)
 * @property {string} title - Note title (max 200 chars)
 * @property {string} content - Note body content (max 50KB)
 * @property {string[]} tags - Array of tag strings (lowercase, trimmed)
 * @property {number} createdAt - Unix timestamp (milliseconds)
 * @property {number} updatedAt - Unix timestamp (milliseconds)
 */
```

Example:
```javascript
{
  id: "1699900000000-abc123",
  title: "Meeting Notes",
  content: "Discussed project timeline and deliverables...",
  tags: ["work", "meeting", "project"],
  createdAt: 1699900000000,
  updatedAt: 1699900100000
}
```

#### Settings Model
```javascript
/**
 * @typedef {Object} AppSettings
 * @property {string|null} lastActiveNote - ID of last viewed note
 * @property {string} viewMode - Current view mode: "all" | "filtered" | "search"
 * @property {string|null} activeFilter - Active tag filter
 * @property {string} sortBy - Sort order: "updatedAt" | "createdAt" | "title"
 * @property {boolean} sortDesc - Sort descending if true
 */
```

### 2.2 Storage Schema

#### localStorage Keys
```javascript
const STORAGE_KEYS = {
  NOTES: 'noteNest_notes',           // Array of Note objects
  SETTINGS: 'noteNest_settings',     // AppSettings object
  VERSION: 'noteNest_version'        // Schema version for migrations
};
```

#### Storage Limits
- Maximum localStorage size: ~5-10MB (browser dependent)
- Maximum note size: 50KB per note
- Estimated capacity: 100-200 notes with average content

### 2.3 Data Validation Rules

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| id | string | Yes | Non-empty, unique |
| title | string | Yes | 1-200 characters, trimmed |
| content | string | No | Max 50KB, can be empty |
| tags | array | Yes | Array of strings, lowercase, max 20 tags |
| createdAt | number | Yes | Valid Unix timestamp |
| updatedAt | number | Yes | Valid Unix timestamp, >= createdAt |

---

## 3. Module Specifications

### 3.1 utils.js - Utility Functions

#### Purpose
Provide reusable helper functions for common operations.

#### Functions

```javascript
/**
 * Generate a unique ID for notes
 * @returns {string} Unique identifier
 */
function generateId() {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Format a timestamp to readable date string
 * @param {number} timestamp - Unix timestamp
 * @returns {string} Formatted date (e.g., "Nov 13, 2025 at 2:30 PM")
 */
function formatDate(timestamp) {
  const date = new Date(timestamp);
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  });
}

/**
 * Sanitize HTML to prevent XSS
 * @param {string} text - Text to sanitize
 * @returns {string} Sanitized text
 */
function sanitizeHTML(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/**
 * Debounce function execution
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in milliseconds
 * @returns {Function} Debounced function
 */
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Parse tags from comma-separated string
 * @param {string} tagsString - Tags as comma-separated string
 * @returns {string[]} Array of cleaned tag strings
 */
function parseTags(tagsString) {
  if (!tagsString) return [];
  return tagsString
    .split(',')
    .map(tag => tag.trim().toLowerCase())
    .filter(tag => tag.length > 0);
}

/**
 * Validate note object structure
 * @param {Object} note - Note object to validate
 * @returns {boolean} True if valid
 */
function validateNote(note) {
  if (!note || typeof note !== 'object') return false;
  if (!note.id || typeof note.id !== 'string') return false;
  if (!note.title || typeof note.title !== 'string') return false;
  if (note.title.length > 200) return false;
  if (!Array.isArray(note.tags)) return false;
  if (!note.createdAt || !note.updatedAt) return false;
  return true;
}
```

---

### 3.2 storage.js - Data Persistence Layer

#### Purpose
Handle all localStorage operations with error handling and data validation.

#### Functions

```javascript
/**
 * Load all notes from localStorage
 * @returns {Note[]} Array of note objects
 */
function loadNotes() {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.NOTES);
    if (!data) return [];
    const notes = JSON.parse(data);
    return Array.isArray(notes) ? notes : [];
  } catch (error) {
    console.error('Error loading notes:', error);
    return [];
  }
}

/**
 * Save notes array to localStorage
 * @param {Note[]} notes - Array of note objects
 * @returns {boolean} True if successful
 */
function saveNotes(notes) {
  try {
    if (!Array.isArray(notes)) {
      throw new Error('Notes must be an array');
    }
    const data = JSON.stringify(notes);
    localStorage.setItem(STORAGE_KEYS.NOTES, data);
    return true;
  } catch (error) {
    console.error('Error saving notes:', error);
    if (error.name === 'QuotaExceededError') {
      alert('Storage quota exceeded. Please delete some notes.');
    }
    return false;
  }
}

/**
 * Load application settings
 * @returns {AppSettings} Settings object
 */
function loadSettings() {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (!data) return getDefaultSettings();
    return { ...getDefaultSettings(), ...JSON.parse(data) };
  } catch (error) {
    console.error('Error loading settings:', error);
    return getDefaultSettings();
  }
}

/**
 * Save application settings
 * @param {AppSettings} settings - Settings object
 * @returns {boolean} True if successful
 */
function saveSettings(settings) {
  try {
    const data = JSON.stringify(settings);
    localStorage.setItem(STORAGE_KEYS.SETTINGS, data);
    return true;
  } catch (error) {
    console.error('Error saving settings:', error);
    return false;
  }
}

/**
 * Get default settings
 * @returns {AppSettings} Default settings object
 */
function getDefaultSettings() {
  return {
    lastActiveNote: null,
    viewMode: 'all',
    activeFilter: null,
    sortBy: 'updatedAt',
    sortDesc: true
  };
}

/**
 * Clear all application data
 * @returns {boolean} True if successful
 */
function clearAllData() {
  try {
    localStorage.removeItem(STORAGE_KEYS.NOTES);
    localStorage.removeItem(STORAGE_KEYS.SETTINGS);
    return true;
  } catch (error) {
    console.error('Error clearing data:', error);
    return false;
  }
}

/**
 * Check localStorage availability
 * @returns {boolean} True if available
 */
function isStorageAvailable() {
  try {
    const test = '__storage_test__';
    localStorage.setItem(test, test);
    localStorage.removeItem(test);
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Get storage usage information
 * @returns {Object} Storage usage stats
 */
function getStorageInfo() {
  try {
    const notes = localStorage.getItem(STORAGE_KEYS.NOTES) || '';
    const settings = localStorage.getItem(STORAGE_KEYS.SETTINGS) || '';
    const totalSize = notes.length + settings.length;
    const estimatedLimit = 5 * 1024 * 1024; // 5MB estimate

    return {
      used: totalSize,
      limit: estimatedLimit,
      percentage: (totalSize / estimatedLimit * 100).toFixed(2)
    };
  } catch (error) {
    return { used: 0, limit: 0, percentage: 0 };
  }
}
```

---

### 3.3 notes.js - Business Logic Layer

#### Purpose
Manage note operations and business logic.

#### State
```javascript
let notesState = {
  notes: [],
  currentNote: null,
  filteredNotes: [],
  filter: null
};
```

#### Functions

```javascript
/**
 * Initialize notes module
 * Load notes from storage
 */
function initNotes() {
  notesState.notes = loadNotes();
  notesState.filteredNotes = notesState.notes;
}

/**
 * Create a new note
 * @param {string} title - Note title
 * @param {string} content - Note content
 * @param {string[]} tags - Array of tags
 * @returns {Note|null} Created note or null if failed
 */
function createNote(title, content = '', tags = []) {
  try {
    const now = Date.now();
    const note = {
      id: generateId(),
      title: title.trim(),
      content: content.trim(),
      tags: Array.isArray(tags) ? tags : [],
      createdAt: now,
      updatedAt: now
    };

    if (!validateNote(note)) {
      throw new Error('Invalid note data');
    }

    notesState.notes.unshift(note); // Add to beginning
    saveNotes(notesState.notes);
    notesState.currentNote = note;

    return note;
  } catch (error) {
    console.error('Error creating note:', error);
    return null;
  }
}

/**
 * Update an existing note
 * @param {string} id - Note ID
 * @param {Object} updates - Object with fields to update
 * @returns {Note|null} Updated note or null if failed
 */
function updateNote(id, updates) {
  try {
    const index = notesState.notes.findIndex(n => n.id === id);
    if (index === -1) {
      throw new Error('Note not found');
    }

    const note = notesState.notes[index];
    const updatedNote = {
      ...note,
      ...updates,
      id: note.id, // Prevent ID change
      createdAt: note.createdAt, // Prevent createdAt change
      updatedAt: Date.now()
    };

    if (!validateNote(updatedNote)) {
      throw new Error('Invalid note data');
    }

    notesState.notes[index] = updatedNote;
    saveNotes(notesState.notes);
    notesState.currentNote = updatedNote;

    return updatedNote;
  } catch (error) {
    console.error('Error updating note:', error);
    return null;
  }
}

/**
 * Delete a note by ID
 * @param {string} id - Note ID
 * @returns {boolean} True if successful
 */
function deleteNote(id) {
  try {
    const index = notesState.notes.findIndex(n => n.id === id);
    if (index === -1) return false;

    notesState.notes.splice(index, 1);
    saveNotes(notesState.notes);

    if (notesState.currentNote && notesState.currentNote.id === id) {
      notesState.currentNote = null;
    }

    return true;
  } catch (error) {
    console.error('Error deleting note:', error);
    return false;
  }
}

/**
 * Get note by ID
 * @param {string} id - Note ID
 * @returns {Note|null} Note object or null
 */
function getNoteById(id) {
  return notesState.notes.find(n => n.id === id) || null;
}

/**
 * Get all notes
 * @returns {Note[]} Array of all notes
 */
function getAllNotes() {
  return [...notesState.notes];
}

/**
 * Filter notes by tag
 * @param {string} tag - Tag to filter by
 * @returns {Note[]} Filtered notes
 */
function filterNotesByTag(tag) {
  if (!tag) {
    notesState.filteredNotes = notesState.notes;
    notesState.filter = null;
  } else {
    notesState.filteredNotes = notesState.notes.filter(note =>
      note.tags.includes(tag.toLowerCase())
    );
    notesState.filter = tag;
  }
  return notesState.filteredNotes;
}

/**
 * Search notes by query string
 * @param {string} query - Search query
 * @returns {Note[]} Matching notes
 */
function searchNotes(query) {
  if (!query || query.trim() === '') {
    return notesState.notes;
  }

  const lowerQuery = query.toLowerCase();
  return notesState.notes.filter(note =>
    note.title.toLowerCase().includes(lowerQuery) ||
    note.content.toLowerCase().includes(lowerQuery) ||
    note.tags.some(tag => tag.includes(lowerQuery))
  );
}

/**
 * Get all unique tags from notes
 * @returns {Array<{tag: string, count: number}>} Tags with counts
 */
function getAllTags() {
  const tagMap = new Map();

  notesState.notes.forEach(note => {
    note.tags.forEach(tag => {
      tagMap.set(tag, (tagMap.get(tag) || 0) + 1);
    });
  });

  return Array.from(tagMap.entries())
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count);
}

/**
 * Get current note
 * @returns {Note|null} Current note
 */
function getCurrentNote() {
  return notesState.currentNote;
}

/**
 * Set current note
 * @param {string|null} id - Note ID or null
 */
function setCurrentNote(id) {
  notesState.currentNote = id ? getNoteById(id) : null;
}
```

---

### 3.4 ui.js - User Interface Layer

#### Purpose
Handle all DOM manipulation and UI rendering.

#### Functions

```javascript
/**
 * Initialize UI event listeners
 */
function initUI() {
  bindEventListeners();
  renderView();
}

/**
 * Bind all event listeners
 */
function bindEventListeners() {
  // Navigation
  document.getElementById('new-note-btn').addEventListener('click', handleNewNote);
  document.getElementById('all-notes-btn').addEventListener('click', handleShowAllNotes);
  document.getElementById('back-to-list-btn').addEventListener('click', handleBackToList);

  // Note actions
  document.getElementById('save-note-btn').addEventListener('click', handleSaveNote);
  document.getElementById('delete-note-btn').addEventListener('click', handleDeleteNote);
  document.getElementById('confirm-delete-btn').addEventListener('click', confirmDelete);
  document.getElementById('cancel-delete-btn').addEventListener('click', cancelDelete);

  // Search
  const searchInput = document.getElementById('search-input');
  searchInput.addEventListener('input', debounce(handleSearch, 300));

  // Form inputs - auto-save on blur
  document.getElementById('note-title').addEventListener('blur', handleAutoSave);
  document.getElementById('note-content').addEventListener('blur', handleAutoSave);
  document.getElementById('note-tags').addEventListener('blur', handleAutoSave);
}

/**
 * Render notes list view
 * @param {Note[]} notes - Array of notes to render
 */
function renderNotesList(notes) {
  const container = document.getElementById('notes-list');

  if (!notes || notes.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <p>No notes found. Create your first note!</p>
      </div>
    `;
    return;
  }

  container.innerHTML = notes.map(note => `
    <article class="note-card" data-note-id="${note.id}">
      <h3 class="note-card-title">${sanitizeHTML(note.title)}</h3>
      <p class="note-card-preview">${sanitizeHTML(note.content.substring(0, 100))}${note.content.length > 100 ? '...' : ''}</p>
      <div class="note-card-meta">
        <span class="note-card-date">${formatDate(note.updatedAt)}</span>
        ${note.tags.length > 0 ? `
          <div class="note-card-tags">
            ${note.tags.map(tag => `<span class="tag">${sanitizeHTML(tag)}</span>`).join('')}
          </div>
        ` : ''}
      </div>
    </article>
  `).join('');

  // Add click handlers to note cards
  container.querySelectorAll('.note-card').forEach(card => {
    card.addEventListener('click', () => {
      const noteId = card.dataset.noteId;
      handleNoteClick(noteId);
    });
  });
}

/**
 * Render note editor with note data
 * @param {Note|null} note - Note to edit or null for new note
 */
function renderNoteEditor(note) {
  const titleInput = document.getElementById('note-title');
  const contentInput = document.getElementById('note-content');
  const tagsInput = document.getElementById('note-tags');
  const createdDate = document.getElementById('created-date');
  const updatedDate = document.getElementById('updated-date');

  if (note) {
    titleInput.value = note.title;
    contentInput.value = note.content;
    tagsInput.value = note.tags.join(', ');
    createdDate.textContent = `Created: ${formatDate(note.createdAt)}`;
    updatedDate.textContent = `Last updated: ${formatDate(note.updatedAt)}`;
    document.getElementById('delete-note-btn').style.display = 'block';
  } else {
    titleInput.value = '';
    contentInput.value = '';
    tagsInput.value = '';
    createdDate.textContent = 'Created: --';
    updatedDate.textContent = 'Last updated: --';
    document.getElementById('delete-note-btn').style.display = 'none';
  }

  // Focus title input
  setTimeout(() => titleInput.focus(), 100);
}

/**
 * Render tag cloud
 * @param {Array<{tag: string, count: number}>} tags - Tags with counts
 */
function renderTagCloud(tags) {
  const container = document.getElementById('tag-cloud');

  if (!tags || tags.length === 0) {
    container.innerHTML = '<p class="no-tags">No tags yet</p>';
    return;
  }

  container.innerHTML = tags.map(({ tag, count }) => `
    <button class="tag-button" data-tag="${tag}">
      ${sanitizeHTML(tag)} <span class="tag-count">(${count})</span>
    </button>
  `).join('');

  // Add click handlers
  container.querySelectorAll('.tag-button').forEach(button => {
    button.addEventListener('click', () => {
      const tag = button.dataset.tag;
      handleTagFilter(tag);
    });
  });
}

/**
 * Show toast notification
 * @param {string} message - Message to display
 * @param {string} type - Type: "success", "error", "info"
 */
function showNotification(message, type = 'info') {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = message;

  container.appendChild(toast);

  // Animate in
  setTimeout(() => toast.classList.add('toast-show'), 10);

  // Remove after 3 seconds
  setTimeout(() => {
    toast.classList.remove('toast-show');
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

/**
 * Show note list view
 */
function showNotesListView() {
  document.getElementById('notes-list-view').style.display = 'block';
  document.getElementById('note-editor-view').style.display = 'none';
}

/**
 * Show note editor view
 */
function showNoteEditorView() {
  document.getElementById('notes-list-view').style.display = 'none';
  document.getElementById('note-editor-view').style.display = 'block';
}

/**
 * Show delete confirmation modal
 */
function showDeleteModal() {
  document.getElementById('delete-modal').style.display = 'flex';
}

/**
 * Hide delete confirmation modal
 */
function hideDeleteModal() {
  document.getElementById('delete-modal').style.display = 'none';
}

/**
 * Update view title
 * @param {string} title - View title
 */
function updateViewTitle(title) {
  document.getElementById('view-title').textContent = title;
}

/**
 * Render the current view based on app state
 */
function renderView() {
  const tags = getAllTags();
  renderTagCloud(tags);

  const notes = getAllNotes();
  renderNotesList(notes);
}
```

---

### 3.5 app.js - Application Controller

#### Purpose
Orchestrate application logic and coordinate between modules.

#### Initialization

```javascript
/**
 * Application state
 */
const appState = {
  initialized: false,
  currentView: 'list', // 'list' or 'editor'
  settings: null
};

/**
 * Initialize the application
 */
function init() {
  if (appState.initialized) return;

  // Check localStorage availability
  if (!isStorageAvailable()) {
    alert('localStorage is not available. The app will not work properly.');
    return;
  }

  // Initialize modules
  initNotes();
  appState.settings = loadSettings();
  initUI();

  // Restore last view if applicable
  if (appState.settings.lastActiveNote) {
    const note = getNoteById(appState.settings.lastActiveNote);
    if (note) {
      setCurrentNote(note.id);
      showNoteEditorView();
      renderNoteEditor(note);
    }
  }

  appState.initialized = true;
  console.log('NoteNest initialized successfully');
}

// Initialize on DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
```

#### Event Handlers

```javascript
/**
 * Handle new note button click
 */
function handleNewNote() {
  setCurrentNote(null);
  showNoteEditorView();
  renderNoteEditor(null);
}

/**
 * Handle show all notes
 */
function handleShowAllNotes() {
  filterNotesByTag(null);
  updateViewTitle('All Notes');
  renderView();
}

/**
 * Handle back to list button
 */
function handleBackToList() {
  showNotesListView();
  renderView();
}

/**
 * Handle save note
 */
function handleSaveNote() {
  const title = document.getElementById('note-title').value.trim();
  const content = document.getElementById('note-content').value.trim();
  const tagsString = document.getElementById('note-tags').value;
  const tags = parseTags(tagsString);

  if (!title) {
    showNotification('Please enter a note title', 'error');
    return;
  }

  const currentNote = getCurrentNote();

  if (currentNote) {
    // Update existing note
    const updated = updateNote(currentNote.id, { title, content, tags });
    if (updated) {
      showNotification('Note updated successfully', 'success');
      renderNoteEditor(updated);
    } else {
      showNotification('Failed to update note', 'error');
    }
  } else {
    // Create new note
    const created = createNote(title, content, tags);
    if (created) {
      showNotification('Note created successfully', 'success');
      setCurrentNote(created.id);
      renderNoteEditor(created);
    } else {
      showNotification('Failed to create note', 'error');
    }
  }

  // Update list view in background
  renderView();
}

/**
 * Handle auto-save on blur
 */
function handleAutoSave() {
  const currentNote = getCurrentNote();
  if (currentNote) {
    handleSaveNote();
  }
}

/**
 * Handle delete note button
 */
function handleDeleteNote() {
  showDeleteModal();
}

/**
 * Confirm delete
 */
function confirmDelete() {
  const currentNote = getCurrentNote();
  if (currentNote) {
    const success = deleteNote(currentNote.id);
    if (success) {
      showNotification('Note deleted successfully', 'success');
      hideDeleteModal();
      handleBackToList();
    } else {
      showNotification('Failed to delete note', 'error');
    }
  }
}

/**
 * Cancel delete
 */
function cancelDelete() {
  hideDeleteModal();
}

/**
 * Handle note card click
 * @param {string} noteId - Note ID
 */
function handleNoteClick(noteId) {
  const note = getNoteById(noteId);
  if (note) {
    setCurrentNote(noteId);
    showNoteEditorView();
    renderNoteEditor(note);

    // Save as last active note
    appState.settings.lastActiveNote = noteId;
    saveSettings(appState.settings);
  }
}

/**
 * Handle tag filter
 * @param {string} tag - Tag to filter by
 */
function handleTagFilter(tag) {
  const filtered = filterNotesByTag(tag);
  updateViewTitle(`Notes tagged with "${tag}"`);
  renderNotesList(filtered);
}

/**
 * Handle search
 * @param {Event} e - Input event
 */
function handleSearch(e) {
  const query = e.target.value.trim();
  const results = searchNotes(query);

  if (query) {
    updateViewTitle(`Search results for "${query}"`);
  } else {
    updateViewTitle('All Notes');
  }

  renderNotesList(results);
}
```

---

## 4. API Documentation

See detailed function documentation in Section 3 (Module Specifications).

---

## 5. UI/UX Specifications

### 5.1 Color Palette

```css
:root {
  /* Primary Colors */
  --primary-orange: #E97900;
  --primary-orange-hover: #D16D00;
  --primary-orange-light: #FFF3E5;

  /* Neutrals */
  --bg-light-gray: #ECEFF1;
  --white: #FFFFFF;
  --text-dark: #212121;
  --text-gray: #616161;
  --border-gray: #CFD8DC;

  /* Semantic Colors */
  --success-green: #4CAF50;
  --error-red: #F44336;
  --info-blue: #2196F3;
}
```

### 5.2 Typography

```css
/* Fonts */
font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
  'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;

/* Type Scale */
--font-size-xs: 0.75rem;   /* 12px */
--font-size-sm: 0.875rem;  /* 14px */
--font-size-base: 1rem;    /* 16px */
--font-size-lg: 1.125rem;  /* 18px */
--font-size-xl: 1.5rem;    /* 24px */
--font-size-2xl: 2rem;     /* 32px */
```

### 5.3 Spacing

```css
/* Spacing Scale */
--space-xs: 0.25rem;  /* 4px */
--space-sm: 0.5rem;   /* 8px */
--space-md: 1rem;     /* 16px */
--space-lg: 1.5rem;   /* 24px */
--space-xl: 2rem;     /* 32px */
--space-2xl: 3rem;    /* 48px */
```

### 5.4 Component Specifications

#### Button Styles
- Primary: Orange background, white text
- Secondary: White background, dark text, gray border
- Danger: Red background, white text
- Height: 40px
- Padding: 12px 24px
- Border radius: 4px
- Transition: all 0.2s ease

#### Input Styles
- Background: White
- Border: 1px solid var(--border-gray)
- Border radius: 4px
- Padding: 12px
- Font size: 16px (prevent iOS zoom)
- Focus: Orange border, no outline

#### Note Card Styles
- Background: White
- Border: 1px solid var(--border-gray)
- Border radius: 8px
- Padding: 16px
- Shadow: 0 2px 4px rgba(0,0,0,0.1)
- Hover: Shadow elevation + border color change

### 5.5 Responsive Breakpoints

```css
/* Mobile first approach */
@media (min-width: 768px) { /* Tablet */ }
@media (min-width: 1024px) { /* Desktop */ }
@media (min-width: 1280px) { /* Large desktop */ }
```

---

## 6. State Management

### Application State Flow

```
User Action
    ↓
Event Handler (app.js)
    ↓
Business Logic (notes.js)
    ↓
Data Layer (storage.js)
    ↓
localStorage
    ↓
State Update (notes.js)
    ↓
UI Render (ui.js)
    ↓
DOM Update
```

---

## 7. Error Handling

### Error Types and Handling

1. **Storage Errors**
   - QuotaExceededError: Show alert, suggest deleting notes
   - SecurityError: Check localStorage availability
   - General errors: Log and show user-friendly message

2. **Validation Errors**
   - Show inline error messages
   - Prevent invalid data from being saved
   - Provide clear feedback

3. **Runtime Errors**
   - Catch and log all errors
   - Show toast notification
   - Attempt graceful recovery

---

## 8. Performance Considerations

### 8.1 Optimization Strategies

1. **Debounced Search**: 300ms delay
2. **Virtual Scrolling**: Consider for 100+ notes
3. **Lazy Rendering**: Render visible notes first
4. **Efficient DOM Updates**: Minimize reflows
5. **localStorage Batching**: Save on intervals, not on every keystroke

### 8.2 Performance Targets

- Initial load: < 100ms
- Note creation: < 50ms
- Search results: < 200ms
- Smooth animations: 60fps

---

## Document Version History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2025-11-13 | Agent 1 | Initial architecture document |

---

**Status**: ✅ Complete and ready for Agent 2 implementation
