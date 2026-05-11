import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach, vi } from 'vitest';

// Clear RTL state after each test
afterEach(() => {
  cleanup();
});

/**
 * Fail Safety Guard: 
 * We want to catch "Duplicate Key" warnings and other critical React console errors 
 * that don't trigger a hard crash but indicate logic errors.
 */
const originalError = console.error;
const originalWarn = console.warn;

console.error = (...args: any[]) => {
  const message = args[0]?.toString() || '';
  
  // Fail test if React key warnings appear
  if (message.includes('Encountered two children with the same key')) {
    throw new Error(`[RUNTIME SAFETY FAIL] Duplicate React Key detected: ${message}`);
  }

  // Fail on other critical React errors
  if (message.includes('React does not recognize the prop')) {
    throw new Error(`[RUNTIME SAFETY FAIL] Invalid prop passed to React component: ${message}`);
  }

  originalError.apply(console, args);
};

console.warn = (...args: any[]) => {
  const message = args[0]?.toString() || '';
  
  // You can add warnings to catch here too if needed
  
  originalWarn.apply(console, args);
};

// Mock global objects that might be missing in JSDOM
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});
