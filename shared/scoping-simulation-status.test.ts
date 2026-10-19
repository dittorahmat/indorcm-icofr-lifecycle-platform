import { describe, it, expect } from 'vitest';
import {
  decideSimulationTransition,
  isSimulationStatus,
  resolveSimulationStatus,
  simulationTimeline,
  SIMULATION_DELETION_STATUS,
} from './scoping-simulation-status';
import { WORKFLOW_TRANSITION_RULES } from './workflow-transitions';

/**
 * Simulation approval lifecycle seam. Expected codes/statuses are known-good
 * literals from SK-5/DKU.MBU/11/2024 and the canonical SCOPING table — never
 * recomputed the way the decision does.
 */

describe('decideSimulationTransition — SCOPING approval gates', () => {
  it('advances Pending CFO → Pending Komut for CFO and Admin', () => {
    expect(decideSimulationTransition({ status: 'Pending CFO', role: 'CFO', action: 'Approve' }))
      .toEqual({ ok: true, kind: 'transition', nextStatus: 'Pending Komut', historyAction: 'Approve' });
    expect(decideSimulationTransition({ status: 'Pending CFO', role: 'Admin', action: 'Approve' }))
      .toEqual({ ok: true, kind: 'transition', nextStatus: 'Pending Komut', historyAction: 'Approve' });
  });

  it('advances Pending Komut → Approved for Commissioner and Admin', () => {
    expect(decideSimulationTransition({ status: 'Pending Komut', role: 'Commissioner', action: 'Approve' }))
      .toEqual({ ok: true, kind: 'transition', nextStatus: 'Approved', historyAction: 'Approve' });
    expect(decideSimulationTransition({ status: 'Pending Komut', role: 'Admin', action: 'Approve' }))
      .toEqual({ ok: true, kind: 'transition', nextStatus: 'Approved', historyAction: 'Approve' });
  });

  it('forbids the wrong stage authority with 403', () => {
    const komutAtCfo = decideSimulationTransition({ status: 'Pending CFO', role: 'Commissioner', action: 'Approve' });
    expect(komutAtCfo.ok).toBe(false);
    if (komutAtCfo.ok === false) {
      expect(komutAtCfo.code).toBe('SIMULATION_ROLE_FORBIDDEN');
      expect(komutAtCfo.status).toBe(403);
    }

    const cfoAtKomut = decideSimulationTransition({ status: 'Pending Komut', role: 'CFO', action: 'Approve' });
    expect(cfoAtKomut.ok).toBe(false);
    if (cfoAtKomut.ok === false) expect(cfoAtKomut.code).toBe('SIMULATION_ROLE_FORBIDDEN');

    const line2AtCfo = decideSimulationTransition({ status: 'Pending CFO', role: 'Line 2', action: 'Approve' });
    expect(line2AtCfo.ok).toBe(false);
    if (line2AtCfo.ok === false) expect(line2AtCfo.code).toBe('SIMULATION_ROLE_FORBIDDEN');
  });

  it('treats a status outside the approval gates as not awaiting approval', () => {
    for (const status of ['Draft', 'Approved', 'Rejected'] as const) {
      const d = decideSimulationTransition({ status, role: 'Admin', action: 'Approve' });
      expect(d.ok).toBe(false);
      if (d.ok === false) {
        expect(d.code).toBe('SIMULATION_NOT_AWAITING_APPROVAL');
        expect(d.status).toBe(400);
      }
    }
  });

  it('returns a rejection to Rejected (which the table lets the preparer resubmit)', () => {
    const missing = decideSimulationTransition({ status: 'Pending CFO', role: 'CFO', action: 'Reject', note: '  ' });
    expect(missing.ok).toBe(false);
    if (missing.ok === false) expect(missing.code).toBe('SIMULATION_NOTE_REQUIRED');

    expect(decideSimulationTransition({ status: 'Pending CFO', role: 'CFO', action: 'Reject', note: 'too low' }))
      .toEqual({ ok: true, kind: 'transition', nextStatus: 'Rejected', historyAction: 'Reject' });
    expect(decideSimulationTransition({ status: 'Pending Komut', role: 'Commissioner', action: 'Reject', note: 'revise' }))
      .toEqual({ ok: true, kind: 'transition', nextStatus: 'Rejected', historyAction: 'Reject' });
  });
});

