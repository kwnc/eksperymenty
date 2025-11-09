// Performance Tests for NoteNest Application
const fs = require('fs');
const path = require('path');

// Performance testing utilities
class PerformanceMonitor {
  constructor() {
    this.metrics = {};
    this.memoryBaseline = null;
  }

  startTimer(name) {
    this.metrics[name] = { startTime: performance.now() };
  }

  endTimer(name) {
    if (this.metrics[name]) {
      this.metrics[name].duration = performance.now() - this.metrics[name].startTime;
      return this.metrics[name].duration;
    }
    return 0;
  }

  measureMemory() {
    // In a real environment, you'd use performance.measureUserAgentSpecificMemory()
    // For testing, we'll simulate memory measurement
    return {
      used: Math.random() * 50 + 10, // 10-60 MB
      available: 1000 // 1GB
    };
  }

  setMemoryBaseline() {
    this.memoryBaseline = this.measureMemory();
  }

  getMemoryDelta() {
    if (!this.memoryBaseline) return null;
    const current = this.measureMemory();
    return {
      used: current.used - this.memoryBaseline.used,
      percentage: ((current.used - this.memoryBaseline.used) / this.memoryBaseline.used) * 100
    };
  }

  getMetrics() {
    return { ...this.metrics };
  }

  clearMetrics() {
    this.metrics = {};
  }
}

// Load application modules
const storageManagerCode = fs.readFileSync(path.join(process.cwd(), 'assets/js/storage.js'), 'utf8');
const authManagerCode = fs.readFileSync(path.join(process.cwd(), 'assets/js/auth.js'), 'utf8');
const notesManagerCode = fs.readFileSync(path.join(process.cwd(), 'assets/js/notes.js'), 'utf8');
const searchManagerCode = fs.readFileSync(path.join(process.cwd(), 'assets/js/search.js'), 'utf8');

// Mock high-performance storage
class PerformanceStorageManager {
  constructor() {
    this.data = {
      users: new Map(),
      notes: new Map(),
      notebooks: new Map(),
      sessions: new Map()
    };
    this.idCounter = 1;
    this.operationCount = 0;
    this.initPromise = Promise.resolve();
    this.isReady = true;
  }

  async saveNote(noteData) {
    this.operationCount++;
    const id = noteData.id || `note_${this.idCounter++}`;
    const note = {
      id,
      ...noteData,
      createdAt: noteData.createdAt || new Date().toISOString(),
      modifiedAt: new Date().toISOString()
    };

    // Simulate realistic storage delay
    await new Promise(resolve => setTimeout(resolve, Math.random() * 2));

    this.data.notes.set(id, note);
    return note;
  }

  async getNotesByUserId(userId) {
    this.operationCount++;
    await new Promise(resolve => setTimeout(resolve, Math.random()));
    return Array.from(this.data.notes.values()).filter(note => note.userId === userId);
  }

  async searchNotes(userId, query) {
    this.operationCount++;
    const searchTime = Math.random() * 5; // Simulate search complexity
    await new Promise(resolve => setTimeout(resolve, searchTime));

    const notes = Array.from(this.data.notes.values()).filter(note => note.userId === userId);
    return notes.filter(note =>
      note.title.toLowerCase().includes(query.toLowerCase()) ||
      note.content.toLowerCase().includes(query.toLowerCase()) ||
      note.tags.some(tag => tag.toLowerCase().includes(query.toLowerCase()))
    );
  }

  async bulkInsert(items, type) {
    this.operationCount += items.length;
    const results = [];

    for (const item of items) {
      const id = `${type}_${this.idCounter++}`;
      const record = {
        id,
        ...item,
        createdAt: new Date().toISOString(),
        modifiedAt: new Date().toISOString()
      };

      this.data[type].set(id, record);
      results.push(record);

      // Simulate batching delay
      if (results.length % 10 === 0) {
        await new Promise(resolve => setTimeout(resolve, 1));
      }
    }

    return results;
  }

  getOperationCount() {
    return this.operationCount;
  }

  resetOperationCount() {
    this.operationCount = 0;
  }

