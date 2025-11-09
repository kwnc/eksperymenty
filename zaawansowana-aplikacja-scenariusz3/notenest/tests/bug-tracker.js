// Bug Tracking and Reporting System for NoteNest
// This system helps track, categorize, and report bugs found during testing

class BugTracker {
  constructor() {
    this.bugs = [];
    this.categories = {
      AUTHENTICATION: 'authentication',
      NOTES: 'notes',
      NOTEBOOKS: 'notebooks',
      SEARCH: 'search',
      STORAGE: 'storage',
      UI: 'ui',
      PERFORMANCE: 'performance',
      SECURITY: 'security',
      COMPATIBILITY: 'compatibility',
      EXPORT: 'export'
    };

    this.severities = {
      CRITICAL: 'critical',    // App unusable, data loss
      HIGH: 'high',           // Major feature broken
      MEDIUM: 'medium',       // Minor feature issues
      LOW: 'low',            // Cosmetic issues
      ENHANCEMENT: 'enhancement' // Feature requests
    };

    this.statuses = {
      OPEN: 'open',
      IN_PROGRESS: 'in_progress',
      RESOLVED: 'resolved',
      CLOSED: 'closed',
      DUPLICATE: 'duplicate',
      WONT_FIX: 'wont_fix'
    };
  }

  // Report a new bug
  reportBug(title, description, category, severity = this.severities.MEDIUM, options = {}) {
    const bug = {
      id: this.generateBugId(),
      title: title.trim(),
      description: description.trim(),
      category: category,
      severity: severity,
      status: this.statuses.OPEN,
      reportedAt: new Date().toISOString(),
      reportedBy: options.reportedBy || 'automated-test',
      environment: options.environment || this.getDefaultEnvironment(),
      tags: options.tags || [],
      steps: options.steps || [],
      expectedBehavior: options.expectedBehavior || '',
      actualBehavior: options.actualBehavior || '',
      stackTrace: options.stackTrace || null,
      attachments: options.attachments || [],
      reproducible: options.reproducible !== false,
      browser: options.browser || 'unknown',
      version: options.version || '1.0.0',
      assignee: options.assignee || null,
      updatedAt: new Date().toISOString(),
      comments: []
    };

    this.bugs.push(bug);
    this.logBugReport(bug);
    return bug;
  }

  // Update an existing bug
  updateBug(bugId, updates) {
    const bugIndex = this.bugs.findIndex(bug => bug.id === bugId);
    if (bugIndex === -1) {
      throw new Error(`Bug with ID ${bugId} not found`);
    }

    const bug = this.bugs[bugIndex];
    const oldStatus = bug.status;

    // Update fields
    Object.assign(bug, updates, {
      updatedAt: new Date().toISOString()
    });

    // Add status change comment
    if (updates.status && updates.status !== oldStatus) {
      this.addComment(bugId, `Status changed from ${oldStatus} to ${updates.status}`, 'system');
    }

    this.logBugUpdate(bug, updates);
    return bug;
  }

  // Add comment to a bug
  addComment(bugId, comment, author = 'system') {
    const bug = this.getBugById(bugId);
    if (!bug) {
      throw new Error(`Bug with ID ${bugId} not found`);
    }

    const commentObj = {
      id: `comment_${Date.now()}`,
      author: author,
      content: comment.trim(),
      createdAt: new Date().toISOString()
    };

    bug.comments.push(commentObj);
    bug.updatedAt = new Date().toISOString();

    return commentObj;
  }

  // Get bug by ID
  getBugById(bugId) {
    return this.bugs.find(bug => bug.id === bugId) || null;
  }

  // Get bugs by various filters
  getBugsByCategory(category) {
    return this.bugs.filter(bug => bug.category === category);
  }

  getBugsBySeverity(severity) {
    return this.bugs.filter(bug => bug.severity === severity);
  }

  getBugsByStatus(status) {
    return this.bugs.filter(bug => bug.status === status);
  }

  getOpenBugs() {
    return this.bugs.filter(bug => bug.status === this.statuses.OPEN);
  }

  getCriticalBugs() {
    return this.bugs.filter(bug => bug.severity === this.severities.CRITICAL);
  }

  // Search bugs
  searchBugs(query) {
    const searchTerm = query.toLowerCase();
    return this.bugs.filter(bug =>
      bug.title.toLowerCase().includes(searchTerm) ||
      bug.description.toLowerCase().includes(searchTerm) ||
      bug.tags.some(tag => tag.toLowerCase().includes(searchTerm))
    );
  }

