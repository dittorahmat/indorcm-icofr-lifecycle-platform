import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { isChunkLoadError, clearChunkReloadGuards, lazyWithRetry } from '../lazyWithRetry';

describe('lazyWithRetry and chunk resilience', () => {
  const originalLocation = window.location;

  beforeEach(() => {
    vi.restoreAllMocks();
    sessionStorage.clear();
  });

  afterEach(() => {
    (window as any).location = originalLocation;
  });

  describe('isChunkLoadError', () => {
    it('identifies Vite and Webpack dynamic import failure messages', () => {
      expect(isChunkLoadError(new Error('Failed to fetch dynamically imported module: /assets/Deficiencies-B32.js'))).toBe(true);
      expect(isChunkLoadError(new Error('Loading chunk 42 failed'))).toBe(true);
      expect(isChunkLoadError(new Error('error loading dynamically imported module'))).toBe(true);
      expect(isChunkLoadError(new Error('Importing a module script failed.'))).toBe(true);
      expect(isChunkLoadError(new Error('Unable to preload CSS'))).toBe(true);
    });

    it('returns false for unrelated application and runtime errors', () => {
      expect(isChunkLoadError(new Error('Cannot read properties of undefined (reading "map")'))).toBe(false);
      expect(isChunkLoadError(new Error('Network error: 500 Internal Server Error'))).toBe(false);
      expect(isChunkLoadError(null)).toBe(false);
      expect(isChunkLoadError(undefined)).toBe(false);
    });
  });

  describe('clearChunkReloadGuards', () => {
    it('clears only keys matching the prefix', () => {
      sessionStorage.setItem('icofr_chunk_reload_/deficiencies', '1');
      sessionStorage.setItem('icofr_chunk_reload_/scoping', '1');
      sessionStorage.setItem('unrelated_key', 'keep_me');

      clearChunkReloadGuards('icofr_chunk_reload_');

      expect(sessionStorage.getItem('icofr_chunk_reload_/deficiencies')).toBeNull();
      expect(sessionStorage.getItem('icofr_chunk_reload_/scoping')).toBeNull();
      expect(sessionStorage.getItem('unrelated_key')).toBe('keep_me');
    });
  });

  describe('lazyWithRetry component factory', () => {
    const MockComponent = () => React.createElement('div', null, 'Loaded Successfully');

    it('resolves immediately when import succeeds on first try', async () => {
      const factory = vi.fn().mockResolvedValue({ default: MockComponent });
      const LazyComp = lazyWithRetry(factory, { maxRetries: 2, baseDelayMs: 10 });

      // In React.lazy, the factory is invoked via ._init(._payload) or by resolving the promise
      const payload = (LazyComp as any)._payload;
      const init = (LazyComp as any)._init;
      
      let result;
      if (typeof init === 'function') {
        // Evaluate the inner promise
        result = await (payload._result ? payload._result() : factory());
      } else {
        result = await factory();
      }

      expect(result.default).toBe(MockComponent);
      expect(factory).toHaveBeenCalledTimes(1);
    });

    it('retries when transient error occurs and succeeds subsequently', async () => {
      let count = 0;
      const factory = vi.fn().mockImplementation(async () => {
        count++;
        if (count === 1) {
          throw new Error('Transient network timeout');
        }
        return { default: MockComponent };
      });

      const LazyComp = lazyWithRetry(factory, { maxRetries: 2, baseDelayMs: 10 });
      const payload = (LazyComp as any)._payload;
      
      // Execute the factory runner embedded in React.lazy
      const loadedModule = await payload._result();
      expect(loadedModule.default).toBe(MockComponent);
      expect(factory).toHaveBeenCalledTimes(2);
    });

    it('triggers a guarded window.location.reload() when chunk error persists after retries', async () => {
      const reloadMock = vi.fn();
      // Replace window.location with mock
      delete (window as any).location;
      window.location = {
        ...originalLocation,
        pathname: '/deficiencies',
        reload: reloadMock
      } as any;

      const factory = vi.fn().mockRejectedValue(new Error('Failed to fetch dynamically imported module: /assets/chunk.js'));

      const LazyComp = lazyWithRetry(factory, { maxRetries: 1, baseDelayMs: 5 });
      const payload = (LazyComp as any)._payload;

      // When reload is triggered, it stores the reload key in sessionStorage
      const promise = payload._result();
      
      // Advance timers or wait for execution
      await new Promise(r => setTimeout(r, 50));

      expect(reloadMock).toHaveBeenCalledTimes(1);
      expect(sessionStorage.getItem('icofr_chunk_reload_/deficiencies')).toBe('1');
    });

    it('does not trigger infinite reloads if already reloaded in current session', async () => {
      const reloadMock = vi.fn();
      delete (window as any).location;
      window.location = {
        ...originalLocation,
        pathname: '/deficiencies',
        reload: reloadMock
      } as any;

      sessionStorage.setItem('icofr_chunk_reload_/deficiencies', '1');

      const factory = vi.fn().mockRejectedValue(new Error('Failed to fetch dynamically imported module: /assets/chunk.js'));

      const LazyComp = lazyWithRetry(factory, { maxRetries: 1, baseDelayMs: 5 });
      const payload = (LazyComp as any)._payload;

      await expect(payload._result()).rejects.toThrow('Failed to fetch dynamically imported module');
      expect(reloadMock).not.toHaveBeenCalled();
    });
  });
});