describe('decideSimulationTransition — deletion approval', () => {
  it('authorises the row deletion for the roles the table declares', () => {
    for (const role of ['CFO', 'Commissioner', 'Admin'] as const) {
      expect(decideSimulationTransition({ status: SIMULATION_DELETION_STATUS, role, action: 'Approve' }))
        .toEqual({ ok: true, kind: 'delete' });
    }
  });

  it('refuses a role the table does not declare for the deletion', () => {
    const d = decideSimulationTransition({ status: SIMULATION_DELETION_STATUS, role: 'Line 2', action: 'Approve' });
    expect(d.ok).toBe(false);
    if (d.ok === false) expect(d.code).toBe('SIMULATION_ROLE_FORBIDDEN');
  });

  it('returns a rejected deletion request to Approved', () => {
    expect(decideSimulationTransition({ status: SIMULATION_DELETION_STATUS, role: 'Commissioner', action: 'Reject', note: 'keep it' }))
      .toEqual({ ok: true, kind: 'transition', nextStatus: 'Approved', historyAction: 'Reject Deletion' });
  });

  it('requires a note when rejecting a deletion request', () => {
    const d = decideSimulationTransition({ status: SIMULATION_DELETION_STATUS, role: 'CFO', action: 'Reject' });
    expect(d.ok).toBe(false);
    if (d.ok === false) expect(d.code).toBe('SIMULATION_NOTE_REQUIRED');
  });
});

describe('simulation lifecycle derives from the canonical SCOPING table', () => {
  it('locks the canonical next-status literals the gates read through', () => {
    expect(WORKFLOW_TRANSITION_RULES.SCOPING['Pending CFO'].nextStatus.Review).toBe('Pending Komut');
    expect(WORKFLOW_TRANSITION_RULES.SCOPING['Pending Komut'].nextStatus.Approve).toBe('Approved');
    expect(WORKFLOW_TRANSITION_RULES.SCOPING['Pending CFO'].nextStatus.Reject).toBe('Rejected');
    expect(WORKFLOW_TRANSITION_RULES.SCOPING['Pending CFO'].requiredRole?.Review).toEqual(['CFO', 'Admin']);
    expect(WORKFLOW_TRANSITION_RULES.SCOPING['Pending Komut'].requiredRole?.Approve).toEqual(['Commissioner', 'Admin']);
    expect(WORKFLOW_TRANSITION_RULES.SCOPING.Approved.nextStatus['Request Deletion']).toBe('Pending Deletion Approval');
    expect(WORKFLOW_TRANSITION_RULES.SCOPING[SIMULATION_DELETION_STATUS].nextStatus['Reject Deletion']).toBe('Approved');
    expect(WORKFLOW_TRANSITION_RULES.SCOPING[SIMULATION_DELETION_STATUS].requiredRole?.['Approve Deletion'])
      .toEqual(['CFO', 'Commissioner', 'Admin']);
  });

  it('keeps the status union and the status set in lockstep', () => {
    for (const status of ['Draft', 'Pending CFO', 'Pending Komut', 'Approved', 'Rejected', SIMULATION_DELETION_STATUS]) {
      expect(isSimulationStatus(status)).toBe(true);
    }
    expect(isSimulationStatus('Pending Update Approval')).toBe(false);
    expect(isSimulationStatus(undefined)).toBe(false);
  });

  it('resolves the authoritative status column before the legacy mirror', () => {
    expect(resolveSimulationStatus({ status: 'Pending CFO', workflowStatus: 'Draft' })).toBe('Pending CFO');
    expect(resolveSimulationStatus({ status: 'Active', workflowStatus: 'Approved' })).toBe('Approved');
    expect(resolveSimulationStatus({})).toBe('Draft');
  });

  it('merges the approval log and the generic workflow log without duplicating an entry', () => {
    const submitted = { id: 'h1', action: 'Submit' as const, role: 'Line 2' as const, userId: 'u1', timestamp: 1, note: '' };
    const approvedFromLifecycle = { id: 'h2', action: 'Approve' as const, role: 'CFO' as const, userId: 'c1', timestamp: 2, note: '' };
    const approvedFromWorkflow = {
      id: 'h2', action: 'Approve' as const, fromStatus: 'Pending CFO', toStatus: 'Pending Komut',
      role: 'CFO', userId: 'c1', timestamp: 2, note: '',
    };
    expect(simulationTimeline({ history: [submitted], workflowHistory: [approvedFromLifecycle, approvedFromWorkflow] }).map(e => e.id))
      .toEqual(['h1', 'h2']);
    expect(simulationTimeline({})).toEqual([]);
  });
});
