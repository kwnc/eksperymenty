/**
 * Minimal Test Framework
 * Lightweight testing framework for the note-taking app
 *
 * @module test-framework
 */

// Test results storage
const testResults = {
  passed: 0,
  failed: 0,
  skipped: 0,
  tests: [],
  suites: []
};

// Current test suite context
let currentSuite = null;
let setupFunc = null;
let teardownFunc = null;

/**
 * Test suite definition
 * @param {string} suiteName - Name of the test suite
 * @param {Function} suiteFunc - Function containing tests
 */
export function describe(suiteName, suiteFunc) {
  const suite = {
    name: suiteName,
    tests: [],
    passed: 0,
    failed: 0
  };

  currentSuite = suite;
  setupFunc = null;
  teardownFunc = null;

  try {
    suiteFunc();
  } catch (error) {
    console.error(`Error in suite "${suiteName}":`, error);
  }

  testResults.suites.push(suite);
  currentSuite = null;
}

/**
 * Individual test definition
 * @param {string} testName - Name of the test
 * @param {Function} testFunc - Test function
 */
export function it(testName, testFunc) {
  if (!currentSuite) {
    console.error('Test must be inside a describe block');
    return;
  }

  const test = {
    name: testName,
    passed: false,
    error: null,
    duration: 0
  };

  try {
    // Run setup if defined
    if (setupFunc) {
      setupFunc();
    }

    const startTime = performance.now();
    testFunc();
    test.duration = performance.now() - startTime;

    test.passed = true;
    currentSuite.passed++;
    testResults.passed++;
  } catch (error) {
    test.passed = false;
    test.error = error.message;
    currentSuite.failed++;
    testResults.failed++;
  } finally {
    // Run teardown if defined
    if (teardownFunc) {
      try {
        teardownFunc();
      } catch (error) {
        console.error('Teardown error:', error);
      }
    }
  }

  currentSuite.tests.push(test);
  testResults.tests.push(test);
}

/**
 * Assertion: expect value to equal expected
 * @param {*} actual - Actual value
 * @returns {Object} Assertion methods
 */
export function expect(actual) {
  return {
    toBe(expected) {
      if (actual !== expected) {
        throw new Error(`Expected ${JSON.stringify(actual)} to be ${JSON.stringify(expected)}`);
      }
    },

    toEqual(expected) {
      const actualStr = JSON.stringify(actual);
      const expectedStr = JSON.stringify(expected);
      if (actualStr !== expectedStr) {
        throw new Error(`Expected ${actualStr} to equal ${expectedStr}`);
      }
    },

    toBeTruthy() {
      if (!actual) {
        throw new Error(`Expected ${JSON.stringify(actual)} to be truthy`);
      }
    },

    toBeFalsy() {
      if (actual) {
        throw new Error(`Expected ${JSON.stringify(actual)} to be falsy`);
      }
    },

    toContain(item) {
      if (Array.isArray(actual)) {
        if (!actual.includes(item)) {
          throw new Error(`Expected array to contain ${JSON.stringify(item)}`);
        }
      } else if (typeof actual === 'string') {
        if (!actual.includes(item)) {
          throw new Error(`Expected string to contain "${item}"`);
        }
      } else {
        throw new Error('toContain can only be used with arrays or strings');
      }
    },

    toThrow() {
      if (typeof actual !== 'function') {
        throw new Error('toThrow requires a function');
      }

      let didThrow = false;
      try {
        actual();
      } catch (error) {
        didThrow = true;
      }

      if (!didThrow) {
        throw new Error('Expected function to throw an error');
      }
    },

    toBeNull() {
      if (actual !== null) {
        throw new Error(`Expected ${JSON.stringify(actual)} to be null`);
      }
    },

    toBeUndefined() {
      if (actual !== undefined) {
        throw new Error(`Expected value to be undefined`);
      }
    },

    toBeGreaterThan(expected) {
      if (actual <= expected) {
        throw new Error(`Expected ${actual} to be greater than ${expected}`);
      }
    },

    toBeLessThan(expected) {
      if (actual >= expected) {
        throw new Error(`Expected ${actual} to be less than ${expected}`);
      }
    },

    toHaveLength(expected) {
      if (!actual || typeof actual.length !== 'number') {
        throw new Error('Expected value to have a length property');
      }
      if (actual.length !== expected) {
        throw new Error(`Expected length ${actual.length} to be ${expected}`);
      }
    }
  };
}

