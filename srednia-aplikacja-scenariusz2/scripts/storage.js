// Storage Manager - localStorage operations for NoteNest
// To be implemented by Agent 2

// Storage key constants
const STORAGE_KEYS = {
    NOTES: 'notenest_notes',
    TAGS: 'notenest_tags'
};

// Storage functions for localStorage operations

function saveNote(note) {
    const notes = loadNotes();
    const existingIndex = notes.findIndex(n => n.id === note.id);

    if (existingIndex !== -1) {
        notes[existingIndex] = note;
    } else {
        notes.push(note);
    }

    localStorage.setItem(STORAGE_KEYS.NOTES, JSON.stringify(notes));
    return note;
}

function loadNotes() {
    const notesJson = localStorage.getItem(STORAGE_KEYS.NOTES);
    return notesJson ? JSON.parse(notesJson) : [];
}

function deleteNote(id) {
    const notes = loadNotes();
    const filteredNotes = notes.filter(note => note.id !== id);
    localStorage.setItem(STORAGE_KEYS.NOTES, JSON.stringify(filteredNotes));
    return true;
}

function updateNote(id, updatedNote) {
    updatedNote.id = id;
    updatedNote.updatedAt = Date.now();
    return saveNote(updatedNote);
}

function saveTags(tags) {
    localStorage.setItem(STORAGE_KEYS.TAGS, JSON.stringify(tags));
}

function loadTags() {
    const tagsJson = localStorage.getItem(STORAGE_KEYS.TAGS);
    return tagsJson ? JSON.parse(tagsJson) : [];
}

function clearAllData() {
    localStorage.removeItem(STORAGE_KEYS.NOTES);
    localStorage.removeItem(STORAGE_KEYS.TAGS);
}

console.log('Storage module loaded and ready');