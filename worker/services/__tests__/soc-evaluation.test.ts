import { describe, expect, it, vi, beforeEach } from 'vitest';
import {
  SOC_EVALUATION_MISSING_REPORT,
  createSocEvaluation,
} from '../soc-evaluation';
import type { DrizzleDb } from '../../db';

/** boundary: drizzle stub — the write path only inserts one row. */
function mockDb() {
  const values = vi.fn().mockResolvedValue([]);
  const db: DrizzleDb = Object.create(null);
  Object.assign(db, { insert: vi.fn(() => ({ values })) });
  return { db, values };
}

const args = (socReportId: unknown, body: Record<string, unknown> = {}) => ({
  orgId: 'org-1',
  userId: 'user-1',
  socReportId,
  body,
});

describe('createSocEvaluation — the one SOC evaluation write (#95)', () => {
  let h: ReturnType<typeof mockDb>;
  beforeEach(() => {
    h = mockDb();
  });

  it('refuses a missing report id with a stable code and writes nothing', async () => {
    for (const missing of ['', undefined, null, 42]) {
      const result = await createSocEvaluation(h.db, args(missing));
      expect(result.outcome).toBe('rejected');
      if (result.outcome !== 'rejected') throw new Error('unreachable');
      expect(result.code).toBe(SOC_EVALUATION_MISSING_REPORT);
      expect(result.httpStatus).toBe(400);
    }
    // The column is NOT NULL with an FK, so this used to surface as a driver 500.
    expect(h.db.insert).not.toHaveBeenCalled();
  });

  it('creates the evaluation for whichever caller supplied the report id', async () => {
    const created = await createSocEvaluation(
      h.db,
      args('soc-report-9', { attrA: true, attrB: false, auditorOpinion: 'Unqualified' }),
    );

    expect(created.outcome).toBe('created');
    if (created.outcome !== 'created') throw new Error('unreachable');
    expect(h.db.insert).toHaveBeenCalledTimes(1);

    const row = h.values.mock.calls[0][0] as Record<string, unknown>;
    expect(row).toMatchObject({
      id: created.id,
      organizationId: 'org-1',
      socReportId: 'soc-report-9',
      evaluatedBy: 'user-1',
      attrA: true,
      attrB: false,
      auditorOpinion: 'Unqualified',
    });
    expect(row.evaluatedAt).toBeInstanceOf(Date);
  });

  it('coerces the criteria rather than asserting them, and defaults the opinion', async () => {
    const created = await createSocEvaluation(
      h.db,
      args('soc-report-9', { attrA: 'yes', attrC: true, auditorOpinion: 7 }),
    );

    if (created.outcome !== 'created') throw new Error('unreachable');
    const row = h.values.mock.calls[0][0] as Record<string, unknown>;
    // A malformed flag falls back to the column default instead of being stored raw.
    expect(row.attrA).toBeUndefined();
    expect(row.attrC).toBe(true);
    expect(row.attrB).toBeUndefined();
    expect(row.auditorOpinion).toBe('');
  });
});
