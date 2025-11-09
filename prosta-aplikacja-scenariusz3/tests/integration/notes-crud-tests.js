describe('Notes CRUD Integration Tests', () => {
    let storage;
    let originalLocalStorage;

    function setup() {
        originalLocalStorage = window.localStorage;
        window.localStorage = createMockStorage();
        storage = new NotesStorage();
    }

    function cleanup() {
        window.localStorage = originalLocalStorage;
    }

    it('should perform complete CRUD workflow', () => {
        setup();

        // CREATE
        const note = storage.createNote('Integration Test Note', 'This tests the full CRUD workflow.');
        expect(note).toBeTruthy();
        expect(note.id).toBeTruthy();
        expect(storage.getAllNotes()).toHaveLength(1);

        // READ
        const retrieved = storage.getNoteById(note.id);
        expect(retrieved).toEqual(note);

        const allNotes = storage.getAllNotes();
        expect(allNotes).toHaveLength(1);
        expect(allNotes[0]).toEqual(note);

        // UPDATE
        const updatedNote = storage.updateNote(note.id, {
            title: 'Updated Integration Test',
            content: 'Updated content for integration testing.'
        });
        expect(updatedNote.title).toBe('Updated Integration Test');
        expect(updatedNote.content).toBe('Updated content for integration testing.');
        expect(updatedNote.id).toBe(note.id);
        expect(updatedNote.createdAt).toBe(note.createdAt);
        expect(updatedNote.updatedAt).not.toBe(note.updatedAt);

        // DELETE
        const deleted = storage.deleteNote(note.id);
        expect(deleted).toBe(true);
        expect(storage.getAllNotes()).toHaveLength(0);
        expect(storage.getNoteById(note.id)).toBeUndefined();

        cleanup();
    });

    it('should handle multiple notes correctly', () => {
        setup();

        // Create multiple notes
        const note1 = storage.createNote('First Note', 'Content 1');
        const note2 = storage.createNote('Second Note', 'Content 2');
        const note3 = storage.createNote('Third Note', 'Content 3');

        expect(storage.getAllNotes()).toHaveLength(3);

        // Update middle note
        const updatedNote2 = storage.updateNote(note2.id, { title: 'Updated Second Note' });
        expect(updatedNote2.title).toBe('Updated Second Note');

        // Check that other notes are unchanged
        const note1Retrieved = storage.getNoteById(note1.id);
        const note3Retrieved = storage.getNoteById(note3.id);
        expect(note1Retrieved.title).toBe('First Note');
        expect(note3Retrieved.title).toBe('Third Note');

        // Delete first note
        storage.deleteNote(note1.id);
        expect(storage.getAllNotes()).toHaveLength(2);
        expect(storage.getNoteById(note1.id)).toBeUndefined();

        cleanup();
    });

    it('should persist data across storage instances', () => {
        setup();

        // Create notes with first storage instance
        const note1 = storage.createNote('Persistent Note 1', 'Should persist');
        const note2 = storage.createNote('Persistent Note 2', 'Should also persist');

        // Create new storage instance
        const newStorage = new NotesStorage();
        const notes = newStorage.getAllNotes();

        expect(notes).toHaveLength(2);
        expect(notes.some(n => n.title === 'Persistent Note 1')).toBe(true);
        expect(notes.some(n => n.title === 'Persistent Note 2')).toBe(true);

        // Modify with new instance
        const updatedNote = newStorage.updateNote(note1.id, { title: 'Updated Persistent Note' });
        expect(updatedNote.title).toBe('Updated Persistent Note');

        // Verify with original instance
        const originalInstanceNotes = storage.loadNotes();
        storage.notes = originalInstanceNotes;
        const retrievedNote = storage.getNoteById(note1.id);
        expect(retrievedNote.title).toBe('Updated Persistent Note');

        cleanup();
    });

    it('should handle search operations correctly', () => {
        setup();

        // Create test notes
        storage.createNote('JavaScript Basics', 'Learn about variables, functions, and objects in JavaScript.');
        storage.createNote('Python Tutorial', 'Python programming language fundamentals and syntax.');
        storage.createNote('Web Development', 'HTML, CSS, and JavaScript for modern web applications.');
        storage.createNote('Data Structures', 'Arrays, objects, and other data structures in programming.');

        // Test various search scenarios
        const jsResults = storage.searchNotes('JavaScript');
        expect(jsResults).toHaveLength(2);

        const pythonResults = storage.searchNotes('Python');
        expect(jsResults).toHaveLength(1);

        const programmingResults = storage.searchNotes('programming');
        expect(programmingResults).toHaveLength(2);

        const caseInsensitiveResults = storage.searchNotes('JAVASCRIPT');
        expect(caseInsensitiveResults).toHaveLength(2);

        const noResults = storage.searchNotes('nonexistent');
        expect(noResults).toHaveLength(0);

        const emptySearch = storage.searchNotes('');
        expect(emptySearch).toHaveLength(4);

        cleanup();
    });

    it('should handle export and import operations', () => {
        setup();

        // Create test data
        const note1 = storage.createNote('Export Test 1', 'Content for export test 1');
        const note2 = storage.createNote('Export Test 2', 'Content for export test 2');

        // Export data
        const exportData = storage.exportNotes();
        expect(exportData.notes).toHaveLength(2);
        expect(exportData.exportedAt).toBeTruthy();
        expect(exportData.metadata).toBeTruthy();
        expect(exportData.metadata.notesCount).toBe(2);

        // Clear storage
        storage.notes = [];
        storage.saveNotes();
        expect(storage.getAllNotes()).toHaveLength(0);

        // Import data
        const importSuccess = storage.importNotes(exportData);
        expect(importSuccess).toBe(true);

        const importedNotes = storage.getAllNotes();
        expect(importedNotes).toHaveLength(2);
        expect(importedNotes.some(n => n.title === 'Export Test 1')).toBe(true);
        expect(importedNotes.some(n => n.title === 'Export Test 2')).toBe(true);

        cleanup();
    });

    it('should handle edge cases and error conditions', () => {
        setup();

        // Test updating non-existent note
        const updateResult = storage.updateNote('non-existent-id', { title: 'Test' });
        expect(updateResult).toBeNull();

        // Test deleting non-existent note
        const deleteResult = storage.deleteNote('non-existent-id');
        expect(deleteResult).toBe(false);

        // Test creating note with only whitespace
        const whitespaceNote = storage.createNote('   ', '   ');
        expect(whitespaceNote.title).toBe('Untitled Note');
        expect(whitespaceNote.content).toBe('');

        // Test very long content
        const longContent = 'x'.repeat(10000);
        const longNote = storage.createNote('Long Content Test', longContent);
        expect(longNote.content).toHaveLength(10000);

        // Test special characters
        const specialNote = storage.createNote('Special <>&"\'', 'Content with <script>alert("xss")</script>');
        expect(specialNote.title).toBe('Special <>&"\'');
        expect(specialNote.content).toContain('<script>');

        cleanup();
    });

    it('should maintain data integrity during concurrent operations', () => {
        setup();

        // Simulate rapid operations
        const note1 = storage.createNote('Rapid Test 1');
        const note2 = storage.createNote('Rapid Test 2');
        const note3 = storage.createNote('Rapid Test 3');

        // Rapid updates
        storage.updateNote(note1.id, { title: 'Updated 1' });
        storage.updateNote(note2.id, { title: 'Updated 2' });
        storage.updateNote(note3.id, { title: 'Updated 3' });

        const notes = storage.getAllNotes();
        expect(notes).toHaveLength(3);
        expect(notes.some(n => n.title === 'Updated 1')).toBe(true);
        expect(notes.some(n => n.title === 'Updated 2')).toBe(true);
        expect(notes.some(n => n.title === 'Updated 3')).toBe(true);

        // Rapid deletions
        storage.deleteNote(note1.id);
        storage.deleteNote(note2.id);

        const remainingNotes = storage.getAllNotes();
        expect(remainingNotes).toHaveLength(1);
        expect(remainingNotes[0].title).toBe('Updated 3');

        cleanup();
    });

    it('should handle storage size calculations correctly', () => {
        setup();

        // Test empty storage
        let info = storage.getStorageInfo();
        expect(info.notesCount).toBe(0);
        expect(info.storageSize).toBe(0);

        // Add some notes and check size
        storage.createNote('Size Test', 'Content for size testing');
        info = storage.getStorageInfo();
        expect(info.notesCount).toBe(1);
        expect(info.storageSize).toBeGreaterThan(0);
        expect(info.storageSizeFormatted).toContain('B');

        // Add more content and verify size increase
        const largContent = 'x'.repeat(1000);
        storage.createNote('Large Note', largContent);
        const newInfo = storage.getStorageInfo();
        expect(newInfo.storageSize).toBeGreaterThan(info.storageSize);

        cleanup();
    });
});