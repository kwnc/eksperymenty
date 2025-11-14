/**
 * Storage Module
 * Handles all localStorage operations for the note-taking application
 *
 * @module storage
 */

import { validateNote as validateNoteUtil } from './utils.js';

// localStorage key for storing notes data
const STORAGE_KEY = 'notes_app_data';
const STORAGE_VERSION = '1.0.0';

/**
 * Initialize storage with default structure if it doesn't exist
 * @returns {boolean} Success status
 */
export function initStorage() {
  try {
    const existing = readStorage();

    if (!existing) {
      // Create default structure
      const defaultData = {
        version: STORAGE_VERSION,
        lastModified: Date.now(),
        notes: [],
        settings: {
          theme: 'light',
          autoSaveDelay: 1000
        }
      };
      return writeStorage(defaultData);
    }

    // Validate existing structure
    if (!existing.notes || !Array.isArray(existing.notes)) {
      existing.notes = [];
    }
    if (!existing.settings) {
      existing.settings = { theme: 'light', autoSaveDelay: 1000 };
    }
    if (!existing.version) {
      existing.version = STORAGE_VERSION;
    }

    return true;
  } catch (error) {
    console.error('Error initializing storage:', error);
    return false;
  }
}

/**
 * Get all notes from storage
 * @returns {Array<Note>} Array of note objects
 */
export function getAllNotes() {
  try {
    const data = readStorage();
    if (!data || !data.notes) {
      return [];
    }

    // Sort by updatedAt (most recent first)
    return data.notes.sort((a, b) => b.updatedAt - a.updatedAt);
  } catch (error) {
    console.error('Error getting all notes:', error);
    return [];
  }
}

/**
 * Get a single note by ID
 * @param {string} id - Note ID
 * @returns {Note|null} Note object or null if not found
 */
export function getNoteById(id) {
  try {
    const notes = getAllNotes();
    return notes.find(note => note.id === id) || null;
  } catch (error) {
    console.error('Error getting note by ID:', error);
    return null;
  }
}

/**
 * Save a note (create or update)
 * @param {Note} note - Note object to save
 * @returns {Object} { success: boolean, note: Note, error?: string }
 */
export function saveNote(note) {
  try {
    // Validate note structure
    const validation = validateNoteUtil(note);
    if (!validation.valid) {
      return {
        success: false,
        note: null,
        error: validation.errors.join(', ')
      };
    }

    const data = readStorage() || {
      version: STORAGE_VERSION,
      lastModified: Date.now(),
      notes: [],
      settings: {}
    };

    const existingIndex = data.notes.findIndex(n => n.id === note.id);

    if (existingIndex >= 0) {
      // Update existing note
      data.notes[existingIndex] = {
        ...note,
        updatedAt: Date.now()
      };
    } else {
      // Add new note
      const newNote = {
        ...note,
        createdAt: note.createdAt || Date.now(),
        updatedAt: Date.now()
      };
      data.notes.push(newNote);
    }

    data.lastModified = Date.now();

    if (writeStorage(data)) {
      const savedNote = existingIndex >= 0 ? data.notes[existingIndex] : data.notes[data.notes.length - 1];
      return {
        success: true,
        note: savedNote
      };
    } else {
      return {
        success: false,
        note: null,
        error: 'Failed to write to storage'
      };
    }
  } catch (error) {
    console.error('Error saving note:', error);
    return {
      success: false,
      note: null,
      error: error.message
    };
  }
}

/**
 * Delete a note by ID
 * @param {string} id - Note ID to delete
 * @returns {boolean} Success status
 */
export function deleteNote(id) {
  try {
    const data = readStorage();
    if (!data || !data.notes) {
      return false;
    }

    const initialLength = data.notes.length;
    data.notes = data.notes.filter(note => note.id !== id);

    if (data.notes.length === initialLength) {
      // Note not found
      return false;
    }

    data.lastModified = Date.now();
    return writeStorage(data);
  } catch (error) {
    console.error('Error deleting note:', error);
    return false;
  }
}

