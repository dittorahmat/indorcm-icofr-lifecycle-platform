import { describe, it, expect } from 'vitest';
import {
  decideSimulationTransition,
  isDeletionApproval,
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
      .toEqual({ ok: true, nextStatus: 'Pending Komut', historyAction: 'Approve' });
    expect(decideSimulationTransition({ status: 'Pending CFO', role: 'Admin', action: 'Approve' }))
      .toEqual({ ok: true, nextStatus: 'Pending Komut', historyAction: 'Approve' });
  });

  it('advances Pending Komut → Approved for Commissioner and Admin', () => {
    expect(decideSimulationTransition({ status: 'Pending Komut', role: 'Commissioner', action: 'Approve' }))
      .toEqual({ ok: true, nextStatus: 'Approved', historyAction: 'Approve' });
    expect(decideSimulationTransition({ status: 'Pending Komut', role: 'Admin', action: 'Approve' }))
      .toEqual({ ok: true, nextStatus: 'Approved', historyAction: 'Approve' });
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

  it('returns a rejection to the Rejected status and requires a note', () => {
    const missing = decideSimulationTransition({ status: 'Pending CFO', role: 'CFO', action: 'Reject', note: '  ' });
    expect(missing.ok).toBe(false);
    if (missing.ok === false) expect(missing.code).toBe('SIMULATION_NOTE_REQUIRED');

    expect(decideSimulationTransition({ status: 'Pending CFO', role: 'CFO', action: 'Reject', note: 'too low' }))
      .toEqual({ ok: true, nextStatus: 'Rejected', historyAction: 'Reject' });
  });
});

describe('decideSimulationTransition — deletion approval', () => {
  it('returns a rejected deletion request to Approved', () => {
    expect(decideSimulationTransition({ status: SIMULATION_DELETION_STATUS, role: 'Commissioner', action: 'Reject', note: 'keep it' }))
      .toEqual({ ok: true, nextStatus: 'Approved', historyAction: 'Reject Deletion' });
  });

  it('requires a note when rejecting a deletion request', () => {
    const d = decideSimulationTransition({ status: SIMULATION_DELETION_STATUS, role: 'CFO', action: 'Reject' });
    expect(d.ok).toBe(false);
    if (d.ok === false) expect(d.code).toBe('SIMULATION_NOTE_REQUIRED');
  });

  it('refuses Approve on the deletion status (the row is deleted, not transitioned)', () => {
    const d = decideSimulationTransition({ status: SIMULATION_DELETION_STATUS, role: 'Admin', action: 'Approve' });
    expect(d.ok).toBe(false);
    if (d.ok === false) expect(d.code).toBe('SIMULATION_NOT_AWAITING_APPROVAL');
  });

  it('detects only the deletion status', () => {
    expect(isDeletionApproval(SIMULATION_DELETION_STATUS)).toBe(true);
    expect(isDeletionApproval('Approved')).toBe(false);
  });
});

describe('simulation lifecycle derives from the canonical SCOPING table', () => {
  it('locks the canonical next-status literals the gates read through', () => {
    expect(WORKFLOW_TRANSITION_RULES.SCOPING['Pending CFO'].nextStatus.Review).toBe('Pending Komut');
    expect(WORKFLOW_TRANSITION_RULES.SCOPING['Pending Komut'].nextStatus.Approve).toBe('Approved');
    expect(WORKFLOW_TRANSITION_RULES.SCOPING['Pending CFO'].requiredRole?.Review).toEqual(['Line 2', 'Admin']);
  });
});
