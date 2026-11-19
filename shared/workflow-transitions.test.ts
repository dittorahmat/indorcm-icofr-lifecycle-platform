import { describe, it, expect } from 'vitest';
import {
  decideTransition,
  allowedActionsFor,
  allowedRolesAt,
  csaSnapshotStatus,
  entityRoles,
  forEntity,
  isWorkflowLockedFor,
  statusBadgeTone,
  workflowEndpointFor,
  workflowInvalidationKeysFor,
  workflowStatusesFor,
  WORKFLOW_TRANSITION_RULES,
  requiresNoteFor,
  type WorkflowEntityType,
} from './workflow-transitions';

const line1 = 'Line 1';
const line2 = 'Line 2';

/** Canonical contract: one decision table for all five ICOFR entity types. */
describe('workflow-transitions single source (T2 RED)', () => {
  it('routes BPM Draft → Submit → In Review', () => {
    const d = decideTransition({ entityType: 'BPM', currentStatus: 'Draft', action: 'Submit', role: line1 });
    expect(d).toEqual({ ok: true, nextStatus: 'In Review' });
  });

  it('routes ACTION_PLAN Resolved → Rollback → Ineffective with note', () => {
    const d = decideTransition({
      entityType: 'ACTION_PLAN', currentStatus: 'Resolved', action: 'Rollback', role: line2, note: 'reopen',
    });
    expect(d).toEqual({ ok: true, nextStatus: 'Ineffective' });
  });

  it('rejects self-approval for non-admin users (SoD violation)', () => {
    // BPM Review step
    expect(decideTransition({
      entityType: 'BPM',
      currentStatus: 'In Review',
      action: 'Review',
      role: line2,
      userId: 'user-1',
      createdBy: 'user-1',
    })).toEqual({
      ok: false,
      code: 'SOD_VIOLATION',
      status: 403,
      message: 'Segregation of duties: Creator cannot approve their own submission',
    });

    // Scoping CFO review step
    expect(decideTransition({
      entityType: 'SCOPING',
      currentStatus: 'Pending CFO',
      action: 'Review',
      role: 'CFO',
      userId: 'cfo-user',
      createdBy: 'cfo-user',
    })).toEqual({
      ok: false,
      code: 'SOD_VIOLATION',
      status: 403,
      message: 'Segregation of duties: Creator cannot approve their own submission',
    });

    // CSA Approve step
    expect(decideTransition({
      entityType: 'CSA',
      currentStatus: 'In Review',
      action: 'Approve',
      role: line2,
      userId: 'line2-user',
      createdBy: 'line2-user',
    })).toEqual({
      ok: false,
      code: 'SOD_VIOLATION',
      status: 403,
      message: 'Segregation of duties: Creator cannot approve their own submission',
    });
  });

  it('permits self-approval for Admin for testing purposes', () => {
    expect(decideTransition({
      entityType: 'BPM',
      currentStatus: 'In Review',
      action: 'Review',
      role: 'Admin',
      userId: 'admin-user',
      createdBy: 'admin-user',
    })).toEqual({
      ok: true,
      nextStatus: 'In Approval',
    });

    expect(decideTransition({
      entityType: 'SCOPING',
      currentStatus: 'Pending CFO',
      action: 'Review',
      role: 'Admin',
      userId: 'admin-user',
      createdBy: 'admin-user',
    })).toEqual({
      ok: true,
      nextStatus: 'Pending Komut',
    });
  });

  it('allows different user to approve', () => {
    expect(decideTransition({
      entityType: 'BPM',
      currentStatus: 'In Review',
      action: 'Review',
      role: line2,
      userId: 'reviewer-user',
      createdBy: 'creator-user',
    })).toEqual({
      ok: true,
      nextStatus: 'In Approval',
    });
  });

  it('routes SCOPING rejection, resubmission and deletion review through the table', () => {
    expect(decideTransition({
      entityType: 'SCOPING', currentStatus: 'Pending CFO', action: 'Reject', role: 'CFO', note: 'benchmark too low',
    })).toEqual({ ok: true, nextStatus: 'Rejected' });

    expect(decideTransition({ entityType: 'SCOPING', currentStatus: 'Rejected', action: 'Submit', role: line1 }))
      .toEqual({ ok: true, nextStatus: 'Pending CFO' });

    expect(decideTransition({ entityType: 'SCOPING', currentStatus: 'Approved', action: 'Request Deletion', role: line2 }))
      .toEqual({ ok: true, nextStatus: 'Pending Deletion Approval' });

    expect(decideTransition({
      entityType: 'SCOPING', currentStatus: 'Pending Deletion Approval', action: 'Reject Deletion',
      role: 'Commissioner', note: 'baseline still needed',
    })).toEqual({ ok: true, nextStatus: 'Approved' });
  });

  it('keeps the SCOPING authority in the table, not in the role names of the route', () => {
    const wrongStage = decideTransition({
      entityType: 'SCOPING', currentStatus: 'Pending CFO', action: 'Approve', role: 'Commissioner',
    });
    expect(wrongStage.ok).toBe(false);
    if (!wrongStage.ok) expect(wrongStage.code).toBe('INVALID_ACTION');

    const wrongRole = decideTransition({
      entityType: 'SCOPING', currentStatus: 'Pending Komut', action: 'Approve', role: 'CFO',
    });
    expect(wrongRole.ok).toBe(false);
    if (!wrongRole.ok) {
      expect(wrongRole.code).toBe('FORBIDDEN_TRANSITION');
      expect(wrongRole.status).toBe(403);
    }

    const line1Deletion = decideTransition({
      entityType: 'SCOPING', currentStatus: 'Approved', action: 'Request Deletion', role: line1,
    });
    expect(line1Deletion.ok).toBe(false);
    if (!line1Deletion.ok) expect(line1Deletion.code).toBe('FORBIDDEN_TRANSITION');
  });

  it('routes RCM_CHANGE Draft → Submit → In Review → Approve → Approved', () => {
    expect(decideTransition({ entityType: 'RCM_CHANGE', currentStatus: 'Draft', action: 'Submit', role: line1 }))
      .toEqual({ ok: true, nextStatus: 'In Review' });
    expect(decideTransition({ entityType: 'RCM_CHANGE', currentStatus: 'In Review', action: 'Approve', role: line2 }))
      .toEqual({ ok: true, nextStatus: 'Approved' });
  });

  it('routes CSA In Review → Approve → Validated', () => {
    const d = decideTransition({ entityType: 'CSA', currentStatus: 'In Review', action: 'Approve', role: line2 });
    expect(d).toEqual({ ok: true, nextStatus: 'Validated' });
  });

  it('rejects CSA Draft → Approve as invalid action', () => {
    const d = decideTransition({ entityType: 'CSA', currentStatus: 'Draft', action: 'Approve', role: line2 });
    expect(d.ok).toBe(false);
    if (!d.ok) expect(d.code).toBe('INVALID_ACTION');
  });

  it('rejects Line 1 approving RCM_CHANGE with 403', () => {
    const d = decideTransition({ entityType: 'RCM_CHANGE', currentStatus: 'In Review', action: 'Approve', role: line1 });
    expect(d.ok).toBe(false);
    if (!d.ok) {
      expect(d.code).toBe('FORBIDDEN_TRANSITION');
      expect(d.status).toBe(403);
    }
  });

  it('requires a note for Reject', () => {
    const d = decideTransition({ entityType: 'BPM', currentStatus: 'In Review', action: 'Reject', role: line2, note: '  ' });
    expect(d.ok).toBe(false);
    if (!d.ok) expect(d.code).toBe('NOTE_REQUIRED');
    expect(requiresNoteFor('BPM', 'In Review', 'Reject')).toBe(true);
    expect(requiresNoteFor('BPM', 'Draft', 'Submit')).toBe(false);
  });

  it('rejects unknown entity and unknown status', () => {
    const bad = decideTransition({
      entityType: 'UNKNOWN' as WorkflowEntityType, currentStatus: 'Draft', action: 'Submit', role: line1,
    });
    expect(bad.ok).toBe(false);
    const stranded = decideTransition({ entityType: 'CSA', currentStatus: 'Nope', action: 'Submit', role: line1 });
    expect(stranded.ok).toBe(false);
  });

  it('exposes allowed actions per step for client blueprints', () => {
    expect(allowedActionsFor('CSA', 'In Review')).toEqual(['Reject', 'Approve']);
    expect(allowedActionsFor('CSA', 'Validated')).toEqual(['Rollback']);
    expect(allowedActionsFor('CSA', 'Nope')).toEqual([]);
    expect(allowedActionsFor('SCOPING', 'Approved')).toEqual(['Request Deletion']);
    expect(allowedActionsFor('SCOPING', 'Pending Deletion Approval')).toEqual(['Reject Deletion']);
  });

  it('exposes the authority of a step, including actions with no transition', () => {
    expect(allowedRolesAt('SCOPING', 'Draft')).toEqual(['Line 1', 'Line 2', 'Admin']);
    expect(allowedRolesAt('SCOPING', 'Pending CFO')).toEqual(['CFO', 'Admin']);
    expect(allowedRolesAt('SCOPING', 'Pending Komut')).toEqual(['Commissioner', 'Admin']);
    expect(allowedRolesAt('SCOPING', 'Approved')).toEqual(['Line 2', 'Admin']);
    // 'Approve Deletion' has no nextStatus, but its authority is still declared.
    expect(allowedRolesAt('SCOPING', 'Pending Deletion Approval').sort())
      .toEqual(['Admin', 'CFO', 'Commissioner']);
    expect(allowedRolesAt('SCOPING', 'Nope')).toEqual([]);
  });

  it('derives the route-level rbac union from the same table', () => {
    expect(entityRoles('SCOPING')).toEqual(['Line 1', 'Line 2', 'Admin', 'CFO', 'Commissioner']);
    expect(entityRoles('CSA')).toEqual(['Line 1', 'Line 2', 'Admin']);
  });

  it('builds byte-identical workflow endpoints per entity', () => {
    expect(workflowEndpointFor('BPM', 'p1')).toBe('/api/bpm-processes/p1/workflow');
    expect(workflowEndpointFor('ACTION_PLAN', 'a1')).toBe('/api/actionplans/a1/workflow');
    expect(workflowEndpointFor('SCOPING', 's1')).toBe('/api/simulations/s1/workflow');
    expect(workflowEndpointFor('RCM_CHANGE', 'r1')).toBe('/api/rcm/r1/workflow');
    expect(workflowEndpointFor('CSA', 'c1')).toBe('/api/csa/c1/workflow');
  });

  it('derives lock from the table: unlocked exactly where Submit is allowed', () => {
    const entities = ['BPM', 'ACTION_PLAN', 'SCOPING', 'RCM_CHANGE', 'CSA'] as WorkflowEntityType[];
    for (const entity of entities) {
      for (const status of Object.keys(WORKFLOW_TRANSITION_RULES[entity] ?? {})) {
        const canSubmit = allowedActionsFor(entity, status).includes('Submit');
        expect(isWorkflowLockedFor(entity, status)).toBe(!canSubmit);
      }
    }
    expect(isWorkflowLockedFor('BPM', 'Draft')).toBe(false);
    expect(isWorkflowLockedFor('BPM', 'Rejected')).toBe(false);
    expect(isWorkflowLockedFor('ACTION_PLAN', 'Ineffective')).toBe(false);
    expect(isWorkflowLockedFor('BPM', 'In Review')).toBe(true);
    expect(isWorkflowLockedFor('SCOPING', 'Rejected')).toBe(false);
    expect(isWorkflowLockedFor('SCOPING', 'Approved')).toBe(true);
    expect(isWorkflowLockedFor('SCOPING', 'Pending Deletion Approval')).toBe(true);
    expect(isWorkflowLockedFor('CSA', 'Nope')).toBe(true);
  });

  it('covers every canonical status with a badge tone', () => {
    expect(statusBadgeTone('Draft')).toBe('neutral');
    expect(statusBadgeTone('Rejected')).toBe('danger');
    expect(statusBadgeTone('In Review')).toBe('info');
    expect(statusBadgeTone('In Approval')).toBe('warning');
    expect(statusBadgeTone('Resolved')).toBe('success');
    expect(statusBadgeTone('Approved')).toBe('success');
    expect(statusBadgeTone('Validated')).toBe('success');
    expect(statusBadgeTone('Pending Deletion Approval')).toBe('danger');
    expect(statusBadgeTone('Nope')).toBe('neutral');
  });

  it('preserves legacy badge tones for statuses outside the canonical table', () => {
    expect(statusBadgeTone('Pending Review')).toBe('info');
    expect(statusBadgeTone('Pending Approval')).toBe('warning');
  });

  it('exposes invalidation keys for every entity', () => {
    expect(workflowInvalidationKeysFor('BPM')).toContainEqual(['bpm-processes']);
    expect(workflowInvalidationKeysFor('CSA')).toContainEqual(['csa-records']);
    for (const entity of ['BPM', 'ACTION_PLAN', 'SCOPING', 'RCM_CHANGE', 'CSA'] as WorkflowEntityType[]) {
      expect(workflowInvalidationKeysFor(entity).length).toBeGreaterThan(0);
    }
  });

  it('answers actions, notes, lock, tone, and keys through one forEntity view', () => {
    const bpmDraft = forEntity('BPM', 'Draft');
    expect(bpmDraft.actions).toEqual(['Submit']);
    expect(bpmDraft.requiresNote).toEqual({ Submit: false });
    expect(bpmDraft.locked).toBe(false);
    expect(bpmDraft.badgeTone).toBe('neutral');
    expect(bpmDraft.invalidationKeys).toContainEqual(['bpm-processes']);

    const bpmReview = forEntity('BPM', 'In Review');
    expect(bpmReview.actions).toEqual(['Reject', 'Review']);
    expect(bpmReview.requiresNote).toEqual({ Reject: true, Review: false });
    expect(bpmReview.locked).toBe(true);
    expect(bpmReview.badgeTone).toBe('info');

    const scopingKomut = forEntity('SCOPING', 'Pending Komut');
    expect(scopingKomut.actions).toEqual(['Reject', 'Approve']);
    expect(scopingKomut.badgeTone).toBe('warning');
  });

  it('returns an empty locked view for unknown statuses', () => {
    const view = forEntity('CSA', 'Nope');
    expect(view.actions).toEqual([]);
    expect(view.requiresNote).toEqual({});
    expect(view.locked).toBe(true);
    expect(view.badgeTone).toBe('neutral');
    expect(view.invalidationKeys).toContainEqual(['csa-records']);
  });
});

