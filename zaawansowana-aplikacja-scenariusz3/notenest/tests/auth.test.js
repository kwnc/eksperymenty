// Authentication Manager Tests
const fs = require('fs');
const path = require('path');

// Load the AuthManager class
const authManagerCode = fs.readFileSync(
  path.join(process.cwd(), 'assets/js/auth.js'),
  'utf8'
);

// Create a simple StorageManager mock for testing
class MockStorageManager {
  constructor() {
    this.users = new Map();
    this.sessions = new Map();
  }

  async getUserByEmail(email) {
    return Array.from(this.users.values()).find(user => user.email === email);
  }

  async saveUser(userData) {
    const id = 'user_' + Date.now();
    const user = { id, ...userData };
    this.users.set(id, user);
    return user;
  }

  async getSessionData(sessionId) {
    return this.sessions.get(sessionId);
  }

  async saveSessionData(sessionId, data) {
    this.sessions.set(sessionId, data);
  }

  async clearSessionData(sessionId) {
    this.sessions.delete(sessionId);
  }

  async updateUser(id, userData) {
    const existing = this.users.get(id);
    if (!existing) throw new Error('User not found');
    const updated = { ...existing, ...userData };
    this.users.set(id, updated);
    return updated;
  }

  async setSessionData(sessionKey, data) {
    this.sessions.set(sessionKey, data);
  }

  async saveNotebook(notebookData) {
    const id = 'notebook_' + this.idCounter++;
    const notebook = { id, ...notebookData };
    // We don't have notebooks in this mock, but we can just return the notebook
    return notebook;
  }
}

// Make StorageManager available globally for AuthManager
global.StorageManager = MockStorageManager;

// Execute the auth manager code to define the class
eval(authManagerCode);

