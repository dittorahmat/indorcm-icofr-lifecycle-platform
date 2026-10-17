import { describe, expect, it, vi } from 'vitest';
import type { DrizzleDb } from '../../../db';
import { bpmDiagrams, bpmNodeRcms, rcms } from '../../../db/schema';
import {
  cascadeDeleteDiagram,
  cleanupFlowPrefixes,
  createDiagram,
  getDiagramById,
  updateDiagram,
  type DiagramContext,
  type DiagramWriteBody,
} from '../bpm-diagrams';

/**
 * Diagram seam behaviour lock. The context is a plain fake (the seam only asks
 * for the four capabilities it uses), and the drizzle chain is stubbed exactly
 * like `worker/services/bpm-service.test.ts`.
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
  const inserts: unknown[] = [];
  const insert = vi.fn(() => ({
    values: vi.fn((row: unknown) => {
      inserts.push(row);
      return Promise.resolve(undefined);
    }),
  }));
  const db: DrizzleDb = Object.create(null);
  Object.assign(db, { select, update, delete: remove, insert });
  return { db, select, update, remove, insert, inserts };
}

function makeContext(rowSets: unknown[][] = []) {
  const stub = makeStubDb(rowSets);
  const logAction = vi.fn(async () => undefined);
  const hydrateDiagramNodes = vi.fn(async (_id: string, nodes: unknown[]) => nodes);
  const syncRisksAndControlsFromNodes = vi.fn(async () => ({
    activeRiskControlPairs: new Set<string>(),
    activeRiskIds: new Set<string>(),
    activeControlIds: new Set<string>(),
  }));
  const syncMappingsFromEdges = vi.fn(async () => undefined);
  const cleanupStaleData = vi.fn(async () => undefined);
  const updateProcessSummaryCounts = vi.fn(async () => undefined);

  const ctx: DiagramContext = {
    db: stub.db,
    audit: { logAction },
    hydrator: { hydrateDiagramNodes },
    sync: {
      syncRisksAndControlsFromNodes,
      syncMappingsFromEdges,
      cleanupStaleData,
      updateProcessSummaryCounts,
    },
  };

  return {
    ctx,
    ...stub,
    logAction,
    hydrateDiagramNodes,
    syncRisksAndControlsFromNodes,
    syncMappingsFromEdges,
    cleanupStaleData,
    updateProcessSummaryCounts,
  };
}

const baseBody: DiagramWriteBody = { name: 'Vendor Flow', subProcess: 'Vendor Payment' };

describe('createDiagram', () => {
  it('parses the year, keeps the payload and defaults the missing collections', async () => {
    const { ctx, inserts } = makeContext();
    const body: DiagramWriteBody = {
      name: 'Vendor Flow',
      subProcess: 'Vendor Payment',
      year: '2025',
      nodes: [{ id: 'n1' }],
    };

    const created = await createDiagram(ctx, 'org-1', 'user-1', body);

    expect(inserts).toHaveLength(1);
    expect(inserts[0]).toMatchObject({
      organizationId: 'org-1',
      name: 'Vendor Flow',
      subProcess: 'Vendor Payment',
      year: 2025,
      nodes: [{ id: 'n1' }],
      edges: [],
      createdBy: 'user-1',
    });
    expect(created.year).toBe(2025);
  });

  it('falls back to "New Diagram" and a null year when the body omits them', async () => {
    const { ctx, inserts } = makeContext();

    const created = await createDiagram(ctx, 'org-1', 'user-1', { name: '', subProcess: 'Cash' });

    expect(inserts[0]).toMatchObject({ name: 'New Diagram', year: null, nodes: [], edges: [] });
    expect(created.name).toBe('New Diagram');
  });

  it('audits the CREATE with the inserted row as dataAfter', async () => {
    const { ctx, inserts, logAction } = makeContext();

    await createDiagram(ctx, 'org-1', 'user-1', baseBody);

    expect(logAction).toHaveBeenCalledWith(expect.objectContaining({
      organizationId: 'org-1',
      userId: 'user-1',
      action: 'CREATE',
      entityType: 'BPMDiagram',
      dataAfter: inserts[0],
    }));
  });
});

describe('updateDiagram', () => {
  it('returns null and writes nothing when the diagram does not exist', async () => {
    const { ctx, update, remove, insert, syncRisksAndControlsFromNodes } = makeContext([[]]);

    await expect(updateDiagram(ctx, 'org-1', 'user-1', 'missing', baseBody)).resolves.toBeNull();
    expect(update).not.toHaveBeenCalled();
    expect(remove).not.toHaveBeenCalled();
    expect(insert).not.toHaveBeenCalled();
    expect(syncRisksAndControlsFromNodes).not.toHaveBeenCalled();
  });

  it('clears node mappings, syncs the GL fan-out and refreshes the summary counts', async () => {
    const {
      ctx,
      remove,
      syncRisksAndControlsFromNodes,
      syncMappingsFromEdges,
      cleanupStaleData,
      updateProcessSummaryCounts,
    } = makeContext([
      [{ id: 'diag-1', year: 2024, subProcess: 'Vendor Payment', nodes: [] }],
      [{ id: 'proc-1', noGL: '1000' }],
    ]);

    const result = await updateDiagram(ctx, 'org-1', 'user-1', 'diag-1', {
      name: 'Vendor Flow',
      subProcess: 'Vendor Payment',
      year: '2025',
      nodes: [],
      edges: [],
      noGLs: ['1000', '1001'],
    });

    expect(result).toEqual({ success: true });
    expect(remove).toHaveBeenCalledWith(bpmNodeRcms);
    expect(syncRisksAndControlsFromNodes).toHaveBeenCalledWith(
      'org-1', 'diag-1', [], 'proc-1', ['1000', '1001'], 'Vendor Flow', 'Vendor Payment', 2025,
    );
    expect(syncMappingsFromEdges).toHaveBeenCalledWith('org-1', [], [], expect.any(Set), ['1000', '1001']);
    expect(cleanupStaleData).toHaveBeenCalledTimes(1);
    expect(updateProcessSummaryCounts).toHaveBeenCalledWith('org-1', 'diag-1');
  });
});

describe('cascadeDeleteDiagram', () => {
  it('unlinks RCMs, drops node mappings, then drops the diagram', async () => {
    const { ctx, update, remove } = makeContext();

    await cascadeDeleteDiagram(ctx, 'org-1', 'diag-1');

    expect(update).toHaveBeenCalledWith(rcms);
    expect(remove).toHaveBeenNthCalledWith(1, bpmNodeRcms);
    expect(remove).toHaveBeenNthCalledWith(2, bpmDiagrams);
  });
});

describe('getDiagramById', () => {
  it('returns null when the diagram is absent', async () => {
    const { ctx, hydrateDiagramNodes } = makeContext([[]]);

    await expect(getDiagramById(ctx, 'org-1', 'missing')).resolves.toBeNull();
    expect(hydrateDiagramNodes).not.toHaveBeenCalled();
  });

  it('hydrates the stored nodes and falls back to the process noGL', async () => {
    const { ctx, hydrateDiagramNodes } = makeContext([
      [{ id: 'diag-1', year: 2025, subProcess: 'Vendor Payment', nodes: [{ id: 'n1' }] }],
      [{ id: 'proc-1', noGL: '1000' }],
      [],
    ]);

    const diagram = await getDiagramById(ctx, 'org-1', 'diag-1', '1000');

    expect(diagram?.nodes).toEqual([{ id: 'n1' }]);
    expect(diagram?.noGLs).toEqual(['1000']);
    expect(hydrateDiagramNodes).toHaveBeenCalledWith('diag-1', [{ id: 'n1' }], '1000');
  });
});

describe('cleanupFlowPrefixes', () => {
  it('renames only the "Flow: " prefixed diagrams and counts them', async () => {
    const { ctx, update } = makeContext([
      [{ id: 'diag-1', name: 'Flow: Vendor Payment' }, { id: 'diag-2', name: 'Payroll' }],
    ]);

    await expect(cleanupFlowPrefixes(ctx.db, 'org-1')).resolves.toEqual({ cleanedCount: 1 });
    expect(update).toHaveBeenCalledTimes(1);
    expect(update).toHaveBeenCalledWith(bpmDiagrams);
  });
});