describe('workflow single-table coverage', () => {
  const entities: WorkflowEntityType[] = ['BPM', 'ACTION_PLAN', 'SCOPING', 'RCM_CHANGE', 'CSA'];
  it('every canonical status resolves a non-default tone intent', () => {
    for (const e of entities) {
      for (const s of workflowStatusesFor(e)) {
        expect(typeof statusBadgeTone(s)).toBe('string');
        expect(forEntity(e, s).badgeTone).toBe(statusBadgeTone(s));
      }
    }
  });
  it('forEntity badge tone matches the shared tone map (no blueprint drift)', () => {
    expect(forEntity('CSA', 'Validated').badgeTone).toBe('success');
    expect(forEntity('CSA', 'Draft').locked).toBe(false);
    expect(forEntity('BPM', 'In Review').locked).toBe(true);
  });
});

describe('csaSnapshotStatus', () => {
  it('prefers workflowStatus, then legacy columns', () => {
    expect(csaSnapshotStatus('Approved', 'Draft', true)).toBe('Approved');
    expect(csaSnapshotStatus(null, 'Validated', true)).toBe('Validated');
    expect(csaSnapshotStatus(null, 'Draft', true)).toBe('Draft');
    expect(csaSnapshotStatus(null, 'Draft', false)).toBe('In Review');
    expect(csaSnapshotStatus(undefined, undefined, undefined)).toBe('In Review');
  });
});
