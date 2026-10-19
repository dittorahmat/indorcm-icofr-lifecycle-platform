import { describe, it, expect } from 'vitest';
import { Hono } from 'hono';
import type { HonoEnv } from '../../app';
import type { UserRole } from '@shared/types';
import remediation from '../remediation';

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
  app.route('/', remediation);
  return app;
}

describe('remediation mutating routes carry an rbac guard (#97)', () => {
  const mutating = remediation.routes.filter((route) => MUTATING_METHODS.includes(route.method));

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
