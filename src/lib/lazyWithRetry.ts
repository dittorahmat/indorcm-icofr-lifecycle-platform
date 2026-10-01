import { ComponentType, lazy, LazyExoticComponent } from 'react';

export interface RetryOptions {
  maxRetries?: number;
  baseDelayMs?: number;
  storageKeyPrefix?: string;
}

/**
 * Checks whether an error is indicative of a dynamic chunk load failure
 * (e.g. server redeployment, stale Vite asset manifest, or transient fetch abort).
 */
export function isChunkLoadError(error: unknown): boolean {
  if (!error) return false;
  const msg = error instanceof Error ? error.message : String(error);
  return (
    msg.includes('Failed to fetch dynamically imported module') ||
    msg.includes('Loading chunk') ||
    msg.includes('error loading dynamically imported module') ||
    msg.includes('Importing a module script failed') ||
    msg.includes('Unable to preload CSS')
  );
}

/**
 * Clears any recorded chunk reload guards from sessionStorage.
 */
export function clearChunkReloadGuards(storageKeyPrefix = 'icofr_chunk_reload_'): void {
  if (typeof window === 'undefined' || !window.sessionStorage) return;
  try {
    const keysToRemove: string[] = [];
    for (let i = 0; i < window.sessionStorage.length; i++) {
      const key = window.sessionStorage.key(i);
      if (key && key.startsWith(storageKeyPrefix)) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach((k) => window.sessionStorage.removeItem(k));
  } catch {
    // Ignore storage errors in restricted contexts
  }
}

/**
 * Wraps dynamic component imports with:
 * 1. Automatic in-memory retries with exponential backoff for transient network hiccups.
 * 2. Automatic single-pass page refresh (guarded via sessionStorage) if a missing chunk (404/post-deployment) is detected.
 */
export function lazyWithRetry<T extends ComponentType<any>>(
  factory: () => Promise<{ default: T }>,
  options: RetryOptions = {}
): LazyExoticComponent<T> {
  const {
    maxRetries = 2,
    baseDelayMs = 300,
    storageKeyPrefix = 'icofr_chunk_reload_'
  } = options;

  return lazy(async () => {
    let attempts = 0;

    while (true) {
      try {
        const component = await factory();
        return component;
      } catch (error) {
        attempts++;
        const isChunkError = isChunkLoadError(error);

        // If retry attempts remain, wait and try again
        if (attempts <= maxRetries) {
          const delay = baseDelayMs * Math.pow(2, attempts - 1);
          await new Promise((resolve) => setTimeout(resolve, delay));
          continue;
        }

        // If retries exhausted and it's a chunk load error, perform a 1-shot page reload
        if (isChunkError && typeof window !== 'undefined' && window.sessionStorage) {
          const reloadKey = `${storageKeyPrefix}${window.location.pathname}`;
          const alreadyReloaded = window.sessionStorage.getItem(reloadKey);

          if (!alreadyReloaded) {
            window.sessionStorage.setItem(reloadKey, '1');
            window.location.reload();
            // Return an unresolved promise to suppress unhandled error boundary flashes during browser reload
            return new Promise<{ default: T }>(() => {});
          }
        }

        // Re-throw the error if already reloaded once or not recoverable
        throw error;
      }
    }
  });
}
