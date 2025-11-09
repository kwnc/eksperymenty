class TestFramework {
    constructor() {
        this.tests = [];
        this.currentSuite = '';
        this.results = {
            total: 0,
            passed: 0,
            failed: 0,
            pending: 0
        };
    }

    describe(suiteName, testFn) {
        this.currentSuite = suiteName;
        console.log(`\n--- Running test suite: ${suiteName} ---`);
        testFn();
    }

    it(testName, testFn) {
        const test = {
            suite: this.currentSuite,
            name: testName,
            fn: testFn,
            status: 'pending',
            error: null,
            startTime: null,
            endTime: null
        };
        this.tests.push(test);
    }

    async runTest(test) {
        test.status = 'running';
        test.startTime = performance.now();

        try {
            const result = test.fn();
            if (result instanceof Promise) {
                await result;
            }
            test.status = 'passed';
            this.results.passed++;
        } catch (error) {
            test.status = 'failed';
            test.error = error;
            this.results.failed++;
        }

        test.endTime = performance.now();
        this.results.total++;
    }

    async runAllTests() {
        this.results = { total: 0, passed: 0, failed: 0, pending: 0 };

        for (const test of this.tests) {
            await this.runTest(test);
            this.updateTestDisplay(test);
        }

        this.updateSummary();
        console.log('\n--- Test Results ---');
        console.log(`Total: ${this.results.total}, Passed: ${this.results.passed}, Failed: ${this.results.failed}`);
    }

    updateTestDisplay(test) {
        const outputDiv = document.getElementById('test-output');
        const suiteDiv = this.getOrCreateSuiteDiv(test.suite);

        const testDiv = document.createElement('div');
        testDiv.className = `test-case ${test.status}`;
        testDiv.innerHTML = `
            <div class="test-name">${test.name}</div>
            <div class="test-status">${test.status.toUpperCase()} ${test.endTime ? `(${(test.endTime - test.startTime).toFixed(2)}ms)` : ''}</div>
            ${test.error ? `<div class="test-error">${test.error.message}</div>` : ''}
        `;

        suiteDiv.appendChild(testDiv);
    }

    getOrCreateSuiteDiv(suiteName) {
        let suiteDiv = document.getElementById(`suite-${suiteName.replace(/\s+/g, '-')}`);
        if (!suiteDiv) {
            const outputDiv = document.getElementById('test-output');
            suiteDiv = document.createElement('div');
            suiteDiv.className = 'test-suite';
            suiteDiv.id = `suite-${suiteName.replace(/\s+/g, '-')}`;
            suiteDiv.innerHTML = `<h3>${suiteName}</h3>`;
            outputDiv.appendChild(suiteDiv);
        }
        return suiteDiv;
    }

    updateSummary() {
        document.getElementById('test-summary').style.display = 'block';
        document.getElementById('total-tests').textContent = this.results.total;
        document.getElementById('passed-tests').textContent = this.results.passed;
        document.getElementById('failed-tests').textContent = this.results.failed;
        document.getElementById('pending-tests').textContent = this.tests.length - this.results.total;
    }

    expect(actual) {
        return {
            toBe: (expected) => {
                if (actual !== expected) {
                    throw new Error(`Expected ${expected}, but got ${actual}`);
                }
            },
            toEqual: (expected) => {
                if (JSON.stringify(actual) !== JSON.stringify(expected)) {
                    throw new Error(`Expected ${JSON.stringify(expected)}, but got ${JSON.stringify(actual)}`);
                }
            },
            toBeNull: () => {
                if (actual !== null) {
                    throw new Error(`Expected null, but got ${actual}`);
                }
            },
            toBeUndefined: () => {
                if (actual !== undefined) {
                    throw new Error(`Expected undefined, but got ${actual}`);
                }
            },
            toBeTruthy: () => {
                if (!actual) {
                    throw new Error(`Expected truthy value, but got ${actual}`);
                }
            },
            toBeFalsy: () => {
                if (actual) {
                    throw new Error(`Expected falsy value, but got ${actual}`);
                }
            },
            toContain: (expected) => {
                if (!actual.includes(expected)) {
                    throw new Error(`Expected "${actual}" to contain "${expected}"`);
                }
            },
            toThrow: () => {
                let threw = false;
                try {
                    actual();
                } catch (e) {
                    threw = true;
                }
                if (!threw) {
                    throw new Error('Expected function to throw an error');
                }
            },
            toHaveLength: (length) => {
                if (actual.length !== length) {
                    throw new Error(`Expected length ${length}, but got ${actual.length}`);
                }
            },
            toBeInstanceOf: (constructor) => {
                if (!(actual instanceof constructor)) {
                    throw new Error(`Expected instance of ${constructor.name}, but got ${actual.constructor.name}`);
                }
            }
        };
    }

    clearResults() {
        document.getElementById('test-output').innerHTML = '<p>Click "Run All Tests" to begin comprehensive testing of the Notes App.</p>';
        document.getElementById('test-summary').style.display = 'none';
        this.results = { total: 0, passed: 0, failed: 0, pending: 0 };
    }
}

// Create global test framework instance
const testFramework = new TestFramework();
const describe = testFramework.describe.bind(testFramework);
const it = testFramework.it.bind(testFramework);
const expect = testFramework.expect.bind(testFramework);

// Global test runner functions
async function runAllTests() {
    document.getElementById('run-all-btn').textContent = 'Running...';
    document.getElementById('run-all-btn').disabled = true;

    testFramework.clearResults();
    await testFramework.runAllTests();

    document.getElementById('run-all-btn').textContent = 'Run All Tests';
    document.getElementById('run-all-btn').disabled = false;
}

function runUnitTests() {
    const unitTests = testFramework.tests.filter(t =>
        t.suite.includes('Storage') ||
        t.suite.includes('Utils') ||
        t.suite.includes('Unit')
    );
    console.log('Running unit tests:', unitTests.length);
}

function runIntegrationTests() {
    const integrationTests = testFramework.tests.filter(t =>
        t.suite.includes('Integration') ||
        t.suite.includes('CRUD') ||
        t.suite.includes('UI')
    );
    console.log('Running integration tests:', integrationTests.length);
}

function runUITests() {
    const uiTests = testFramework.tests.filter(t =>
        t.suite.includes('UI') ||
        t.suite.includes('Interface') ||
        t.suite.includes('Component')
    );
    console.log('Running UI tests:', uiTests.length);
}

function clearResults() {
    testFramework.clearResults();
}

// Test utilities
function createMockStorage() {
    const mockData = {};
    return {
        getItem: (key) => mockData[key] || null,
        setItem: (key, value) => { mockData[key] = value; },
        removeItem: (key) => { delete mockData[key]; },
        clear: () => { Object.keys(mockData).forEach(key => delete mockData[key]); }
    };
}

function createMockNote(overrides = {}) {
    const now = new Date().toISOString();
    return {
        id: 'test_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
        title: 'Test Note',
        content: 'This is a test note content.',
        createdAt: now,
        updatedAt: now,
        ...overrides
    };
}