  // Generate reports
  generateSummaryReport() {
    const total = this.bugs.length;
    const bySeverity = {};
    const byCategory = {};
    const byStatus = {};

    Object.values(this.severities).forEach(severity => {
      bySeverity[severity] = this.getBugsBySeverity(severity).length;
    });

    Object.values(this.categories).forEach(category => {
      byCategory[category] = this.getBugsByCategory(category).length;
    });

    Object.values(this.statuses).forEach(status => {
      byStatus[status] = this.getBugsByStatus(status).length;
    });

    const criticalOpen = this.bugs.filter(bug =>
      bug.severity === this.severities.CRITICAL && bug.status === this.statuses.OPEN
    ).length;

    const highOpen = this.bugs.filter(bug =>
      bug.severity === this.severities.HIGH && bug.status === this.statuses.OPEN
    ).length;

    return {
      total,
      summary: {
        bySeverity,
        byCategory,
        byStatus,
        criticalOpen,
        highOpen,
        openTotal: byStatus[this.statuses.OPEN],
        resolvedTotal: byStatus[this.statuses.RESOLVED]
      },
      generatedAt: new Date().toISOString()
    };
  }

  generateDetailedReport() {
    const summary = this.generateSummaryReport();
    const criticalBugs = this.getCriticalBugs();
    const openBugs = this.getOpenBugs();
    const recentBugs = this.bugs
      .sort((a, b) => new Date(b.reportedAt) - new Date(a.reportedAt))
      .slice(0, 10);

    return {
      ...summary,
      details: {
        criticalBugs: criticalBugs.map(bug => ({
          id: bug.id,
          title: bug.title,
          category: bug.category,
          severity: bug.severity,
          reportedAt: bug.reportedAt,
          status: bug.status
        })),
        openBugs: openBugs.map(bug => ({
          id: bug.id,
          title: bug.title,
          category: bug.category,
          severity: bug.severity,
          reportedAt: bug.reportedAt
        })),
        recentBugs: recentBugs.map(bug => ({
          id: bug.id,
          title: bug.title,
          category: bug.category,
          severity: bug.severity,
          status: bug.status,
          reportedAt: bug.reportedAt
        }))
      }
    };
  }

  // Export functions
  exportToJSON() {
    return JSON.stringify({
      exportedAt: new Date().toISOString(),
      totalBugs: this.bugs.length,
      bugs: this.bugs
    }, null, 2);
  }

