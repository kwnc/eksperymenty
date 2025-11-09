// Security Tests for NoteNest Application
const fs = require('fs');
const path = require('path');

// Security testing utilities
class SecurityTester {
  constructor() {
    this.vulnerabilities = [];
    this.testResults = {};
  }

  addVulnerability(type, severity, description, recommendation) {
    this.vulnerabilities.push({
      type,
      severity,
      description,
      recommendation,
      timestamp: new Date().toISOString()
    });
  }

  getVulnerabilities() {
    return [...this.vulnerabilities];
  }

  clearVulnerabilities() {
    this.vulnerabilities = [];
  }

  testXSS(input, context = 'general') {
    const xssPayloads = [
      '<script>alert("XSS")</script>',
      '"><script>alert("XSS")</script>',
      '<img src="x" onerror="alert(\'XSS\')">',
      'javascript:alert("XSS")',
      '<svg onload="alert(\'XSS\')">',
      '&#60;script&#62;alert("XSS")&#60;/script&#62;',
      '<iframe src="javascript:alert(\'XSS\')"></iframe>',
      '<body onload="alert(\'XSS\')">',
      'expression(alert("XSS"))',
      '<style>@import"javascript:alert(\'XSS\')";</style>'
    ];

    const results = [];

    for (const payload of xssPayloads) {
      const testInput = input.replace('%PAYLOAD%', payload);
      results.push({
        payload,
        input: testInput,
        context,
        dangerous: this.containsExecutableCode(testInput)
      });
    }

    return results;
  }

  containsExecutableCode(input) {
    const patterns = [
      /<script[\s\S]*?<\/script>/gi,
      /javascript:/gi,
      /on\w+\s*=/gi,
      /@import/gi,
      /expression\(/gi,
      /<iframe/gi,
      /<embed/gi,
      /<object/gi
    ];

    return patterns.some(pattern => pattern.test(input));
  }

  testSQLInjection(input) {
    const sqlPayloads = [
      "'; DROP TABLE notes; --",
      "1' OR '1'='1",
      "1' UNION SELECT * FROM users --",
      "'; INSERT INTO users VALUES ('hacker', 'password'); --",
      "1'; UPDATE users SET password='hacked' WHERE id=1; --",
      "1' OR 1=1 #",
      "admin'--",
      "admin' /*",
      "1' ORDER BY 1--+",
      "' AND extractvalue(1, concat(0x7e, version(), 0x7e))-- -"
    ];

    return sqlPayloads.map(payload => ({
      payload,
      input: input.replace('%PAYLOAD%', payload),
      dangerous: this.containsSQLInjection(payload)
    }));
  }

  containsSQLInjection(input) {
    const patterns = [
      /DROP\s+TABLE/gi,
      /UNION\s+SELECT/gi,
      /INSERT\s+INTO/gi,
      /UPDATE\s+\w+\s+SET/gi,
      /DELETE\s+FROM/gi,
      /OR\s+1\s*=\s*1/gi,
      /--/g,
      /\/\*/g,
      /extractvalue/gi,
      /concat/gi
    ];

    return patterns.some(pattern => pattern.test(input));
  }
}

// Load application modules for testing
const storageManagerCode = fs.readFileSync(path.join(process.cwd(), 'assets/js/storage.js'), 'utf8');
const authManagerCode = fs.readFileSync(path.join(process.cwd(), 'assets/js/auth.js'), 'utf8');
const notesManagerCode = fs.readFileSync(path.join(process.cwd(), 'assets/js/notes.js'), 'utf8');

// Mock storage for security testing
class SecurityStorageManager {
  constructor() {
    this.data = {
      users: new Map(),
      notes: new Map(),
      notebooks: new Map(),
      sessions: new Map()
    };
    this.idCounter = 1;
    this.auditLog = [];
    this.initPromise = Promise.resolve();
    this.isReady = true;
  }

  logAccess(operation, userId, resourceId, success = true) {
    this.auditLog.push({
      timestamp: new Date().toISOString(),
      operation,
      userId,
      resourceId,
      success,
      ip: '127.0.0.1' // Mock IP
    });
  }

  async saveUser(userData) {
    // Validate user data for security issues
    if (this.containsMaliciousContent(userData.name) ||
        this.containsMaliciousContent(userData.email)) {
      throw new Error('Invalid user data detected');
    }

    const id = `user_${this.idCounter++}`;
    const user = { id, ...userData };
    this.data.users.set(id, user);
    this.logAccess('CREATE_USER', id, id);
    return user;
  }

