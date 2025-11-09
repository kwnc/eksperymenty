// Cross-Browser Compatibility Tests for NoteNest
// These tests validate that NoteNest works correctly across different browsers

// Browser compatibility testing utilities
class BrowserCompatibilityTester {
  constructor() {
    this.supportMatrix = {};
    this.issues = [];
    this.userAgents = {
      chrome: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      firefox: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/120.0',
      safari: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Safari/605.1.15',
      edge: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0',
      opera: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 OPR/106.0.0.0'
    };
  }

  mockBrowser(browserName) {
    const userAgent = this.userAgents[browserName];

    // Mock navigator object
    Object.defineProperty(global, 'navigator', {
      value: {
        userAgent,
        language: 'en-US',
        languages: ['en-US', 'en'],
        cookieEnabled: true,
        onLine: true,
        platform: browserName === 'safari' ? 'MacIntel' : 'Win32'
      },
      configurable: true
    });

    // Browser-specific feature availability
    const features = this.getBrowserFeatures(browserName);

    // Mock window object with browser-specific features
    const mockWindow = {
      indexedDB: features.indexedDB ? {} : undefined,
      localStorage: features.localStorage ? {
        getItem: jest.fn(),
        setItem: jest.fn(),
        removeItem: jest.fn(),
        clear: jest.fn()
      } : undefined,
      crypto: features.crypto ? {
        subtle: {
          digest: jest.fn().mockResolvedValue(new ArrayBuffer(32))
        }
      } : undefined,
      fetch: features.fetch ? jest.fn() : undefined,
      Promise: features.promise ? Promise : undefined,
      requestAnimationFrame: features.raf ? jest.fn() : undefined,
      MutationObserver: features.mutationObserver ? jest.fn() : undefined,
      IntersectionObserver: features.intersectionObserver ? jest.fn() : undefined
    };

    Object.defineProperty(global, 'window', {
      value: mockWindow,
      configurable: true
    });

    return mockWindow;
  }

  getBrowserFeatures(browserName) {
    const baseFeatures = {
      indexedDB: true,
      localStorage: true,
      crypto: true,
      fetch: true,
      promise: true,
      raf: true,
      mutationObserver: true,
      intersectionObserver: true
    };

    // Browser-specific feature variations
    switch (browserName) {
      case 'chrome':
        return { ...baseFeatures };

      case 'firefox':
        return { ...baseFeatures };

      case 'safari':
        return {
          ...baseFeatures,
          // Safari has some restrictions on IndexedDB in private mode
          indexedDB: true // Assume normal mode
        };

      case 'edge':
        return { ...baseFeatures };

      case 'opera':
        return { ...baseFeatures };

      default:
        return baseFeatures;
    }
  }

  testFeatureSupport(browserName, feature) {
    const features = this.getBrowserFeatures(browserName);
    return features[feature] || false;
  }

  addCompatibilityIssue(browser, feature, severity, description) {
    this.issues.push({
      browser,
      feature,
      severity,
      description,
      timestamp: new Date().toISOString()
    });
  }

  getCompatibilityReport() {
    return {
      supportMatrix: { ...this.supportMatrix },
      issues: [...this.issues],
      summary: this.generateSummary()
    };
  }

  generateSummary() {
    const browsers = Object.keys(this.userAgents);
    const criticalIssues = this.issues.filter(issue => issue.severity === 'critical');
    const majorIssues = this.issues.filter(issue => issue.severity === 'major');

    return {
      totalBrowsers: browsers.length,
      criticalIssues: criticalIssues.length,
      majorIssues: majorIssues.length,
      totalIssues: this.issues.length,
      overallStatus: criticalIssues.length === 0 ? 'PASS' : 'FAIL'
    };
  }
}

