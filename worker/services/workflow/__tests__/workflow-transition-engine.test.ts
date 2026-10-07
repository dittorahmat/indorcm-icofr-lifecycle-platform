import { describe, it, expect, vi, beforeEach } from 'vitest';
import { 
  WorkflowTransitionEngine, 
  TransitionRequest, 
  TransitionContext 
} from '../workflow-transition-engine';
import { WorkflowEntityType, WorkflowAction, UserRole } from '@shared/types';

describe('WorkflowTransitionEngine (TDD)', () => {
  let mockDb: any;
  let mockAuditService: any;
  let engine: WorkflowTransitionEngine;

  beforeEach(() => {
    mockDb = {};
    mockAuditService = {
      logAction: vi.fn().mockResolvedValue(true),
    };
    engine = new WorkflowTransitionEngine(mockDb, mockAuditService);
  });

  describe('BPM Transitions & RBAC', () => {
    it('allows Line 1 to submit a Draft BPM process for review', async () => {
      const request: TransitionRequest = {
        entityType: 'BPM',
        entityId: 'proc-1',
        currentStatus: 'Draft',
        action: 'Submit',
        note: 'Ready for review',
        assigneeId: 'user-checker',
      };
      const context: TransitionContext = {
        organizationId: 'org-1',
        userId: 'user-maker',
        role: 'Line 1',
      };

      const result = await engine.executeTransition(request, context);

      expect(result.success).toBe(true);
      expect(result.nextStatus).toBe('In Review');
      expect(mockAuditService.logAction).toHaveBeenCalledWith(expect.objectContaining({
        action: 'WORKFLOW_TRANSITION',
        entityType: 'BPM',
        entityId: 'proc-1',
      }));
    });

    it('rejects Line 1 from approving a BPM process directly', async () => {
      const request: TransitionRequest = {
        entityType: 'BPM',
        entityId: 'proc-1',
        currentStatus: 'In Approval',
        action: 'Approve',
      };
      const context: TransitionContext = {
        organizationId: 'org-1',
        userId: 'user-maker',
        role: 'Line 1',
      };

      await expect(engine.executeTransition(request, context)).rejects.toThrow(/unauthorized role/i);
    });

    it('requires a note when rejecting an entity', async () => {
      const request: TransitionRequest = {
        entityType: 'BPM',
        entityId: 'proc-1',
        currentStatus: 'In Review',
        action: 'Reject',
        note: '', // missing note
      };
      const context: TransitionContext = {
        organizationId: 'org-1',
        userId: 'user-checker',
        role: 'Line 2',
      };

      await expect(engine.executeTransition(request, context)).rejects.toThrow(/note is required/i);
    });
  });

  describe('CSA Validation Transitions', () => {
    it('allows Line 2 to validate and sign off CSA record into Validated status', async () => {
      const request: TransitionRequest = {
        entityType: 'CSA',
        entityId: 'csa-1',
        currentStatus: 'In Review',
        action: 'Approve',
        note: 'Verified against SK-5 controls',
      };
      const context: TransitionContext = {
        organizationId: 'org-1',
        userId: 'user-l2',
        role: 'Line 2',
      };

      const result = await engine.executeTransition(request, context);

      expect(result.success).toBe(true);
      expect(result.nextStatus).toBe('Validated');
    });

    it('rejects invalid action for current status with diagnostic error', async () => {
      const request: TransitionRequest = {
        entityType: 'CSA',
        entityId: 'csa-1',
        currentStatus: 'Draft',
        action: 'Approve', // cannot approve Draft directly
      };
      const context: TransitionContext = {
        organizationId: 'org-1',
        userId: 'user-l2',
        role: 'Line 2',
      };

      await expect(engine.executeTransition(request, context)).rejects.toThrow(/invalid action "Approve" for status "Draft"/i);
    });
  });
});
