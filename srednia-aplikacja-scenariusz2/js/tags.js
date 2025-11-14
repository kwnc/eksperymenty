/**
 * Tags Module
 * Manages tag operations and filtering for NoteNest application
 *
 * @module tags
 */

/**
 * Get all unique tags from all notes
 *
 * @returns {Array<string>} Array of unique tag strings
 */
function getAllTags() {
    const allNotes = getAllNotes();
    const tagSet = new Set();

    allNotes.forEach(note => {
        note.tags.forEach(tag => {
            tagSet.add(tag);
        });
    });

    return Array.from(tagSet).sort();
}

/**
 * Add tag to note
 *
 * @param {string} noteId - ID of the note
 * @param {string} tag - Tag to add
 * @returns {boolean} Success status
 */
function addTagToNote(noteId, tag) {
    const note = getNoteById(noteId);
    if (!note) {
        return false;
    }

    if (!note.tags.includes(tag)) {
        note.tags.push(tag);
        updateNote(noteId, note.title, note.content, note.tags);
    }

    return true;
}

/**
 * Remove tag from note
 *
 * @param {string} noteId - ID of the note
 * @param {string} tag - Tag to remove
 * @returns {boolean} Success status
 */
function removeTagFromNote(noteId, tag) {
    const note = getNoteById(noteId);
    if (!note) {
        return false;
    }

    const tagIndex = note.tags.indexOf(tag);
    if (tagIndex > -1) {
        note.tags.splice(tagIndex, 1);
        updateNote(noteId, note.title, note.content, note.tags);
    }

    return true;
}

/**
 * Filter notes by tag
 * This is a convenience wrapper around getNotesByTag
 *
 * @param {string} tag - Tag to filter by
 * @returns {Array<Object>} Array of matching notes
 */
function filterByTag(tag) {
    return getNotesByTag(tag);
}

/**
 * Parse tags from input string
 * Handles comma-separated tag strings
 *
 * @param {string} tagString - Comma-separated tag string
 * @returns {Array<string>} Array of trimmed, unique tags
 */
function parseTagString(tagString) {
    if (!tagString || tagString.trim() === '') {
        return [];
    }

    const tags = tagString
        .split(',')
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0);

    return Array.from(new Set(tags));
}
