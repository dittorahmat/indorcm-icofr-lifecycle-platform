/**
 * Common database URL normalization and host extraction utilities
 * shared across TypeScript and ESM scripts.
 */

/**
 * Neon serves pooled URLs from a `-pooler` host; scripts need the direct one for DDL/administrative tasks.
 * @param {string} url
 * @returns {string}
 */
export function toDirectUrl(url) {
  if (typeof url !== 'string') return '';
  return url.replace('-pooler', '');
}

/**
 * Host only: safe to print in logs and consoles, never includes user or password.
 * @param {string} url
 * @returns {string}
 */
export function databaseHost(url) {
  try {
    return new URL(toDirectUrl(url)).host;
  } catch {
    return 'invalid-url';
  }
}
