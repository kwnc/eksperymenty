#!/usr/bin/env node

// Test Runner for NoteNest - Runs all test suites and generates comprehensive reports
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

class TestRunner {
  constructor() {
    this.testSuites = [
      { name: 'Unit Tests', pattern: '*.test.js', exclude: ['e2e.test.js', 'browser-compatibility.test.js'] },
      { name: 'Integration Tests', pattern: 'integration.test.js' },
      { name: 'Performance Tests', pattern: 'performance.test.js' },
      { name: 'Security Tests', pattern: 'security.test.js' },
      { name: 'Browser Compatibility Tests', pattern: 'browser-compatibility.test.js' },
      { name: 'End-to-End Tests', pattern: 'e2e.test.js' }
    ];

    this.results = {
      startTime: null,
      endTime: null,
      duration: 0,
      totalTests: 0,
      passedTests: 0,
      failedTests: 0,
      skippedTests: 0,
      coverage: null,
      suiteResults: [],
      errors: []
    };
  }

  async runAllTests() {
    console.log('🧪 Starting NoteNest Test Suite');
    console.log('=====================================\n');

    this.results.startTime = new Date();

    // Check if dependencies are installed
    if (!this.checkDependencies()) {
      console.log('❌ Dependencies not installed. Please run: npm install\n');
      return false;
    }

    // Run each test suite
    for (const suite of this.testSuites) {
      await this.runTestSuite(suite);
    }

    this.results.endTime = new Date();
    this.results.duration = this.results.endTime - this.results.startTime;

    this.generateReport();
    return this.results.failedTests === 0;
  }

