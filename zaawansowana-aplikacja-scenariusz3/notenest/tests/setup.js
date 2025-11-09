// Test setup configuration
require('@testing-library/jest-dom');

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};

// Mock IndexedDB
const indexedDBMock = {
  open: jest.fn(),
  deleteDatabase: jest.fn(),
};

// Mock crypto.subtle
const cryptoMock = {
  subtle: {
    digest: jest.fn().mockImplementation(async (algorithm, data) => {
      // Create a simple hash based on the input data
      const input = Array.from(new Uint8Array(data));
      const hash = new ArrayBuffer(32);
      const view = new Uint8Array(hash);

      // Simple deterministic "hash" function
      for (let i = 0; i < 32; i++) {
        view[i] = input.reduce((acc, val, idx) =>
          (acc + val + idx + i) % 256, 0
        );
      }

      return hash;
    }),
  },
};

// Mock TextEncoder and TextDecoder
global.TextEncoder = class TextEncoder {
  encode(text) {
    return new Uint8Array(Buffer.from(text, 'utf-8'));
  }
};

global.TextDecoder = class TextDecoder {
  decode(data) {
    return Buffer.from(data).toString('utf-8');
  }
};

// Mock window.crypto
Object.defineProperty(window, 'crypto', {
  value: cryptoMock,
  writable: true,
});

// Mock localStorage
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
  writable: true,
});

// Mock indexedDB
Object.defineProperty(window, 'indexedDB', {
  value: indexedDBMock,
  writable: true,
});

// Mock console to reduce noise in tests
global.console = {
  ...console,
  log: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

// Global test utilities
global.createMockUser = () => ({
  id: 'test-user-id',
  name: 'Test User',
  email: 'test@example.com',
  passwordHash: 'hashed-password',
  createdAt: '2023-01-01T00:00:00.000Z'
});

global.createMockNote = (overrides = {}) => ({
  id: 'test-note-id',
  title: 'Test Note',
  content: '<p>Test content</p>',
  tags: ['test', 'mock'],
  notebookId: 'test-notebook-id',
  userId: 'test-user-id',
  createdAt: '2023-01-01T00:00:00.000Z',
  modifiedAt: '2023-01-01T00:00:00.000Z',
  ...overrides
});

global.createMockNotebook = (overrides = {}) => ({
  id: 'test-notebook-id',
  name: 'Test Notebook',
  description: 'Test description',
  color: '#E97900',
  userId: 'test-user-id',
  createdAt: '2023-01-01T00:00:00.000Z',
  ...overrides
});