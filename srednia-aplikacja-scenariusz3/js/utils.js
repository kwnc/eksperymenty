/**
 * utils.js - Utility Functions
 * Provides reusable helper functions for common operations
 */

/**
 * Generate a unique ID for notes
 * @returns {string} Unique identifier
 */
function generateId() {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Format a timestamp to readable date string
 * @param {number} timestamp - Unix timestamp
 * @returns {string} Formatted date (e.g., "Nov 13, 2025 at 2:30 PM")
 */
function formatDate(timestamp) {
  const date = new Date(timestamp);
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  });
}

/**
 * Sanitize HTML to prevent XSS
 * @param {string} text - Text to sanitize
 * @returns {string} Sanitized text
 */
function sanitizeHTML(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/**
 * Debounce function execution
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in milliseconds
 * @returns {Function} Debounced function
 */
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Parse tags from comma-separated string
 * @param {string} tagsString - Tags as comma-separated string
 * @returns {string[]} Array of cleaned tag strings
 */
function parseTags(tagsString) {
  if (!tagsString) return [];
  return tagsString
    .split(',')
    .map(tag => tag.trim().toLowerCase())
    .filter(tag => tag.length > 0);
}

/**
 * Validate note object structure
 * @param {Object} note - Note object to validate
 * @returns {boolean} True if valid
 */
function validateNote(note) {
  if (!note || typeof note !== 'object') return false;
  if (!note.id || typeof note.id !== 'string') return false;
  if (!note.title || typeof note.title !== 'string') return false;
  if (note.title.length > 200) return false;
  if (!Array.isArray(note.tags)) return false;
  if (!note.createdAt || !note.updatedAt) return false;
  return true;
}