  async runTestSuite(suite) {
    console.log(`\n📋 Running ${suite.name}...`);
    console.log('-'.repeat(40));

    try {
      const result = await this.executeJest(suite);
      result.suiteName = suite.name;
      this.results.suiteResults.push(result);

      // Update totals
      this.results.totalTests += result.numTotalTests || 0;
      this.results.passedTests += result.numPassedTests || 0;
      this.results.failedTests += result.numFailedTests || 0;
      this.results.skippedTests += result.numPendingTests || 0;

      // Display suite results
      if (result.success) {
        console.log(`✅ ${suite.name}: ${result.numPassedTests}/${result.numTotalTests} tests passed`);
      } else {
        console.log(`❌ ${suite.name}: ${result.numFailedTests}/${result.numTotalTests} tests failed`);
        if (result.failureMessage) {
          console.log(`   Error: ${result.failureMessage}`);
        }
      }

    } catch (error) {
      console.log(`💥 ${suite.name}: Failed to execute`);
      console.log(`   Error: ${error.message}`);
      this.results.errors.push({
        suite: suite.name,
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  }

  async executeJest(suite) {
    return new Promise((resolve) => {
      const args = [
        '--testPathPattern=' + suite.pattern,
        '--json',
        '--silent'
      ];

      if (suite.exclude) {
        suite.exclude.forEach(exclude => {
          args.push('--testPathIgnorePatterns=' + exclude);
        });
      }

      const jest = spawn('npx', ['jest', ...args], {
        cwd: __dirname,
        stdio: ['ignore', 'pipe', 'pipe']
      });

      let stdout = '';
      let stderr = '';

      jest.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      jest.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      jest.on('close', (code) => {
        try {
          const result = JSON.parse(stdout);
          result.success = code === 0;
          result.stderr = stderr;
          resolve(result);
        } catch (parseError) {
          resolve({
            success: false,
            numTotalTests: 0,
            numPassedTests: 0,
            numFailedTests: 1,
            numPendingTests: 0,
            failureMessage: `Parse error: ${parseError.message}`,
            stderr: stderr
          });
        }
      });

      jest.on('error', (error) => {
        resolve({
          success: false,
          numTotalTests: 0,
          numPassedTests: 0,
          numFailedTests: 1,
          numPendingTests: 0,
          failureMessage: error.message,
          stderr: stderr
        });
      });
    });
  }

  generateReport() {
    console.log('\n' + '='.repeat(50));
    console.log('📊 TEST RESULTS SUMMARY');
    console.log('='.repeat(50));

    console.log(`\n⏱️  Total Duration: ${Math.round(this.results.duration / 1000)}s`);
    console.log(`📈 Total Tests: ${this.results.totalTests}`);
    console.log(`✅ Passed: ${this.results.passedTests}`);
    console.log(`❌ Failed: ${this.results.failedTests}`);
    console.log(`⏭️  Skipped: ${this.results.skippedTests}`);

    const successRate = this.results.totalTests > 0 ?
      Math.round((this.results.passedTests / this.results.totalTests) * 100) : 0;

    console.log(`📊 Success Rate: ${successRate}%`);

    // Suite breakdown
    console.log('\n📋 Suite Breakdown:');
    this.results.suiteResults.forEach(suite => {
      const status = suite.success ? '✅' : '❌';
      const passed = suite.numPassedTests || 0;
      const total = suite.numTotalTests || 0;
      const rate = total > 0 ? Math.round((passed / total) * 100) : 0;

      console.log(`   ${status} ${suite.suiteName}: ${passed}/${total} (${rate}%)`);
    });

    // Errors
    if (this.results.errors.length > 0) {
      console.log('\n❌ Execution Errors:');
      this.results.errors.forEach(error => {
        console.log(`   • ${error.suite}: ${error.error}`);
      });
    }

    // Overall status
    console.log('\n' + '='.repeat(50));
    if (this.results.failedTests === 0 && this.results.errors.length === 0) {
      console.log('🎉 ALL TESTS PASSED!');
      console.log('✨ NoteNest is ready for deployment');
    } else {
      console.log('🚨 SOME TESTS FAILED');
      console.log('🔧 Please fix failing tests before deployment');
    }
    console.log('='.repeat(50));

    this.saveReport();
  }

  saveReport() {
    const reportPath = path.join(__dirname, 'test-reports');
    if (!fs.existsSync(reportPath)) {
      fs.mkdirSync(reportPath, { recursive: true });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const reportFile = path.join(reportPath, `test-report-${timestamp}.json`);

    const report = {
      ...this.results,
      generatedAt: new Date().toISOString(),
      environment: {
        node: process.version,
        platform: process.platform,
        arch: process.arch
      }
    };

    fs.writeFileSync(reportFile, JSON.stringify(report, null, 2));
    console.log(`\n📄 Detailed report saved to: ${reportFile}`);

    // Also save a simple HTML report
    this.generateHTMLReport(path.join(reportPath, `test-report-${timestamp}.html`));
  }

  generateHTMLReport(filePath) {
    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>NoteNest Test Report</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; margin: 20px; }
        .header { background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
        .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin-bottom: 20px; }
        .metric { background: white; border: 1px solid #e1e5e9; border-radius: 6px; padding: 15px; text-align: center; }
        .metric h3 { margin: 0 0 10px 0; font-size: 14px; color: #586069; text-transform: uppercase; }
        .metric .value { font-size: 24px; font-weight: bold; }
        .passed .value { color: #28a745; }
        .failed .value { color: #dc3545; }
        .skipped .value { color: #6f42c1; }
        .suite { background: white; border: 1px solid #e1e5e9; border-radius: 6px; padding: 15px; margin-bottom: 10px; }
        .suite.success { border-left: 4px solid #28a745; }
        .suite.failure { border-left: 4px solid #dc3545; }
        .suite h4 { margin: 0 0 10px 0; }
        .progress-bar { background: #e1e5e9; border-radius: 4px; height: 8px; overflow: hidden; }
        .progress-fill { height: 100%; transition: width 0.3s ease; }
        .progress-success { background: #28a745; }
        .error { background: #f8d7da; color: #721c24; padding: 10px; border-radius: 4px; margin: 5px 0; }
    </style>
</head>
<body>
    <div class="header">
        <h1>🧪 NoteNest Test Report</h1>
        <p>Generated on ${new Date().toLocaleString()}</p>
        <p>Duration: ${Math.round(this.results.duration / 1000)} seconds</p>
    </div>

    <div class="summary">
        <div class="metric">
            <h3>Total Tests</h3>
            <div class="value">${this.results.totalTests}</div>
        </div>
        <div class="metric passed">
            <h3>Passed</h3>
            <div class="value">${this.results.passedTests}</div>
        </div>
        <div class="metric failed">
            <h3>Failed</h3>
            <div class="value">${this.results.failedTests}</div>
        </div>
        <div class="metric skipped">
            <h3>Skipped</h3>
            <div class="value">${this.results.skippedTests}</div>
        </div>
    </div>

    <h2>Test Suites</h2>
    ${this.results.suiteResults.map(suite => {
      const total = suite.numTotalTests || 0;
      const passed = suite.numPassedTests || 0;
      const successRate = total > 0 ? (passed / total) * 100 : 0;

      return `
        <div class="suite ${suite.success ? 'success' : 'failure'}">
            <h4>${suite.suiteName}</h4>
            <p>${passed}/${total} tests passed (${Math.round(successRate)}%)</p>
            <div class="progress-bar">
                <div class="progress-fill progress-success" style="width: ${successRate}%"></div>
            </div>
        </div>
      `;
    }).join('')}

    ${this.results.errors.length > 0 ? `
        <h2>Errors</h2>
        ${this.results.errors.map(error => `
            <div class="error">
                <strong>${error.suite}:</strong> ${error.error}
            </div>
        `).join('')}
    ` : ''}

    <div style="margin-top: 30px; padding: 20px; background: ${this.results.failedTests === 0 ? '#d4edda' : '#f8d7da'}; border-radius: 6px; text-align: center;">
        <h2 style="margin: 0;">
            ${this.results.failedTests === 0 ? '🎉 All Tests Passed!' : '🚨 Some Tests Failed'}
        </h2>
        <p style="margin: 10px 0 0 0;">
            ${this.results.failedTests === 0 ? 'NoteNest is ready for deployment' : 'Please fix failing tests before deployment'}
        </p>
    </div>
</body>
</html>`;

    fs.writeFileSync(filePath, html);
    console.log(`📊 HTML report saved to: ${filePath}`);
  }

  checkDependencies() {
    const packageJsonPath = path.join(__dirname, 'package.json');
    if (!fs.existsSync(packageJsonPath)) {
      return false;
    }

    const nodeModulesPath = path.join(__dirname, 'node_modules');
    return fs.existsSync(nodeModulesPath);
  }
}

// CLI handling
if (require.main === module) {
  const runner = new TestRunner();

  runner.runAllTests().then(success => {
    process.exit(success ? 0 : 1);
  }).catch(error => {
    console.error('💥 Test runner failed:', error);
    process.exit(1);
  });
}

module.exports = TestRunner;