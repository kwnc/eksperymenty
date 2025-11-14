/**
 * Storage Management Module
 * Handles all LocalStorage operations for notes
 * Storage key: 'simplenote_notes'
 */

const STORAGE_KEY = 'simplenote_notes';

/**
 * Note Object Structure:
 * {
 *   id: string,           // Unique identifier
 *   title: string,        // Note title
 *   content: string,      // Note content
 *   createdAt: number,    // Unix timestamp
 *   updatedAt: number,    // Unix timestamp
 *   tags: string[]        // Optional, for future use
 * }
 */

/**
 * Get all notes from LocalStorage
 * @returns {Array<Object>} Array of note objects
 */
function getAllNotes() {
    try {
        const data = localStorage.getItem(STORAGE_KEY);
        if (!data) {
            return [];
        }
        const notes = JSON.parse(data);
        // Sort by updatedAt (most recent first)
        return notes.sort((a, b) => b.updatedAt - a.updatedAt);
    } catch (error) {
        console.error('Error getting notes:', error);
        return [];
    }
}

/**
 * Get a single note by ID
 * @param {string} id - Note ID
 * @returns {Object|null} Note object or null if not found
 */
function getNoteById(id) {
    const notes = getAllNotes();
    const note = notes.find(note => note.id === id);
    return note || null;
}

/**
 * Create a new note
 * @param {string} title - Note title
 * @param {string} content - Note content
 * @returns {Object} Newly created note object
 */
function createNote(title, content) {
    const now = Date.now();
    const newNote = {
        id: generateId(),
        title: title || 'Untitled Note',
        content: content || '',
        createdAt: now,
        updatedAt: now,
        tags: []
    };

    const notes = getAllNotes();
    notes.push(newNote);
    saveToStorage(notes);

    return newNote;
}

/**
 * Update an existing note
 * @param {string} id - Note ID
 * @param {Object} updates - Object with fields to update (title, content, etc.)
 * @returns {Object|null} Updated note or null if not found
 */
function updateNote(id, updates) {
    const notes = getAllNotes();
    const noteIndex = notes.findIndex(note => note.id === id);

    if (noteIndex === -1) {
        return null;
    }

    // Merge updates, preserve createdAt, update updatedAt
    notes[noteIndex] = {
        ...notes[noteIndex],
        ...updates,
        createdAt: notes[noteIndex].createdAt,
        updatedAt: Date.now()
    };

    saveToStorage(notes);
    return notes[noteIndex];
}

/**
 * Delete a note
 * @param {string} id - Note ID
 * @returns {boolean} True if deleted, false if not found
 */
function deleteNote(id) {
    const notes = getAllNotes();
    const initialLength = notes.length;
    const filteredNotes = notes.filter(note => note.id !== id);

    if (filteredNotes.length === initialLength) {
        return false; // Note not found
    }

    saveToStorage(filteredNotes);
    return true;
}

/**
 * Search notes by title or content
 * @param {string} query - Search query
 * @returns {Array<Object>} Array of matching notes
 */
function searchNotes(query) {
    if (!query || query.trim() === '') {
        return getAllNotes();
    }

    const notes = getAllNotes();
    const lowercaseQuery = query.toLowerCase();

    return notes.filter(note =>
        note.title.toLowerCase().includes(lowercaseQuery) ||
        note.content.toLowerCase().includes(lowercaseQuery)
    );
}

/**
 * Save notes array to localStorage
 * @param {Array<Object>} notes - Array of notes
 * @private
 */
function saveToStorage(notes) {
    try {
        const jsonString = JSON.stringify(notes);
        localStorage.setItem(STORAGE_KEY, jsonString);
    } catch (error) {
        if (error.name === 'QuotaExceededError') {
            console.error('Storage quota exceeded!');
            alert('Storage is full. Please delete some notes to free up space.');
        } else {
            console.error('Error saving to storage:', error);
        }
        throw error;
    }
}

/**
 * Get storage usage statistics
 * @returns {Object} Object with used and total storage info
 */
function getStorageInfo() {
    try {
        const data = localStorage.getItem(STORAGE_KEY) || '';
        const usedBytes = new Blob([data]).size;
        const usedKB = (usedBytes / 1024).toFixed(2);
        const totalKB = 5120; // Approximate 5MB limit

        return {
            used: usedKB,
            total: totalKB,
            percentage: ((usedKB / totalKB) * 100).toFixed(1)
        };
    } catch (error) {
        console.error('Error getting storage info:', error);
        return { used: 0, total: 5120, percentage: 0 };
    }
}
