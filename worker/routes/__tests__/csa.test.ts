import { describe, it, expect, vi } from 'vitest';
import { Hono } from 'hono';
import csa from '../csa';
import { mutatingRoutes, OVERSIGHT_ROLES, reachableBy } from './rbac-coverage';
import { getDb } from '../../db';
import type { HonoEnv } from '../../app';
import type { DrizzleDb } from '../../db';

const stubDb = (overrides: Record<string, unknown> = {}): DrizzleDb => {
  const db: DrizzleDb = Object.create(null);
  return Object.assign(db, overrides);
};

vi.mock('../../db', () => ({
  getDb: vi.fn(() => ({
    select: vi.fn().mockReturnValue({
      from: vi.fn().mockReturnValue({
        leftJoin: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([]),
        }),
        where: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue([]),
        }),
      }),
    }),
  })),
}));

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
    expect(routePaths).toContain('GET /csa/:id');
    expect(routePaths).toContain('POST /csa');
    expect(routePaths).toContain('PUT /csa/:id');
    expect(routePaths).toContain('GET /csa/worklist');
    expect(routePaths).toContain('POST /csa/:id/workflow');
    expect(routePaths).toContain('DELETE /csa/:id');
    expect(routePaths).toContain('GET /csa/:id/export-pdf');
  });

  it('GET /csa/:id returns 404 when record is not found', async () => {
    const app = new Hono<any>();
    app.use('*', async (c, next) => {
      c.set('userId', 'user-1');
      c.set('organizationId', 'org-1');
      c.set('userRole', 'Admin');
      c.env = { DATABASE_URL: 'postgres://mock' };
      await next();
    });
    app.route('/api', csa);

    const res = await app.request('/api/csa/non-existent-id');
    expect(res.status).toBe(404);
  });

  it('GET /csa/worklist accepts valid year parameter', async () => {
    const app = new Hono<any>();
    app.use('*', async (c, next) => {
      c.set('userId', 'user-1');
      c.set('organizationId', 'org-1');
      c.set('userRole', 'Admin');
      c.env = { DATABASE_URL: 'postgres://mock' };
      await next();
    });
    app.route('/api', csa);

    const res = await app.request('/api/csa/worklist?year=2025');
    expect(res.status).toBe(200);
    const json = await res.json<{ success: boolean; data: { items: unknown[] } }>();
    expect(json.success).toBe(true);
    expect(json.data.items).toEqual([]);
  });

  it('POST /csa/samples/batch returns 404 when csaRecord is not in caller organization', async () => {
    const mockSelect = vi.fn().mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue([])
        })
      })
    });
    vi.mocked(getDb).mockReturnValue(stubDb({ select: mockSelect }));

    const app = new Hono<HonoEnv>();
    app.use('*', async (c, next) => {
      c.set('userId', 'user-1');
      c.set('organizationId', 'org-1');
      c.set('userRole', 'Line 1');
      Object.assign(c, { env: { DATABASE_URL: 'postgres://mock' } });
      await next();
    });
    app.route('/api', csa);

    const res = await app.request('/api/csa/samples/batch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        csaRecordId: 'foreign-csa-record',
        samples: [{ sampleName: 'Sample 1' }]
      })
    });

    expect(res.status).toBe(404);
    const json = await res.json<{ success: boolean; error: string }>();
    expect(json.success).toBe(false);
    expect(json.error).toBe('CSA_RECORD_NOT_FOUND');
  });

  it('POST /csa/samples/batch returns 403 when modifying a sample from another organization', async () => {
    let callCount = 0;
    const mockSelect = vi.fn().mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: vi.fn().mockImplementation(() => {
            callCount++;
            // 1st call: csaRecord check in caller org
            if (callCount === 1) return Promise.resolve([{ id: 'csa-rec-1' }]);
            // 2nd call: existing sample check returns foreign org
            return Promise.resolve([{ id: 'sample-foreign', organizationId: 'org-2' }]);
          })
        })
      })
    });
    vi.mocked(getDb).mockReturnValue(stubDb({ select: mockSelect }));

    const app = new Hono<HonoEnv>();
    app.use('*', async (c, next) => {
      c.set('userId', 'user-1');
      c.set('organizationId', 'org-1');
      c.set('userRole', 'Line 1');
      Object.assign(c, { env: { DATABASE_URL: 'postgres://mock' } });
      await next();
    });
    app.route('/api', csa);

    const res = await app.request('/api/csa/samples/batch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        csaRecordId: 'csa-rec-1',
        samples: [{ id: 'sample-foreign', sampleName: 'Hijack attempt' }]
      })
    });

    expect(res.status).toBe(403);
    const json = await res.json<{ success: boolean; error: string }>();
    expect(json.success).toBe(false);
    expect(json.error).toBe('SAMPLE_CROSS_TENANT_FORBIDDEN');
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
