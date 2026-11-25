import { describe, expect, it, vi } from 'vitest';
import {
  loadProcessHierarchy,
  planReorganize,
  rollupChildCounts,
  type ProcessCountRow,
  type ReorganizePlan,
} from '../bpm-process-hierarchy';

function expectRejected(plan: ReorganizePlan, code: string, status: number) {
  expect(plan.ok).toBe(false);
  if (plan.ok === false) {
    expect(plan.code).toBe(code);
    expect(plan.status).toBe(status);
  }
}

describe('rollupChildCounts', () => {
  it('returns an empty map when no row has a parent', () => {
    const rows: ProcessCountRow[] = [
      { id: 'p1', parentId: null, riskCount: 2, controlCount: 3 },
    ];
    expect(rollupChildCounts(rows).size).toBe(0);
  });

  it('sums every child onto its parent id and never onto a leaf', () => {
    const rows: ProcessCountRow[] = [
      { id: 'p1', parentId: null, riskCount: 1, controlCount: 1 },
      { id: 'c1', parentId: 'p1', riskCount: 2, controlCount: 3 },
      { id: 'c2', parentId: 'p1', riskCount: 4, controlCount: 5 },
      { id: 'c3', parentId: 'p2', riskCount: 7, controlCount: 8 },
    ];
    const map = rollupChildCounts(rows);
    expect(map.get('p1')).toEqual({ risks: 6, controls: 8 });
    expect(map.get('p2')).toEqual({ risks: 7, controls: 8 });
    expect(map.has('c1')).toBe(false);
  });

  it('treats null child counts as zero', () => {
    const rows: ProcessCountRow[] = [
      { id: 'c1', parentId: 'p1', riskCount: null, controlCount: null },
      { id: 'c2', parentId: 'p1', riskCount: 2, controlCount: null },
    ];
    expect(rollupChildCounts(rows).get('p1')).toEqual({ risks: 2, controls: 0 });
  });

  it('does not mutate the input rows', () => {
    const rows: ProcessCountRow[] = [{ id: 'c1', parentId: 'p1', riskCount: 2, controlCount: 3 }];
    rollupChildCounts(rows);
    expect(rows[0]).toEqual({ id: 'c1', parentId: 'p1', riskCount: 2, controlCount: 3 });
  });
});

describe('planReorganize (reorganize decision seam)', () => {
  it('rejects an empty selection with BPM_REORGANIZE_EMPTY (400)', () => {
    expectRejected(
      planReorganize({ action: 'promote', processIds: [], targetExists: false }),
      'BPM_REORGANIZE_EMPTY',
      400,
    );
  });

  it('requires a demote target with BPM_DEMOTE_TARGET_REQUIRED (400)', () => {
    expectRejected(
      planReorganize({ action: 'demote', processIds: ['a'], targetExists: false }),
      'BPM_DEMOTE_TARGET_REQUIRED',
      400,
    );
  });

  it('refuses a self-parent with BPM_SELF_PARENT (400)', () => {
    expectRejected(
      planReorganize({ action: 'demote', processIds: ['a', 'b'], targetParentId: 'a', targetExists: true }),
      'BPM_SELF_PARENT',
      400,
    );
  });

  it('reports a missing demote target with BPM_TARGET_NOT_FOUND (404)', () => {
    expectRejected(
      planReorganize({ action: 'demote', processIds: ['a'], targetParentId: 'p', targetExists: false }),
      'BPM_TARGET_NOT_FOUND',
      404,
    );
  });

  it('rejects an unknown action with BPM_ACTION_INVALID (400)', () => {
    expectRejected(
      planReorganize({ action: 'purge', processIds: ['a'], targetExists: false }),
      'BPM_ACTION_INVALID',
      400,
    );
  });

  it('accepts demote and returns the validated target parent', () => {
    const plan = planReorganize({ action: 'demote', processIds: ['a'], targetParentId: 'p', targetExists: true });
    expect(plan).toEqual({ ok: true, action: 'demote', targetParentId: 'p' });
  });

  it('accepts promote', () => {
    const plan = planReorganize({ action: 'promote', processIds: ['a'], targetExists: false });
    expect(plan).toEqual({ ok: true, action: 'promote' });
  });
});

describe('loadProcessHierarchy database query seam', () => {
  it('executes select query with Drizzle schema and aggregates child counts', async () => {
    const mockRows = [
      {
        id: 'proc_parent',
        organizationId: 'org1',
        noGL: '100',
        fsliName: 'Cash',
        name: 'Treasury',
        year: 2027,
        createdAt: new Date(),
        createdBy: 'user1',
        controlCount: 0,
        riskCount: 0,
        bpmCode: 'TR-01',
        standardTestProcedure: null,
        workflowStatus: 'Draft',
        workflowHistory: null,
        parentId: null,
        level: 1,
      },
      {
        id: 'proc_child',
        organizationId: 'org1',
        noGL: '100',
        fsliName: 'Cash',
        name: 'Disbursements',
        year: 2027,
        createdAt: new Date(),
        createdBy: 'user1',
        controlCount: 3,
        riskCount: 2,
        bpmCode: 'TR-01-01',
        standardTestProcedure: null,
        workflowStatus: 'Draft',
        workflowHistory: null,
        parentId: 'proc_parent',
        level: 2,
      },
    ];

    const mockDb = {
      select: () => ({
        from: () => ({
          where: async () => mockRows,
        }),
      }),
    };

    // @ts-expect-error minimal select-from-where test stub
    const results = await loadProcessHierarchy(mockDb, {
      orgId: 'org1',
      year: 2027,
    });

    expect(results).toHaveLength(2);
    // Parent should rollup child counts (3 controls, 2 risks)
    const parent = results.find((r) => r.id === 'proc_parent');
    expect(parent?.controlCount).toBe(3);
    expect(parent?.riskCount).toBe(2);

    const child = results.find((r) => r.id === 'proc_child');
    expect(child?.controlCount).toBe(3);
    expect(child?.riskCount).toBe(2);
  });
});
