import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BpmService } from '../../worker/services/bpm-service';
import { bpmProcesses, bpmDiagrams, rcms, bpmNodeRcms, controls, csaRecords, bpmProcessGlCodes } from '../../worker/db/schema';

describe('BpmService - Cascade Deletion & Foreign Key Decoupling', () => {
  let mockDb: any;
  let bpmService: BpmService;

  beforeEach(() => {
    vi.restoreAllMocks();

    mockDb = {
      select: vi.fn(),
      insert: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      // Both cascades run inside `inTransaction`; run the callback on the same handle.
      transaction: vi.fn(async (cb: (tx: unknown) => Promise<unknown>) => cb(mockDb)),
    };

    bpmService = new BpmService(mockDb as any);
  });

  describe('deleteDiagram', () => {
    it('decouples rcms.diagramId and deletes bpmNodeRcms before deleting bpmDiagrams', async () => {
      const updateWhere = vi.fn().mockResolvedValue([]);
      const updateSet = vi.fn().mockReturnValue({ where: updateWhere });
      mockDb.update.mockReturnValue({ set: updateSet });

      const deleteWhere = vi.fn().mockResolvedValue([]);
      mockDb.delete.mockReturnValue({ where: deleteWhere });

      const result = await bpmService.deleteDiagram('org-1', 'diag-1');

      expect(result).toEqual({ success: true });
      expect(mockDb.update).toHaveBeenCalledWith(rcms);
      expect(updateSet).toHaveBeenCalledWith({ diagramId: null });

      // First delete call is bpmNodeRcms, second is bpmDiagrams
      expect(mockDb.delete).toHaveBeenNthCalledWith(1, bpmNodeRcms);
      expect(mockDb.delete).toHaveBeenNthCalledWith(2, bpmDiagrams);
    });
  });

  describe('deleteProcess', () => {
    it('cascades diagram deletion when no other process shares the subProcess name', async () => {
      // 1. targetProcesses query
      const targetProcess = { id: 'proc-1', name: 'Vendor Payment', year: 2025, organizationId: 'org-1' };
      const selectTargetWhere = vi.fn().mockReturnValue({
        limit: vi.fn().mockResolvedValue([targetProcess])
      });

      // 2. otherProcesses query -> empty (no sharing)
      const selectOtherWhere = vi.fn().mockReturnValue({
        limit: vi.fn().mockResolvedValue([])
      });

      // 3. associatedDiagrams query -> found diagram
      const selectDiagWhere = vi.fn().mockResolvedValue([{ id: 'diag-vendor' }]);

      mockDb.select
        .mockReturnValueOnce({ from: vi.fn().mockReturnValue({ where: selectTargetWhere }) })
        .mockReturnValueOnce({ from: vi.fn().mockReturnValue({ where: selectOtherWhere }) })
        .mockReturnValueOnce({ from: vi.fn().mockReturnValue({ where: selectDiagWhere }) });

      // Mock update (controls & csaRecords decoupling)
      const updateWhere = vi.fn().mockResolvedValue([]);
      const updateSet = vi.fn().mockReturnValue({ where: updateWhere });
      mockDb.update.mockReturnValue({ set: updateSet });

      // Mock delete (bpmProcessGlCodes & bpmProcesses)
      const deleteWhere = vi.fn().mockResolvedValue([]);
      mockDb.delete.mockReturnValue({ where: deleteWhere });

      const result = await bpmService.deleteProcess('org-1', 'proc-1');

      expect(result).toEqual({ success: true });
      // deleteProcess now calls the diagram seam directly (not the public
      // deleteDiagram), so the cascade is asserted through its effect:
      // decouple rcms.diagramId, then delete bpmNodeRcms and bpmDiagrams.
      expect(mockDb.update).toHaveBeenCalledWith(rcms);
      expect(mockDb.delete).toHaveBeenCalledWith(bpmNodeRcms);
      expect(mockDb.delete).toHaveBeenCalledWith(bpmDiagrams);
      expect(mockDb.update).toHaveBeenCalledWith(controls);
      expect(mockDb.update).toHaveBeenCalledWith(csaRecords);
      expect(mockDb.delete).toHaveBeenCalledWith(bpmProcessGlCodes);
      expect(mockDb.delete).toHaveBeenCalledWith(bpmProcesses);
    });

    it('does NOT delete associated diagram if another process still uses the subProcess name', async () => {
      const targetProcess = { id: 'proc-1', name: 'Vendor Payment', year: 2025, organizationId: 'org-1' };
      const selectTargetWhere = vi.fn().mockReturnValue({
        limit: vi.fn().mockResolvedValue([targetProcess])
      });

      // Another process exists
      const selectOtherWhere = vi.fn().mockReturnValue({
        limit: vi.fn().mockResolvedValue([{ id: 'proc-2' }])
      });

      mockDb.select
        .mockReturnValueOnce({ from: vi.fn().mockReturnValue({ where: selectTargetWhere }) })
        .mockReturnValueOnce({ from: vi.fn().mockReturnValue({ where: selectOtherWhere }) });

      const updateWhere = vi.fn().mockResolvedValue([]);
      const updateSet = vi.fn().mockReturnValue({ where: updateWhere });
      mockDb.update.mockReturnValue({ set: updateSet });

      const deleteWhere = vi.fn().mockResolvedValue([]);
      mockDb.delete.mockReturnValue({ where: deleteWhere });

      const result = await bpmService.deleteProcess('org-1', 'proc-1');

      expect(result).toEqual({ success: true });
      // The diagram cascade is skipped entirely, so none of its writes happen.
      expect(mockDb.delete).not.toHaveBeenCalledWith(bpmNodeRcms);
      expect(mockDb.delete).not.toHaveBeenCalledWith(bpmDiagrams);
      expect(mockDb.delete).toHaveBeenCalledWith(bpmProcessGlCodes);
      expect(mockDb.delete).toHaveBeenCalledWith(bpmProcesses);
    });
  });
});