/**
 * Update an existing note
 * @param {string} id - Note ID
 * @param {Object} updates - Partial note object with fields to update
 * @returns {Object} { success: boolean, note: Note, error?: string }
 */
export function updateNote(id, updates) {
  try {
    const existingNote = getNoteById(id);
    if (!existingNote) {
      return {
        success: false,
        note: null,
        error: 'Note not found'
      };
    }

    const updatedNote = {
      ...existingNote,
      ...updates,
      id: existingNote.id, // Preserve original ID
      createdAt: existingNote.createdAt, // Preserve creation date
      updatedAt: Date.now()
    };

    return saveNote(updatedNote);
  } catch (error) {
    console.error('Error updating note:', error);
    return {
      success: false,
      note: null,
      error: error.message
    };
  }
}

/**
 * Search notes by query string (searches title and content)
 * @param {string} query - Search query
 * @returns {Array<Note>} Filtered array of notes
 */
export function searchNotes(query) {
  try {
    const allNotes = getAllNotes();

    if (!query || query.trim() === '') {
      return allNotes;
    }

    const searchTerm = query.toLowerCase().trim();

    return allNotes.filter(note => {
      const titleMatch = note.title && note.title.toLowerCase().includes(searchTerm);
      const contentMatch = note.content && note.content.toLowerCase().includes(searchTerm);
      return titleMatch || contentMatch;
    });
  } catch (error) {
    console.error('Error searching notes:', error);
    return [];
  }
}

/**
 * Get storage usage information
 * @returns {Object} { used: number, available: number, percentage: number }
 */
export function getStorageInfo() {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    const used = data ? new Blob([data]).size : 0;

    // Estimate available storage (5MB is common minimum)
    const available = 5 * 1024 * 1024; // 5 MB in bytes
    const percentage = (used / available) * 100;

    return {
      used: used,
      available: available,
      percentage: Math.min(percentage, 100) // Cap at 100%
    };
  } catch (error) {
    console.error('Error getting storage info:', error);
    return {
      used: 0,
      available: 5 * 1024 * 1024,
      percentage: 0
    };
  }
}

/**
 * Export all data as JSON string
 * @returns {string} JSON string of all data
 */
export function exportData() {
  try {
    const data = readStorage();
    return JSON.stringify(data, null, 2);
  } catch (error) {
    console.error('Error exporting data:', error);
    return '{}';
  }
}

/**
 * Import data from JSON string
 * @param {string} jsonString - JSON string to import
 * @returns {boolean} Success status
 */
export function importData(jsonString) {
  try {
    const data = JSON.parse(jsonString);

    // Validate basic structure
    if (!data.notes || !Array.isArray(data.notes)) {
      console.error('Invalid data structure: notes array missing');
      return false;
    }

    // Ensure required fields exist
    if (!data.version) {
      data.version = STORAGE_VERSION;
    }
    if (!data.lastModified) {
      data.lastModified = Date.now();
    }
    if (!data.settings) {
      data.settings = { theme: 'light', autoSaveDelay: 1000 };
    }

    return writeStorage(data);
  } catch (error) {
    console.error('Error importing data:', error);
    return false;
  }
}

// ============================================
// Private Helper Functions (for Agent 2 to implement)
// ============================================

/**
 * Read data from localStorage
 * @private
 * @returns {Object|null} Parsed data or null on error
 */
function readStorage() {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return null;
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading from storage:', error);
    return null;
  }
}

/**
 * Write data to localStorage
 * @private
 * @param {Object} data - Data to write
 * @returns {boolean} Success status
 */
function writeStorage(data) {
  try {
    const jsonString = JSON.stringify(data);
    localStorage.setItem(STORAGE_KEY, jsonString);
    return true;
  } catch (error) {
    if (error.name === 'QuotaExceededError') {
      console.error('Storage quota exceeded:', error);
      alert('Storage quota exceeded. Please delete some notes to free up space.');
    } else {
      console.error('Error writing to storage:', error);
    }
    return false;
  }
}
