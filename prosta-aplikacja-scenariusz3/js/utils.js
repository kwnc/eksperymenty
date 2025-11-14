/**
 * Utility Functions
 * Reusable helper functions for the application
 *
 * @module utils
 */

/**
 * Generate a unique ID (UUID v4)
 * @returns {string} UUID string
 */
export function generateId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }

  // Fallback implementation for older browsers
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

/**
 * Format a timestamp into a human-readable string
 * @param {number} timestamp - Unix timestamp in milliseconds
 * @returns {string} Formatted date string
 * @example
 * formatTimestamp(Date.now()) // "Just now"
 * formatTimestamp(Date.now() - 60000) // "1 minute ago"
 * formatTimestamp(Date.now() - 86400000) // "Yesterday"
 * formatTimestamp(Date.now() - 172800000) // "Nov 11, 2025"
 */
export function formatTimestamp(timestamp) {
  const now = Date.now();
  const diff = now - timestamp;
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  // Less than 1 minute
  if (seconds < 60) {
    return 'Just now';
  }

  // Less than 60 minutes
  if (minutes < 60) {
    return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  }

  // Less than 24 hours
  if (hours < 24) {
    return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  }

  const date = new Date(timestamp);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  // Yesterday
  if (days === 1 || (date.toDateString() === yesterday.toDateString())) {
    return 'Yesterday';
  }

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const month = months[date.getMonth()];
  const day = date.getDate();
  const year = date.getFullYear();

  // Within current year
  if (year === today.getFullYear()) {
    return `${month} ${day}`;
  }

  // Older
  return `${month} ${day}, ${year}`;
}

/**
 * Truncate text to a maximum length
 * @param {string} text - Text to truncate
 * @param {number} maxLength - Maximum length
 * @returns {string} Truncated text with ellipsis if needed
 */
export function truncateText(text, maxLength) {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
}

/**
 * Sanitize HTML to prevent XSS attacks
 * @param {string} html - HTML string to sanitize
 * @returns {string} Sanitized string
 */
export function sanitizeHtml(html) {
  if (!html) return '';
  // Remove all HTML tags and script content
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<[^>]*>/g, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '');
}

/**
 * Strip HTML tags from string
 * @param {string} html - HTML string
 * @returns {string} Plain text
 */
export function stripHtml(html) {
  if (!html) return '';
  const tmp = document.createElement('div');
  tmp.textContent = html; // Use textContent to avoid XSS
  return tmp.textContent || tmp.innerText || '';
}

/**
 * Debounce a function call
 * @param {Function} func - Function to debounce
 * @param {number} delay - Delay in milliseconds
 * @returns {Function} Debounced function
 */
export function debounce(func, delay) {
  let timeoutId;
  return function(...args) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      func.apply(this, args);
    }, delay);
  };
}

/**
 * Format bytes into human-readable string
 * @param {number} bytes - Number of bytes
 * @returns {string} Formatted string (e.g., "1.5 MB", "500 KB")
 */
export function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  if (!bytes || bytes < 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Validate email format (for future use)
 * @param {string} email - Email address to validate
 * @returns {boolean} True if valid email format
 */
export function isValidEmail(email) {
  if (!email) return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Deep clone an object
 * @param {Object} obj - Object to clone
 * @returns {Object} Cloned object
 */
export function deepClone(obj) {
  if (!obj) return obj;

  // Use structuredClone if available (modern browsers)
  if (typeof structuredClone !== 'undefined') {
    return structuredClone(obj);
  }

  // Fallback to JSON method
  try {
    return JSON.parse(JSON.stringify(obj));
  } catch (error) {
    console.error('Error cloning object:', error);
    return obj;
  }
}

/**
 * Get current timestamp
 * @returns {number} Current timestamp in milliseconds
 */
export function now() {
  // TODO: Implement by Agent 2
  return Date.now();
}

/**
 * Escape special characters for use in regex
 * @param {string} string - String to escape
 * @returns {string} Escaped string
 */
export function escapeRegex(string) {
  if (!string) return '';
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Calculate reading time estimate
 * @param {string} text - Text to analyze
 * @returns {string} Reading time estimate (e.g., "2 min read")
 */
export function getReadingTime(text) {
  if (!text) return '0 min read';

  const wordsPerMinute = 200;
  const words = text.trim().split(/\s+/).length;
  const minutes = Math.ceil(words / wordsPerMinute);

  return `${minutes} min read`;
}

/**
 * Validate note object structure
 * @param {Object} note - Note to validate
 * @returns {Object} { valid: boolean, errors: string[] }
 */
export function validateNote(note) {
  const errors = [];

  if (!note) {
    return { valid: false, errors: ['Note object is required'] };
  }

  if (!note.id || typeof note.id !== 'string') {
    errors.push('Note must have a valid id');
  }

  if (note.title === undefined || note.title === null) {
    errors.push('Note must have a title');
  }

  if (typeof note.title === 'string' && note.title.length > 100) {
    errors.push('Title must be 100 characters or less');
  }

  if (note.content === undefined || note.content === null) {
    errors.push('Note must have content');
  }

  if (typeof note.content === 'string' && note.content.length > 100000) {
    errors.push('Content must be 100,000 characters or less');
  }

  if (!note.createdAt || typeof note.createdAt !== 'number') {
    errors.push('Note must have a valid createdAt timestamp');
  }

  if (!note.updatedAt || typeof note.updatedAt !== 'number') {
    errors.push('Note must have a valid updatedAt timestamp');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}
