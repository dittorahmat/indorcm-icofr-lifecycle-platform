import { describe, it, expect } from 'vitest';
import { Hono } from 'hono';
import type { HonoEnv } from '../../app';
import type { UserRole } from '@shared/types';
import infrastructure from '../infrastructure';

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
 * business writing operational data. The guard runs before the handler, so a
 * refused role never reaches the DB and these assertions need no fixtures.
 *
 * Removing an `rbac(...)` makes the handler run instead and answer 500 — which is
 * exactly the regression this pair exists to catch.
 */
const MUTATING_METHODS = ['POST', 'PUT', 'PATCH', 'DELETE'];

function appAs(role: UserRole): Hono<HonoEnv> {
  const app = new Hono<HonoEnv>();
  app.use('*', async (c, next) => {
    c.set('userRole', role);
    await next();
  });
  app.route('/', infrastructure);
  return app;
}

describe('infrastructure mutating routes carry an rbac guard (#97)', () => {
  const mutating = infrastructure.routes.filter((route) => MUTATING_METHODS.includes(route.method));

  it('declares mutating routes for the guard assertions to cover', () => {
    expect(mutating.length).toBeGreaterThan(0);
  });

  it('refuses oversight roles on every mutating route', async () => {
    for (const role of ['External Auditor', 'Line 3'] as UserRole[]) {
      const app = appAs(role);
      for (const route of mutating) {
        const response = await app.request(route.path, { method: route.method });
        expect(response.status, `${role} ${route.method} ${route.path}`).toBe(403);
      }
    }
  });
});
