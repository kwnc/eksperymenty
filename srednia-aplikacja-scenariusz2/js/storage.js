/**
 * Storage Module
 * Handles all LocalStorage interactions for NoteNest application
 *
 * @module storage
 */

const STORAGE_KEY = 'notenest_notes';

/**
 * Initialize storage
 * Sets up initial storage structure if not exists
 *
 * @returns {void}
 */
function initStorage() {
    try {
        const existingNotes = localStorage.getItem(STORAGE_KEY);
        if (!existingNotes) {
            localStorage.setItem(STORAGE_KEY, JSON.stringify([]));
        }
    } catch (error) {
        console.error('Failed to initialize storage:', error);
    }
}

/**
 * Save notes array to LocalStorage
 *
 * @param {Array<Object>} notes - Array of note objects to save
 * @returns {boolean} Success status
 */
function saveNotes(notes) {
    try {
        const jsonString = JSON.stringify(notes);
        localStorage.setItem(STORAGE_KEY, jsonString);
        return true;
    } catch (error) {
        console.error('Failed to save notes:', error);
        return false;
    }
}

/**
 * Load notes from LocalStorage
 *
 * @returns {Array<Object>} Array of note objects
 */
function loadNotes() {
    try {
        const jsonString = localStorage.getItem(STORAGE_KEY);
        if (!jsonString) {
            return [];
        }
        return JSON.parse(jsonString);
    } catch (error) {
        console.error('Failed to load notes:', error);
        return [];
    }
}

/**
 * Clear all data from storage
 * Use with caution - this is destructive
 *
 * @returns {void}
 */
function clearStorage() {
    try {
        localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
        console.error('Failed to clear storage:', error);
    }
}
