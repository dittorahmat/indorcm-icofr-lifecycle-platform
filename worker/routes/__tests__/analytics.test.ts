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
    expect(routePaths).toContain('GET /analytics/heatmap');
    expect(routePaths).toContain('GET /analytics/risk-exposure');
    expect(routePaths).toContain('GET /analytics/testing-evaluation');
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
    const leftJoin = vi.fn(() => ({ where }));
    const from = vi.fn(() => ({ where, leftJoin }));
    const select = vi.fn(() => ({ from }));
    return Object.assign(db, { select });
  };

  it('returns 5x5 heatmap risk matrix with control details', async () => {
    vi.mocked(getDb).mockReturnValue(
      stubDb([
        [
          {
            id: 'ctrl-1',
            code: 'CTRL-REV-01',
            description: 'Three-way match billing',
            csaStatus: 'Effective',
            inherentRisk: 'High',
            process: 'Revenue to Cash',
          },
        ],
      ])
    );

    const res = await app.request('/api/analytics/heatmap?year=2026', undefined, env);
    expect(res.status).toBe(200);
    const json = (await res.json()) as { success: boolean; data: Record<string, unknown> };
    expect(json.success).toBe(true);
    expect(json.data).toHaveProperty('matrix');
    expect(json.data).toHaveProperty('controls');
  });

  it('returns 3-axis risk exposure bubble coordinates', async () => {
    vi.mocked(getDb).mockReturnValue(
      stubDb([
        [
          {
            id: 'rcm-1',
            process: 'Revenue to Cash',
            riskRating: 'High',
            riskDescription: 'Risiko fraud cut-off omset',
          },
        ],
      ])
    );

    const res = await app.request('/api/analytics/risk-exposure?year=2026', undefined, env);
    expect(res.status).toBe(200);
    const json = (await res.json()) as { success: boolean; data: Array<Record<string, unknown>> };
    expect(json.success).toBe(true);
    expect(Array.isArray(json.data)).toBe(true);
    expect(json.data[0]).toHaveProperty('x');
    expect(json.data[0]).toHaveProperty('y');
    expect(json.data[0]).toHaveProperty('z');
    expect(json.data[0]).toHaveProperty('process');
  });

  it('returns 6-pillar testing evaluation scores and status counts', async () => {
    vi.mocked(getDb).mockReturnValue(
      stubDb([
        [
          {
            testType: 'TOD',
            result: 'Effective',
            todPilarObjective: true,
            todPilarTiming: true,
            todPilarAuthority: true,
            todPilarReliability: true,
            todPilarCoverage: true,
          },
        ],
      ])
    );

    const res = await app.request('/api/analytics/testing-evaluation?year=2026', undefined, env);
    expect(res.status).toBe(200);
    const json = (await res.json()) as {
      success: boolean;
      data: {
        radarScores: Array<{ pillar: string; score: number; fullMark: number }>;
        statusBreakdown: Array<{ name: string; value: number }>;
      };
    };
    expect(json.success).toBe(true);
    expect(json.data).toHaveProperty('radarScores');
    expect(json.data).toHaveProperty('statusBreakdown');
    expect(json.data.radarScores.length).toBe(6);
  });
});
