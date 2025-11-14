/**
 * notes.js - Business Logic Layer
 * Manage note operations and business logic
 */

// Application state for notes
let notesState = {
  notes: [],
  currentNote: null,
  filteredNotes: [],
  filter: null
};

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