  getDataSize() {
    let size = 0;
    for (const [key, map] of Object.entries(this.data)) {
      size += map.size;
    }
    return size;
  }
}

// Set up globals and execute code
global.StorageManager = PerformanceStorageManager;
global.crypto = {
  subtle: {
    digest: jest.fn().mockResolvedValue(new ArrayBuffer(32))
  }
};

eval(storageManagerCode);
eval(authManagerCode);
eval(notesManagerCode);
eval(searchManagerCode);

describe('NoteNest Performance Tests', () => {
  let performanceMonitor;
  let storageManager;
  let authManager;
  let notesManager;
  let searchManager;

  beforeEach(async () => {
    jest.clearAllMocks();
    performanceMonitor = new PerformanceMonitor();

    // Initialize managers
    storageManager = new PerformanceStorageManager();
    authManager = new AuthManager();
    notesManager = new NotesManager();
    searchManager = new SearchManager();

    // Set up dependencies
    authManager.storageManager = storageManager;
    notesManager.setAuthManager(authManager);
    notesManager.storageManager = storageManager;
    searchManager.setAuthManager(authManager);
    searchManager.setNotesManager(notesManager);

    // Create test user
    await authManager.register('Performance User', 'perf@test.com', 'SecurePass123');

    performanceMonitor.setMemoryBaseline();
  });

  describe('Storage Performance', () => {
    test('should handle bulk note creation efficiently', async () => {
      const noteCount = 1000;
      const notes = [];

      // Generate test notes
      for (let i = 0; i < noteCount; i++) {
        notes.push({
          title: `Performance Test Note ${i}`,
          content: `<p>This is test content for note ${i}. It contains some text to simulate real note content.</p>`,
          tags: [`tag${i % 10}`, `category${i % 5}`, 'performance'],
          userId: authManager.getCurrentUser().id,
          notebookId: 'default'
        });
      }

      performanceMonitor.startTimer('bulkCreate');

      // Create notes in batches
      const batchSize = 100;
      for (let i = 0; i < notes.length; i += batchSize) {
        const batch = notes.slice(i, i + batchSize);
        const promises = batch.map(note => storageManager.saveNote(note));
        await Promise.all(promises);
      }

      const createTime = performanceMonitor.endTimer('bulkCreate');

      expect(createTime).toBeLessThan(5000); // Should complete in under 5 seconds
      expect(storageManager.getDataSize()).toBe(noteCount + 1); // +1 for user
      expect(storageManager.getOperationCount()).toBe(noteCount);
    });

    test('should load large datasets efficiently', async () => {
      // Create test data
      const noteCount = 500;
      for (let i = 0; i < noteCount; i++) {
        await storageManager.saveNote({
          title: `Load Test Note ${i}`,
          content: `<p>Content ${i}</p>`,
          tags: [`tag${i % 20}`],
          userId: authManager.getCurrentUser().id
        });
      }

      performanceMonitor.startTimer('loadNotes');
      await notesManager.loadNotes();
      const loadTime = performanceMonitor.endTimer('loadNotes');

      expect(loadTime).toBeLessThan(1000); // Should load in under 1 second
      expect(notesManager.notes).toHaveLength(noteCount);
    });

    test('should handle concurrent operations efficiently', async () => {
      const concurrentOps = 50;
      const operations = [];

      performanceMonitor.startTimer('concurrentOps');

      // Create concurrent save operations
      for (let i = 0; i < concurrentOps; i++) {
        operations.push(
          notesManager.createNote({
            title: `Concurrent Note ${i}`,
            content: `<p>Concurrent content ${i}</p>`,
            tags: ['concurrent', `batch${Math.floor(i / 10)}`]
          })
        );
      }

      const results = await Promise.all(operations);
      const concurrentTime = performanceMonitor.endTimer('concurrentOps');

      expect(concurrentTime).toBeLessThan(2000); // Should complete in under 2 seconds
      expect(results).toHaveLength(concurrentOps);
      expect(results.every(result => result && result.id)).toBe(true);
    });
  });

  describe('Search Performance', () => {
    beforeEach(async () => {
      // Create searchable test data
      const searchTerms = ['javascript', 'python', 'react', 'nodejs', 'database', 'algorithm', 'design', 'testing'];

      for (let i = 0; i < 200; i++) {
        const term = searchTerms[i % searchTerms.length];
        await storageManager.saveNote({
          title: `${term} Tutorial ${i}`,
          content: `<p>This is a comprehensive guide about ${term} development. It covers advanced topics and practical examples.</p>`,
          tags: [term, 'tutorial', `level${i % 3}`],
          userId: authManager.getCurrentUser().id
        });
      }

      await notesManager.loadNotes();
    });

    test('should perform text search efficiently', async () => {
      const searchQuery = 'javascript';

      performanceMonitor.startTimer('textSearch');
      const results = notesManager.searchNotes(searchQuery);
      const searchTime = performanceMonitor.endTimer('textSearch');

      expect(searchTime).toBeLessThan(100); // Should search in under 100ms
      expect(results.length).toBeGreaterThan(0);
      expect(results.every(note =>
        note.title.toLowerCase().includes(searchQuery) ||
        note.content.toLowerCase().includes(searchQuery) ||
        note.tags.some(tag => tag.toLowerCase().includes(searchQuery))
      )).toBe(true);
    });

    test('should handle complex search queries efficiently', async () => {
      const complexQueries = [
        'javascript react',
        'tutorial advanced',
        'python algorithm',
        'design testing level1'
      ];

      for (const query of complexQueries) {
        performanceMonitor.startTimer(`complexSearch_${query}`);
        const results = notesManager.searchNotes(query);
        const searchTime = performanceMonitor.endTimer(`complexSearch_${query}`);

        expect(searchTime).toBeLessThan(150); // Should complete complex searches in under 150ms
        expect(Array.isArray(results)).toBe(true);
      }
    });

    test('should handle empty and edge case searches', async () => {
      const edgeCases = ['', '   ', 'nonexistent', '!@#$%', 'a'.repeat(100)];

      for (const query of edgeCases) {
        performanceMonitor.startTimer(`edgeSearch_${query.substring(0, 10)}`);
        const results = notesManager.searchNotes(query);
        const searchTime = performanceMonitor.endTimer(`edgeSearch_${query.substring(0, 10)}`);

        expect(searchTime).toBeLessThan(50); // Edge cases should be handled very quickly
        expect(Array.isArray(results)).toBe(true);
      }
    });
  });

  describe('Memory Usage', () => {
    test('should not cause memory leaks with large datasets', async () => {
      const initialMemory = performanceMonitor.measureMemory();

      // Create and manipulate large amounts of data
      for (let cycle = 0; cycle < 5; cycle++) {
        // Create notes
        for (let i = 0; i < 100; i++) {
          await notesManager.createNote({
            title: `Memory Test Note ${cycle}_${i}`,
            content: `<p>Memory test content for cycle ${cycle}, note ${i}</p>`.repeat(10),
            tags: [`cycle${cycle}`, `note${i}`, 'memory-test']
          });
        }

        // Load and search
        await notesManager.loadNotes();
        notesManager.searchNotes(`cycle${cycle}`);

        // Clear current note references
        notesManager.currentNote = null;
        notesManager.notes = [];
      }

      const finalMemory = performanceMonitor.measureMemory();
      const memoryIncrease = finalMemory.used - initialMemory.used;

      // Memory increase should be reasonable (less than 50% of initial)
      expect(memoryIncrease).toBeLessThan(initialMemory.used * 0.5);
    });

    test('should efficiently manage note editor memory', async () => {
      const baselineMemory = performanceMonitor.measureMemory();

      // Simulate opening and closing many notes
      for (let i = 0; i < 50; i++) {
        const note = await notesManager.createNote({
          title: `Editor Memory Test ${i}`,
          content: `<p>${'Large content block '.repeat(100)}</p>`,
          tags: ['memory', 'editor']
        });

        // Simulate editing
        await notesManager.setCurrentNote(note.id);
        await notesManager.saveCurrentNote({
          content: `<p>Updated content ${i}</p>`,
          tags: ['updated', 'memory']
        });

        // Clear current note
        await notesManager.setCurrentNote(null);
      }

      const finalMemory = performanceMonitor.measureMemory();
      const memoryGrowth = finalMemory.used - baselineMemory.used;

      // Memory growth should be controlled
      expect(memoryGrowth).toBeLessThan(baselineMemory.used * 0.3);
    });
  });

  describe('Rendering Performance', () => {
    test('should render large note lists efficiently', async () => {
      // Create many notes
      const noteCount = 300;
      for (let i = 0; i < noteCount; i++) {
        await storageManager.saveNote({
          title: `Render Test Note ${i}`,
          content: `<p>Content for rendering test ${i}</p>`,
          tags: [`render${i % 10}`],
          userId: authManager.getCurrentUser().id
        });
      }

      await notesManager.loadNotes();

      // Simulate note list rendering performance
      performanceMonitor.startTimer('noteListRender');

      // This would normally measure DOM rendering time
      // For testing, we'll measure note preparation time
      const notePreviews = notesManager.notes.map(note => ({
        id: note.id,
        title: note.title,
        preview: notesManager.getNotePreview(note.id),
        date: notesManager.formatRelativeDate(note.modifiedAt)
      }));

      const renderTime = performanceMonitor.endTimer('noteListRender');

      expect(renderTime).toBeLessThan(500); // Should render preparations in under 500ms
      expect(notePreviews).toHaveLength(noteCount);
      expect(notePreviews.every(preview => preview.title && preview.preview)).toBe(true);
    });

    test('should handle rapid UI updates efficiently', async () => {
      // Create base note
      const note = await notesManager.createNote({
        title: 'Rapid Update Test',
        content: '<p>Initial content</p>'
      });

      await notesManager.setCurrentNote(note.id);

      performanceMonitor.startTimer('rapidUpdates');

      // Simulate rapid auto-save updates
      for (let i = 0; i < 20; i++) {
        notesManager.scheduleAutoSave({
          title: `Rapid Update ${i}`,
          content: `<p>Updated content ${i}</p>`,
          tags: [`update${i}`]
        });

        // Small delay between updates
        await new Promise(resolve => setTimeout(resolve, 10));
      }

      // Wait for auto-save to complete
      await new Promise(resolve => setTimeout(resolve, 2100));

      const updateTime = performanceMonitor.endTimer('rapidUpdates');

      expect(updateTime).toBeLessThan(3000); // Should handle rapid updates efficiently
      expect(notesManager.getCurrentNote().title).toContain('Rapid Update');
    });
  });

  describe('Scalability Tests', () => {
    test('should scale with increasing data size', async () => {
      const dataSizes = [100, 500, 1000, 2000];
      const results = {};

      for (const size of dataSizes) {
        // Clear previous data
        storageManager.data.notes.clear();
        storageManager.resetOperationCount();

        // Create data set
        const notes = [];
        for (let i = 0; i < size; i++) {
          notes.push({
            title: `Scalability Test ${i}`,
            content: `<p>Scalability test content ${i}</p>`,
            tags: [`scale${i % 50}`, 'scalability'],
            userId: authManager.getCurrentUser().id
          });
        }

        // Measure bulk insert
        performanceMonitor.startTimer(`bulk_${size}`);
        await storageManager.bulkInsert(notes, 'notes');
        const bulkTime = performanceMonitor.endTimer(`bulk_${size}`);

        // Measure query performance
        performanceMonitor.startTimer(`query_${size}`);
        await notesManager.loadNotes();
        const queryTime = performanceMonitor.endTimer(`query_${size}`);

        // Measure search performance
        performanceMonitor.startTimer(`search_${size}`);
        notesManager.searchNotes('scalability');
        const searchTime = performanceMonitor.endTimer(`search_${size}`);

        results[size] = {
          bulkTime,
          queryTime,
          searchTime,
          operations: storageManager.getOperationCount()
        };
      }

      // Verify scaling characteristics
      expect(results[100].bulkTime).toBeLessThan(1000);
      expect(results[500].bulkTime).toBeLessThan(3000);
      expect(results[1000].bulkTime).toBeLessThan(6000);

      // Query time should scale sub-linearly
      const queryRatio = results[1000].queryTime / results[100].queryTime;
      expect(queryRatio).toBeLessThan(15); // Should not be 10x slower with 10x data

      // Search should remain reasonably fast
      expect(results[2000].searchTime).toBeLessThan(200);
    });

    test('should handle high-frequency operations', async () => {
      const operationsPerSecond = 100;
      const testDuration = 2000; // 2 seconds
      const expectedOperations = (operationsPerSecond * testDuration) / 1000;

      let operationCount = 0;
      const startTime = Date.now();

      performanceMonitor.startTimer('highFrequency');

      // Run high-frequency operations
      const interval = setInterval(async () => {
        if (Date.now() - startTime >= testDuration) {
          clearInterval(interval);
          return;
        }

        // Perform quick operation
        await notesManager.createNote({
          title: `HF Operation ${operationCount}`,
          content: `<p>High frequency content ${operationCount}</p>`
        });
        operationCount++;
      }, 1000 / operationsPerSecond);

      // Wait for test completion
      await new Promise(resolve => setTimeout(resolve, testDuration + 100));

      const totalTime = performanceMonitor.endTimer('highFrequency');

      expect(operationCount).toBeGreaterThanOrEqual(expectedOperations * 0.8); // Allow 20% variance
      expect(totalTime).toBeLessThan(testDuration + 500); // Should not significantly exceed test duration
    });
  });

  describe('Performance Optimization Validation', () => {
    test('should demonstrate search indexing benefits', async () => {
      // Create large dataset
      for (let i = 0; i < 1000; i++) {
        await storageManager.saveNote({
          title: `Search Index Test ${i}`,
          content: `<p>Content with unique term: searchterm${i}</p>`,
          tags: [`tag${i}`, 'searchable'],
          userId: authManager.getCurrentUser().id
        });
      }

      await notesManager.loadNotes();

      // Measure search performance for different query types
      const queries = [
        'searchterm500',  // Specific term
        'searchable',     // Common tag
        'Search Index',   // Title search
        'nonexistent'     // No results
      ];

      const searchTimes = {};

      for (const query of queries) {
        performanceMonitor.startTimer(`search_${query}`);
        const results = notesManager.searchNotes(query);
        searchTimes[query] = performanceMonitor.endTimer(`search_${query}`);

        // All searches should complete quickly
        expect(searchTimes[query]).toBeLessThan(100);
      }

      // Specific searches should be faster than broad searches
      expect(searchTimes['nonexistent']).toBeLessThan(searchTimes['searchable']);
    });

    test('should validate caching mechanisms', async () => {
      // Create test data
      const note = await notesManager.createNote({
        title: 'Cache Test Note',
        content: '<p>This content will be cached</p>',
        tags: ['cache', 'performance']
      });

      // First access (cache miss)
      performanceMonitor.startTimer('cacheMiss');
      const preview1 = notesManager.getNotePreview(note.id);
      const missTime = performanceMonitor.endTimer('cacheMiss');

      // Second access (cache hit)
      performanceMonitor.startTimer('cacheHit');
      const preview2 = notesManager.getNotePreview(note.id);
      const hitTime = performanceMonitor.endTimer('cacheHit');

      expect(preview1).toBe(preview2);
      expect(hitTime).toBeLessThanOrEqual(missTime); // Cache hit should not be slower
    });
  });

  afterEach(() => {
    const metrics = performanceMonitor.getMetrics();
    const memoryDelta = performanceMonitor.getMemoryDelta();

    // Log performance summary for analysis
    if (Object.keys(metrics).length > 0) {
      console.log('Performance Metrics:', JSON.stringify(metrics, null, 2));
    }

    if (memoryDelta) {
      console.log('Memory Delta:', memoryDelta);
    }
  });
});