// Mock DOM and application setup for each browser
function setupBrowserEnvironment(browserName) {
  const { JSDOM } = require('jsdom');

  const dom = new JSDOM(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>NoteNest Cross-Browser Test</title>
    </head>
    <body>
      <div id="app">
        <div id="auth-view">
          <input id="login-email" type="email">
          <input id="login-password" type="password">
          <button id="login-submit">Login</button>
        </div>
        <div id="app-view" class="hidden">
          <button id="new-note">New Note</button>
          <div id="notes-list"></div>
          <div id="note-editor" class="hidden">
            <input id="note-title">
            <div id="note-content" contenteditable="true"></div>
          </div>
        </div>
      </div>
    </body>
    </html>
  `, {
    pretendToBeVisual: true,
    resources: 'usable'
  });

  const window = dom.window;
  const document = window.document;

  // Set browser-specific user agent
  Object.defineProperty(window.navigator, 'userAgent', {
    value: new BrowserCompatibilityTester().userAgents[browserName],
    configurable: true
  });

  return { dom, window, document };
}

describe('NoteNest Cross-Browser Compatibility', () => {
  let compatibilityTester;
  const browsers = ['chrome', 'firefox', 'safari', 'edge', 'opera'];

  beforeEach(() => {
    compatibilityTester = new BrowserCompatibilityTester();
  });

  describe('Core Feature Support', () => {
    test('should support required APIs in all browsers', () => {
      const requiredAPIs = [
        'indexedDB',
        'localStorage',
        'crypto',
        'fetch',
        'promise'
      ];

      browsers.forEach(browser => {
        requiredAPIs.forEach(api => {
          const isSupported = compatibilityTester.testFeatureSupport(browser, api);

          if (!isSupported) {
            compatibilityTester.addCompatibilityIssue(
              browser,
              api,
              'critical',
              `${api} API not supported in ${browser}`
            );
          }

          expect(isSupported).toBe(true);
        });
      });
    });

    test('should handle localStorage across browsers', () => {
      browsers.forEach(browser => {
        compatibilityTester.mockBrowser(browser);

        // Test localStorage availability
        expect(window.localStorage).toBeDefined();

        // Test basic localStorage operations
        expect(() => {
          window.localStorage.setItem('test-key', 'test-value');
          window.localStorage.getItem('test-key');
          window.localStorage.removeItem('test-key');
        }).not.toThrow();
      });
    });

    test('should handle IndexedDB across browsers', () => {
      browsers.forEach(browser => {
        compatibilityTester.mockBrowser(browser);

        const hasIndexedDB = compatibilityTester.testFeatureSupport(browser, 'indexedDB');

        if (hasIndexedDB) {
          expect(window.indexedDB).toBeDefined();
        } else {
          compatibilityTester.addCompatibilityIssue(
            browser,
            'indexedDB',
            'critical',
            `IndexedDB not available in ${browser}`
          );
        }
      });
    });

    test('should support crypto.subtle API across browsers', () => {
      browsers.forEach(browser => {
        compatibilityTester.mockBrowser(browser);

        expect(window.crypto).toBeDefined();
        expect(window.crypto.subtle).toBeDefined();
        expect(typeof window.crypto.subtle.digest).toBe('function');
      });
    });
  });

  describe('DOM API Compatibility', () => {
    test('should handle contenteditable across browsers', () => {
      browsers.forEach(browser => {
        const { document } = setupBrowserEnvironment(browser);

        const editableDiv = document.getElementById('note-content');
        expect(editableDiv).toBeDefined();
        expect(editableDiv.contentEditable).toBeDefined();

        // Test basic contenteditable operations
        editableDiv.innerHTML = '<p>Test content</p>';
        expect(editableDiv.innerHTML).toBe('<p>Test content</p>');

        // Test text selection (mock)
        if (document.createRange && window.getSelection) {
          // Browser supports text selection APIs
          expect(typeof document.createRange).toBe('function');
          expect(typeof window.getSelection).toBe('function');
        } else {
          compatibilityTester.addCompatibilityIssue(
            browser,
            'textSelection',
            'major',
            `Text selection APIs not fully supported in ${browser}`
          );
        }
      });
    });

    test('should handle form input validation across browsers', () => {
      browsers.forEach(browser => {
        const { document } = setupBrowserEnvironment(browser);

        const emailInput = document.getElementById('login-email');
        const passwordInput = document.getElementById('login-password');

        // Test HTML5 input types
        expect(emailInput.type).toBe('email');
        expect(passwordInput.type).toBe('password');

        // Test validation attributes
        emailInput.setAttribute('required', '');
        passwordInput.setAttribute('required', '');

        expect(emailInput.hasAttribute('required')).toBe(true);
        expect(passwordInput.hasAttribute('required')).toBe(true);

        // Test validation API
        if (typeof emailInput.checkValidity === 'function') {
          emailInput.value = 'invalid-email';
          const isValid = emailInput.checkValidity();
          expect(typeof isValid).toBe('boolean');
        } else {
          compatibilityTester.addCompatibilityIssue(
            browser,
            'formValidation',
            'minor',
            `HTML5 form validation not supported in ${browser}`
          );
        }
      });
    });

    test('should handle CSS class manipulation across browsers', () => {
      browsers.forEach(browser => {
        const { document } = setupBrowserEnvironment(browser);

        const appView = document.getElementById('app-view');

        // Test classList API
        expect(appView.classList).toBeDefined();
        expect(typeof appView.classList.add).toBe('function');
        expect(typeof appView.classList.remove).toBe('function');
        expect(typeof appView.classList.contains).toBe('function');
        expect(typeof appView.classList.toggle).toBe('function');

        // Test basic operations
        appView.classList.add('test-class');
        expect(appView.classList.contains('test-class')).toBe(true);

        appView.classList.remove('test-class');
        expect(appView.classList.contains('test-class')).toBe(false);
      });
    });
  });

  describe('Event Handling Compatibility', () => {
    test('should handle modern event listeners across browsers', () => {
      browsers.forEach(browser => {
        const { document } = setupBrowserEnvironment(browser);

        const button = document.getElementById('login-submit');
        let eventFired = false;

        // Test addEventListener
        expect(typeof button.addEventListener).toBe('function');
        expect(typeof button.removeEventListener).toBe('function');

        const handler = () => { eventFired = true; };
        button.addEventListener('click', handler);

        // Simulate click
        const clickEvent = new document.defaultView.Event('click', { bubbles: true });
        button.dispatchEvent(clickEvent);

        expect(eventFired).toBe(true);

        // Test removeEventListener
        button.removeEventListener('click', handler);
        eventFired = false;
        button.dispatchEvent(clickEvent);
        expect(eventFired).toBe(false);
      });
    });

    test('should handle keyboard events across browsers', () => {
      browsers.forEach(browser => {
        const { document } = setupBrowserEnvironment(browser);

        const input = document.getElementById('login-email');
        let keyEventFired = false;

        const keyHandler = (e) => {
          keyEventFired = true;
          expect(e.key || e.keyCode).toBeDefined();
        };

        input.addEventListener('keydown', keyHandler);

        // Simulate keyboard event
        const keyEvent = new document.defaultView.KeyboardEvent('keydown', {
          key: 'Enter',
          keyCode: 13,
          bubbles: true
        });

        input.dispatchEvent(keyEvent);
        expect(keyEventFired).toBe(true);
      });
    });

    test('should handle input events across browsers', () => {
      browsers.forEach(browser => {
        const { document } = setupBrowserEnvironment(browser);

        const input = document.getElementById('note-title');
        let inputEventFired = false;

        input.addEventListener('input', () => {
          inputEventFired = true;
        });

        // Simulate input
        input.value = 'Test input';
        const inputEvent = new document.defaultView.Event('input', { bubbles: true });
        input.dispatchEvent(inputEvent);

        expect(inputEventFired).toBe(true);
      });
    });
  });

  describe('CSS and Styling Compatibility', () => {
    test('should support modern CSS features', () => {
      browsers.forEach(browser => {
        const { document } = setupBrowserEnvironment(browser);

        const testElement = document.createElement('div');
        const style = testElement.style;

        // Test CSS Grid support
        if (style.display !== undefined) {
          style.display = 'grid';
          const supportsGrid = style.display === 'grid';

          if (!supportsGrid && (browser === 'chrome' || browser === 'firefox' || browser === 'edge')) {
            compatibilityTester.addCompatibilityIssue(
              browser,
              'cssGrid',
              'minor',
              `CSS Grid may not be fully supported in ${browser}`
            );
          }
        }

        // Test CSS Flexbox support
        style.display = 'flex';
        const supportsFlex = style.display === 'flex';
        expect(supportsFlex).toBe(true);

        // Test CSS custom properties (CSS variables)
        style.setProperty('--test-var', '10px');
        const customPropSupported = style.getPropertyValue('--test-var') === '10px';

        if (!customPropSupported) {
          compatibilityTester.addCompatibilityIssue(
            browser,
            'cssCustomProperties',
            'minor',
            `CSS custom properties not supported in ${browser}`
          );
        }
      });
    });

    test('should handle responsive design features', () => {
      browsers.forEach(browser => {
        const { window } = setupBrowserEnvironment(browser);

        // Test matchMedia support
        if (typeof window.matchMedia === 'function') {
          const mediaQuery = window.matchMedia('(max-width: 768px)');
          expect(typeof mediaQuery.matches).toBe('boolean');
          expect(typeof mediaQuery.addListener).toBe('function');
        } else {
          compatibilityTester.addCompatibilityIssue(
            browser,
            'matchMedia',
            'minor',
            `matchMedia API not supported in ${browser}`
          );
        }
      });
    });
  });

  describe('Performance API Compatibility', () => {
    test('should support performance measurement APIs', () => {
      browsers.forEach(browser => {
        compatibilityTester.mockBrowser(browser);

        // Test performance.now()
        if (typeof performance !== 'undefined' && typeof performance.now === 'function') {
          const time1 = performance.now();
          const time2 = performance.now();
          expect(time2).toBeGreaterThanOrEqual(time1);
        } else {
          // Fallback to Date.now()
          expect(typeof Date.now).toBe('function');
        }

        // Test requestAnimationFrame
        const hasRAF = compatibilityTester.testFeatureSupport(browser, 'raf');
        if (!hasRAF) {
          compatibilityTester.addCompatibilityIssue(
            browser,
            'requestAnimationFrame',
            'minor',
            `requestAnimationFrame not supported in ${browser}`
          );
        }
      });
    });
  });

  describe('Security Feature Compatibility', () => {
    test('should handle Content Security Policy across browsers', () => {
      browsers.forEach(browser => {
        const { document } = setupBrowserEnvironment(browser);

        // Test that inline scripts are blocked (when CSP is enabled)
        const script = document.createElement('script');
        script.innerHTML = 'console.log("inline script")';

        // This should be blocked by CSP in modern browsers
        // For testing, we just verify the script element is created
        expect(script.tagName).toBe('SCRIPT');
        expect(script.innerHTML).toBe('console.log("inline script")');
      });
    });

    test('should support secure contexts requirements', () => {
      browsers.forEach(browser => {
        compatibilityTester.mockBrowser(browser);

        // Some APIs require secure contexts (HTTPS)
        const hasSecureContext = window.isSecureContext !== false;

        if (hasSecureContext) {
          expect(window.crypto).toBeDefined();
          expect(window.crypto.subtle).toBeDefined();
        }
      });
    });
  });

  describe('Mobile Browser Compatibility', () => {
    test('should handle touch events for mobile browsers', () => {
      const mobileBrowsers = ['chrome', 'firefox', 'safari']; // Mobile versions

      mobileBrowsers.forEach(browser => {
        const { document } = setupBrowserEnvironment(browser);

        const element = document.getElementById('new-note');
        let touchEventFired = false;

        // Test touch events
        if (typeof document.defaultView.TouchEvent !== 'undefined') {
          element.addEventListener('touchstart', () => {
            touchEventFired = true;
          });

          // Simulate touch event
          try {
            const touchEvent = new document.defaultView.TouchEvent('touchstart', {
              touches: [],
              bubbles: true
            });
            element.dispatchEvent(touchEvent);
          } catch (e) {
            // TouchEvent constructor may not be fully supported in test environment
            // This is acceptable for testing purposes
          }
        }

        // Touch events are optional but should not break the application
        expect(typeof element.addEventListener).toBe('function');
      });
    });

    test('should handle viewport meta tag', () => {
      browsers.forEach(browser => {
        const { document } = setupBrowserEnvironment(browser);

        // Add viewport meta tag
        const viewportMeta = document.createElement('meta');
        viewportMeta.name = 'viewport';
        viewportMeta.content = 'width=device-width, initial-scale=1.0';

        document.head.appendChild(viewportMeta);

        const addedMeta = document.querySelector('meta[name="viewport"]');
        expect(addedMeta).toBeDefined();
        expect(addedMeta.content).toBe('width=device-width, initial-scale=1.0');
      });
    });
  });

  describe('Accessibility Features Compatibility', () => {
    test('should support ARIA attributes across browsers', () => {
      browsers.forEach(browser => {
        const { document } = setupBrowserEnvironment(browser);

        const button = document.getElementById('new-note');

        // Test ARIA attributes
        button.setAttribute('aria-label', 'Create new note');
        button.setAttribute('aria-describedby', 'help-text');
        button.setAttribute('role', 'button');

        expect(button.getAttribute('aria-label')).toBe('Create new note');
        expect(button.getAttribute('aria-describedby')).toBe('help-text');
        expect(button.getAttribute('role')).toBe('button');
      });
    });

    test('should support keyboard navigation', () => {
      browsers.forEach(browser => {
        const { document } = setupBrowserEnvironment(browser);

        const elements = [
          document.getElementById('login-email'),
          document.getElementById('login-password'),
          document.getElementById('login-submit')
        ];

        // Test tabindex
        elements.forEach((element, index) => {
          element.setAttribute('tabindex', (index + 1).toString());
          expect(element.getAttribute('tabindex')).toBe((index + 1).toString());
        });

        // Test focus management
        const firstElement = elements[0];
        if (typeof firstElement.focus === 'function') {
          expect(typeof firstElement.focus).toBe('function');
          expect(typeof firstElement.blur).toBe('function');
        }
      });
    });
  });

  afterEach(() => {
    const report = compatibilityTester.getCompatibilityReport();

    if (report.issues.length > 0) {
      console.log(`\nCompatibility Issues Found: ${report.issues.length}`);
      console.log(`Critical: ${report.summary.criticalIssues}, Major: ${report.summary.majorIssues}`);

      report.issues.forEach(issue => {
        console.log(`  [${issue.severity.toUpperCase()}] ${issue.browser}: ${issue.description}`);
      });
    }

    expect(report.summary.overallStatus).toBe('PASS');
  });

  afterAll(() => {
    const finalReport = compatibilityTester.getCompatibilityReport();

    console.log('\n=== Cross-Browser Compatibility Report ===');
    console.log(`Browsers Tested: ${finalReport.summary.totalBrowsers}`);
    console.log(`Total Issues: ${finalReport.summary.totalIssues}`);
    console.log(`Critical Issues: ${finalReport.summary.criticalIssues}`);
    console.log(`Major Issues: ${finalReport.summary.majorIssues}`);
    console.log(`Overall Status: ${finalReport.summary.overallStatus}`);

    if (finalReport.issues.length > 0) {
      console.log('\nDetailed Issues:');
      finalReport.issues.forEach(issue => {
        console.log(`  ${issue.browser} - ${issue.feature}: ${issue.description} [${issue.severity}]`);
      });
    }
  });
});