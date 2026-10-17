import { describe, it, expect, vi } from 'vitest';
import { Hono } from 'hono';
import reporting from '../reporting';
import { getDb } from '../../db';
import type { DrizzleDb } from '../../db';
import type { HonoEnv } from '../../app';

vi.mock('../../db', () => ({
  getDb: vi.fn(),
}));

/**
 * reporting HTTP contract lock. Handlers stay thin adapters; refactors
 * must keep these URLs byte-identical (missing-route 404s fail silently
 * on the client — see the CSA PUT post-mortem).
 */
describe('reporting barrel routes', () => {
  it('exposes a valid Hono instance', () => {
    expect(reporting).toBeDefined();
    expect(reporting.fetch).toBeDefined();
  });

  it('keeps every reporting URL byte-identical', () => {
    const routePaths = reporting.routes.map((r) => `${r.method} ${r.path}`);

    expect(routePaths).toContain('GET /reports/summary');
    expect(routePaths).toContain('POST /reports/sign-off');
    expect(routePaths).toContain('POST /reports/export');
    expect(routePaths).toContain('GET /bpm-exports');
    expect(routePaths).toContain('POST /bpm-exports');
  });
});

type SummaryPayload = {
  success: boolean;
  data: {
    totalControls: number;
    totalRcm: number;
    openDeficiencies: number;
    effectiveness: number;
    deficienciesBySeverity: Array<{ name: string; count: number }>;
    deficienciesByStatus: Array<{ name: string; count: number }>;
    allDeficiencies: unknown[];
  };
};

/**
 * The effectiveness conclusion is produced once, in
 * `@shared/deficiency-summary`. This side pins the literal the HTTP response
 * ships; the Lampiran 11 client helper pins the same conclusion through
 * `isEffective` off the same module.
 */
describe('GET /reports/summary effectiveness conclusion', () => {
  const app = new Hono<HonoEnv>();
  app.use('*', async (c, next) => {
    c.set('organizationId', 'org-1');
    await next();
  });
  app.route('/api', reporting);

  const env = {
    DATABASE_URL: 'postgres://mock',
    BETTER_AUTH_SECRET: 'test',
    GEMINI_API_KEY: 'test',
    DOCUMENTS_BUCKET: undefined,
  };

  /** boundary: drizzle stub — the handler only reads via select→from→where. */
  const stubDb = (rowSets: unknown[][]): DrizzleDb => {
    const db: DrizzleDb = Object.create(null);
    let call = 0;
    const where = vi.fn(() => Promise.resolve(rowSets[call++]));
    const select = vi.fn(() => ({ from: vi.fn(() => ({ where })) }));
    return Object.assign(db, { select });
  };

  const requestSummary = async (rowSets: unknown[][]) => {
    vi.mocked(getDb).mockReturnValue(stubDb(rowSets));
    const res = await app.request('/api/reports/summary', undefined, env);
    return { status: res.status, body: await res.json<SummaryPayload>() };
  };

  it('ships effectiveness 0 when a Material Weakness exists', async () => {
    const { status, body } = await requestSummary([
      [{ count: 12 }],
      [{ count: 5 }],
      [
        { severity: 'Material Weakness', status: 'Open' },
        { severity: 'Significant Deficiency', status: 'Closed' },
        { severity: 'Control Deficiency', status: 'Open' },
      ],
    ]);

    expect(status).toBe(200);
    expect(body.data.effectiveness).toBe(0);
    expect(body.data.openDeficiencies).toBe(2);
    expect(body.data.totalControls).toBe(12);
    expect(body.data.totalRcm).toBe(5);
    expect(body.data.deficienciesBySeverity).toEqual([
      { name: 'Control Deficiency', count: 1 },
      { name: 'Significant Deficiency', count: 1 },
      { name: 'Material Weakness', count: 1 },
    ]);
    expect(body.data.deficienciesByStatus).toEqual([
      { name: 'Open', count: 2 },
      { name: 'Remediated', count: 0 },
      { name: 'Verified', count: 0 },
      { name: 'Closed', count: 1 },
    ]);
  });

  it('ships effectiveness 100 when only SD/CD exist', async () => {
    const { body } = await requestSummary([
      [{ count: 0 }],
      [{ count: 0 }],
      [
        { severity: 'Significant Deficiency', status: 'Open' },
        { severity: 'Control Deficiency', status: 'Verified' },
      ],
    ]);

    expect(body.data.effectiveness).toBe(100);
    expect(body.data.allDeficiencies).toHaveLength(2);
  });
});
