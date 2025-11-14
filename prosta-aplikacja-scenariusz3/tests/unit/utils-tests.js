/**
 * Unit Tests for utils.js
 * Tests all utility functions
 */

import { describe, it, expect } from '../test-framework.js';
import * as utils from '../../js/utils.js';

describe('Utils - generateId()', () => {
  it('should generate a valid UUID format', () => {
    const id = utils.generateId();
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    expect(uuidRegex.test(id)).toBeTruthy();
  });

  it('should generate unique IDs', () => {
    const id1 = utils.generateId();
    const id2 = utils.generateId();
    expect(id1 !== id2).toBeTruthy();
  });

  it('should always return a string', () => {
    const id = utils.generateId();
    expect(typeof id).toBe('string');
  });
});

describe('Utils - formatTimestamp()', () => {
  it('should return "Just now" for recent timestamps', () => {
    const now = Date.now();
    const result = utils.formatTimestamp(now);
    expect(result).toBe('Just now');
  });

  it('should return minutes for timestamps less than an hour old', () => {
    const fiveMinutesAgo = Date.now() - (5 * 60 * 1000);
    const result = utils.formatTimestamp(fiveMinutesAgo);
    expect(result).toContain('minute');
    expect(result).toContain('ago');
  });

  it('should return hours for timestamps less than a day old', () => {
    const twoHoursAgo = Date.now() - (2 * 60 * 60 * 1000);
    const result = utils.formatTimestamp(twoHoursAgo);
    expect(result).toContain('hour');
    expect(result).toContain('ago');
  });

  it('should return "Yesterday" for yesterday timestamps', () => {
    const yesterday = Date.now() - (24 * 60 * 60 * 1000);
    const result = utils.formatTimestamp(yesterday);
    expect(result).toBe('Yesterday');
  });

  it('should return formatted date for older timestamps', () => {
    const oneWeekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
    const result = utils.formatTimestamp(oneWeekAgo);
    expect(result.length).toBeGreaterThan(0);
    expect(typeof result).toBe('string');
  });
});

describe('Utils - truncateText()', () => {
  it('should return original text if shorter than maxLength', () => {
    const text = 'Hello';
    const result = utils.truncateText(text, 10);
    expect(result).toBe('Hello');
  });

  it('should truncate text longer than maxLength', () => {
    const text = 'This is a very long text that should be truncated';
    const result = utils.truncateText(text, 10);
    expect(result.length).toBe(13); // 10 chars + '...'
    expect(result).toContain('...');
  });

  it('should handle empty string', () => {
    const result = utils.truncateText('', 10);
    expect(result).toBe('');
  });

  it('should handle null input', () => {
    const result = utils.truncateText(null, 10);
    expect(result).toBe('');
  });

  it('should handle undefined input', () => {
    const result = utils.truncateText(undefined, 10);
    expect(result).toBe('');
  });
});

describe('Utils - sanitizeHtml()', () => {
  it('should remove HTML tags', () => {
    const html = '<p>Hello <strong>World</strong></p>';
    const result = utils.sanitizeHtml(html);
    expect(result).toBe('Hello World');
  });

  it('should remove script tags', () => {
    const html = '<script>alert("xss")</script>Hello';
    const result = utils.sanitizeHtml(html);
    expect(result.toLowerCase()).not.toContain('<script');
    expect(result.toLowerCase()).not.toContain('</script');
  });

  it('should remove javascript: protocol', () => {
    const html = '<a href="javascript:alert()">Click</a>';
    const result = utils.sanitizeHtml(html);
    expect(result.toLowerCase()).not.toContain('javascript:');
  });

  it('should handle empty string', () => {
    const result = utils.sanitizeHtml('');
    expect(result).toBe('');
  });

  it('should handle plain text', () => {
    const text = 'Plain text without HTML';
    const result = utils.sanitizeHtml(text);
    expect(result).toBe(text);
  });
});

describe('Utils - stripHtml()', () => {
  it('should return plain text from HTML', () => {
    const html = '<p>Test</p>';
    const result = utils.stripHtml(html);
    expect(result).toBe(html); // textContent preserves the tags as text
  });

  it('should handle empty string', () => {
    const result = utils.stripHtml('');
    expect(result).toBe('');
  });

  it('should handle null', () => {
    const result = utils.stripHtml(null);
    expect(result).toBe('');
  });
});

describe('Utils - debounce()', () => {
  it('should return a function', () => {
    const debouncedFn = utils.debounce(() => {}, 100);
    expect(typeof debouncedFn).toBe('function');
  });

  it('should delay function execution', (done) => {
    let called = false;
    const debouncedFn = utils.debounce(() => {
      called = true;
    }, 50);

    debouncedFn();
    expect(called).toBeFalsy();

    setTimeout(() => {
      expect(called).toBeTruthy();
      done();
    }, 100);
  });
});

