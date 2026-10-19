import { describe, it, expect } from 'vitest';
import accountAssertions from '../account-assertions';
import { mutatingRoutes, OVERSIGHT_ROLES, reachableBy } from './rbac-coverage';

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

/**
 * #97: the barrel's mutating routes must refuse a role with no business writing
 * here. The subject is the barrel's own route list; see ./rbac-coverage.
 */
describe('account-assertions mutating routes carry an rbac guard (#97)', () => {
  it('declares mutating routes for the guard assertions to cover', () => {
    expect(mutatingRoutes(accountAssertions).length).toBeGreaterThan(0);
  });

  it('refuses oversight roles on every mutating route', async () => {
    for (const role of OVERSIGHT_ROLES) {
      expect(await reachableBy(accountAssertions, role), role).toEqual([]);
    }
  });
});
