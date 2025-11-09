describe('NotesStorage Unit Tests', () => {
    let storage;
    let originalLocalStorage;

    // Setup before each test
    function setup() {
        // Mock localStorage
        originalLocalStorage = window.localStorage;
        window.localStorage = createMockStorage();
        storage = new NotesStorage();
    }

    // Cleanup after each test
    function cleanup() {
        window.localStorage = originalLocalStorage;
    }

    it('should initialize with empty notes array', () => {
        setup();
        const notes = storage.getAllNotes();
        expect(notes).toEqual([]);
        cleanup();
    });

    it('should create a new note with correct structure', () => {
        setup();
        const note = storage.createNote('Test Title', 'Test Content');

        expect(note).toBeTruthy();
        expect(note.id).toBeTruthy();
        expect(note.title).toBe('Test Title');
        expect(note.content).toBe('Test Content');
        expect(note.createdAt).toBeTruthy();
        expect(note.updatedAt).toBeTruthy();
        expect(note.createdAt).toBe(note.updatedAt);
        cleanup();
    });

    it('should handle empty title and content gracefully', () => {
        setup();
        const note = storage.createNote('', '   ');

        expect(note.title).toBe('Untitled Note');
        expect(note.content).toBe('');
        cleanup();
    });

    it('should generate unique IDs for notes', () => {
        setup();
        const note1 = storage.createNote('Note 1');
        const note2 = storage.createNote('Note 2');

        expect(note1.id).not.toBe(note2.id);
        cleanup();
    });

    it('should save and retrieve notes from localStorage', () => {
        setup();
        const note = storage.createNote('Persistent Note', 'This should persist');

        // Create new storage instance to test persistence
        const newStorage = new NotesStorage();
        const notes = newStorage.getAllNotes();

        expect(notes).toHaveLength(1);
        expect(notes[0].title).toBe('Persistent Note');
        cleanup();
    });

    it('should update existing notes correctly', () => {
        setup();
        const note = storage.createNote('Original Title', 'Original Content');
        const originalCreatedAt = note.createdAt;

        // Wait a moment to ensure updatedAt differs
        setTimeout(() => {
            const updatedNote = storage.updateNote(note.id, {
                title: 'Updated Title',
                content: 'Updated Content'
            });

            expect(updatedNote.title).toBe('Updated Title');
            expect(updatedNote.content).toBe('Updated Content');
            expect(updatedNote.createdAt).toBe(originalCreatedAt);
            expect(updatedNote.updatedAt).not.toBe(originalCreatedAt);
        }, 10);
        cleanup();
    });

    it('should return null when updating non-existent note', () => {
        setup();
        const result = storage.updateNote('non-existent-id', { title: 'Test' });
        expect(result).toBeNull();
        cleanup();
    });

    it('should delete notes correctly', () => {
        setup();
        const note = storage.createNote('To Delete');
        expect(storage.getAllNotes()).toHaveLength(1);

        const deleted = storage.deleteNote(note.id);
        expect(deleted).toBe(true);
        expect(storage.getAllNotes()).toHaveLength(0);
        cleanup();
    });

    it('should return false when deleting non-existent note', () => {
        setup();
        const result = storage.deleteNote('non-existent-id');
        expect(result).toBe(false);
        cleanup();
    });

    it('should search notes by title and content', () => {
        setup();
        storage.createNote('JavaScript Tutorial', 'Learn about variables and functions');
        storage.createNote('Python Guide', 'Understanding loops and conditionals');
        storage.createNote('Web Development', 'JavaScript frameworks and libraries');

        // Search by title
        const jsResults = storage.searchNotes('JavaScript');
        expect(jsResults).toHaveLength(2);

        // Search by content
        const loopResults = storage.searchNotes('loops');
        expect(loopResults).toHaveLength(1);
        expect(loopResults[0].title).toBe('Python Guide');

        // Search case insensitive
        const caseResults = storage.searchNotes('PYTHON');
        expect(caseResults).toHaveLength(1);
        cleanup();
    });

    it('should return all notes when search query is empty', () => {
        setup();
        storage.createNote('Note 1');
        storage.createNote('Note 2');

        const emptyResults = storage.searchNotes('');
        const spaceResults = storage.searchNotes('   ');

        expect(emptyResults).toHaveLength(2);
        expect(spaceResults).toHaveLength(2);
        cleanup();
    });

    it('should sort notes by updatedAt in descending order', () => {
        setup();
        const note1 = storage.createNote('First Note');

        setTimeout(() => {
            const note2 = storage.createNote('Second Note');
            const notes = storage.getAllNotes();

            expect(notes[0].id).toBe(note2.id); // Most recent first
            expect(notes[1].id).toBe(note1.id);
        }, 10);
        cleanup();
    });

    it('should get note by ID correctly', () => {
        setup();
        const note = storage.createNote('Find Me');
        const found = storage.getNoteById(note.id);

        expect(found).toBeTruthy();
        expect(found.id).toBe(note.id);
        expect(found.title).toBe('Find Me');

        const notFound = storage.getNoteById('non-existent');
        expect(notFound).toBeUndefined();
        cleanup();
    });

    it('should provide storage information', () => {
        setup();
        storage.createNote('Test Note', 'Some content here');
        const info = storage.getStorageInfo();

        expect(info.notesCount).toBe(1);
        expect(info.storageSize).toBeGreaterThan(0);
        expect(info.storageSizeFormatted).toContain('B');
        cleanup();
    });

    it('should export notes data correctly', () => {
        setup();
        const note = storage.createNote('Export Test');
        const exportData = storage.exportNotes();

        expect(exportData.notes).toHaveLength(1);
        expect(exportData.notes[0].title).toBe('Export Test');
        expect(exportData.exportedAt).toBeTruthy();
        expect(exportData.metadata).toBeTruthy();
        cleanup();
    });

    it('should import notes data correctly', () => {
        setup();
        const importData = {
            notes: [
                createMockNote({ title: 'Imported Note 1' }),
                createMockNote({ title: 'Imported Note 2' })
            ]
        };

        const success = storage.importNotes(importData);
        expect(success).toBe(true);

        const notes = storage.getAllNotes();
        expect(notes).toHaveLength(2);
        expect(notes.some(n => n.title === 'Imported Note 1')).toBe(true);
        cleanup();
    });

    it('should handle invalid import data', () => {
        setup();
        const success1 = storage.importNotes(null);
        expect(success1).toBe(false);

        const success2 = storage.importNotes({ notes: 'invalid' });
        expect(success2).toBe(false);

        const success3 = storage.importNotes({});
        expect(success3).toBe(false);
        cleanup();
    });
});