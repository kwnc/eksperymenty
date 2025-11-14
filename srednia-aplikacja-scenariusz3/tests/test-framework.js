/**
 * test-framework.js - Simple Test Framework
 * Lightweight assertion library and test runner for NoteNest
 */

// Test Results Storage
const testResults = {
  passed: 0,
  failed: 0,
  total: 0,
  tests: []
};

/**
 * Simple assertion library
 */
const assert = {
  /**
   * Assert that a value is truthy
   */
  isTrue(value, message = 'Expected value to be true') {
    if (!value) {
      throw new Error(message);
    }
  },

  /**
   * Assert that a value is falsy
   */
  isFalse(value, message = 'Expected value to be false') {
    if (value) {
      throw new Error(message);
    }
  },

  /**
   * Assert that two values are equal
   */
  equals(actual, expected, message) {
    if (actual !== expected) {
      const msg = message || `Expected ${JSON.stringify(expected)} but got ${JSON.stringify(actual)}`;
      throw new Error(msg);
    }
  },

  /**
   * Assert that two values are deeply equal
   */
  deepEquals(actual, expected, message) {
    if (JSON.stringify(actual) !== JSON.stringify(expected)) {
      const msg = message || `Expected ${JSON.stringify(expected)} but got ${JSON.stringify(actual)}`;
      throw new Error(msg);
    }
  },

  /**
   * Assert that a value is not null or undefined
   */
  exists(value, message = 'Expected value to exist') {
    if (value === null || value === undefined) {
      throw new Error(message);
    }
  },

  /**
   * Assert that a value is null or undefined
   */
  notExists(value, message = 'Expected value to not exist') {
    if (value !== null && value !== undefined) {
      throw new Error(message);
    }
  },

  /**
   * Assert that an array contains a value
   */
  contains(array, value, message) {
    if (!Array.isArray(array)) {
      throw new Error('First argument must be an array');
    }
    if (!array.includes(value)) {
      const msg = message || `Expected array to contain ${JSON.stringify(value)}`;
      throw new Error(msg);
    }
  },

  /**
   * Assert that a value is of a specific type
   */
  isType(value, type, message) {
    const actualType = Array.isArray(value) ? 'array' : typeof value;
    if (actualType !== type) {
      const msg = message || `Expected type ${type} but got ${actualType}`;
      throw new Error(msg);
    }
  },

  /**
   * Assert that a function throws an error
   */
  throws(fn, message = 'Expected function to throw an error') {
    let threw = false;
    try {
      fn();
    } catch (e) {
      threw = true;
    }
    if (!threw) {
      throw new Error(message);
    }
  },

  /**
   * Assert that an array has a specific length
   */
  lengthEquals(array, length, message) {
    if (!Array.isArray(array) && typeof array !== 'string') {
      throw new Error('First argument must be an array or string');
    }
    if (array.length !== length) {
      const msg = message || `Expected length ${length} but got ${array.length}`;
      throw new Error(msg);
    }
  }
};

/**
 * Test suite runner
 */
function describe(suiteName, testFn) {
  console.log(`\n📦 ${suiteName}`);
  testFn();
}

/**
 * Individual test case
 */
function it(testName, testFn) {
  testResults.total++;
  const testResult = {
    name: testName,
    passed: false,
    error: null,
    duration: 0
  };

  const startTime = performance.now();

  try {
    testFn();
    testResult.passed = true;
    testResults.passed++;
    const duration = (performance.now() - startTime).toFixed(2);
    testResult.duration = duration;
    console.log(`  ✓ ${testName} (${duration}ms)`);
  } catch (error) {
    testResult.passed = false;
    testResult.error = error.message;
    testResults.failed++;
    const duration = (performance.now() - startTime).toFixed(2);
    testResult.duration = duration;
    console.error(`  ✗ ${testName} (${duration}ms)`);
    console.error(`    ${error.message}`);
  }

  testResults.tests.push(testResult);
}

/**
 * Setup function - runs before tests
 */
function beforeEach(fn) {
  // Store setup function for test suite
  window.__testSetup = fn;
}

/**
 * Teardown function - runs after tests
 */
function afterEach(fn) {
  // Store teardown function for test suite
  window.__testTeardown = fn;
}

/**
 * Run all tests and display results
 */
function runTests() {
  console.log('🧪 Starting NoteNest Test Suite...\n');
  console.log('='.repeat(50));

  testResults.passed = 0;
  testResults.failed = 0;
  testResults.total = 0;
  testResults.tests = [];

  // Run all test suites
  if (typeof runUtilsTests === 'function') runUtilsTests();
  if (typeof runStorageTests === 'function') runStorageTests();
  if (typeof runNotesTests === 'function') runNotesTests();
  if (typeof runIntegrationTests === 'function') runIntegrationTests();
  if (typeof runUITests === 'function') runUITests();

  // Display summary
  console.log('\n' + '='.repeat(50));
  console.log('📊 Test Summary');
  console.log('='.repeat(50));
  console.log(`Total Tests: ${testResults.total}`);
  console.log(`✓ Passed: ${testResults.passed}`);
  console.log(`✗ Failed: ${testResults.failed}`);

  const passRate = ((testResults.passed / testResults.total) * 100).toFixed(1);
  console.log(`Pass Rate: ${passRate}%`);

  // Display results in HTML
  displayResults();

  return testResults;
}

/**
 * Display test results in HTML
 */
function displayResults() {
  const container = document.getElementById('test-results');
  if (!container) return;

  const passRate = ((testResults.passed / testResults.total) * 100).toFixed(1);
  const statusClass = passRate === '100.0' ? 'success' : passRate >= '80.0' ? 'warning' : 'error';

  let html = `
    <div class="summary ${statusClass}">
      <h2>Test Summary</h2>
      <div class="stats">
        <div class="stat">
          <span class="label">Total Tests:</span>
          <span class="value">${testResults.total}</span>
        </div>
        <div class="stat">
          <span class="label">Passed:</span>
          <span class="value passed">${testResults.passed}</span>
        </div>
        <div class="stat">
          <span class="label">Failed:</span>
          <span class="value failed">${testResults.failed}</span>
        </div>
        <div class="stat">
          <span class="label">Pass Rate:</span>
          <span class="value">${passRate}%</span>
        </div>
      </div>
    </div>

    <div class="test-list">
      <h3>Test Results</h3>
  `;

  testResults.tests.forEach(test => {
    const icon = test.passed ? '✓' : '✗';
    const statusClass = test.passed ? 'passed' : 'failed';
    html += `
      <div class="test-item ${statusClass}">
        <span class="icon">${icon}</span>
        <span class="name">${test.name}</span>
        <span class="duration">${test.duration}ms</span>
        ${test.error ? `<div class="error">${test.error}</div>` : ''}
      </div>
    `;
  });

  html += '</div>';
  container.innerHTML = html;
}

/**
 * Helper function to clean up test data
 */
function cleanupTestData() {
  localStorage.removeItem('noteNest_notes');
  localStorage.removeItem('noteNest_settings');
}
