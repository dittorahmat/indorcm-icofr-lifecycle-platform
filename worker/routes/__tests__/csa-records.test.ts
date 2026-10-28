import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Hono } from 'hono';
import csa from '../csa';
import { getDb } from '../../db';
import type { DrizzleDb } from '../../db';
import type { HonoEnv } from '../../app';

vi.mock('../../db', () => ({
  getDb: vi.fn(),
}));

/** boundary: drizzle stub — handler reads via select→from→where/leftJoin with optional limit. */
const stubDb = (resolver: (queryIndex: number) => unknown[]): DrizzleDb => {
  const db: DrizzleDb = Object.create(null);
  let queryIndex = 0;
  const select = vi.fn(() => ({
    from: vi.fn(() => ({
      leftJoin: vi.fn(() => ({
        where: vi.fn(() => {
          const rows = resolver(queryIndex++);
          return Object.assign(Promise.resolve(rows), {
            limit: vi.fn(() => Promise.resolve(rows)),
          });
        }),
      })),
      where: vi.fn(() => {
        const rows = resolver(queryIndex++);
        return Object.assign(Promise.resolve(rows), {
          limit: vi.fn(() => Promise.resolve(rows)),
        });
      }),
    })),
  }));
  return Object.assign(db, { select });
};

describe('CSA Record Detail API (GET /csa/:id)', () => {
  let app: Hono<HonoEnv>;
  const mockOrgId = 'org-1';
  const mockUserId = 'user-123';

  beforeEach(() => {
    vi.restoreAllMocks();
    app = new Hono<HonoEnv>();
    app.use('*', async (c, next) => {
      c.set('userId', mockUserId);
      c.set('organizationId', mockOrgId);
      c.set('userRole', 'Line 1');
      await next();
    });
    app.route('/api', csa);
  });

  const env = {
    DATABASE_URL: 'postgres://mock',
  };

  it('GET /api/csa/:id returns 200 with record and associated samples', async () => {
    const mockRecord = {
      id: 'csa-rec-1',
      organizationId: mockOrgId,
      controlId: 'ctrl-1',
      period: '2026-Q1',
      status: 'Draft',
    };
    const mockSamples = [
      { id: 'sample-1', csaRecordId: 'csa-rec-1', sampleNumber: 1, testResult: 'Effective' },
      { id: 'sample-2', csaRecordId: 'csa-rec-1', sampleNumber: 2, testResult: 'Effective' },
    ];

    vi.mocked(getDb).mockReturnValue(stubDb((idx) => (idx === 0 ? [mockRecord] : mockSamples)));

    const res = await app.request('/api/csa/csa-rec-1', undefined, env);

    expect(res.status).toBe(200);
    const json = await res.json<{ success: boolean; data: typeof mockRecord & { samples: typeof mockSamples } }>();
    expect(json.success).toBe(true);
    expect(json.data.id).toBe('csa-rec-1');
    expect(json.data.organizationId).toBe(mockOrgId);
    expect(json.data.samples).toEqual(mockSamples);
  });

  it('GET /api/csa/:id returns 404 when record does not exist or wrong org', async () => {
    vi.mocked(getDb).mockReturnValue(stubDb(() => []));

    const res = await app.request('/api/csa/non-existent-id', undefined, env);

    expect(res.status).toBe(404);
    const json = await res.json<{ success: boolean; error: string }>();
    expect(json.success).toBe(false);
    expect(json.error).toBe('CSA Record not found');
  });

  describe('GET /csa/:id/export-pdf', () => {
    it('returns 200 and application/pdf when controlId is null but bpmProcessId is present', async () => {
      const mockRecord = {
        id: 'csa-bpm-rec-1',
        organizationId: mockOrgId,
        controlId: null,
        bpmProcessId: 'proc-123',
        period: '2026-Q2',
        assessmentDate: new Date(),
        result: 'Effective',
      };
      const mockProcess = {
        id: 'proc-123',
        organizationId: mockOrgId,
        bpmCode: 'PROC-FIN-01',
        name: 'Siklus Keuangan',
      };
      const mockControls = [
        { id: 'c-1', code: 'CTRL-01', name: 'Otorisasi', description: 'Desc 1', bpmProcessId: 'proc-123', organizationId: mockOrgId },
      ];
      const mockSamples = [
        { id: 's-1', csaRecordId: 'csa-bpm-rec-1', sampleRef: 'SMP-001', attrA: true, attrB: true, attrC: true, attrD: true },
      ];

      vi.mocked(getDb).mockReturnValue(stubDb((idx) => {
        if (idx === 0) return [mockRecord];
        if (idx === 1) return [mockProcess];
        if (idx === 2) return mockControls;
        return mockSamples;
      }));

      const res = await app.request('/api/csa/csa-bpm-rec-1/export-pdf', undefined, env);

      expect(res.status).toBe(200);
      expect(res.headers.get('Content-Type')).toBe('application/pdf');
      expect(res.headers.get('Content-Disposition')).toContain('CSA_PROC-FIN-01_2026-Q2.pdf');
    });

    it('returns 400 bad request when neither controlId nor bpmProcessId exists', async () => {
      const mockRecord = {
        id: 'csa-empty-rec',
        organizationId: mockOrgId,
        controlId: null,
        bpmProcessId: null,
        period: '2026',
      };

      vi.mocked(getDb).mockReturnValue(stubDb(() => [mockRecord]));

      const res = await app.request('/api/csa/csa-empty-rec/export-pdf', undefined, env);

      expect(res.status).toBe(400);
      const json = await res.json<{ success: boolean; error: string; message?: string }>();
      expect(json.success).toBe(false);
      expect(json.error).toBe('INVALID_CSA_SCOPE');
      expect(json.message).toBe('CSA Record has no associated control or process');
    });
  });

  describe('CSA Record List API (GET /csa)', () => {
    it('returns 200 with summary projection for year filter', async () => {
      const mockItems = [
        {
          id: 'csa-rec-1',
          organizationId: mockOrgId,
          controlId: 'ctrl-1',
          bpmProcessId: 'proc-1',
          period: '2025',
          result: 'Effective',
          assessmentDate: '2025-06-01T00:00:00.000Z',
          workflowStatus: 'Draft',
        },
      ];

      vi.mocked(getDb).mockReturnValue(stubDb(() => mockItems));

      const res = await app.request('/api/csa?year=2025', undefined, env);

      expect(res.status).toBe(200);
      const json = await res.json<{ success: boolean; data: { items: typeof mockItems } }>();
      expect(json.success).toBe(true);
      expect(json.data.items).toEqual(mockItems);
    });
  });
});
