import { describe, it, expect, beforeEach } from 'vitest';
import {
  executeWorkflowTransition,
  type WorkflowTransitionInput,
  type WorkflowTransitionStore,
  type WorkflowTransitionEffects,
  type WorkflowTransitionDeps,
  type WorkflowEntitySnapshot,
} from '../workflow-execution';
import type { WorkflowEntityType } from '@shared/workflow-transitions';
import type { DeficiencyTriggerEvent } from '../../deficiency-trigger';
import type { WorkflowHistoryEntry } from '@shared/types';

/** In-memory seam implementation: no HTTP, no DB. */
function seedSnapshot(over: Partial<WorkflowEntitySnapshot> = {}): WorkflowEntitySnapshot {
  return {
    status: 'Draft',
    history: [],
    controlId: null,
    bpmProcessId: null,
    period: null,
    result: null,
    deficiencyId: null,
    ownerId: null,
    createdBy: 'creator-1',
    name: 'Entity 1',
    planStatus: 'Draft',
    ...over,
  };
}

interface Saved {
  entityType: string;
  entityId: string;
  nextStatus: string;
  history: WorkflowHistoryEntry[];
  extra: Record<string, string | boolean | Date | null>;
}

function createFakes() {
  const rows = new Map<string, WorkflowEntitySnapshot>();
  const key = (entityType: string, entityId: string) => `${entityType}:${entityId}`;
  const saved: Saved[] = [];
  const audits: { action: string; entityType: string }[] = [];
  const deficiencyEvents: DeficiencyTriggerEvent[] = [];
  const notifications: { userId: string; link: string }[] = [];
  const remediated: string[] = [];
  const rcmApprovals: { entityId: string }[] = [];

  const store: WorkflowTransitionStore = {
    load: async ({ entityType, entityId }) => rows.get(key(entityType, entityId)) ?? null,
    save: async ({ entityType, entityId, nextStatus, history, extra }) => {
      const row = rows.get(key(entityType, entityId));
      if (row) {
        row.status = nextStatus;
        row.history = history;
      }
      saved.push({ entityType, entityId, nextStatus, history, extra });
    },
    markDeficiencyRemediated: async (id) => {
      remediated.push(id);
    },
    approveRcmChange: async ({ entityId }) => {
      rcmApprovals.push({ entityId });
    },
  };
  const effects: WorkflowTransitionEffects = {
    audit: async (entry) => {
      audits.push({ action: entry.action, entityType: entry.entityType });
    },
    raiseDeficiency: async (event) => {
      deficiencyEvents.push(event);
      return { id: 'def-new', created: true };
    },
    notify: async ({ userId, link }) => {
      notifications.push({ userId, link });
    },
  };
  const deps: WorkflowTransitionDeps = { store, effects, now: () => 1000, newId: () => 'hist-1' };
  return { rows, key, saved, audits, deficiencyEvents, notifications, remediated, rcmApprovals, deps };
}

function input(over: Partial<WorkflowTransitionInput> = {}): WorkflowTransitionInput {
  return {
    entityType: 'CSA',
    entityId: 'csa-1',
    organizationId: 'org-1',
    userId: 'user-l1',
    role: 'Line 1',
    action: 'Submit',
    ...over,
  };
}

