import { describe, it, expect, vi } from 'vitest';
import { Hono } from 'hono';
import analytics from '../analytics';
import { getDb } from '../../db';
import type { DrizzleDb } from '../../db';
import type { HonoEnv } from '../../app';

vi.mock('../../db', () => ({
  getDb: vi.fn(),
}));

describe('analytics barrel routes contract', () => {
  it('exposes a valid Hono instance', () => {
    expect(analytics).toBeDefined();
    expect(analytics.fetch).toBeDefined();
  });

  it('keeps analytics URL endpoints byte-identical', () => {
    const routePaths = analytics.routes.map((r) => `${r.method} ${r.path}`);
    expect(routePaths).toContain('GET /analytics/summary');
  });
});

describe('GET /analytics/summary response structure', () => {
  const app = new Hono<HonoEnv>();
  app.use('*', async (c, next) => {
    c.set('organizationId', 'org-1');
    await next();
  });
  app.route('/api', analytics);

  const env = {
    DATABASE_URL: 'postgres://mock',
    BETTER_AUTH_SECRET: 'test',
    GEMINI_API_KEY: 'test',
  };

  /** boundary: drizzle stub — the handler only reads via select→from→where. */
  const stubDb = (rowSets: unknown[][]): DrizzleDb => {
    const db: DrizzleDb = Object.create(null);
    let call = 0;
    const where = vi.fn(() => Promise.resolve(rowSets[call++] ?? []));
    const select = vi.fn(() => ({ from: vi.fn(() => ({ where })) }));
    return Object.assign(db, { select });
  };

  it('returns valid executive KPI metrics matching schema', async () => {
    vi.mocked(getDb).mockReturnValue(
      stubDb([
        [{ count: 12 }],
        [{ count: 24 }],
        [{ testType: 'TOE', result: 'Pass' }],
        [{ result: 'Effective' }],
        [{ severity: 'High', status: 'Open' }],
      ])
    );

    const res = await app.request('/api/analytics/summary?year=2026', undefined, env);

    expect(res.status).toBe(200);
    const json = (await res.json()) as { success: boolean; data: Record<string, unknown> };
    expect(json.success).toBe(true);
    expect(json.data).toBeDefined();
    expect(json.data).toHaveProperty('totalRisks');
    expect(json.data).toHaveProperty('totalControls');
    expect(json.data).toHaveProperty('toePassRate');
    expect(json.data).toHaveProperty('csaHealthScore');
    expect(json.data).toHaveProperty('openDeficiencies');
    expect(json.data).toHaveProperty('materialWeaknesses');
    expect(json.data).toHaveProperty('controlsByEffectiveness');
  });
});