/**
 * Setup function to run before each test
 * @param {Function} func - Setup function
 */
export function beforeEach(func) {
  setupFunc = func;
}

/**
 * Teardown function to run after each test
 * @param {Function} func - Teardown function
 */
export function afterEach(func) {
  teardownFunc = func;
}

/**
 * Run all tests and display results
 */
export function runTests() {
  // Tests are run as they are defined
  displayResults();
}

/**
 * Display test results in the page
 */
function displayResults() {
  const resultsContainer = document.getElementById('testResults');
  if (!resultsContainer) {
    console.error('Test results container not found');
    return;
  }

  resultsContainer.innerHTML = '';

  // Summary
  const summary = document.createElement('div');
  summary.className = 'summary';
  const totalTests = testResults.passed + testResults.failed;
  const passRate = totalTests > 0 ? ((testResults.passed / totalTests) * 100).toFixed(1) : 0;

  summary.innerHTML = `
    <h2>Test Results Summary</h2>
    <p><strong>Total Tests:</strong> ${totalTests}</p>
    <p><strong>Passed:</strong> <span style="color: #28A745">${testResults.passed}</span></p>
    <p><strong>Failed:</strong> <span style="color: #DC3545">${testResults.failed}</span></p>
    <p><strong>Pass Rate:</strong> ${passRate}%</p>
  `;
  resultsContainer.appendChild(summary);

  // Test suites
  testResults.suites.forEach(suite => {
    const suiteDiv = document.createElement('div');
    suiteDiv.className = 'test-suite';

    const suiteHeader = document.createElement('h3');
    suiteHeader.textContent = `${suite.name} (${suite.passed}/${suite.tests.length} passed)`;
    suiteDiv.appendChild(suiteHeader);

    suite.tests.forEach(test => {
      const testDiv = document.createElement('div');
      testDiv.className = `test-case ${test.passed ? 'passed' : 'failed'}`;

      const testName = document.createElement('strong');
      testName.textContent = test.passed ? '✓ ' : '✗ ';
      testName.textContent += test.name;
      testDiv.appendChild(testName);

      if (test.duration) {
        const duration = document.createElement('span');
        duration.style.marginLeft = '10px';
        duration.style.fontSize = '12px';
        duration.style.color = '#666';
        duration.textContent = `(${test.duration.toFixed(2)}ms)`;
        testDiv.appendChild(duration);
      }

      if (!test.passed && test.error) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-details';
        errorDiv.textContent = test.error;
        testDiv.appendChild(errorDiv);
      }

      suiteDiv.appendChild(testDiv);
    });

    resultsContainer.appendChild(suiteDiv);
  });
}

/**
 * Mock localStorage for testing
 */
export function mockLocalStorage() {
  const store = {};

  return {
    getItem(key) {
      return store[key] || null;
    },
    setItem(key, value) {
      store[key] = String(value);
    },
    removeItem(key) {
      delete store[key];
    },
    clear() {
      for (const key in store) {
        delete store[key];
      }
    },
    get length() {
      return Object.keys(store).length;
    },
    key(index) {
      const keys = Object.keys(store);
      return keys[index] || null;
    }
  };
}

/**
 * Clear test results
 */
export function clearResults() {
  testResults.passed = 0;
  testResults.failed = 0;
  testResults.skipped = 0;
  testResults.tests = [];
  testResults.suites = [];
}

// Export test results for external use
export function getTestResults() {
  return testResults;
}
