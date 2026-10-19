import { describe, it, expect } from 'vitest';
import csa from '../csa';
import { mutatingRoutes, OVERSIGHT_ROLES, reachableBy } from './rbac-coverage';

/**
 * CSA HTTP contract lock. The worklist tab (spec #65) and the execution
 * workspace both depend on these URLs; refactors must keep them
 * byte-identical. Handlers stay thin adapters over CsaDomainService.
 */
describe('CSA barrel routes and sub-apps', () => {
  it('exposes a valid Hono instance', () => {
    expect(csa).toBeDefined();
    expect(csa.fetch).toBeDefined();
  });

  it('keeps every CSA record URL byte-identical', () => {
    const routePaths = csa.routes.map((r) => `${r.method} ${r.path}`);

    expect(routePaths).toContain('GET /csa');
    expect(routePaths).toContain('POST /csa');
    expect(routePaths).toContain('PUT /csa/:id');
    expect(routePaths).toContain('GET /csa/worklist');
    expect(routePaths).toContain('POST /csa/:id/workflow');
    expect(routePaths).toContain('DELETE /csa/:id');
    expect(routePaths).toContain('GET /csa/:id/export-pdf');
  });
});

/**
 * #97: every mutating route in this barrel must refuse a role that has no
 * business writing operational data. The subject is the barrel's own route list
 * and the mechanics live in ./rbac-coverage — see there for what a failure means.
 */
describe('csa mutating routes carry an rbac guard (#97)', () => {
  it('declares mutating routes for the guard assertions to cover', () => {
    expect(mutatingRoutes(csa).length).toBeGreaterThan(0);
  });

  it('refuses oversight roles on every mutating route', async () => {
    for (const role of OVERSIGHT_ROLES) {
      expect(await reachableBy(csa, role), role).toEqual([]);
    }
  });
});
