import { describe, it, expect } from 'vitest';
import accountAssertions from '../account-assertions';

/**
 * account-assertions HTTP contract lock. Handlers stay thin adapters; refactors
 * must keep these URLs byte-identical (missing-route 404s fail silently
 * on the client — see the CSA PUT post-mortem).
 */
describe('account-assertions barrel routes', () => {
  it('exposes a valid Hono instance', () => {
    expect(accountAssertions).toBeDefined();
    expect(accountAssertions.fetch).toBeDefined();
  });

  it('keeps every account-assertions URL byte-identical', () => {
    const routePaths = accountAssertions.routes.map((r) => `${r.method} ${r.path}`);

    expect(routePaths).toContain('GET /account-assertions');
    expect(routePaths).toContain('POST /account-assertions');
  });
});
