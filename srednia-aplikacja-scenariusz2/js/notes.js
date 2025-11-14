/**
 * Notes Module
 * Manages note CRUD operations for NoteNest application
 *
 * @module notes
 */

/**
 * Note Data Structure:
 * {
 *   id: String,           // Unique identifier (timestamp-based)
 *   title: String,        // Note title
 *   content: String,      // Note body content
 *   tags: Array<String>,  // Array of tag strings
 *   createdAt: Date,      // Creation timestamp
 *   updatedAt: Date       // Last modification timestamp
 * }
 */

// In-memory notes array (synced with LocalStorage)
let notes = [];

/**
 * Create a new note
 *
 * @param {string} title - Note title
 * @param {string} content - Note content
 * @param {Array<string>} tags - Array of tags
 * @returns {Object} The created note object
 */
function createNote(title, content, tags = []) {
    const now = new Date().toISOString();
    const note = {
        id: Date.now().toString(),
        title: title,
        content: content,
        tags: tags,
        createdAt: now,
        updatedAt: now
    };

    notes.push(note);
    saveNotes(notes);

    return note;
}

/**
 * Get note by ID
 *
 * @param {string} id - Note ID
 * @returns {Object|null} Note object or null if not found
 */
function getNoteById(id) {
    return notes.find(note => note.id === id) || null;
}

/**
 * Update existing note
 *
 * @param {string} id - Note ID
 * @param {string} title - Updated title
 * @param {string} content - Updated content
 * @param {Array<string>} tags - Updated tags array
 * @returns {Object|null} Updated note object or null if not found
 */
function updateNote(id, title, content, tags) {
    const note = getNoteById(id);
    if (!note) {
        return null;
    }

    note.title = title;
    note.content = content;
    note.tags = tags;
    note.updatedAt = new Date().toISOString();

    saveNotes(notes);

    return note;
}

/**
 * Delete note
 *
 * @param {string} id - Note ID
 * @returns {boolean} Success status
 */
function deleteNote(id) {
    const index = notes.findIndex(note => note.id === id);
    if (index === -1) {
        return false;
    }

    notes.splice(index, 1);
    saveNotes(notes);

    return true;
}

/**
 * Get all notes
 *
 * @returns {Array<Object>} Array of all notes
 */
function getAllNotes() {
    return [...notes].sort((a, b) => {
        return new Date(b.updatedAt) - new Date(a.updatedAt);
    });
}

/**
 * Filter notes by tag
 *
 * @param {string} tag - Tag to filter by
 * @returns {Array<Object>} Array of matching notes
 */
function getNotesByTag(tag) {
    return notes.filter(note => note.tags.includes(tag))
        .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
}