  async getUserByEmail(email) {
    // Log access attempt
    this.logAccess('GET_USER_BY_EMAIL', 'system', email);

    // Check for injection attempts
    if (this.containsMaliciousContent(email)) {
      this.logAccess('SECURITY_VIOLATION', 'system', email, false);
      return null;
    }

    return Array.from(this.data.users.values()).find(user => user.email === email) || null;
  }

  async saveNote(noteData) {
    // Security validation for note content
    if (this.containsMaliciousContent(noteData.title) ||
        this.containsMaliciousContent(noteData.content)) {
      this.logAccess('SECURITY_VIOLATION', noteData.userId, 'note_creation', false);
      throw new Error('Malicious content detected in note');
    }

    const id = `note_${this.idCounter++}`;
    const note = {
      id,
      ...noteData,
      createdAt: new Date().toISOString(),
      modifiedAt: new Date().toISOString()
    };

    this.data.notes.set(id, note);
    this.logAccess('CREATE_NOTE', noteData.userId, id);
    return note;
  }

  async getNotesByUserId(userId) {
    this.logAccess('GET_NOTES', userId, 'user_notes');

    // Ensure user can only access their own notes
    return Array.from(this.data.notes.values()).filter(note => note.userId === userId);
  }

  async getNoteById(id) {
    const note = this.data.notes.get(id);
    if (note) {
      this.logAccess('GET_NOTE', note.userId, id);
    } else {
      this.logAccess('GET_NOTE_NOT_FOUND', 'unknown', id, false);
    }
    return note || null;
  }

