// Tag Management Functions for NoteNest
// To be implemented by Agent 2

// Tag management functions

function addTagToNote(noteId, tag) {
    const note = getNoteById(noteId);
    if (!note) return false;

    const tagName = tag.trim().toLowerCase();
    if (tagName && !note.tags.includes(tagName)) {
        note.tags.push(tagName);
        note.updatedAt = Date.now();
        saveNote(note);
        updateTagsList();
    }
    return true;
}

function removeTagFromNote(noteId, tag) {
    const note = getNoteById(noteId);
    if (!note) return false;

    const tagName = tag.trim().toLowerCase();
    const tagIndex = note.tags.indexOf(tagName);
    if (tagIndex > -1) {
        note.tags.splice(tagIndex, 1);
        note.updatedAt = Date.now();
        saveNote(note);
        updateTagsList();
    }
    return true;
}

function getAllTags() {
    const notes = getAllNotes();
    const tagCounts = {};

    notes.forEach(note => {
        note.tags.forEach(tag => {
            tagCounts[tag] = (tagCounts[tag] || 0) + 1;
        });
    });

    return Object.entries(tagCounts)
        .map(([tag, count]) => ({ name: tag, count }))
        .sort((a, b) => b.count - a.count);
}

function getNotesWithTag(tag) {
    return filterNotesByTag(tag);
}

function createTag(tagName) {
    const cleanTag = tagName.trim().toLowerCase();
    if (!cleanTag) return false;

    const existingTags = loadTags();
    if (!existingTags.includes(cleanTag)) {
        existingTags.push(cleanTag);
        saveTags(existingTags);
    }
    return true;
}

function deleteTag(tagName) {
    const tagToDelete = tagName.trim().toLowerCase();
    const notes = getAllNotes();

    notes.forEach(note => {
        const tagIndex = note.tags.indexOf(tagToDelete);
        if (tagIndex > -1) {
            note.tags.splice(tagIndex, 1);
            note.updatedAt = Date.now();
            saveNote(note);
        }
    });

    updateTagsList();
    return true;
}

function filterTags(searchTerm) {
    if (!searchTerm || searchTerm.trim() === '') {
        return getAllTags();
    }

    const search = searchTerm.toLowerCase();
    return getAllTags().filter(tag => tag.name.includes(search));
}

function updateTagsList() {
    const tagListElement = document.getElementById('tag-list');
    if (!tagListElement) return;

    const allTags = getAllTags();
    const allNotes = getAllNotes();

    const allNotesFilter = tagListElement.querySelector('[data-tag="all"]');
    if (allNotesFilter) {
        const countElement = allNotesFilter.querySelector('.tag-count');
        if (countElement) {
            countElement.textContent = allNotes.length;
        }
    }

    const existingTagFilters = tagListElement.querySelectorAll('[data-tag]:not([data-tag="all"])');
    existingTagFilters.forEach(filter => filter.remove());

    allTags.forEach(tag => {
        const tagFilter = document.createElement('div');
        tagFilter.className = 'tag-filter';
        tagFilter.setAttribute('data-tag', tag.name);
        tagFilter.innerHTML = `
            <span>${tag.name}</span>
            <span class="tag-count">${tag.count}</span>
        `;

        tagFilter.addEventListener('click', () => {
            filterNotesByTagUI(tag.name);
        });

        tagListElement.appendChild(tagFilter);
    });
}

function filterNotesByTagUI(tagName) {
    const tagFilters = document.querySelectorAll('.tag-filter');
    tagFilters.forEach(filter => filter.classList.remove('active'));

    const activeFilter = document.querySelector(`[data-tag="${tagName}"]`);
    if (activeFilter) {
        activeFilter.classList.add('active');
    }

    const filteredNotes = filterNotesByTag(tagName);
    renderNotesList(filteredNotes);
}

console.log('Tags module loaded and ready');