import { describe, it, expect } from 'vitest';
import infrastructure from '../infrastructure';
import { mutatingRoutes, OVERSIGHT_ROLES, reachableBy } from './rbac-coverage';

/**
 * infrastructure HTTP contract lock. Handlers stay thin adapters; refactors
 * must keep these URLs byte-identical (missing-route 404s fail silently
 * on the client — see the CSA PUT post-mortem).
 */
describe('infrastructure barrel routes', () => {
  it('exposes a valid Hono instance', () => {
    expect(infrastructure).toBeDefined();
    expect(infrastructure.fetch).toBeDefined();
  });

  it('keeps every infrastructure URL byte-identical', () => {
    const routePaths = infrastructure.routes.map((r) => `${r.method} ${r.path}`);

    expect(routePaths).toContain('GET /applications');
    expect(routePaths).toContain('POST /applications');
    expect(routePaths).toContain('PATCH /applications/:id');
    expect(routePaths).toContain('DELETE /applications/:id');
    expect(routePaths).toContain('GET /applications/:id/documents');
    expect(routePaths).toContain('POST /applications/:id/documents/upload');
    expect(routePaths).toContain('DELETE /applications/:id/documents/:docId');
    expect(routePaths).toContain('GET /applications/:id/controls');
    expect(routePaths).toContain('GET /vendors');
    expect(routePaths).toContain('POST /vendors');
    expect(routePaths).toContain('GET /soc-reports');
    expect(routePaths).toContain('POST /soc-reports');
    expect(routePaths).toContain('POST /soc-reports/:id/evaluate');
    expect(routePaths).toContain('POST /soc-evaluations');
  });
});

/**
 * #97: every mutating route in this barrel must refuse a role that has no
 * business writing operational data. The subject is the barrel's own route list
 * and the mechanics live in ./rbac-coverage — see there for why no fixtures are
 * needed and what a failure means.
 */
describe('infrastructure mutating routes carry an rbac guard (#97)', () => {
  it('declares mutating routes for the guard assertions to cover', () => {
    expect(mutatingRoutes(infrastructure).length).toBeGreaterThan(0);
  });

  it('refuses oversight roles on every mutating route', async () => {
    for (const role of OVERSIGHT_ROLES) {
      expect(await reachableBy(infrastructure, role), role).toEqual([]);
    }
  });
});