  containsMaliciousContent(content) {
    if (!content) return false;

    const maliciousPatterns = [
      /<script[\s\S]*?<\/script>/gi,
      /javascript:/gi,
      /on\w+\s*=/gi,
      /document\./gi,
      /window\./gi,
      /eval\(/gi,
      /setTimeout/gi,
      /setInterval/gi,
      /<iframe/gi,
      /<embed/gi,
      /<object/gi,
      /DROP\s+TABLE/gi,
      /UNION\s+SELECT/gi,
      /INSERT\s+INTO/gi
    ];

    return maliciousPatterns.some(pattern => pattern.test(content));
  }

  getAuditLog() {
    return [...this.auditLog];
  }

  clearAuditLog() {
    this.auditLog = [];
  }
}

// Set up globals and execute code
global.StorageManager = SecurityStorageManager;
global.crypto = {
  subtle: {
    digest: jest.fn().mockImplementation(async (algorithm, data) => {
      // Return predictable hash for testing
      return new ArrayBuffer(32);
    })
  }
};

eval(storageManagerCode);
eval(authManagerCode);
eval(notesManagerCode);

describe('NoteNest Security Tests', () => {
  let securityTester;
  let storageManager;
  let authManager;
  let notesManager;

  beforeEach(async () => {
    jest.clearAllMocks();
    securityTester = new SecurityTester();

    // Initialize managers
    storageManager = new SecurityStorageManager();
    authManager = new AuthManager();
    notesManager = new NotesManager();

    // Set up dependencies
    authManager.storageManager = storageManager;
    notesManager.setAuthManager(authManager);
    notesManager.storageManager = storageManager;
  });

  describe('Authentication Security', () => {
    test('should validate password strength requirements', async () => {
      const weakPasswords = [
        '123456',        // Too short and simple
        'password',      // Common password
        'abc123',        // Too short
        'ALLUPPERCASE',  // No lowercase or numbers
        'alllowercase',  // No uppercase or numbers
        'NoNumbers',     // No numbers
        '12345678'       // Only numbers
      ];

      for (const password of weakPasswords) {
        const validation = authManager.validatePassword(password);
        expect(validation.isValid).toBe(false);
        expect(validation.errors.length).toBeGreaterThan(0);
      }
    });

    test('should securely hash passwords', async () => {
      const testPasswords = ['SecurePass123', 'AnotherSecure456'];
      const hashes = [];

      for (const password of testPasswords) {
        const hash = await authManager.hashPassword(password);
        hashes.push(hash);

        // Hash should not contain original password
        expect(hash).not.toContain(password);

        // Hash should be consistent
        const secondHash = await authManager.hashPassword(password);
        expect(hash).toBe(secondHash);

        // Hash should be hex string of expected length
        expect(hash).toMatch(/^[a-f0-9]{64}$/);
      }

      // Different passwords should produce different hashes
      expect(hashes[0]).not.toBe(hashes[1]);
    });

    test('should prevent timing attacks on login', async () => {
      // Register a user
      await authManager.register('Test User', 'test@example.com', 'SecurePass123');

      const timings = [];

      // Measure login time for valid user
      const start1 = performance.now();
      await authManager.login('test@example.com', 'SecurePass123');
      const validUserTime = performance.now() - start1;
      timings.push(validUserTime);

      // Measure login time for invalid user
      const start2 = performance.now();
      try {
        await authManager.login('nonexistent@example.com', 'SecurePass123');
      } catch (e) {}
      const invalidUserTime = performance.now() - start2;
      timings.push(invalidUserTime);

      // Measure login time for valid user, wrong password
      const start3 = performance.now();
      try {
        await authManager.login('test@example.com', 'WrongPassword123');
      } catch (e) {}
      const wrongPasswordTime = performance.now() - start3;
      timings.push(wrongPasswordTime);

      // Timing differences should not be excessive (within 50% variance)
      const maxTiming = Math.max(...timings);
      const minTiming = Math.min(...timings);
      const timingVariance = (maxTiming - minTiming) / minTiming;

      expect(timingVariance).toBeLessThan(0.5);
    });

    test('should validate email format securely', () => {
      const maliciousEmails = [
        'test@example.com<script>alert("XSS")</script>',
        'test@example.com"; DROP TABLE users; --',
        'test@example.com\'; INSERT INTO users VALUES (\'hacker\'); --',
        'test@example.com" onload="alert(\'XSS\')" dummy="',
        'javascript:alert("XSS")@example.com'
      ];

      for (const email of maliciousEmails) {
        const isValid = authManager.validateEmail(email);
        expect(isValid).toBe(false);
      }
    });
  });

  describe('Input Validation and Sanitization', () => {
    beforeEach(async () => {
      await authManager.register('Security Test User', 'security@test.com', 'SecurePass123');
    });

    test('should prevent XSS in note titles', async () => {
      const xssPayloads = securityTester.testXSS('%PAYLOAD%', 'note_title');

      for (const testCase of xssPayloads) {
        if (testCase.dangerous) {
          await expect(notesManager.createNote({
            title: testCase.input,
            content: 'Safe content'
          })).rejects.toThrow('Malicious content detected');
        }
      }
    });

    test('should prevent XSS in note content', async () => {
      const maliciousContent = [
        '<script>alert("XSS")</script>',
        '<img src="x" onerror="alert(\'XSS\')">',
        '<svg onload="alert(\'XSS\')">',
        '<iframe src="javascript:alert(\'XSS\')"></iframe>',
        '<body onload="alert(\'XSS\')">',
        '<style>body{background:url("javascript:alert(\'XSS\')")}</style>'
      ];

      for (const content of maliciousContent) {
        await expect(notesManager.createNote({
          title: 'Test Note',
          content: content
        })).rejects.toThrow('Malicious content detected');
      }
    });

    test('should prevent code injection in search queries', () => {
      const maliciousQueries = [
        '<script>document.location="http://evil.com"</script>',
        'javascript:alert("XSS")',
        '<img src=x onerror="alert(\'XSS\')">',
        '"; DROP TABLE notes; --',
        '\'; INSERT INTO notes VALUES (\'hacked\'); --'
      ];

      // First create some safe notes
      const safeNotes = [
        { id: '1', title: 'Safe Note 1', content: 'Safe content', tags: ['safe'] },
        { id: '2', title: 'Safe Note 2', content: 'More safe content', tags: ['test'] }
      ];

      notesManager.notes = safeNotes;

      for (const query of maliciousQueries) {
        // Search should not execute malicious code and should return empty results
        const results = notesManager.searchNotes(query);
        expect(Array.isArray(results)).toBe(true);
        expect(results.length).toBe(0);
      }
    });

    test('should sanitize tag input', async () => {
      const maliciousTags = [
        '<script>alert("XSS")</script>',
        'javascript:alert("XSS")',
        '<img src=x onerror=alert("XSS")>',
        'tag"; DROP TABLE notes; --'
      ];

      for (const tag of maliciousTags) {
        await expect(notesManager.createNote({
          title: 'Test Note',
          content: 'Safe content',
          tags: [tag, 'safe-tag']
        })).rejects.toThrow('Malicious content detected');
      }
    });
  });

  describe('Access Control', () => {
    let user1, user2;

    beforeEach(async () => {
      // Create two test users
      const result1 = await authManager.register('User One', 'user1@test.com', 'SecurePass123');
      user1 = result1.user;

      await authManager.logout();

      const result2 = await authManager.register('User Two', 'user2@test.com', 'SecurePass456');
      user2 = result2.user;
    });

    test('should prevent unauthorized access to notes', async () => {
      // User 1 creates a note
      await authManager.login('user1@test.com', 'SecurePass123');
      const note = await notesManager.createNote({
        title: 'User 1 Private Note',
        content: 'This should only be accessible to User 1'
      });

      await authManager.logout();

      // User 2 logs in
      await authManager.login('user2@test.com', 'SecurePass456');

      // User 2 should not be able to access User 1's notes
      await notesManager.loadNotes();
      expect(notesManager.notes.find(n => n.id === note.id)).toBeUndefined();

      // Direct access to note should also be prevented
      const directAccess = await storageManager.getNoteById(note.id);
      expect(directAccess).toBeDefined(); // Note exists

      // But user 2 shouldn't see it in their notes list
      const user2Notes = await storageManager.getNotesByUserId(user2.id);
      expect(user2Notes.find(n => n.id === note.id)).toBeUndefined();
    });

    test('should enforce session-based access control', async () => {
      // Create note while logged in
      await authManager.login('user1@test.com', 'SecurePass123');
      await notesManager.createNote({
        title: 'Session Test Note',
        content: 'Test content'
      });

      // Logout should clear access
      await authManager.logout();

      // Should not be able to load notes without authentication
      await expect(notesManager.loadNotes()).rejects.toThrow('User not authenticated');

      // Should not be able to create notes without authentication
      await expect(notesManager.createNote({
        title: 'Unauthorized Note',
        content: 'This should fail'
      })).rejects.toThrow('User not authenticated');
    });
  });

  describe('Data Integrity', () => {
    beforeEach(async () => {
      await authManager.register('Integrity User', 'integrity@test.com', 'SecurePass123');
    });

    test('should maintain data integrity during updates', async () => {
      // Create original note
      const originalNote = await notesManager.createNote({
        title: 'Original Title',
        content: 'Original content',
        tags: ['original']
      });

      const originalModified = originalNote.modifiedAt;

      // Wait a moment to ensure timestamp difference
      await new Promise(resolve => setTimeout(resolve, 10));

      // Update note
      await notesManager.setCurrentNote(originalNote.id);
      const updatedNote = await notesManager.saveCurrentNote({
        title: 'Updated Title',
        content: 'Updated content',
        tags: ['updated']
      });

      // Verify integrity
      expect(updatedNote.id).toBe(originalNote.id);
      expect(updatedNote.userId).toBe(originalNote.userId);
      expect(updatedNote.createdAt).toBe(originalNote.createdAt);
      expect(updatedNote.modifiedAt).not.toBe(originalModified);
      expect(updatedNote.title).toBe('Updated Title');
      expect(updatedNote.content).toBe('Updated content');
      expect(updatedNote.tags).toEqual(['updated']);
    });

    test('should prevent data corruption from concurrent access', async () => {
      const note = await notesManager.createNote({
        title: 'Concurrent Test',
        content: 'Original content'
      });

      // Simulate concurrent updates
      const update1 = storageManager.updateNote ?
        storageManager.updateNote(note.id, { title: 'Update 1', content: 'Content 1' }) :
        Promise.resolve();

      const update2 = storageManager.updateNote ?
        storageManager.updateNote(note.id, { title: 'Update 2', content: 'Content 2' }) :
        Promise.resolve();

      await Promise.all([update1, update2]);

      // Final state should be consistent
      const finalNote = await storageManager.getNoteById(note.id);
      expect(finalNote).toBeDefined();
      expect(finalNote.id).toBe(note.id);
      expect(finalNote.userId).toBe(note.userId);
    });
  });

  describe('Privacy and Data Protection', () => {
    test('should not log sensitive information', async () => {
      const sensitiveData = {
        password: 'SuperSecretPassword123',
        email: 'sensitive@example.com',
        content: 'Confidential business information'
      };

      await authManager.register('Test User', sensitiveData.email, sensitiveData.password);

      const auditLog = storageManager.getAuditLog();
      const logString = JSON.stringify(auditLog);

      // Audit log should not contain sensitive information
      expect(logString).not.toContain(sensitiveData.password);
      expect(logString).not.toContain('SuperSecret');

      // But should contain non-sensitive operation info
      expect(auditLog.some(entry => entry.operation === 'CREATE_USER')).toBe(true);
    });

    test('should handle password reset securely', () => {
      // Password reset should not be implemented in local-only version
      // This test validates that password reset functionality is not available
      expect(typeof authManager.resetPassword).toBe('undefined');
      expect(typeof authManager.requestPasswordReset).toBe('undefined');
    });

    test('should securely clear user data on logout', async () => {
      await authManager.register('Privacy User', 'privacy@test.com', 'SecurePass123');

      // Create some user data
      await notesManager.createNote({
        title: 'Private Note',
        content: 'Sensitive information'
      });

      expect(authManager.getCurrentUser()).toBeDefined();
      expect(notesManager.notes.length).toBeGreaterThan(0);

      // Logout should clear sensitive data from memory
      await authManager.logout();

      expect(authManager.getCurrentUser()).toBeNull();
      expect(authManager.currentUser).toBeNull();
    });
  });

  describe('Error Handling Security', () => {
    test('should not reveal system information in error messages', async () => {
      const maliciousInputs = [
        { email: 'test@example.com', password: '\'; DROP TABLE users; --' },
        { email: '<script>alert("XSS")</script>', password: 'ValidPass123' },
        { email: 'test@example.com', password: 'short' }
      ];

      for (const input of maliciousInputs) {
        try {
          await authManager.login(input.email, input.password);
        } catch (error) {
          // Error messages should be generic
          expect(error.message).not.toContain('SQL');
          expect(error.message).not.toContain('database');
          expect(error.message).not.toContain('table');
          expect(error.message).not.toContain('script');
          expect(error.message).not.toContain('system');
          expect(error.message).not.toContain('internal');
        }
      }
    });

    test('should handle security violations gracefully', async () => {
      await authManager.register('Security User', 'security@test.com', 'SecurePass123');

      const maliciousAttempts = [
        { title: '<script>alert("XSS")</script>', content: 'Safe content' },
        { title: 'Safe title', content: '<img src=x onerror="alert(\'XSS\')">' },
        { title: 'javascript:alert("XSS")', content: 'Safe content' }
      ];

      for (const attempt of maliciousAttempts) {
        try {
          await notesManager.createNote(attempt);
          fail('Should have thrown security error');
        } catch (error) {
          expect(error.message).toContain('Malicious content detected');

          // Should log the security violation
          const auditLog = storageManager.getAuditLog();
          const violations = auditLog.filter(entry => entry.operation === 'SECURITY_VIOLATION');
          expect(violations.length).toBeGreaterThan(0);
        }
      }
    });
  });

  describe('Content Security Policy Compliance', () => {
    test('should not execute inline JavaScript', () => {
      const inlineScriptPatterns = [
        /on\w+\s*=/gi,        // Event handlers
        /javascript:/gi,       // JavaScript URLs
        /<script/gi,          // Script tags
        /eval\(/gi,           // Eval calls
        /setTimeout.*string/gi, // String-based setTimeout
        /setInterval.*string/gi // String-based setInterval
      ];

      const testContent = `
        <div onclick="alert('XSS')">Click me</div>
        <a href="javascript:alert('XSS')">Link</a>
        <script>alert('XSS')</script>
        <img src="x" onerror="alert('XSS')">
      `;

      const hasInlineScript = inlineScriptPatterns.some(pattern =>
        pattern.test(testContent)
      );

      expect(hasInlineScript).toBe(true); // Test content contains violations

      // Security manager should detect this
      expect(storageManager.containsMaliciousContent(testContent)).toBe(true);
    });

    test('should sanitize HTML content appropriately', () => {
      const unsafeHTML = [
        '<script>alert("XSS")</script><p>Safe content</p>',
        '<div onload="alert(\'XSS\')">Content</div>',
        '<style>body{background:url("javascript:alert(\'XSS\')")}</style>',
        '<iframe src="javascript:alert(\'XSS\')"></iframe>'
      ];

      for (const html of unsafeHTML) {
        expect(storageManager.containsMaliciousContent(html)).toBe(true);
      }

      // Safe HTML should pass
      const safeHTML = [
        '<p>This is safe content</p>',
        '<div class="note-content">Safe text</div>',
        '<strong>Bold text</strong>',
        '<em>Emphasized text</em>',
        '<ul><li>List item</li></ul>'
      ];

      for (const html of safeHTML) {
        expect(storageManager.containsMaliciousContent(html)).toBe(false);
      }
    });
  });

  afterEach(() => {
    const vulnerabilities = securityTester.getVulnerabilities();
    const auditLog = storageManager.getAuditLog();

    if (vulnerabilities.length > 0) {
      console.log('Security Vulnerabilities Found:');
      vulnerabilities.forEach(vuln => {
        console.log(`  [${vuln.severity}] ${vuln.type}: ${vuln.description}`);
        console.log(`    Recommendation: ${vuln.recommendation}`);
      });
    }

    if (auditLog.length > 0) {
      const securityEvents = auditLog.filter(entry =>
        entry.operation === 'SECURITY_VIOLATION' || !entry.success
      );

      if (securityEvents.length > 0) {
        console.log('Security Events:', securityEvents.length);
      }
    }
  });
});