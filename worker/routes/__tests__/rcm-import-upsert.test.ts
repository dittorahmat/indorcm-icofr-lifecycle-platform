import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Hono } from 'hono';
import { rcmImportRoute } from '../rcm/rcm-import';
import { getDb } from '../../db';
import type { DrizzleDb } from '../../db';
import type { HonoEnv } from '../../app';

vi.mock('../../db', () => ({
  getDb: vi.fn(),
}));

const stubDb = (overrides: Record<string, unknown> = {}): DrizzleDb => {
  const db: DrizzleDb = Object.create(null);
  return Object.assign(db, overrides);
};

describe('POST /rcm/import idempotency and upsert locking tests', () => {
  let app: Hono<HonoEnv>;
  const mockOrgId = 'org-bumn-1';
  const mockUserId = 'user-ops-1';

  beforeEach(() => {
    vi.restoreAllMocks();
    app = new Hono<HonoEnv>();
    app.use('*', async (c, next) => {
      c.set('userId', mockUserId);
      c.set('organizationId', mockOrgId);
      c.set('userRole', 'Line 1');
      c.env = {
        DATABASE_URL: 'postgres://mock',
        BETTER_AUTH_SECRET: 'mock-secret',
        BETTER_AUTH_URL: 'http://localhost:3000',
        DOCUMENTS_BUCKET: {} as R2Bucket,
      };
      await next();
    });
    app.route('/', rcmImportRoute);
  });

  it('updates existing control and risk instead of duplicating when identical controlCode is re-uploaded', async () => {
    const executedUpdates: { table: string; values?: unknown }[] = [];
    const executedInserts: { table: string; values?: unknown }[] = [];

    // Mock transaction builder
    const mockTx = {
      select: vi.fn(() => ({
        from: vi.fn((table?: Record<string | symbol, unknown>) => ({
          where: vi.fn(() => {
            const resultPromise = Promise.resolve([
              { id: 'existing-id-1', name: 'Existing Process', count: 1 }
            ]);
            return Object.assign(resultPromise, {
              limit: vi.fn().mockImplementation(() => {
                const target = table as Record<string | symbol, unknown> | undefined;
                if (target?.[Symbol.for('drizzle:Name')] === 'rcms' || (target && 'riskDescription' in target)) {
                  return Promise.resolve([{ id: 'existing-risk-1' }]);
                }
                if (target?.[Symbol.for('drizzle:Name')] === 'controls' || (target && 'code' in target)) {
                  return Promise.resolve([{ id: 'existing-ctrl-1' }]);
                }
                if (target?.[Symbol.for('drizzle:Name')] === 'rcm_controls' || (target && 'rcmId' in target)) {
                  return Promise.resolve([{ id: 'existing-mapping-1' }]);
                }
                return Promise.resolve([{ id: 'existing-proc-1', name: 'Pendaftaran & Uji Tuntas Rekanan Baru' }]);
              }),
            });
          }),
        })),
      })),
      update: vi.fn(() => ({
        set: vi.fn((vals: unknown) => {
          executedUpdates.push({ table: 'mock-table', values: vals });
          return {
            where: vi.fn().mockResolvedValue({}),
          };
        }),
      })),
      insert: vi.fn(() => ({
        values: vi.fn((vals: unknown) => {
          executedInserts.push({ table: 'mock-table', values: vals });
          return Promise.resolve({});
        }),
      })),
    };

    const mockDb = stubDb({
      transaction: vi.fn(async (cb: (tx: unknown) => Promise<unknown>) => {
        return cb(mockTx);
      }),
    });

    vi.mocked(getDb).mockReturnValue(mockDb);

    const payload = {
      rcmType: 'TLC',
      year: 2027,
      rows: [
        {
          processName: 'Procure-to-Pay',
          subProcessName: 'Pendaftaran & Uji Tuntas Rekanan Baru',
          riskDescription: 'Risiko vendor fiktif',
          controlCode: 'CTRL-P2P-2027-001',
          controlName: 'Verifikasi Dokumen Legalitas & Uji Tuntas Vendor (Updated)',
          controlDescription: 'Prosedur diperbarui dengan checklist AML',
          isKeyControl: true,
          ipoC: 'Y',
          assertionE: 'Y',
        },
      ],
    };

    const res = await app.request('/rcm/import', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    expect(res.status).toBe(200);
    const json = await res.json<{
      success: boolean;
      data: {
        summary: { createdControls: number; createdRisks: number; totalRows: number };
      };
    }>();
    expect(json.success).toBe(true);

    // Because existing items were matched:
    // createdControls and createdRisks counts should remain 0 (no new inserts)
    expect(json.data.summary.createdRisks).toBe(0);
    expect(json.data.summary.createdControls).toBe(0);

    // Verify updates were called for risk, control, and mapping
    expect(executedUpdates.length).toBeGreaterThanOrEqual(3);
  });

  it('deduplicates controls by (bpmProcessId, name) fallback when controlCode is omitted', async () => {
    const executedUpdates: { table: string; values?: unknown }[] = [];
    const executedInserts: { table: string; values?: unknown }[] = [];

    const mockTx = {
      select: vi.fn(() => ({
        from: vi.fn(() => ({
          where: vi.fn(() => {
            const resultPromise = Promise.resolve([
              { id: 'existing-id-1', name: 'Existing Process', count: 1 }
            ]);
            return Object.assign(resultPromise, {
              limit: vi.fn().mockImplementation(() => {
                return Promise.resolve([{ id: 'existing-id-1', name: 'Existing Process' }]);
              }),
            });
          }),
        })),
      })),
      update: vi.fn(() => ({
        set: vi.fn((vals: unknown) => {
          executedUpdates.push({ table: 'mock-table', values: vals });
          return { where: vi.fn().mockResolvedValue({}) };
        }),
      })),
      insert: vi.fn(() => ({
        values: vi.fn((vals: unknown) => {
          executedInserts.push({ table: 'mock-table', values: vals });
          return Promise.resolve({});
        }),
      })),
    };

    const mockDb = stubDb({
      transaction: vi.fn(async (cb: (tx: unknown) => Promise<unknown>) => {
        return cb(mockTx);
      }),
    });

    vi.mocked(getDb).mockReturnValue(mockDb);

    const payload = {
      rcmType: 'TLC',
      year: 2027,
      rows: [
        {
          processName: 'Order-to-Cash',
          subProcessName: 'Penerimaan Pesanan & Pemeriksaan Plafon Kredit',
          riskDescription: 'Risiko pelampauan plafon kredit',
          controlCode: '', // Empty code!
          controlName: 'Otorisasi Pelepasan Kredit Khusus Direksi',
          controlDescription: 'Approval rilis kredit',
        },
      ],
    };

    const res = await app.request('/rcm/import', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    expect(res.status).toBe(200);
    const json = await res.json<{
      success: boolean;
      data: {
        summary: { createdControls: number; createdRisks: number };
      };
    }>();
    expect(json.success).toBe(true);
    expect(json.data.summary.createdControls).toBe(0);
    expect(executedUpdates.length).toBeGreaterThanOrEqual(2);
  });
});
