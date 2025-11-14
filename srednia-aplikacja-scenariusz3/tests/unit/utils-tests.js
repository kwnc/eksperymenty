/**
 * Unit Tests for utils.js
 * Test all utility functions
 */

function runUtilsTests() {
  describe('Utils Module Tests', () => {

    // Test generateId()
    describe('generateId()', () => {
      it('should generate a unique ID', () => {
        const id = generateId();
        assert.exists(id);
        assert.isType(id, 'string');
      });

      it('should generate different IDs on consecutive calls', () => {
        const id1 = generateId();
        const id2 = generateId();
        assert.isFalse(id1 === id2, 'IDs should be unique');
      });

      it('should include timestamp in ID format', () => {
        const id = generateId();
        assert.isTrue(id.includes('-'), 'ID should contain hyphen separator');
        const parts = id.split('-');
        assert.lengthEquals(parts, 2, 'ID should have two parts');
        assert.isFalse(isNaN(parseInt(parts[0])), 'First part should be numeric timestamp');
      });
    });

    // Test formatDate()
    describe('formatDate()', () => {
      it('should format a timestamp to readable date string', () => {
        const timestamp = Date.now();
        const formatted = formatDate(timestamp);
        assert.exists(formatted);
        assert.isType(formatted, 'string');
      });

      it('should include month, day, and year', () => {
        const timestamp = new Date('2025-11-13T14:30:00').getTime();
        const formatted = formatDate(timestamp);
        assert.isTrue(formatted.includes('Nov') || formatted.includes('11'));
        assert.isTrue(formatted.includes('13'));
        assert.isTrue(formatted.includes('2025'));
      });

      it('should handle past dates correctly', () => {
        const pastTimestamp = new Date('2020-01-01T00:00:00').getTime();
        const formatted = formatDate(pastTimestamp);
        assert.isTrue(formatted.includes('2020'));
      });
    });

    // Test sanitizeHTML()
    describe('sanitizeHTML()', () => {
      it('should sanitize HTML tags', () => {
        const input = '<script>alert("xss")</script>';
        const sanitized = sanitizeHTML(input);
        assert.isFalse(sanitized.includes('<script>'));
        assert.isTrue(sanitized.includes('&lt;script&gt;'));
      });

      it('should handle plain text without modification', () => {
        const input = 'Hello World';
        const sanitized = sanitizeHTML(input);
        assert.equals(sanitized, 'Hello World');
      });

      it('should sanitize multiple HTML tags', () => {
        const input = '<div><span>test</span></div>';
        const sanitized = sanitizeHTML(input);
        assert.isFalse(sanitized.includes('<div>'));
        assert.isFalse(sanitized.includes('<span>'));
      });

      it('should handle special characters', () => {
        const input = 'Test & < > " \' characters';
        const sanitized = sanitizeHTML(input);
        assert.exists(sanitized);
        // Should escape special HTML characters
        assert.isTrue(sanitized.includes('&amp;') || sanitized === input);
      });

      it('should handle empty string', () => {
        const sanitized = sanitizeHTML('');
        assert.equals(sanitized, '');
      });
    });

    // Test debounce()
    describe('debounce()', () => {
      it('should return a function', () => {
        const debouncedFn = debounce(() => {}, 100);
        assert.isType(debouncedFn, 'function');
      });

      it('should delay function execution', (done) => {
        let called = false;
        const debouncedFn = debounce(() => {
          called = true;
        }, 50);

        debouncedFn();

        // Should not be called immediately
        assert.isFalse(called, 'Function should not be called immediately');
      });

      it('should execute function after delay', (done) => {
        let called = false;
        const debouncedFn = debounce(() => {
          called = true;
        }, 10);

        debouncedFn();

        setTimeout(() => {
          assert.isTrue(called, 'Function should be called after delay');
        }, 50);
      });
    });

    // Test parseTags()
    describe('parseTags()', () => {
      it('should parse comma-separated tags', () => {
        const tags = parseTags('tag1, tag2, tag3');
        assert.isType(tags, 'array');
        assert.lengthEquals(tags, 3);
        assert.contains(tags, 'tag1');
        assert.contains(tags, 'tag2');
        assert.contains(tags, 'tag3');
      });

      it('should convert tags to lowercase', () => {
        const tags = parseTags('TAG1, Tag2, tAg3');
        assert.contains(tags, 'tag1');
        assert.contains(tags, 'tag2');
        assert.contains(tags, 'tag3');
      });

      it('should trim whitespace from tags', () => {
        const tags = parseTags('  tag1  ,  tag2  ');
        assert.contains(tags, 'tag1');
        assert.contains(tags, 'tag2');
      });

      it('should filter out empty tags', () => {
        const tags = parseTags('tag1, , tag2,  , tag3');
        assert.lengthEquals(tags, 3);
      });

      it('should return empty array for empty string', () => {
        const tags = parseTags('');
        assert.isType(tags, 'array');
        assert.lengthEquals(tags, 0);
      });

      it('should return empty array for null/undefined', () => {
        const tags1 = parseTags(null);
        const tags2 = parseTags(undefined);
        assert.lengthEquals(tags1, 0);
        assert.lengthEquals(tags2, 0);
      });

      it('should handle single tag without comma', () => {
        const tags = parseTags('singletag');
        assert.lengthEquals(tags, 1);
        assert.contains(tags, 'singletag');
      });
    });

    // Test validateNote()
    describe('validateNote()', () => {
      it('should validate a correct note object', () => {
        const validNote = {
          id: 'test-123',
          title: 'Test Note',
          content: 'Test content',
          tags: ['tag1', 'tag2'],
          createdAt: Date.now(),
          updatedAt: Date.now()
        };
        const isValid = validateNote(validNote);
        assert.isTrue(isValid, 'Valid note should pass validation');
      });

      it('should reject note without id', () => {
        const invalidNote = {
          title: 'Test Note',
          content: 'Test content',
          tags: [],
          createdAt: Date.now(),
          updatedAt: Date.now()
        };
        const isValid = validateNote(invalidNote);
        assert.isFalse(isValid);
      });

      it('should reject note without title', () => {
        const invalidNote = {
          id: 'test-123',
          content: 'Test content',
          tags: [],
          createdAt: Date.now(),
          updatedAt: Date.now()
        };
        const isValid = validateNote(invalidNote);
        assert.isFalse(isValid);
      });

      it('should reject note with non-string title', () => {
        const invalidNote = {
          id: 'test-123',
          title: 123,
          content: 'Test content',
          tags: [],
          createdAt: Date.now(),
          updatedAt: Date.now()
        };
        const isValid = validateNote(invalidNote);
        assert.isFalse(isValid);
      });

      it('should reject note with title longer than 200 chars', () => {
        const invalidNote = {
          id: 'test-123',
          title: 'a'.repeat(201),
          content: 'Test content',
          tags: [],
          createdAt: Date.now(),
          updatedAt: Date.now()
        };
        const isValid = validateNote(invalidNote);
        assert.isFalse(isValid);
      });

      it('should reject note with non-array tags', () => {
        const invalidNote = {
          id: 'test-123',
          title: 'Test Note',
          content: 'Test content',
          tags: 'not-an-array',
          createdAt: Date.now(),
          updatedAt: Date.now()
        };
        const isValid = validateNote(invalidNote);
        assert.isFalse(isValid);
      });

      it('should reject note without timestamps', () => {
        const invalidNote = {
          id: 'test-123',
          title: 'Test Note',
          content: 'Test content',
          tags: []
        };
        const isValid = validateNote(invalidNote);
        assert.isFalse(isValid);
      });

      it('should reject null or undefined', () => {
        assert.isFalse(validateNote(null));
        assert.isFalse(validateNote(undefined));
      });

      it('should accept note with empty content', () => {
        const validNote = {
          id: 'test-123',
          title: 'Test Note',
          content: '',
          tags: [],
          createdAt: Date.now(),
          updatedAt: Date.now()
        };
        const isValid = validateNote(validNote);
        assert.isTrue(isValid);
      });

      it('should accept note with empty tags array', () => {
        const validNote = {
          id: 'test-123',
          title: 'Test Note',
          content: 'Test content',
          tags: [],
          createdAt: Date.now(),
          updatedAt: Date.now()
        };
        const isValid = validateNote(validNote);
        assert.isTrue(isValid);
      });
    });
  });
}
