// Note Management Functions for NoteNest
// To be implemented by Agent 2

// Note data model:
// {
//   id: string (timestamp-based)
//   title: string
//   content: string
//   tags: array of strings
//   createdAt: timestamp
//   updatedAt: timestamp
// }

// Note management functions

function generateNoteId() {
    return Date.now().toString() + Math.random().toString(36).substr(2, 9);
}

function createNote(title, content, tags = []) {
    const now = Date.now();
    const note = {
        id: generateNoteId(),
        title: title.trim(),
        content: content.trim(),
        tags: Array.isArray(tags) ? tags.map(tag => tag.trim().toLowerCase()) : [],
        createdAt: now,
        updatedAt: now
    };

    return saveNote(note);
}

function editNote(id, title, content, tags = []) {
    const note = {
        title: title.trim(),
        content: content.trim(),
        tags: Array.isArray(tags) ? tags.map(tag => tag.trim().toLowerCase()) : []
    };

    return updateNote(id, note);
}

function getNoteById(id) {
    const notes = loadNotes();
    return notes.find(note => note.id === id);
}

function getAllNotes() {
    return loadNotes().sort((a, b) => b.updatedAt - a.updatedAt);
}

function filterNotesByTag(tag) {
    if (!tag || tag === 'all') {
        return getAllNotes();
    }

    const notes = getAllNotes();
    return notes.filter(note => note.tags.includes(tag.toLowerCase()));
}

function deleteNoteById(id) {
    return deleteNote(id);
}

function searchNotes(query) {
    if (!query || query.trim() === '') {
        return getAllNotes();
    }

    const searchTerm = query.toLowerCase();
    const notes = getAllNotes();

    return notes.filter(note =>
        note.title.toLowerCase().includes(searchTerm) ||
        note.content.toLowerCase().includes(searchTerm) ||
        note.tags.some(tag => tag.includes(searchTerm))
    );
}

function formatDate(timestamp) {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));

    if (diffInHours < 1) {
        return 'Just now';
    } else if (diffInHours < 24) {
        return `${diffInHours} hour${diffInHours === 1 ? '' : 's'} ago`;
    } else if (diffInHours < 48) {
        return 'Yesterday';
    } else {
        const days = Math.floor(diffInHours / 24);
        return `${days} day${days === 1 ? '' : 's'} ago`;
    }
}

console.log('Notes module loaded and ready');