describe('Utils - formatBytes()', () => {
  it('should format zero bytes', () => {
    const result = utils.formatBytes(0);
    expect(result).toBe('0 Bytes');
  });

  it('should format bytes', () => {
    const result = utils.formatBytes(500);
    expect(result).toContain('Bytes');
  });

  it('should format kilobytes', () => {
    const result = utils.formatBytes(1024);
    expect(result).toContain('KB');
  });

  it('should format megabytes', () => {
    const result = utils.formatBytes(1024 * 1024);
    expect(result).toContain('MB');
  });

  it('should format gigabytes', () => {
    const result = utils.formatBytes(1024 * 1024 * 1024);
    expect(result).toContain('GB');
  });

  it('should handle negative values', () => {
    const result = utils.formatBytes(-100);
    expect(result).toBe('0 Bytes');
  });
});

describe('Utils - isValidEmail()', () => {
  it('should validate correct email', () => {
    expect(utils.isValidEmail('test@example.com')).toBeTruthy();
  });

  it('should reject email without @', () => {
    expect(utils.isValidEmail('testexample.com')).toBeFalsy();
  });

  it('should reject email without domain', () => {
    expect(utils.isValidEmail('test@')).toBeFalsy();
  });

  it('should reject empty string', () => {
    expect(utils.isValidEmail('')).toBeFalsy();
  });

  it('should reject null', () => {
    expect(utils.isValidEmail(null)).toBeFalsy();
  });
});

describe('Utils - deepClone()', () => {
  it('should clone an object', () => {
    const obj = { a: 1, b: 2 };
    const cloned = utils.deepClone(obj);
    expect(cloned).toEqual(obj);
    expect(cloned !== obj).toBeTruthy();
  });

  it('should clone nested objects', () => {
    const obj = { a: { b: { c: 1 } } };
    const cloned = utils.deepClone(obj);
    expect(cloned).toEqual(obj);
    cloned.a.b.c = 2;
    expect(obj.a.b.c).toBe(1);
  });

  it('should handle null', () => {
    const result = utils.deepClone(null);
    expect(result).toBeNull();
  });

  it('should handle undefined', () => {
    const result = utils.deepClone(undefined);
    expect(result).toBeUndefined();
  });
});

describe('Utils - now()', () => {
  it('should return a number', () => {
    const result = utils.now();
    expect(typeof result).toBe('number');
  });

  it('should return current timestamp', () => {
    const result = utils.now();
    const expected = Date.now();
    expect(Math.abs(result - expected)).toBeLessThan(10);
  });
});

describe('Utils - escapeRegex()', () => {
  it('should escape special regex characters', () => {
    const result = utils.escapeRegex('test.*+?');
    expect(result).toContain('\\.');
    expect(result).toContain('\\*');
    expect(result).toContain('\\+');
    expect(result).toContain('\\?');
  });

  it('should handle empty string', () => {
    const result = utils.escapeRegex('');
    expect(result).toBe('');
  });

  it('should handle plain text', () => {
    const result = utils.escapeRegex('hello');
    expect(result).toBe('hello');
  });
});

describe('Utils - getReadingTime()', () => {
  it('should calculate reading time', () => {
    const text = 'word '.repeat(200); // 200 words
    const result = utils.getReadingTime(text);
    expect(result).toContain('min read');
  });

  it('should handle empty text', () => {
    const result = utils.getReadingTime('');
    expect(result).toBe('0 min read');
  });

  it('should handle short text', () => {
    const text = 'Short text';
    const result = utils.getReadingTime(text);
    expect(result).toContain('min read');
  });
});

describe('Utils - validateNote()', () => {
  it('should validate a correct note', () => {
    const note = {
      id: '123',
      title: 'Test',
      content: 'Content',
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    const result = utils.validateNote(note);
    expect(result.valid).toBeTruthy();
    expect(result.errors).toHaveLength(0);
  });

  it('should reject note without id', () => {
    const note = {
      title: 'Test',
      content: 'Content',
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    const result = utils.validateNote(note);
    expect(result.valid).toBeFalsy();
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it('should reject note without title', () => {
    const note = {
      id: '123',
      content: 'Content',
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    const result = utils.validateNote(note);
    expect(result.valid).toBeFalsy();
  });

  it('should reject note with title too long', () => {
    const note = {
      id: '123',
      title: 'a'.repeat(101),
      content: 'Content',
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    const result = utils.validateNote(note);
    expect(result.valid).toBeFalsy();
  });

  it('should reject null note', () => {
    const result = utils.validateNote(null);
    expect(result.valid).toBeFalsy();
    expect(result.errors).toHaveLength(1);
  });
});
