import { describe, it, expect } from 'vitest';
import { resolveTrustedOrigins } from '../trusted-origins';

/**
 * Session isolation between instances depends on each Worker trusting only its
 * own host. The demo Worker sets BETTER_AUTH_URL to its own host, so the primary
 * origin must NOT appear in its trusted list.
 */
describe('resolveTrustedOrigins', () => {
  it('trusts only the configured base URL, never the legacy primary origin', () => {
    const origins = resolveTrustedOrigins('https://icofr-demo.tech1solusi.workers.dev');
    expect(origins).toEqual(['https://icofr-demo.tech1solusi.workers.dev']);
    expect(origins).not.toContain('https://icofr.tech1solusi.workers.dev');
  });

  it('keeps the legacy primary origin only when no base URL is configured', () => {
    expect(resolveTrustedOrigins(undefined)).toEqual([
      'http://localhost:3000',
      'https://icofr.tech1solusi.workers.dev',
    ]);
  });

  it('accepts extra origins from a comma separated list and de-duplicates', () => {
    const origins = resolveTrustedOrigins(
      'https://icofr-demo.tech1solusi.workers.dev',
      ' https://custom.example , https://icofr-demo.tech1solusi.workers.dev ,,',
    );
    expect(origins).toEqual([
      'https://icofr-demo.tech1solusi.workers.dev',
      'https://custom.example',
    ]);
  });

  it('falls back to localhost when the base URL is blank', () => {
    expect(resolveTrustedOrigins('   ')[0]).toBe('http://localhost:3000');
  });
});
