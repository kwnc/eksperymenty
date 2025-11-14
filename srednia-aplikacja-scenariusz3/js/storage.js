/**
 * storage.js - Data Persistence Layer
 * Handle all localStorage operations with error handling and data validation
 */

// localStorage Keys
const STORAGE_KEYS = {
  NOTES: 'noteNest_notes',           // Array of Note objects
  SETTINGS: 'noteNest_settings',     // AppSettings object
  VERSION: 'noteNest_version'        // Schema version for migrations
};

/**
 * Load all notes from localStorage
 * @returns {Note[]} Array of note objects
 */
function loadNotes() {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.NOTES);
    if (!data) return [];
    const notes = JSON.parse(data);
    return Array.isArray(notes) ? notes : [];
  } catch (error) {
    console.error('Error loading notes:', error);
    return [];
  }
}

/**
 * Save notes array to localStorage
 * @param {Note[]} notes - Array of note objects
 * @returns {boolean} True if successful
 */
function saveNotes(notes) {
  try {
    if (!Array.isArray(notes)) {
      throw new Error('Notes must be an array');
    }
    const data = JSON.stringify(notes);
    localStorage.setItem(STORAGE_KEYS.NOTES, data);
    return true;
  } catch (error) {
    console.error('Error saving notes:', error);
    if (error.name === 'QuotaExceededError') {
      alert('Storage quota exceeded. Please delete some notes.');
    }
    return false;
  }
}

/**
 * Load application settings
 * @returns {AppSettings} Settings object
 */
function loadSettings() {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (!data) return getDefaultSettings();
    return { ...getDefaultSettings(), ...JSON.parse(data) };
  } catch (error) {
    console.error('Error loading settings:', error);
    return getDefaultSettings();
  }
}

/**
 * Save application settings
 * @param {AppSettings} settings - Settings object
 * @returns {boolean} True if successful
 */
function saveSettings(settings) {
  try {
    const data = JSON.stringify(settings);
    localStorage.setItem(STORAGE_KEYS.SETTINGS, data);
    return true;
  } catch (error) {
    console.error('Error saving settings:', error);
    return false;
  }
}

/**
 * Get default settings
 * @returns {AppSettings} Default settings object
 */
function getDefaultSettings() {
  return {
    lastActiveNote: null,
    viewMode: 'all',
    activeFilter: null,
    sortBy: 'updatedAt',
    sortDesc: true
  };
}

/**
 * Clear all application data
 * @returns {boolean} True if successful
 */
function clearAllData() {
  try {
    localStorage.removeItem(STORAGE_KEYS.NOTES);
    localStorage.removeItem(STORAGE_KEYS.SETTINGS);
    return true;
  } catch (error) {
    console.error('Error clearing data:', error);
    return false;
  }
}

/**
 * Check localStorage availability
 * @returns {boolean} True if available
 */
function isStorageAvailable() {
  try {
    const test = '__storage_test__';
    localStorage.setItem(test, test);
    localStorage.removeItem(test);
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Get storage usage information
 * @returns {Object} Storage usage stats
 */
function getStorageInfo() {
  try {
    const notes = localStorage.getItem(STORAGE_KEYS.NOTES) || '';
    const settings = localStorage.getItem(STORAGE_KEYS.SETTINGS) || '';
    const totalSize = notes.length + settings.length;
    const estimatedLimit = 5 * 1024 * 1024; // 5MB estimate

    return {
      used: totalSize,
      limit: estimatedLimit,
      percentage: (totalSize / estimatedLimit * 100).toFixed(2)
    };
  } catch (error) {
    return { used: 0, limit: 0, percentage: 0 };
  }
}