  exportToCSV() {
    const headers = [
      'ID', 'Title', 'Category', 'Severity', 'Status', 'Reported At',
      'Reported By', 'Browser', 'Version', 'Reproducible', 'Description'
    ];

    const rows = this.bugs.map(bug => [
      bug.id,
      `"${bug.title.replace(/"/g, '""')}"`,
      bug.category,
      bug.severity,
      bug.status,
      bug.reportedAt,
      bug.reportedBy,
      bug.browser,
      bug.version,
      bug.reproducible,
      `"${bug.description.replace(/"/g, '""')}"`
    ]);

    return [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
  }

  // Import functions
  importFromJSON(jsonData) {
    try {
      const data = typeof jsonData === 'string' ? JSON.parse(jsonData) : jsonData;
      const importedBugs = data.bugs || [];

      importedBugs.forEach(bug => {
        // Validate and add bug
        if (this.validateBugData(bug)) {
          this.bugs.push(bug);
        }
      });

      return { success: true, imported: importedBugs.length };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Validation
  validateBugData(bug) {
    const requiredFields = ['title', 'description', 'category', 'severity'];
    return requiredFields.every(field => bug[field] && bug[field].trim());
  }

  // Statistics
  getStatistics() {
    const now = new Date();
    const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const lastMonth = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const recentBugs = this.bugs.filter(bug =>
      new Date(bug.reportedAt) >= lastWeek
    );

    const monthlyBugs = this.bugs.filter(bug =>
      new Date(bug.reportedAt) >= lastMonth
    );

    const resolutionRate = this.bugs.length > 0 ?
      (this.getBugsByStatus(this.statuses.RESOLVED).length / this.bugs.length * 100).toFixed(2) :
      0;

    const avgResolutionTime = this.calculateAverageResolutionTime();

    return {
      totalBugs: this.bugs.length,
      openBugs: this.getOpenBugs().length,
      criticalBugs: this.getCriticalBugs().length,
      recentBugs: recentBugs.length,
      monthlyBugs: monthlyBugs.length,
      resolutionRate: parseFloat(resolutionRate),
      avgResolutionTime: avgResolutionTime,
      mostCommonCategory: this.getMostCommonCategory(),
      mostCommonSeverity: this.getMostCommonSeverity()
    };
  }

  calculateAverageResolutionTime() {
    const resolvedBugs = this.getBugsByStatus(this.statuses.RESOLVED);
    if (resolvedBugs.length === 0) return 0;

    const totalTime = resolvedBugs.reduce((sum, bug) => {
      const reported = new Date(bug.reportedAt);
      const resolved = new Date(bug.updatedAt);
      return sum + (resolved - reported);
    }, 0);

    return Math.round(totalTime / resolvedBugs.length / (1000 * 60 * 60 * 24)); // Days
  }

  getMostCommonCategory() {
    const counts = {};
    this.bugs.forEach(bug => {
      counts[bug.category] = (counts[bug.category] || 0) + 1;
    });

    return Object.keys(counts).reduce((a, b) =>
      counts[a] > counts[b] ? a : b, Object.keys(counts)[0]
    );
  }

  getMostCommonSeverity() {
    const counts = {};
    this.bugs.forEach(bug => {
      counts[bug.severity] = (counts[bug.severity] || 0) + 1;
    });

    return Object.keys(counts).reduce((a, b) =>
      counts[a] > counts[b] ? a : b, Object.keys(counts)[0]
    );
  }

  // Utility functions
  generateBugId() {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000);
    return `BUG-${timestamp}-${random}`;
  }

  getDefaultEnvironment() {
    return {
      os: 'Unknown',
      browser: 'Unknown',
      version: 'Unknown',
      resolution: 'Unknown',
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'N/A'
    };
  }

  logBugReport(bug) {
    console.log(`🐛 New Bug Reported: ${bug.id} - ${bug.title} [${bug.severity.toUpperCase()}]`);
  }

  logBugUpdate(bug, updates) {
    const updatedFields = Object.keys(updates).join(', ');
    console.log(`📝 Bug Updated: ${bug.id} - Fields: ${updatedFields}`);
  }

  // Cleanup
  clearAllBugs() {
    this.bugs = [];
  }

  deleteBug(bugId) {
    const index = this.bugs.findIndex(bug => bug.id === bugId);
    if (index !== -1) {
      const deletedBug = this.bugs.splice(index, 1)[0];
      console.log(`🗑️  Bug Deleted: ${deletedBug.id} - ${deletedBug.title}`);
      return deletedBug;
    }
    return null;
  }
}

// Bug reporting helper functions
class BugReporter {
  constructor(bugTracker) {
    this.tracker = bugTracker;
  }

  // Quick reporting methods for common scenarios
  reportAuthenticationBug(title, description, options = {}) {
    return this.tracker.reportBug(
      title,
      description,
      this.tracker.categories.AUTHENTICATION,
      this.tracker.severities.HIGH,
      options
    );
  }

  reportDataLossBug(title, description, options = {}) {
    return this.tracker.reportBug(
      title,
      description,
      this.tracker.categories.STORAGE,
      this.tracker.severities.CRITICAL,
      {
        ...options,
        tags: [...(options.tags || []), 'data-loss']
      }
    );
  }

  reportPerformanceBug(title, description, metrics, options = {}) {
    return this.tracker.reportBug(
      title,
      description,
      this.tracker.categories.PERFORMANCE,
      this.tracker.severities.MEDIUM,
      {
        ...options,
        tags: [...(options.tags || []), 'performance'],
        attachments: [...(options.attachments || []), { type: 'metrics', data: metrics }]
      }
    );
  }

  reportSecurityBug(title, description, vulnerability, options = {}) {
    return this.tracker.reportBug(
      title,
      description,
      this.tracker.categories.SECURITY,
      this.tracker.severities.CRITICAL,
      {
        ...options,
        tags: [...(options.tags || []), 'security', vulnerability.type],
        attachments: [...(options.attachments || []), { type: 'vulnerability', data: vulnerability }]
      }
    );
  }

  reportCompatibilityBug(title, description, browser, options = {}) {
    return this.tracker.reportBug(
      title,
      description,
      this.tracker.categories.COMPATIBILITY,
      this.tracker.severities.MEDIUM,
      {
        ...options,
        browser: browser,
        tags: [...(options.tags || []), 'compatibility', browser]
      }
    );
  }

  reportUIBug(title, description, component, options = {}) {
    return this.tracker.reportBug(
      title,
      description,
      this.tracker.categories.UI,
      this.tracker.severities.LOW,
      {
        ...options,
        tags: [...(options.tags || []), 'ui', component]
      }
    );
  }
}

// Test result analyzer - helps identify patterns in test failures
class TestResultAnalyzer {
  constructor(bugTracker) {
    this.tracker = bugTracker;
  }

  analyzeTestFailure(testName, error, testContext = {}) {
    const errorType = this.categorizeError(error);
    const severity = this.determineSeverity(error, testContext);
    const category = this.determineCategory(testName, error);

    return {
      suggestedBugReport: {
        title: `Test Failure: ${testName}`,
        description: this.generateFailureDescription(testName, error, testContext),
        category: category,
        severity: severity,
        stackTrace: error.stack || null,
        tags: [errorType, 'test-failure'],
        steps: this.generateStepsFromTest(testName, testContext),
        actualBehavior: error.message || 'Test failed',
        expectedBehavior: testContext.expected || 'Test should pass'
      },
      errorAnalysis: {
        type: errorType,
        severity: severity,
        category: category,
        isKnownIssue: this.isKnownIssue(error),
        possibleCauses: this.suggestPossibleCauses(error, testContext)
      }
    };
  }

  categorizeError(error) {
    const message = error.message?.toLowerCase() || '';

    if (message.includes('timeout') || message.includes('async')) return 'timeout';
    if (message.includes('network') || message.includes('fetch')) return 'network';
    if (message.includes('permission') || message.includes('auth')) return 'authorization';
    if (message.includes('not found') || message.includes('undefined')) return 'missing-resource';
    if (message.includes('validation') || message.includes('invalid')) return 'validation';
    if (message.includes('memory') || message.includes('heap')) return 'memory';
    if (message.includes('security') || message.includes('xss')) return 'security';

    return 'general';
  }

  determineSeverity(error, testContext) {
    const message = error.message?.toLowerCase() || '';

    if (message.includes('critical') || message.includes('data loss') || message.includes('security')) {
      return this.tracker.severities.CRITICAL;
    }

    if (message.includes('auth') || message.includes('login') || testContext.critical) {
      return this.tracker.severities.HIGH;
    }

    if (message.includes('ui') || message.includes('display')) {
      return this.tracker.severities.LOW;
    }

    return this.tracker.severities.MEDIUM;
  }

  determineCategory(testName, error) {
    const testLower = testName.toLowerCase();
    const message = error.message?.toLowerCase() || '';

    if (testLower.includes('auth') || message.includes('login')) return this.tracker.categories.AUTHENTICATION;
    if (testLower.includes('note') && !testLower.includes('notebook')) return this.tracker.categories.NOTES;
    if (testLower.includes('notebook')) return this.tracker.categories.NOTEBOOKS;
    if (testLower.includes('search')) return this.tracker.categories.SEARCH;
    if (testLower.includes('storage') || testLower.includes('database')) return this.tracker.categories.STORAGE;
    if (testLower.includes('performance')) return this.tracker.categories.PERFORMANCE;
    if (testLower.includes('security')) return this.tracker.categories.SECURITY;
    if (testLower.includes('browser') || testLower.includes('compatibility')) return this.tracker.categories.COMPATIBILITY;
    if (testLower.includes('ui') || testLower.includes('interface')) return this.tracker.categories.UI;
    if (testLower.includes('export')) return this.tracker.categories.EXPORT;

    return this.tracker.categories.UI; // Default category
  }

  generateFailureDescription(testName, error, testContext) {
    let description = `Test "${testName}" failed with error: ${error.message}\n\n`;

    if (testContext.description) {
      description += `Test Description: ${testContext.description}\n\n`;
    }

    if (error.stack) {
      description += `Stack Trace:\n${error.stack}\n\n`;
    }

    if (testContext.environment) {
      description += `Environment: ${JSON.stringify(testContext.environment, null, 2)}\n\n`;
    }

    description += `Reported automatically from test failure.`;

    return description;
  }

  generateStepsFromTest(testName, testContext) {
    // Generate basic steps based on test name and context
    const steps = [`Run test: ${testName}`];

    if (testContext.setup) {
      steps.unshift('Setup: ' + testContext.setup);
    }

    if (testContext.actions) {
      testContext.actions.forEach(action => {
        steps.push('Action: ' + action);
      });
    }

    steps.push('Observe failure');

    return steps;
  }

  isKnownIssue(error) {
    // Check against known issues
    const knownIssues = [
      'IndexedDB not available in test environment',
      'localStorage is not defined',
      'crypto.subtle not supported',
      'fetch is not defined'
    ];

    return knownIssues.some(known =>
      error.message?.includes(known)
    );
  }

  suggestPossibleCauses(error, testContext) {
    const causes = [];
    const message = error.message?.toLowerCase() || '';

    if (message.includes('timeout')) {
      causes.push('Slow async operation', 'Network latency', 'Infinite loop');
    }

    if (message.includes('not defined') || message.includes('undefined')) {
      causes.push('Missing dependency', 'Incorrect module loading', 'Environment setup issue');
    }

    if (message.includes('permission') || message.includes('access')) {
      causes.push('CORS issue', 'Security policy violation', 'Authentication failure');
    }

    if (message.includes('memory')) {
      causes.push('Memory leak', 'Large dataset processing', 'Insufficient resources');
    }

    return causes;
  }
}

// Export the classes for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    BugTracker,
    BugReporter,
    TestResultAnalyzer
  };
}

// Global instances for testing
if (typeof global !== 'undefined') {
  global.BugTracker = BugTracker;
  global.BugReporter = BugReporter;
  global.TestResultAnalyzer = TestResultAnalyzer;
}