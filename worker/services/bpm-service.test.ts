import { describe, expect, it, vi } from 'vitest';
import type { DrizzleDb } from '../db';
import { BPM_CODE_TAKEN, BPM_PROCESS_NOT_FOUND, BpmService } from './bpm-service';

/**
 * Typed drizzle stub with no `any` (mirrors worker/routes/__tests__/reporting.test.ts).
 * `select→from→where` returns an awaitable that also exposes `.limit`, so it
 * covers both the `.limit(1)` and the bare-await read shapes BpmService uses.
 */
function makeStubDb(rowSets: unknown[][] = []) {
  let call = 0;
  const where = vi.fn(() => {
    const rows = rowSets[call++] ?? [];
    return Object.assign(Promise.resolve(rows), { limit: vi.fn(() => Promise.resolve(rows)) });
  });
  const select = vi.fn(() => ({ from: vi.fn(() => ({ where })) }));
  const update = vi.fn(() => ({ set: vi.fn(() => ({ where: vi.fn(() => Promise.resolve(undefined)) })) }));
  const remove = vi.fn(() => ({ where: vi.fn(() => Promise.resolve(undefined)) }));
  const insert = vi.fn(() => ({ values: vi.fn(() => Promise.resolve(undefined)) }));
  const db: DrizzleDb = Object.create(null);
  const transaction = vi.fn((work: (tx: DrizzleDb) => Promise<unknown>) => work(db));
  Object.assign(db, { select, update, delete: remove, insert, transaction });
  return { db, select, update, remove, insert, transaction };
}

describe('BpmService stable error codes', () => {
  it('publishes the known-good producer literals', () => {
    expect(BPM_PROCESS_NOT_FOUND).toBe('BPM_PROCESS_NOT_FOUND');
    expect(BPM_CODE_TAKEN).toBe('BPM_CODE_TAKEN');
  });

  it('raises BPM_PROCESS_NOT_FOUND (404) when the process is missing', async () => {
    const service = new BpmService(makeStubDb([[]]).db);
    await expect(service.getNextSequences('org-1', 'missing')).rejects.toMatchObject({
      code: 'BPM_PROCESS_NOT_FOUND',
      status: 404,
    });
  });

  it('raises BPM_CODE_TAKEN (409) when the BPM code is already used', async () => {
    const service = new BpmService(makeStubDb([[{ id: 'other' }]]).db);
    await expect(service.updateProcess('org-1', 'proc-1', { bpmCode: 'bpm-fin-01' })).rejects.toMatchObject({
      code: 'BPM_CODE_TAKEN',
      status: 409,
    });
  });

  it('returns success without writing when nothing changes', async () => {
    const stub = makeStubDb();
    const service = new BpmService(stub.db);
    await expect(service.updateProcess('org-1', 'proc-1', {})).resolves.toEqual({ success: true });
    expect(stub.update).not.toHaveBeenCalled();
  });
});

describe('BpmService multi-step cascades are atomic', () => {
  it('runs deleteDiagram inside exactly one transaction', async () => {
    const stub = makeStubDb();
    const service = new BpmService(stub.db);
    await expect(service.deleteDiagram('org-1', 'diag-1')).resolves.toEqual({ success: true });
    expect(stub.transaction).toHaveBeenCalledTimes(1);
    expect(stub.remove).toHaveBeenCalledTimes(2);
  });

  it('runs the whole deleteProcess cascade inside exactly one transaction', async () => {
    const stub = makeStubDb([
      [{ id: 'proc-1', name: 'Vendor Payment', year: 2025 }],
      [],
      [{ id: 'diag-1' }],
    ]);
    const service = new BpmService(stub.db);
    await expect(service.deleteProcess('org-1', 'proc-1')).resolves.toEqual({ success: true });
    expect(stub.transaction).toHaveBeenCalledTimes(1);
  });

  it('rejects an empty reorganize selection before any write', async () => {
    const stub = makeStubDb([[]]);
    const service = new BpmService(stub.db);
    await expect(
      service.batchReorganizeProcesses('org-1', 'user-1', { action: 'demote', targetParentId: 'p', processIds: [] }),
    ).rejects.toMatchObject({ code: 'BPM_REORGANIZE_EMPTY', status: 400 });
    expect(stub.transaction).not.toHaveBeenCalled();
  });

  it('applies a demote inside exactly one transaction', async () => {
    const stub = makeStubDb([[{ id: 'p' }]]);
    const service = new BpmService(stub.db);
    const result = await service.batchReorganizeProcesses('org-1', 'user-1', {
      action: 'demote',
      targetParentId: 'p',
      processIds: ['a', 'b'],
    });
    expect(result).toMatchObject({ success: true, count: 2, action: 'demote', targetParentId: 'p' });
    expect(stub.transaction).toHaveBeenCalledTimes(1);
  });
});
