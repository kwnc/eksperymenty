class NoteNest {
    constructor() {
        this.notes = [];
        this.currentEditingId = null;
        this.activeFilter = null;
        this.init();
    }

    init() {
        this.loadNotes();
        this.bindEvents();
        this.renderNotes();
        this.renderTags();
    }

    bindEvents() {
        const saveBtn = document.getElementById('saveNote');
        const clearBtn = document.getElementById('clearNote');
        const clearFilterBtn = document.getElementById('clearFilter');
        const tagFilter = document.getElementById('tagFilter');

        saveBtn.addEventListener('click', () => this.saveNote());
        clearBtn.addEventListener('click', () => this.clearForm());
        clearFilterBtn.addEventListener('click', () => this.clearFilter());
        tagFilter.addEventListener('input', (e) => this.filterByTag(e.target.value));

        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.key === 'Enter') {
                this.saveNote();
            }
        });
    }

    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    saveNote() {
        const title = document.getElementById('noteTitle').value.trim();
        const content = document.getElementById('noteContent').value.trim();
        const tagsInput = document.getElementById('noteTags').value.trim();

        if (!title && !content) {
            this.showToast('Please add a title or content for your note', 'error');
            return;
        }

        const tags = tagsInput ? tagsInput.split(',').map(tag => tag.trim()).filter(tag => tag) : [];

        if (this.currentEditingId) {
            this.updateNote(this.currentEditingId, title, content, tags);
        } else {
            this.createNote(title, content, tags);
        }
    }

    createNote(title, content, tags) {
        const note = {
            id: this.generateId(),
            title: title || 'Untitled',
            content,
            tags,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        this.notes.unshift(note);
        this.saveNotes();
        this.renderNotes();
        this.renderTags();
        this.clearForm();
        this.showToast('Note created successfully!');
    }

    updateNote(id, title, content, tags) {
        const noteIndex = this.notes.findIndex(note => note.id === id);
        if (noteIndex === -1) return;

        this.notes[noteIndex] = {
            ...this.notes[noteIndex],
            title: title || 'Untitled',
            content,
            tags,
            updatedAt: new Date().toISOString()
        };

        this.saveNotes();
        this.renderNotes();
        this.renderTags();
        this.clearForm();
        this.showToast('Note updated successfully!');
    }

    editNote(id) {
        const note = this.notes.find(note => note.id === id);
        if (!note) return;

        document.getElementById('noteTitle').value = note.title === 'Untitled' ? '' : note.title;
        document.getElementById('noteContent').value = note.content;
        document.getElementById('noteTags').value = note.tags.join(', ');

        this.currentEditingId = id;
        document.getElementById('saveNote').textContent = 'Update Note';
        document.getElementById('noteTitle').focus();

        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    deleteNote(id) {
        if (!confirm('Are you sure you want to delete this note?')) return;

        this.notes = this.notes.filter(note => note.id !== id);
        this.saveNotes();
        this.renderNotes();
        this.renderTags();
        this.showToast('Note deleted successfully!');

        if (this.currentEditingId === id) {
            this.clearForm();
        }
    }

    clearForm() {
        document.getElementById('noteTitle').value = '';
        document.getElementById('noteContent').value = '';
        document.getElementById('noteTags').value = '';
        this.currentEditingId = null;
        document.getElementById('saveNote').textContent = 'Save Note';
    }

    filterByTag(filterText) {
        this.activeFilter = filterText.toLowerCase().trim();
        this.renderNotes();
        this.renderTags();
    }

    clearFilter() {
        this.activeFilter = null;
        document.getElementById('tagFilter').value = '';
        this.renderNotes();
        this.renderTags();
    }

    selectTag(tag) {
        document.getElementById('tagFilter').value = tag;
        this.filterByTag(tag);
    }

    getFilteredNotes() {
        if (!this.activeFilter) return this.notes;

        return this.notes.filter(note =>
            note.tags.some(tag => tag.toLowerCase().includes(this.activeFilter)) ||
            note.title.toLowerCase().includes(this.activeFilter) ||
            note.content.toLowerCase().includes(this.activeFilter)
        );
    }

    getAllTags() {
        const tagSet = new Set();
        this.notes.forEach(note => {
            note.tags.forEach(tag => tagSet.add(tag));
        });
        return Array.from(tagSet).sort();
    }

    renderTags() {
        const tagsList = document.getElementById('tagsList');
        const allTags = this.getAllTags();

        if (allTags.length === 0) {
            tagsList.innerHTML = '<p style="color: #666; font-style: italic;">No tags yet</p>';
            return;
        }

        tagsList.innerHTML = allTags.map(tag => {
            const isActive = this.activeFilter && tag.toLowerCase().includes(this.activeFilter);
            return `<span class="tag-chip ${isActive ? 'active' : ''}" onclick="noteNest.selectTag('${tag}')">${tag}</span>`;
        }).join('');
    }

    renderNotes() {
        const notesList = document.getElementById('notesList');
        const filteredNotes = this.getFilteredNotes();

        if (filteredNotes.length === 0) {
            const emptyMessage = this.activeFilter
                ? `No notes found matching "${this.activeFilter}"`
                : 'No notes yet. Create your first note above!';

            notesList.innerHTML = `
                <div class="empty-state">
                    <p>${emptyMessage}</p>
                </div>
            `;
            return;
        }

        notesList.innerHTML = filteredNotes.map(note => this.renderNoteCard(note)).join('');
    }

    renderNoteCard(note) {
        const createdDate = new Date(note.createdAt).toLocaleDateString();
        const updatedDate = new Date(note.updatedAt).toLocaleDateString();
        const dateText = note.createdAt !== note.updatedAt
            ? `Updated ${updatedDate}`
            : `Created ${createdDate}`;

        return `
            <div class="note-card" data-id="${note.id}">
                <div class="note-header">
                    <h3 class="note-title">${this.escapeHtml(note.title)}</h3>
                    <div class="note-actions">
                        <button class="btn-edit" onclick="noteNest.editNote('${note.id}')">Edit</button>
                        <button class="btn-delete" onclick="noteNest.deleteNote('${note.id}')">Delete</button>
                    </div>
                </div>
                <div class="note-content">${this.escapeHtml(note.content)}</div>
                <div class="note-tags">
                    ${note.tags.map(tag => `<span class="note-tag">${this.escapeHtml(tag)}</span>`).join('')}
                </div>
                <div style="margin-top: 15px; font-size: 12px; color: #999;">${dateText}</div>
            </div>
        `;
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    showToast(message, type = 'success') {
        const toast = document.getElementById('toast');
        toast.textContent = message;
        toast.className = `toast ${type}`;

        setTimeout(() => {
            toast.classList.add('show');
        }, 10);

        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => {
                toast.classList.add('hidden');
            }, 300);
        }, 3000);
    }

    saveNotes() {
        try {
            localStorage.setItem('noteNest_notes', JSON.stringify(this.notes));
        } catch (error) {
            console.error('Failed to save notes:', error);
            this.showToast('Failed to save notes to local storage', 'error');
        }
    }

    loadNotes() {
        try {
            const saved = localStorage.getItem('noteNest_notes');
            if (saved) {
                this.notes = JSON.parse(saved);
            }
        } catch (error) {
            console.error('Failed to load notes:', error);
            this.showToast('Failed to load notes from local storage', 'error');
            this.notes = [];
        }
    }
}

const noteNest = new NoteNest();