import { describe, it, expect } from 'vitest';
import remediation from '../remediation';
import { mutatingRoutes, OVERSIGHT_ROLES, reachableBy } from './rbac-coverage';

/**
 * remediation HTTP contract lock. Handlers stay thin adapters; refactors
 * must keep these URLs byte-identical (missing-route 404s fail silently
 * on the client — see the CSA PUT post-mortem).
 */
describe('remediation barrel routes', () => {
  it('exposes a valid Hono instance', () => {
    expect(remediation).toBeDefined();
    expect(remediation.fetch).toBeDefined();
  });

  it('keeps every remediation URL byte-identical', () => {
    const routePaths = remediation.routes.map((r) => `${r.method} ${r.path}`);

    expect(routePaths).toContain('GET /deficiencies');
    expect(routePaths).toContain('GET /actionplans');
    expect(routePaths).toContain('POST /actionplans');
    expect(routePaths).toContain('PUT /actionplans/:id');
    expect(routePaths).toContain('POST /actionplans/:id/workflow');
    expect(routePaths).toContain('GET /aggregatedeficiencies');
    expect(routePaths).toContain('POST /aggregatedeficiencies');
    expect(routePaths).toContain('PUT /deficiencies/:id');
  });
});

/**
 * #97: every mutating route in this barrel must refuse a role that has no
 * business writing operational data. The subject is the barrel's own route list
 * and the mechanics live in ./rbac-coverage — see there for why no fixtures are
 * needed and what a failure means.
 */
describe('remediation mutating routes carry an rbac guard (#97)', () => {
  it('declares mutating routes for the guard assertions to cover', () => {
    expect(mutatingRoutes(remediation).length).toBeGreaterThan(0);
  });

  it('refuses oversight roles on every mutating route', async () => {
    for (const role of OVERSIGHT_ROLES) {
      expect(await reachableBy(remediation, role), role).toEqual([]);
    }
  });
});