describe('AuthManager', () => {
  let authManager;
  let mockStorageManager;

  beforeEach(() => {
    // Clear mocks
    jest.clearAllMocks();

    // Create new instance
    authManager = new AuthManager();
    mockStorageManager = new MockStorageManager();
    authManager.storageManager = mockStorageManager;
  });

  describe('validateEmail', () => {
    test('should validate correct email addresses', () => {
      expect(authManager.validateEmail('test@example.com')).toBe(true);
      expect(authManager.validateEmail('user.name+tag@domain.co.uk')).toBe(true);
    });

    test('should reject invalid email addresses', () => {
      expect(authManager.validateEmail('invalid-email')).toBe(false);
      expect(authManager.validateEmail('test@')).toBe(false);
      expect(authManager.validateEmail('@domain.com')).toBe(false);
      expect(authManager.validateEmail('')).toBe(false);
    });
  });

  describe('validatePassword', () => {
    test('should validate strong passwords', () => {
      const result = authManager.validatePassword('SecurePass123');
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('should reject weak passwords', () => {
      let result = authManager.validatePassword('weak');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password must be at least 8 characters long');

      result = authManager.validatePassword('lowercase123');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password must contain at least one uppercase letter');

      result = authManager.validatePassword('UPPERCASE123');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password must contain at least one lowercase letter');

      result = authManager.validatePassword('NoNumbers');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password must contain at least one number');
    });
  });

  describe('hashPassword', () => {
    test('should hash passwords consistently', async () => {
      const password = 'TestPassword123';
      const hash1 = await authManager.hashPassword(password);
      const hash2 = await authManager.hashPassword(password);

      expect(hash1).toBe(hash2);
      expect(hash1).toHaveLength(64); // SHA-256 hex string length
    });

    test('should produce different hashes for different passwords', async () => {
      const hash1 = await authManager.hashPassword('password1');
      const hash2 = await authManager.hashPassword('password2');

      expect(hash1).not.toBe(hash2);
    });
  });

  describe('register', () => {
    test('should successfully register a new user', async () => {
      const userData = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'SecurePass123'
      };

      const result = await authManager.register(
        userData.name,
        userData.email,
        userData.password
      );

      expect(result.success).toBe(true);
      expect(authManager.getCurrentUser()).toBeDefined();
      expect(authManager.getCurrentUser().email).toBe(userData.email.toLowerCase());
      expect(authManager.getCurrentUser().name).toBe(userData.name);
    });

    test('should reject registration with missing fields', async () => {
      const result1 = await authManager.register('', 'test@example.com', 'SecurePass123');
      expect(result1.success).toBe(false);
      expect(result1.message).toBe('All fields are required');

      const result2 = await authManager.register('Test User', '', 'SecurePass123');
      expect(result2.success).toBe(false);
      expect(result2.message).toBe('All fields are required');

      const result3 = await authManager.register('Test User', 'test@example.com', '');
      expect(result3.success).toBe(false);
      expect(result3.message).toBe('All fields are required');
    });

    test('should reject registration with invalid email', async () => {
      const result = await authManager.register('Test User', 'invalid-email', 'SecurePass123');
      expect(result.success).toBe(false);
      expect(result.message).toBe('Please enter a valid email address');
    });

    test('should reject registration with weak password', async () => {
      const result = await authManager.register('Test User', 'test@example.com', 'weak');
      expect(result.success).toBe(false);
      expect(result.message).toContain('Password must be at least 8 characters long');
    });

    test('should reject duplicate email registration', async () => {
      const userData = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'SecurePass123'
      };

      // Register first user
      await authManager.register(userData.name, userData.email, userData.password);

      // Try to register again with same email
      const duplicateResult = await authManager.register('Another User', userData.email, 'AnotherPass123');
      expect(duplicateResult.success).toBe(false);
      expect(duplicateResult.message).toBe('An account with this email already exists');
    });
  });

  describe('login', () => {
    beforeEach(async () => {
      // Create a test user for login tests
      await authManager.register('Test User', 'test@example.com', 'SecurePass123');
    });

    test('should successfully login with correct credentials', async () => {
      const result = await authManager.login('test@example.com', 'SecurePass123');

      expect(result.success).toBe(true);
      expect(result.user).toBeDefined();
      expect(result.user.email).toBe('test@example.com');
      expect(authManager.currentUser).toBeDefined();
    });

    test('should reject login with incorrect email', async () => {
      await authManager.logout(); // Clear any existing session
      const result = await authManager.login('wrong@example.com', 'SecurePass123');

      expect(result.success).toBe(false);
      expect(result.message).toBe('Invalid email or password');
      expect(authManager.currentUser).toBeNull();
    });

    test('should reject login with incorrect password', async () => {
      await authManager.logout(); // Clear any existing session
      const result = await authManager.login('test@example.com', 'WrongPassword123');

      expect(result.success).toBe(false);
      expect(result.message).toBe('Invalid email or password');
      expect(authManager.currentUser).toBeNull();
    });

    test('should reject login with missing credentials', async () => {
      const result1 = await authManager.login('', 'SecurePass123');
      expect(result1.success).toBe(false);
      expect(result1.message).toBe('Email and password are required');

      const result2 = await authManager.login('test@example.com', '');
      expect(result2.success).toBe(false);
      expect(result2.message).toBe('Email and password are required');
    });
  });

  describe('logout', () => {
    test('should successfully logout user', async () => {
      // Login first
      await authManager.register('Test User', 'test@example.com', 'SecurePass123');
      await authManager.login('test@example.com', 'SecurePass123');

      const result = await authManager.logout();

      expect(result.success).toBe(true);
      expect(authManager.currentUser).toBeNull();
    });

    test('should handle logout when no user is logged in', async () => {
      const result = await authManager.logout();

      expect(result.success).toBe(true);
      expect(authManager.currentUser).toBeNull();
    });
  });

  describe('getCurrentUser', () => {
    test('should return current user when logged in', async () => {
      await authManager.register('Test User', 'test@example.com', 'SecurePass123');
      await authManager.login('test@example.com', 'SecurePass123');

      const currentUser = authManager.getCurrentUser();

      expect(currentUser).toBeDefined();
      expect(currentUser.email).toBe('test@example.com');
    });

    test('should return null when no user is logged in', () => {
      const currentUser = authManager.getCurrentUser();
      expect(currentUser).toBeNull();
    });
  });

  describe('authentication state callback', () => {
    test('should call callback when auth state changes', async () => {
      const callback = jest.fn();
      authManager.setAuthStateChangeCallback(callback);

      await authManager.register('Test User', 'test@example.com', 'SecurePass123');
      await authManager.login('test@example.com', 'SecurePass123');

      expect(callback).toHaveBeenCalledWith(expect.objectContaining({
        email: 'test@example.com'
      }));

      await authManager.logout();

      expect(callback).toHaveBeenCalledWith(null);
    });
  });
});