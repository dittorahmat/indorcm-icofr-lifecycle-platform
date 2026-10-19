import { describe, it, expect, vi, beforeEach } from 'vitest';
import { buildProcessTree } from '../pages/bpm/utils/bpm-process-tree';
import { BpmService } from '../../worker/services/bpm-service';
import { bpmProcesses } from '../../worker/db/schema';
import type { BPMProcess } from '@shared/types';

describe('BPM Hierarchical Process & Sub-Process Logic', () => {
  describe('buildProcessTree (Frontend Hierarchical Transformation)', () => {
    const mockFlatProcesses: BPMProcess[] = [
      {
        id: 'p-1',
        organizationId: 'org-1',
        noGL: '111001',
        fsliName: 'Kas & Setara Kas',
        name: 'Pengelolaan Kas & Bank',
        bpmCode: 'BPM-FIN-01',
        year: 2026,
        riskCount: 2,
        controlCount: 3,
        standardTestProcedure: null,
        workflowStatus: 'Resolved',
        workflowHistory: [],
        createdAt: Date.now(),
        createdBy: 'user-1',
        parentId: null,
        level: 'process',
      },
      {
        id: 'p-2',
        organizationId: 'org-1',
        noGL: '111001',
        fsliName: 'Kas & Setara Kas',
        name: 'Penerimaan Kas',
        bpmCode: 'BPM-FIN-01a',
        year: 2026,
        riskCount: 4,
        controlCount: 5,
        standardTestProcedure: null,
        workflowStatus: 'Resolved',
        workflowHistory: [],
        createdAt: Date.now(),
        createdBy: 'user-1',
        parentId: 'p-1',
        level: 'sub_process',
      },
      {
        id: 'p-3',
        organizationId: 'org-1',
        noGL: '111001',
        fsliName: 'Kas & Setara Kas',
        name: 'Pengeluaran Kas',
        bpmCode: 'BPM-FIN-01b',
        year: 2026,
        riskCount: 3,
        controlCount: 4,
        standardTestProcedure: null,
        workflowStatus: 'Resolved',
        workflowHistory: [],
        createdAt: Date.now(),
        createdBy: 'user-1',
        parentId: 'p-1',
        level: 'sub_process',
      },
      {
        id: 'p-4',
        organizationId: 'org-1',
        noGL: '111001',
        fsliName: 'Kas & Setara Kas',
        name: 'Pengelolaan Kas Kecil',
        bpmCode: 'BPM-FIN-02',
        year: 2026,
        riskCount: 1,
        controlCount: 2,
        standardTestProcedure: null,
        workflowStatus: 'Resolved',
        workflowHistory: [],
        createdAt: Date.now(),
        createdBy: 'user-1',
        parentId: null,
        level: 'process',
      },
    ];

    it('transforms flat processes into a nested parent-child tree structure', () => {
      const tree = buildProcessTree(mockFlatProcesses);

      expect(tree).toHaveLength(2); // 2 root processes: p-1 and p-4
      expect(tree[0].id).toBe('p-1');
      expect(tree[0].children).toHaveLength(2);
      expect(tree[0].children?.[0].id).toBe('p-2');
      expect(tree[0].children?.[1].id).toBe('p-3');

      expect(tree[1].id).toBe('p-4');
      expect(tree[1].children).toHaveLength(0);
    });

    it('filters tree by matching parent name and preserves all its children', () => {
      const tree = buildProcessTree(mockFlatProcesses, 'Pengelolaan Kas & Bank');
      expect(tree).toHaveLength(1);
      expect(tree[0].id).toBe('p-1');
      expect(tree[0].children).toHaveLength(2);
    });

    it('filters tree by child sub-process name and includes the parent', () => {
      const tree = buildProcessTree(mockFlatProcesses, 'Penerimaan Kas');
      expect(tree).toHaveLength(1);
      expect(tree[0].id).toBe('p-1');
      expect(tree[0].children).toHaveLength(1);
      expect(tree[0].children?.[0].name).toBe('Penerimaan Kas');
    });

    it('returns empty array when search query matches no entity', () => {
      const tree = buildProcessTree(mockFlatProcesses, 'NonExistentQuery');
      expect(tree).toHaveLength(0);
    });
  });

  describe('BpmService - batchReorganizeProcesses (Backend Migration)', () => {
    let mockDb: any;
    let bpmService: BpmService;

    beforeEach(() => {
      vi.restoreAllMocks();
      mockDb = {
        // Default chainable stub: the service resolves `targetExists` before the
        // pure plan runs, so an unmocked `select` must not dereference undefined.
        select: vi.fn(() => ({
          from: vi.fn(() => ({ where: vi.fn(() => ({ limit: vi.fn().mockResolvedValue([]) })) })),
        })),
        update: vi.fn(),
        insert: vi.fn(),
        delete: vi.fn(),
        // Every mutating cascade is wrapped in `inTransaction`; run the callback
        // against the same mock handle the service then writes through.
        transaction: vi.fn(async (cb: (tx: unknown) => Promise<unknown>) => cb(mockDb)),
      };
      bpmService = new BpmService(mockDb as any);
    });

    it('throws error if processIds array is empty', async () => {
      await expect(
        bpmService.batchReorganizeProcesses('org-1', 'user-1', {
          action: 'demote',
          targetParentId: 'parent-1',
          processIds: [],
        })
      ).rejects.toMatchObject({ code: 'BPM_REORGANIZE_EMPTY', status: 400 });
    });

    it('throws error in demote mode if targetParentId is missing or targets itself', async () => {
      await expect(
        bpmService.batchReorganizeProcesses('org-1', 'user-1', {
          action: 'demote',
          processIds: ['proc-1'],
        })
      ).rejects.toMatchObject({ code: 'BPM_DEMOTE_TARGET_REQUIRED', status: 400 });

      await expect(
        bpmService.batchReorganizeProcesses('org-1', 'user-1', {
          action: 'demote',
          targetParentId: 'proc-1',
          processIds: ['proc-1', 'proc-2'],
        })
      ).rejects.toMatchObject({ code: 'BPM_SELF_PARENT', status: 400 });
    });

    it('successfully demotes selected processes to sub-processes under target parent', async () => {
      // Mock target parent query
      mockDb.select.mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([{ id: 'parent-1', name: 'Master Parent' }]),
          }),
        }),
      });

      const updateWhere = vi.fn().mockResolvedValue([]);
      const updateSet = vi.fn().mockReturnValue({ where: updateWhere });
      mockDb.update.mockReturnValue({ set: updateSet });

      // Mock audit log insert
      mockDb.insert.mockReturnValue({
        values: vi.fn().mockResolvedValue([]),
      });

      const result = await bpmService.batchReorganizeProcesses('org-1', 'user-1', {
        action: 'demote',
        targetParentId: 'parent-1',
        processIds: ['proc-2', 'proc-3', 'proc-4', 'proc-5'],
      });

      expect(result.success).toBe(true);
      expect(result.action).toBe('demote');
      expect(result.count).toBe(4);
      expect(mockDb.update).toHaveBeenCalledWith(bpmProcesses);
      expect(updateSet).toHaveBeenCalledWith({
        parentId: 'parent-1',
        level: 'sub_process',
      });
    });

    it('successfully promotes selected sub-processes to standalone independent processes', async () => {
      const updateWhere = vi.fn().mockResolvedValue([]);
      const updateSet = vi.fn().mockReturnValue({ where: updateWhere });
      mockDb.update.mockReturnValue({ set: updateSet });

      mockDb.insert.mockReturnValue({
        values: vi.fn().mockResolvedValue([]),
      });

      const result = await bpmService.batchReorganizeProcesses('org-1', 'user-1', {
        action: 'promote',
        processIds: ['sub-1', 'sub-2'],
      });

      expect(result.success).toBe(true);
      expect(result.action).toBe('promote');
      expect(result.count).toBe(2);
      expect(mockDb.update).toHaveBeenCalledWith(bpmProcesses);
      expect(updateSet).toHaveBeenCalledWith({
        parentId: null,
        level: 'process',
      });
    });
  });
});