describe('executeWorkflowTransition transactional seam (T2 RED)', () => {
  let f: ReturnType<typeof createFakes>;
  beforeEach(() => {
    f = createFakes();
  });

  it('persists CSA Draft → Submit with prepended history and one audit, no deficiency', async () => {
    f.rows.set(f.key('CSA', 'csa-1'), seedSnapshot({ status: 'Draft' }));
    const result = await executeWorkflowTransition(input(), f.deps);

    expect(result).toMatchObject({ success: true, fromStatus: 'Draft', nextStatus: 'In Review' });
    expect(f.saved).toHaveLength(1);
    expect(f.saved[0].nextStatus).toBe('In Review');
    expect(f.saved[0].history).toHaveLength(1);
    expect(f.saved[0].history[0]).toMatchObject({ id: 'hist-1', action: 'Submit', fromStatus: 'Draft', toStatus: 'In Review' });
    expect(f.saved[0].extra).toMatchObject({ workflowStatus: 'In Review', isDraft: false, line2Status: 'In Review' });
    expect(f.audits).toHaveLength(1);
    expect(f.audits[0]).toMatchObject({ action: 'WORKFLOW_TRANSITION', entityType: 'CSA' });
    expect(f.deficiencyEvents).toHaveLength(0);
  });

  it('prepends new history before existing entries', async () => {
    const old = { id: 'hist-0', action: 'Submit', fromStatus: 'Draft', toStatus: 'In Review' } as WorkflowHistoryEntry;
    f.rows.set(f.key('CSA', 'csa-1'), seedSnapshot({ status: 'In Review', history: [old] }));
    const result = await executeWorkflowTransition(
      input({ role: 'Line 2', userId: 'user-l2', action: 'Approve' }),
      f.deps,
    );
    expect(result.nextStatus).toBe('Validated');
    expect(f.saved[0].history.map((h) => h.id)).toEqual(['hist-1', 'hist-0']);
  });

  it('raises one typed deficiency when CSA Validated with Ineffective result', async () => {
    f.rows.set(
      f.key('CSA', 'csa-1'),
      seedSnapshot({ status: 'In Review', result: 'Ineffective', controlId: 'ctrl-1', period: '2026-Q1' }),
    );
    const result = await executeWorkflowTransition(
      input({ role: 'Line 2', userId: 'user-l2', action: 'Approve' }),
      f.deps,
    );
    expect(result.nextStatus).toBe('Validated');
    expect(f.deficiencyEvents).toHaveLength(1);
    expect(f.deficiencyEvents[0]).toMatchObject({
      organizationId: 'org-1',
      controlId: 'ctrl-1',
      period: '2026-Q1',
      source: 'Lini 2 - CSA Validation',
      userId: 'user-l2',
    });
    expect(f.audits.map((a) => a.action)).toEqual(['WORKFLOW_TRANSITION', 'SIGN_OFF_CSA']);
  });

  it('does not raise deficiency when CSA result is Effective', async () => {
    f.rows.set(f.key('CSA', 'csa-1'), seedSnapshot({ status: 'In Review', result: 'Effective', controlId: 'ctrl-1', period: '2026-Q1' }));
    await executeWorkflowTransition(input({ role: 'Line 2', userId: 'user-l2', action: 'Approve' }), f.deps);
    expect(f.deficiencyEvents).toHaveLength(0);
  });

  it('locks one contract per entity type (five entities)', async () => {
    const cases: { entityType: WorkflowEntityType; from: string; action: 'Submit' | 'Approve'; role: 'Line 1' | 'Line 2'; to: string }[] = [
      { entityType: 'BPM', from: 'Draft', action: 'Submit', role: 'Line 1', to: 'In Review' },
      { entityType: 'ACTION_PLAN', from: 'Ineffective', action: 'Submit', role: 'Line 1', to: 'In Review' },
      { entityType: 'SCOPING', from: 'Draft', action: 'Submit', role: 'Line 1', to: 'Pending CFO' },
      { entityType: 'RCM_CHANGE', from: 'In Review', action: 'Approve', role: 'Line 2', to: 'Approved' },
      { entityType: 'CSA', from: 'Draft', action: 'Submit', role: 'Line 1', to: 'In Review' },
    ];
    for (const c of cases) {
      f.rows.set(f.key(c.entityType, 'e1'), seedSnapshot({ status: c.from }));
      const r = await executeWorkflowTransition(
        input({ entityType: c.entityType, entityId: 'e1', action: c.action, role: c.role }),
        f.deps,
      );
      expect(r.nextStatus).toBe(c.to);
    }
    expect(f.saved).toHaveLength(5);
  });

  it('marks linked deficiency remediated when action plan resolves', async () => {
    f.rows.set(
      f.key('ACTION_PLAN', 'ap-1'),
      seedSnapshot({ status: 'In Approval', deficiencyId: 'def-9', ownerId: 'owner-1' }),
    );
    const r = await executeWorkflowTransition(
      input({ entityType: 'ACTION_PLAN', entityId: 'ap-1', role: 'Line 2', userId: 'user-l2', action: 'Approve' }),
      f.deps,
    );
    expect(r.nextStatus).toBe('Resolved');
    expect(f.remediated).toEqual(['def-9']);
    expect(f.saved[0].extra).toMatchObject({ status: 'Resolved' });
  });

  it('rolls BPM Resolved back to In Review (canonical, not Draft)', async () => {
    f.rows.set(f.key('BPM', 'p1'), seedSnapshot({ status: 'Resolved' }));
    const r = await executeWorkflowTransition(
      input({ entityType: 'BPM', entityId: 'p1', role: 'Line 2', userId: 'user-l2', action: 'Rollback', note: 'rework' }),
      f.deps,
    );
    expect(r.nextStatus).toBe('In Review');
  });

  it('throws AppError envelopes for invalid, forbidden, note-missing and unknown entity', async () => {
    f.rows.set(f.key('CSA', 'csa-1'), seedSnapshot({ status: 'Draft' }));
    await expect(executeWorkflowTransition(input({ action: 'Approve' }), f.deps)).rejects.toMatchObject({
      code: 'INVALID_ACTION',
      status: 400,
    });
    f.rows.set(f.key('RCM_CHANGE', 'r1'), seedSnapshot({ status: 'In Review' }));
    await expect(
      executeWorkflowTransition(input({ entityType: 'RCM_CHANGE', entityId: 'r1', action: 'Approve', role: 'Line 1' }), f.deps),
    ).rejects.toMatchObject({ code: 'FORBIDDEN_TRANSITION', status: 403 });
    f.rows.set(f.key('BPM', 'p1'), seedSnapshot({ status: 'In Review' }));
    await expect(
      executeWorkflowTransition(input({ entityType: 'BPM', entityId: 'p1', role: 'Line 2', action: 'Reject', note: '' }), f.deps),
    ).rejects.toMatchObject({ code: 'NOTE_REQUIRED', status: 400 });
    await expect(executeWorkflowTransition(input({ entityType: 'CSA', entityId: 'missing' }), f.deps)).rejects.toMatchObject({
      status: 404,
    });
  });
});
