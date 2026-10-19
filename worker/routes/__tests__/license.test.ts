import { describe, it, expect } from 'vitest';
import license from '../license';
import { mutatingRoutes, OVERSIGHT_ROLES, reachableBy } from './rbac-coverage';

/**
 * license HTTP contract lock. Handlers stay thin adapters; refactors
 * must keep these URLs byte-identical (missing-route 404s fail silently
 * on the client — see the CSA PUT post-mortem).
 */
describe('license barrel routes', () => {
  it('exposes a valid Hono instance', () => {
    expect(license).toBeDefined();
    expect(license.fetch).toBeDefined();
  });

  it('keeps every license URL byte-identical', () => {
    const routePaths = license.routes.map((r) => `${r.method} ${r.path}`);

    expect(routePaths).toContain('GET /license/status');
    expect(routePaths).toContain('POST /license/activate');
  });
});

/**
 * #97: the barrel's mutating routes must refuse a role with no business writing
 * here. The subject is the barrel's own route list; see ./rbac-coverage.
 */
describe('license mutating routes carry an rbac guard (#97)', () => {
  it('declares mutating routes for the guard assertions to cover', () => {
    expect(mutatingRoutes(license).length).toBeGreaterThan(0);
  });

  it('refuses oversight roles on every mutating route', async () => {
    for (const role of OVERSIGHT_ROLES) {
      expect(await reachableBy(license, role), role).toEqual([]);
    }
  });
});
