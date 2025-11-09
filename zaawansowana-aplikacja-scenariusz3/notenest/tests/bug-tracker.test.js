// Tests for Bug Tracking and Reporting System
const { BugTracker, BugReporter, TestResultAnalyzer } = require('./bug-tracker');

describe('Bug Tracking and Reporting System', () => {
  let bugTracker;
  let bugReporter;
  let testAnalyzer;

  beforeEach(() => {
    bugTracker = new BugTracker();
    bugReporter = new BugReporter(bugTracker);
    testAnalyzer = new TestResultAnalyzer(bugTracker);
  });

  describe('BugTracker', () => {
    describe('Bug Reporting', () => {
      test('should create a new bug with all required fields', () => {
        const bug = bugTracker.reportBug(
          'Test Bug Title',
          'Test bug description',
          bugTracker.categories.NOTES,
          bugTracker.severities.HIGH
        );

        expect(bug.id).toBeDefined();
        expect(bug.title).toBe('Test Bug Title');
        expect(bug.description).toBe('Test bug description');
        expect(bug.category).toBe(bugTracker.categories.NOTES);
        expect(bug.severity).toBe(bugTracker.severities.HIGH);
        expect(bug.status).toBe(bugTracker.statuses.OPEN);
        expect(bug.reportedAt).toBeDefined();
        expect(bug.updatedAt).toBeDefined();
        expect(Array.isArray(bug.comments)).toBe(true);
      });

      test('should generate unique bug IDs', () => {
        const bug1 = bugTracker.reportBug('Bug 1', 'Description 1', bugTracker.categories.UI);
        const bug2 = bugTracker.reportBug('Bug 2', 'Description 2', bugTracker.categories.UI);

        expect(bug1.id).not.toBe(bug2.id);
        expect(bug1.id).toMatch(/^BUG-\d+-\d+$/);
        expect(bug2.id).toMatch(/^BUG-\d+-\d+$/);
      });

      test('should include optional fields when provided', () => {
        const options = {
          reportedBy: 'test-user',
          tags: ['tag1', 'tag2'],
          steps: ['Step 1', 'Step 2'],
          browser: 'Chrome',
          version: '1.2.3',
          expectedBehavior: 'Should work',
          actualBehavior: 'Does not work'
        };

        const bug = bugTracker.reportBug(
          'Bug with Options',
          'Description',
          bugTracker.categories.AUTHENTICATION,
          bugTracker.severities.MEDIUM,
          options
        );

        expect(bug.reportedBy).toBe(options.reportedBy);
        expect(bug.tags).toEqual(options.tags);
        expect(bug.steps).toEqual(options.steps);
        expect(bug.browser).toBe(options.browser);
        expect(bug.version).toBe(options.version);
        expect(bug.expectedBehavior).toBe(options.expectedBehavior);
        expect(bug.actualBehavior).toBe(options.actualBehavior);
      });
    });

    describe('Bug Updates', () => {
      test('should update existing bug', () => {
        const bug = bugTracker.reportBug('Test Bug', 'Description', bugTracker.categories.NOTES);
        const originalUpdatedAt = bug.updatedAt;

        // Wait a bit to ensure timestamp difference
        setTimeout(() => {
          const updatedBug = bugTracker.updateBug(bug.id, {
            status: bugTracker.statuses.IN_PROGRESS,
            assignee: 'developer'
          });

          expect(updatedBug.status).toBe(bugTracker.statuses.IN_PROGRESS);
          expect(updatedBug.assignee).toBe('developer');
          expect(updatedBug.updatedAt).not.toBe(originalUpdatedAt);
        }, 1);
      });

      test('should add status change comment automatically', () => {
        const bug = bugTracker.reportBug('Test Bug', 'Description', bugTracker.categories.NOTES);

        bugTracker.updateBug(bug.id, {
          status: bugTracker.statuses.RESOLVED
        });

        expect(bug.comments).toHaveLength(1);
        expect(bug.comments[0].content).toContain('Status changed from open to resolved');
        expect(bug.comments[0].author).toBe('system');
      });

      test('should throw error for non-existent bug', () => {
        expect(() => {
          bugTracker.updateBug('non-existent-id', { status: 'resolved' });
        }).toThrow('Bug with ID non-existent-id not found');
      });
    });

    describe('Comments', () => {
      test('should add comment to existing bug', () => {
        const bug = bugTracker.reportBug('Test Bug', 'Description', bugTracker.categories.NOTES);

        const comment = bugTracker.addComment(bug.id, 'This is a test comment', 'test-user');

        expect(comment.id).toBeDefined();
        expect(comment.content).toBe('This is a test comment');
        expect(comment.author).toBe('test-user');
        expect(comment.createdAt).toBeDefined();
        expect(bug.comments).toContain(comment);
      });

      test('should update bug timestamp when comment is added', () => {
        const bug = bugTracker.reportBug('Test Bug', 'Description', bugTracker.categories.NOTES);
        const originalUpdatedAt = bug.updatedAt;

        setTimeout(() => {
          bugTracker.addComment(bug.id, 'Test comment');
          expect(bug.updatedAt).not.toBe(originalUpdatedAt);
        }, 1);
      });
    });

    describe('Bug Queries', () => {
      beforeEach(() => {
        // Create test bugs
        bugTracker.reportBug('Auth Bug', 'Auth issue', bugTracker.categories.AUTHENTICATION, bugTracker.severities.CRITICAL);
        bugTracker.reportBug('UI Bug', 'UI issue', bugTracker.categories.UI, bugTracker.severities.LOW);
        bugTracker.reportBug('Notes Bug', 'Notes issue', bugTracker.categories.NOTES, bugTracker.severities.HIGH);

        // Update one bug status
        const authBug = bugTracker.getBugsByCategory(bugTracker.categories.AUTHENTICATION)[0];
        bugTracker.updateBug(authBug.id, { status: bugTracker.statuses.RESOLVED });
      });

      test('should get bugs by category', () => {
        const authBugs = bugTracker.getBugsByCategory(bugTracker.categories.AUTHENTICATION);
        const uiBugs = bugTracker.getBugsByCategory(bugTracker.categories.UI);

        expect(authBugs).toHaveLength(1);
        expect(uiBugs).toHaveLength(1);
        expect(authBugs[0].category).toBe(bugTracker.categories.AUTHENTICATION);
        expect(uiBugs[0].category).toBe(bugTracker.categories.UI);
      });

      test('should get bugs by severity', () => {
        const criticalBugs = bugTracker.getBugsBySeverity(bugTracker.severities.CRITICAL);
        const lowBugs = bugTracker.getBugsBySeverity(bugTracker.severities.LOW);

        expect(criticalBugs).toHaveLength(1);
        expect(lowBugs).toHaveLength(1);
        expect(criticalBugs[0].severity).toBe(bugTracker.severities.CRITICAL);
      });

      test('should get bugs by status', () => {
        const openBugs = bugTracker.getOpenBugs();
        const resolvedBugs = bugTracker.getBugsByStatus(bugTracker.statuses.RESOLVED);

        expect(openBugs).toHaveLength(2);
        expect(resolvedBugs).toHaveLength(1);
      });

      test('should get critical bugs', () => {
        const criticalBugs = bugTracker.getCriticalBugs();

        expect(criticalBugs).toHaveLength(1);
        expect(criticalBugs[0].severity).toBe(bugTracker.severities.CRITICAL);
      });

      test('should search bugs by text', () => {
        const searchResults = bugTracker.searchBugs('auth');

        expect(searchResults).toHaveLength(1);
        expect(searchResults[0].title).toBe('Auth Bug');
      });
    });

    describe('Reports', () => {
      beforeEach(() => {
        // Create diverse test data
        bugTracker.reportBug('Critical Auth Bug', 'Auth issue', bugTracker.categories.AUTHENTICATION, bugTracker.severities.CRITICAL);
        bugTracker.reportBug('High Notes Bug', 'Notes issue', bugTracker.categories.NOTES, bugTracker.severities.HIGH);
        bugTracker.reportBug('Medium UI Bug', 'UI issue', bugTracker.categories.UI, bugTracker.severities.MEDIUM);
        bugTracker.reportBug('Low Perf Bug', 'Performance issue', bugTracker.categories.PERFORMANCE, bugTracker.severities.LOW);

        // Resolve one non-critical bug (the UI bug)
        const uiBug = bugTracker.getBugsByCategory(bugTracker.categories.UI)[0];
        bugTracker.updateBug(uiBug.id, { status: bugTracker.statuses.RESOLVED });
      });

      test('should generate summary report', () => {
        const report = bugTracker.generateSummaryReport();

        expect(report.total).toBe(4);
        expect(report.summary.bySeverity.critical).toBe(1);
        expect(report.summary.bySeverity.high).toBe(1);
        expect(report.summary.byCategory.authentication).toBe(1);
        expect(report.summary.byCategory.notes).toBe(1);
        expect(report.summary.byStatus.open).toBe(3);
        expect(report.summary.byStatus.resolved).toBe(1);
        expect(report.summary.criticalOpen).toBe(1);
        expect(report.generatedAt).toBeDefined();
      });

      test('should generate detailed report', () => {
        const report = bugTracker.generateDetailedReport();

        expect(report.total).toBe(4);
        expect(report.details.criticalBugs).toHaveLength(1);
        expect(report.details.openBugs).toHaveLength(3);
        expect(report.details.recentBugs).toHaveLength(4);
        expect(report.details.criticalBugs[0].severity).toBe(bugTracker.severities.CRITICAL);
      });
    });

    describe('Export/Import', () => {
      test('should export to JSON format', () => {
        bugTracker.reportBug('Test Bug', 'Description', bugTracker.categories.NOTES);

        const jsonExport = bugTracker.exportToJSON();
        const data = JSON.parse(jsonExport);

        expect(data.totalBugs).toBe(1);
        expect(data.bugs).toHaveLength(1);
        expect(data.exportedAt).toBeDefined();
        expect(data.bugs[0].title).toBe('Test Bug');
      });

      test('should export to CSV format', () => {
        bugTracker.reportBug('Test Bug', 'Description', bugTracker.categories.NOTES);

        const csvExport = bugTracker.exportToCSV();
        const lines = csvExport.split('\n');

        expect(lines[0]).toContain('ID,Title,Category');
        expect(lines[1]).toContain('"Test Bug"');
        expect(lines[1]).toContain('notes');
      });

      test('should import from JSON format', () => {
        const testData = {
          bugs: [{
            id: 'TEST-BUG-1',
            title: 'Imported Bug',
            description: 'Imported description',
            category: bugTracker.categories.UI,
            severity: bugTracker.severities.MEDIUM,
            status: bugTracker.statuses.OPEN,
            reportedAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            comments: []
          }]
        };

        const result = bugTracker.importFromJSON(testData);

        expect(result.success).toBe(true);
        expect(result.imported).toBe(1);
        expect(bugTracker.getBugById('TEST-BUG-1')).toBeDefined();
        expect(bugTracker.getBugById('TEST-BUG-1').title).toBe('Imported Bug');
      });
    });

    describe('Statistics', () => {
      test('should calculate bug statistics', () => {
        // Create test bugs with different timestamps
        bugTracker.reportBug('Recent Bug', 'Description', bugTracker.categories.NOTES, bugTracker.severities.HIGH);
        bugTracker.reportBug('Another Bug', 'Description', bugTracker.categories.UI, bugTracker.severities.MEDIUM);

        const stats = bugTracker.getStatistics();

        expect(stats.totalBugs).toBe(2);
        expect(stats.openBugs).toBe(2);
        expect(stats.resolutionRate).toBe(0);
        expect(stats.mostCommonCategory).toBeDefined();
        expect(stats.mostCommonSeverity).toBeDefined();
      });
    });
  });

  describe('BugReporter', () => {
    test('should report authentication bug with correct defaults', () => {
      const bug = bugReporter.reportAuthenticationBug(
        'Login fails with valid credentials',
        'User cannot login despite entering correct credentials'
      );

      expect(bug.category).toBe(bugTracker.categories.AUTHENTICATION);
      expect(bug.severity).toBe(bugTracker.severities.HIGH);
      expect(bug.status).toBe(bugTracker.statuses.OPEN);
    });

    test('should report data loss bug as critical', () => {
      const bug = bugReporter.reportDataLossBug(
        'Notes deleted unexpectedly',
        'User notes were deleted after sync'
      );

      expect(bug.category).toBe(bugTracker.categories.STORAGE);
      expect(bug.severity).toBe(bugTracker.severities.CRITICAL);
      expect(bug.tags).toContain('data-loss');
    });

    test('should report performance bug with metrics', () => {
      const metrics = { loadTime: 5000, memoryUsage: 150 };

      const bug = bugReporter.reportPerformanceBug(
        'Slow note loading',
        'Notes take too long to load',
        metrics
      );

      expect(bug.category).toBe(bugTracker.categories.PERFORMANCE);
      expect(bug.tags).toContain('performance');
      expect(bug.attachments[0].type).toBe('metrics');
      expect(bug.attachments[0].data).toBe(metrics);
    });

    test('should report security bug as critical', () => {
      const vulnerability = { type: 'xss', severity: 'high' };

      const bug = bugReporter.reportSecurityBug(
        'XSS vulnerability in note content',
        'User input not properly sanitized',
        vulnerability
      );

      expect(bug.category).toBe(bugTracker.categories.SECURITY);
      expect(bug.severity).toBe(bugTracker.severities.CRITICAL);
      expect(bug.tags).toContain('security');
      expect(bug.tags).toContain('xss');
    });

    test('should report compatibility bug with browser info', () => {
      const bug = bugReporter.reportCompatibilityBug(
        'Feature not working in Safari',
        'IndexedDB operations fail in Safari',
        'Safari'
      );

      expect(bug.category).toBe(bugTracker.categories.COMPATIBILITY);
      expect(bug.browser).toBe('Safari');
      expect(bug.tags).toContain('compatibility');
      expect(bug.tags).toContain('Safari');
    });

    test('should report UI bug with component info', () => {
      const bug = bugReporter.reportUIBug(
        'Button styling incorrect',
        'Primary button has wrong color',
        'button-component'
      );

      expect(bug.category).toBe(bugTracker.categories.UI);
      expect(bug.severity).toBe(bugTracker.severities.LOW);
      expect(bug.tags).toContain('ui');
      expect(bug.tags).toContain('button-component');
    });
  });

  describe('TestResultAnalyzer', () => {
    test('should analyze test failure and suggest bug report', () => {
      const error = new Error('Authentication failed: invalid credentials');
      error.stack = 'Error: Authentication failed\n    at AuthManager.login';

      const testContext = {
        description: 'Test login with valid credentials',
        expected: 'Should login successfully',
        environment: { browser: 'Chrome', version: '120' }
      };

      const analysis = testAnalyzer.analyzeTestFailure(
        'should auth login with valid credentials',
        error,
        testContext
      );

      expect(analysis.suggestedBugReport.title).toContain('Test Failure: should auth login with valid credentials');
      expect(analysis.suggestedBugReport.category).toBe(bugTracker.categories.AUTHENTICATION);
      expect(analysis.suggestedBugReport.severity).toBe(bugTracker.severities.HIGH);
      expect(analysis.suggestedBugReport.stackTrace).toBe(error.stack);
      expect(analysis.suggestedBugReport.tags).toContain('test-failure');

      expect(analysis.errorAnalysis.type).toBe('authorization');
      expect(analysis.errorAnalysis.category).toBe(bugTracker.categories.AUTHENTICATION);
    });

    test('should categorize different error types correctly', () => {
      const timeoutError = new Error('Operation timeout occurred');
      const networkError = new Error('Network fetch failed');
      const validationError = new Error('Validation failed: invalid input provided');

      expect(testAnalyzer.categorizeError(timeoutError)).toBe('timeout');
      expect(testAnalyzer.categorizeError(networkError)).toBe('network');
      expect(testAnalyzer.categorizeError(validationError)).toBe('validation');
    });

    test('should determine severity based on error content', () => {
      const criticalError = new Error('Critical system failure - data loss occurred');
      const authError = new Error('Authentication required');
      const uiError = new Error('Button display issue');

      expect(testAnalyzer.determineSeverity(criticalError, {})).toBe(bugTracker.severities.CRITICAL);
      expect(testAnalyzer.determineSeverity(authError, {})).toBe(bugTracker.severities.HIGH);
      expect(testAnalyzer.determineSeverity(uiError, {})).toBe(bugTracker.severities.LOW);
    });

    test('should identify known issues', () => {
      const knownError = new Error('IndexedDB not available in test environment');
      const unknownError = new Error('Unexpected error occurred');

      expect(testAnalyzer.isKnownIssue(knownError)).toBe(true);
      expect(testAnalyzer.isKnownIssue(unknownError)).toBe(false);
    });

    test('should suggest possible causes', () => {
      const timeoutError = new Error('Operation timeout occurred');
      const undefinedError = new Error('variable is not defined');

      const timeoutCauses = testAnalyzer.suggestPossibleCauses(timeoutError, {});
      const undefinedCauses = testAnalyzer.suggestPossibleCauses(undefinedError, {});

      expect(timeoutCauses).toContain('Slow async operation');
      expect(undefinedCauses).toContain('Missing dependency');
    });
  });

  describe('Integration', () => {
    test('should integrate test failure analysis with bug reporting', () => {
      const error = new Error('Storage operation failed');
      const testContext = {
        description: 'Test note saving functionality',
        critical: true
      };

      const analysis = testAnalyzer.analyzeTestFailure(
        'should save note to storage',
        error,
        testContext
      );

      // Use the suggested bug report to actually create a bug
      const bugReport = analysis.suggestedBugReport;
      const bug = bugTracker.reportBug(
        bugReport.title,
        bugReport.description,
        bugReport.category,
        bugReport.severity,
        {
          tags: bugReport.tags,
          steps: bugReport.steps,
          stackTrace: bugReport.stackTrace,
          expectedBehavior: bugReport.expectedBehavior,
          actualBehavior: bugReport.actualBehavior
        }
      );

      expect(bug.title).toContain('Test Failure: should save note to storage');
      expect(bug.tags).toContain('test-failure');
      expect(bug.stackTrace).toBe(error.stack);

      // Verify the bug was added to the tracker
      expect(bugTracker.getBugById(bug.id)).toBe(bug);
    });

    test('should generate comprehensive report after multiple test failures', () => {
      // Simulate multiple test failures
      const failures = [
        { testName: 'auth login test', error: new Error('Critical auth failed'), critical: true },
        { testName: 'note saving test', error: new Error('Storage error'), critical: false },
        { testName: 'ui rendering test', error: new Error('Display issue'), critical: false }
      ];

      failures.forEach(failure => {
        const analysis = testAnalyzer.analyzeTestFailure(failure.testName, failure.error, { critical: failure.critical });
        const bugReport = analysis.suggestedBugReport;

        bugTracker.reportBug(
          bugReport.title,
          bugReport.description,
          bugReport.category,
          bugReport.severity,
          { tags: bugReport.tags }
        );
      });

      const report = bugTracker.generateDetailedReport();

      expect(report.total).toBe(3);
      expect(report.summary.criticalOpen).toBeGreaterThan(0);
      expect(report.details.recentBugs).toHaveLength(3);

      // Verify all bugs have test-failure tag
      const allBugs = bugTracker.bugs;
      expect(allBugs.every(bug => bug.tags.includes('test-failure'))).toBe(true);
    });
  });
});