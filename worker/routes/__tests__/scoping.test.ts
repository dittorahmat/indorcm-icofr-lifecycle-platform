import { describe, it, expect } from 'vitest';
import scoping from '../scoping';
import { mutatingRoutes, OVERSIGHT_ROLES, reachableBy } from './rbac-coverage';

/**
 * scoping HTTP contract lock. Handlers stay thin adapters; refactors
 * must keep these URLs byte-identical (missing-route 404s fail silently
 * on the client — see the CSA PUT post-mortem).
 */
describe('scoping barrel routes', () => {
  it('exposes a valid Hono instance', () => {
    expect(scoping).toBeDefined();
    expect(scoping.fetch).toBeDefined();
  });

  it('keeps every scoping URL byte-identical', () => {
    const routePaths = scoping.routes.map((r) => `${r.method} ${r.path}`);

    expect(routePaths).toContain('GET /simulations');
    expect(routePaths).toContain('GET /simulations/:id');
    expect(routePaths).toContain('POST /simulations');
    expect(routePaths).toContain('PUT /simulations/:id');
    expect(routePaths).toContain('POST /simulations/:id/submit');
    expect(routePaths).toContain('DELETE /simulations/:id');
    expect(routePaths).toContain('POST /simulations/:id/approve');
    expect(routePaths).toContain('POST /simulations/:id/reject');
    expect(routePaths).toContain('POST /simulations/:id/request-deletion');
    expect(routePaths).toContain('POST /simulations/:id/workflow');
    expect(routePaths).toContain('POST /simulations/assign-department');
    expect(routePaths).toContain('POST /simulations/:id/account-departments/sync');
    expect(routePaths).toContain('GET /simulations/:id/account-applications');
    expect(routePaths).toContain('POST /simulations/:id/account-applications/sync');
    expect(routePaths).toContain('GET /gl-snapshots');
    expect(routePaths).toContain('POST /gl-snapshots');
    expect(routePaths).toContain('GET /gl-snapshots/:id');
    expect(routePaths).toContain('PUT /gl-snapshots/:id/mapping');
    expect(routePaths).toContain('POST /gl-snapshots/:id/set-active');
    expect(routePaths).toContain('GET /gl-snapshots/:id/rows');
    expect(routePaths).toContain('DELETE /gl-snapshots/:id');
    expect(routePaths).toContain('PUT /gl-rows/:noGL/owner-acceptance');
  });
});

/**
 * #97: every mutating route in this barrel must refuse a role that has no
 * business writing operational data. The subject is the barrel's own route list
 * and the mechanics live in ./rbac-coverage — see there for what a failure means.
 */
describe('scoping mutating routes carry an rbac guard (#97)', () => {
  it('declares mutating routes for the guard assertions to cover', () => {
    expect(mutatingRoutes(scoping).length).toBeGreaterThan(0);
  });

  it('refuses oversight roles on every mutating route', async () => {
    for (const role of OVERSIGHT_ROLES) {
      expect(await reachableBy(scoping, role), role).toEqual([]);
    }
  });
});
