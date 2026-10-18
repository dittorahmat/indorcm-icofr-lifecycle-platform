import { describe, expect, it, vi, beforeEach } from 'vitest';
import {
  TEST_RECORD_MISSING_CONTROL,
  TEST_RECORD_SAMPLE_SIZE_BELOW_TABLE22,
  createTestRecord,
} from '../csa-verdict';
import type { TestingDecision } from '@shared/testing-decision';
import type { DrizzleDb } from '../../db';

/** A stand-in decision: the seam itself is covered by the shared testing-decision suite. */
const accepted = (): TestingDecision => ({ isValid: true, verdict: 'Effective' });
const refused = (): TestingDecision => ({ isValid: false });

/** boundary: drizzle stub — the write path only fetches one control and inserts. */
function mockDb() {
  const values = vi.fn().mockResolvedValue([]);
  const db: DrizzleDb = Object.create(null);
  Object.assign(db, {
    query: { controls: { findFirst: vi.fn().mockResolvedValue({ frequency: 'Annual' }) } },
    insert: vi.fn(() => ({ values })),
  });
  return { db, values };
}

const args = (db: DrizzleDb, body: Record<string, unknown>) => ({
  db,
  orgId: 'org-1',
  userId: 'user-1',
  body: { controlId: 'c-1', ...body },
  decide: accepted,
});

describe('createTestRecord — the one write path for a CSA test record (#96)', () => {
  let h: ReturnType<typeof mockDb>;
  beforeEach(() => {
    h = mockDb();
  });

  it('refuses a missing controlId with a stable code and never touches the database', async () => {
    const result = await createTestRecord(args(h.db, { controlId: '', decide: accepted }));

    expect(result.outcome).toBe('rejected');
    if (result.outcome !== 'rejected') throw new Error('unreachable');
    expect(result.code).toBe(TEST_RECORD_MISSING_CONTROL);
    expect(result.httpStatus).toBe(400);
    expect(h.db.query.controls.findFirst).not.toHaveBeenCalled();
    expect(h.db.insert).not.toHaveBeenCalled();
  });

  it('refuses a rejected decision with the Table 22 code and inserts nothing', async () => {
    const result = await createTestRecord({ ...args(h.db, {}), decide: refused });

    expect(result.outcome).toBe('rejected');
    if (result.outcome !== 'rejected') throw new Error('unreachable');
    expect(result.code).toBe(TEST_RECORD_SAMPLE_SIZE_BELOW_TABLE22);
    expect(result.message).toContain('Table 22');
    expect(h.db.insert).not.toHaveBeenCalled();
  });

  it('normalises testType, defaults a blank period to the current year and keeps the verdict', async () => {
    const created = await createTestRecord(args(h.db, { testType: 'SOMETHING', period: '   ' }));

    expect(created.outcome).toBe('created');
    if (created.outcome !== 'created') throw new Error('unreachable');
    expect(created.record.testType).toBe('TOE');
    expect(created.record.period).toBe(String(new Date().getFullYear()));
    expect(created.record.result).toBe('Effective');
    expect(h.db.insert).toHaveBeenCalledWith(expect.anything());
  });

  it('trims a given period and ignores a non-numeric sampleSize', async () => {
    const created = await createTestRecord(args(h.db, { testType: 'TOD', period: ' 2025 ', sampleSize: 'lots' }));

    if (created.outcome !== 'created') throw new Error('expected created');
    expect(created.record.testType).toBe('TOD');
    expect(created.record.period).toBe('2025');
    expect(created.record.sampleSize).toBe(0);
  });

  it('coerces the request body instead of asserting it: booleans and the pilar comment map', async () => {
    const created = await createTestRecord(
      args(h.db, {
        todPilarObjective: true,
        todPilarTiming: 'yes',
        todPilarComments: { evidence: 'ok' },
      }),
    );

    if (created.outcome !== 'created') throw new Error('expected created');
    expect(created.record.todPilarObjective).toBe(true);
    expect(created.record.todPilarTiming).toBeUndefined();
    expect(created.record.todPilarComments).toEqual({ evidence: 'ok' });
  });

  it('drops a pilar comment map whose entries are not all strings', async () => {
    const created = await createTestRecord(args(h.db, { todPilarComments: { evidence: 1 } }));

    if (created.outcome !== 'created') throw new Error('expected created');
    expect(created.record.todPilarComments).toBeUndefined();
  });

  it('inserts the sample rows only when samples are given, defaulting status to Pass', async () => {
    const without = await createTestRecord(args(h.db, {}));
    if (without.outcome !== 'created') throw new Error('expected created');
    expect(h.db.insert).toHaveBeenCalledTimes(1);

    h = mockDb();
    const withSamples = await createTestRecord(
      args(h.db, { samples: [{ sampleRef: 'S-1', attrA: true, status: 'Fail' }, 'not-an-object'] }),
    );
    if (withSamples.outcome !== 'created') throw new Error('expected created');
    expect(h.db.insert).toHaveBeenCalledTimes(2);

    const sampleValues = h.values.mock.calls[1][0] as Array<Record<string, unknown>>;
    expect(sampleValues).toHaveLength(2);
    expect(sampleValues[0]).toMatchObject({
      testRecordId: withSamples.record.id,
      sampleRef: 'S-1',
      attrA: true,
      status: 'Fail',
    });
    // A junk entry still yields a well-formed row rather than a cast-shaped one.
    expect(sampleValues[1]).toMatchObject({ status: 'Pass', attrA: undefined });
  });
});
