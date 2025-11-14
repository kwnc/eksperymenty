/**
 * Unit Tests for storage.js
 * Test localStorage operations and data persistence
 */

function runStorageTests() {
  describe('Storage Module Tests', () => {

    // Clean up before and after tests
    beforeEach(() => {
      cleanupTestData();
    });

    afterEach(() => {
      cleanupTestData();
    });

    // Test isStorageAvailable()
    describe('isStorageAvailable()', () => {
      it('should return true when localStorage is available', () => {
        const isAvailable = isStorageAvailable();
        assert.isTrue(isAvailable, 'localStorage should be available in test environment');
      });

      it('should allow test write and read', () => {
        assert.isTrue(isStorageAvailable());
        localStorage.setItem('test-key', 'test-value');
        const value = localStorage.getItem('test-key');
        assert.equals(value, 'test-value');
        localStorage.removeItem('test-key');
      });
    });

    // Test getDefaultSettings()
    describe('getDefaultSettings()', () => {
      it('should return default settings object', () => {
        const settings = getDefaultSettings();
        assert.exists(settings);
        assert.isType(settings, 'object');
      });

      it('should have correct default values', () => {
        const settings = getDefaultSettings();
        assert.equals(settings.lastActiveNote, null);
        assert.equals(settings.viewMode, 'all');
        assert.equals(settings.activeFilter, null);
        assert.equals(settings.sortBy, 'updatedAt');
        assert.equals(settings.sortDesc, true);
      });
    });

    // Test saveNotes() and loadNotes()
    describe('saveNotes() and loadNotes()', () => {
      it('should save and load empty array', () => {
        const notes = [];
        const saved = saveNotes(notes);
        assert.isTrue(saved);

        const loaded = loadNotes();
        assert.isType(loaded, 'array');
        assert.lengthEquals(loaded, 0);
      });

      it('should save and load notes array', () => {
        const notes = [
          {
            id: 'test-1',
            title: 'Test Note 1',
            content: 'Content 1',
            tags: ['tag1'],
            createdAt: Date.now(),
            updatedAt: Date.now()
          },
          {
            id: 'test-2',
            title: 'Test Note 2',
            content: 'Content 2',
            tags: ['tag2'],
            createdAt: Date.now(),
            updatedAt: Date.now()
          }
        ];

        const saved = saveNotes(notes);
        assert.isTrue(saved);

        const loaded = loadNotes();
        assert.lengthEquals(loaded, 2);
        assert.equals(loaded[0].id, 'test-1');
        assert.equals(loaded[1].id, 'test-2');
      });

      it('should return false when saving non-array', () => {
        const saved = saveNotes('not-an-array');
        assert.isFalse(saved);
      });

      it('should return empty array when no data exists', () => {
        const loaded = loadNotes();
        assert.isType(loaded, 'array');
        assert.lengthEquals(loaded, 0);
      });

      it('should handle corrupted data gracefully', () => {
        localStorage.setItem(STORAGE_KEYS.NOTES, 'invalid-json');
        const loaded = loadNotes();
        assert.isType(loaded, 'array');
        assert.lengthEquals(loaded, 0);
      });

      it('should preserve note data integrity', () => {
        const originalNote = {
          id: 'test-integrity',
          title: 'Integrity Test',
          content: 'Testing data integrity',
          tags: ['test', 'integrity'],
          createdAt: 1699900000000,
          updatedAt: 1699900100000
        };

        saveNotes([originalNote]);
        const loaded = loadNotes();

        assert.equals(loaded[0].id, originalNote.id);
        assert.equals(loaded[0].title, originalNote.title);
        assert.equals(loaded[0].content, originalNote.content);
        assert.deepEquals(loaded[0].tags, originalNote.tags);
        assert.equals(loaded[0].createdAt, originalNote.createdAt);
        assert.equals(loaded[0].updatedAt, originalNote.updatedAt);
      });
    });

    // Test saveSettings() and loadSettings()
    describe('saveSettings() and loadSettings()', () => {
      it('should save and load settings', () => {
        const settings = {
          lastActiveNote: 'note-123',
          viewMode: 'filtered',
          activeFilter: 'work',
          sortBy: 'title',
          sortDesc: false
        };

        const saved = saveSettings(settings);
        assert.isTrue(saved);

        const loaded = loadSettings();
        assert.equals(loaded.lastActiveNote, 'note-123');
        assert.equals(loaded.viewMode, 'filtered');
        assert.equals(loaded.activeFilter, 'work');
        assert.equals(loaded.sortBy, 'title');
        assert.equals(loaded.sortDesc, false);
      });

      it('should return default settings when no data exists', () => {
        const loaded = loadSettings();
        const defaults = getDefaultSettings();
        assert.deepEquals(loaded, defaults);
      });

      it('should merge with defaults for missing properties', () => {
        const partialSettings = {
          lastActiveNote: 'note-456'
        };

        saveSettings(partialSettings);
        const loaded = loadSettings();

        assert.equals(loaded.lastActiveNote, 'note-456');
        assert.equals(loaded.viewMode, 'all'); // Should use default
      });

      it('should handle corrupted settings data', () => {
        localStorage.setItem(STORAGE_KEYS.SETTINGS, 'invalid-json');
        const loaded = loadSettings();
        const defaults = getDefaultSettings();
        assert.deepEquals(loaded, defaults);
      });
    });

    // Test clearAllData()
    describe('clearAllData()', () => {
      it('should clear all notes and settings', () => {
        // Save some data first
        saveNotes([{ id: 'test', title: 'Test', content: '', tags: [], createdAt: Date.now(), updatedAt: Date.now() }]);
        saveSettings({ lastActiveNote: 'test' });

        // Verify data exists
        assert.lengthEquals(loadNotes(), 1);

        // Clear data
        const cleared = clearAllData();
        assert.isTrue(cleared);

        // Verify data is cleared
        assert.lengthEquals(loadNotes(), 0);
        const settings = loadSettings();
        assert.equals(settings.lastActiveNote, null); // Should be default
      });

      it('should return true even if no data exists', () => {
        const cleared = clearAllData();
        assert.isTrue(cleared);
      });
    });

    // Test getStorageInfo()
    describe('getStorageInfo()', () => {
      it('should return storage usage information', () => {
        const info = getStorageInfo();
        assert.exists(info);
        assert.exists(info.used);
        assert.exists(info.limit);
        assert.exists(info.percentage);
      });

      it('should calculate correct usage', () => {
        // Save some notes
        const notes = [
          {
            id: 'test-1',
            title: 'Test Note 1',
            content: 'Some content here',
            tags: ['tag1'],
            createdAt: Date.now(),
            updatedAt: Date.now()
          }
        ];
        saveNotes(notes);

        const info = getStorageInfo();
        assert.isTrue(info.used > 0, 'Storage should be used after saving data');
        assert.isTrue(info.limit > 0, 'Limit should be positive');
        assert.isTrue(parseFloat(info.percentage) >= 0, 'Percentage should be non-negative');
      });

      it('should return zero usage when no data', () => {
        cleanupTestData();
        const info = getStorageInfo();
        assert.equals(info.used, 0);
      });
    });

    // Test STORAGE_KEYS constant
    describe('STORAGE_KEYS', () => {
      it('should have correct key names', () => {
        assert.equals(STORAGE_KEYS.NOTES, 'noteNest_notes');
        assert.equals(STORAGE_KEYS.SETTINGS, 'noteNest_settings');
        assert.equals(STORAGE_KEYS.VERSION, 'noteNest_version');
      });
    });

    // Test data persistence across operations
    describe('Data Persistence', () => {
      it('should persist multiple save and load operations', () => {
        const notes1 = [
          { id: '1', title: 'Note 1', content: '', tags: [], createdAt: Date.now(), updatedAt: Date.now() }
        ];
        saveNotes(notes1);
        assert.lengthEquals(loadNotes(), 1);

        const notes2 = [
          { id: '1', title: 'Note 1', content: '', tags: [], createdAt: Date.now(), updatedAt: Date.now() },
          { id: '2', title: 'Note 2', content: '', tags: [], createdAt: Date.now(), updatedAt: Date.now() }
        ];
        saveNotes(notes2);
        assert.lengthEquals(loadNotes(), 2);

        const notes3 = [
          { id: '1', title: 'Note 1', content: '', tags: [], createdAt: Date.now(), updatedAt: Date.now() }
        ];
        saveNotes(notes3);
        assert.lengthEquals(loadNotes(), 1);
      });

      it('should handle special characters in note content', () => {
        const notes = [
          {
            id: 'test-special',
            title: 'Special <>&"\' Characters',
            content: 'Content with special chars: <>&"\'',
            tags: ['special-char'],
            createdAt: Date.now(),
            updatedAt: Date.now()
          }
        ];

        saveNotes(notes);
        const loaded = loadNotes();

        assert.lengthEquals(loaded, 1);
        assert.equals(loaded[0].title, 'Special <>&"\' Characters');
      });

      it('should handle unicode characters', () => {
        const notes = [
          {
            id: 'test-unicode',
            title: 'Unicode: 你好 🎉 café',
            content: 'Content: 日本語 한글 Ελληνικά',
            tags: ['unicode'],
            createdAt: Date.now(),
            updatedAt: Date.now()
          }
        ];

        saveNotes(notes);
        const loaded = loadNotes();

        assert.lengthEquals(loaded, 1);
        assert.isTrue(loaded[0].title.includes('你好'));
        assert.isTrue(loaded[0].content.includes('日本語'));
      });
    });
  });
}
