import { describe, it, expect, vi } from 'vitest';
import { Hono } from 'hono';
import remediation from '../remediation';
import { mutatingRoutes, OVERSIGHT_ROLES, reachableBy } from './rbac-coverage';
import { getDb } from '../../db';

vi.mock('../../db', () => ({
  getDb: vi.fn(() => ({
    select: vi.fn().mockReturnValue({
      from: vi.fn().mockReturnValue({
        leftJoin: vi.fn().mockReturnValue({
          leftJoin: vi.fn().mockReturnValue({
            where: vi.fn().mockResolvedValue([]),
          }),
          where: vi.fn().mockResolvedValue([]),
        }),
        where: vi.fn().mockResolvedValue([]),
      }),
    }),
  })),
}));

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

  it('GET /deficiencies accepts year parameter and returns 200', async () => {
    const app = new Hono<any>();
    app.use('*', async (c, next) => {
      c.set('userId', 'user-1');
      c.set('organizationId', 'org-1');
      c.set('userRole', 'Admin');
      c.env = { DATABASE_URL: 'postgres://mock' };
      await next();
    });
    app.route('/api', remediation);

    const res = await app.request('/api/deficiencies?year=2025');
    expect(res.status).toBe(200);
    const json = await res.json<{ success: boolean; data: { items: unknown[] } }>();
    expect(json.success).toBe(true);
    expect(json.data.items).toEqual([]);
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
