/**
 * Test setup - Mock Chrome APIs
 */

import { vi } from 'vitest';

// Mock Chrome API
const chromeMock = {
  runtime: {
    getURL: vi.fn((path: string) => `chrome-extension://mock-id/${path}`),
    onMessage: {
      addListener: vi.fn(),
      removeListener: vi.fn(),
    },
    sendMessage: vi.fn(),
    lastError: null,
  },
  storage: {
    sync: {
      get: vi.fn((keys, callback) => {
        callback({});
      }),
      set: vi.fn((items, callback) => {
        if (callback) callback();
      }),
    },
    onChanged: {
      addListener: vi.fn(),
      removeListener: vi.fn(),
    },
  },
  tabs: {
    sendMessage: vi.fn(),
  },
};

// @ts-expect-error - Mocking global chrome object
global.chrome = chromeMock;
