import type { ApprovalHistoryEntry, SimulationStatus, WorkflowAction } from './types/scoping';
import type { UserRole } from './types/common';
import { WORKFLOW_TRANSITION_RULES } from './workflow-transitions';

/**
 * Single owner of the materiality-simulation approval lifecycle (arch round 8, C4).
 *
 * The two approve gates do NOT declare a status progression here: every Approve
 * outcome reads its `nextStatus` from the canonical SCOPING table in
 * `shared/workflow-transitions.ts`, so the route and the table cannot drift into
 * parallel taxonomies. The only thing local to this module is the stage authority
 * — the simulation route speaks the `CFO`/`Commissioner` role vocabulary while the
 * canonical table speaks the generic `Line 2`/`Admin` vocabulary, so the binding
 * (who may advance which gate) is declared once, here.
 *
 * Pure: no I/O, no throws. Callers map a failed decision onto `bad()`/`AppError`.
 */

/** Route-level action for the approve/reject endpoints (mapped to a canonical `WorkflowAction`). */
export type SimulationReviewAction = 'Approve' | 'Reject';

/** History label written to `simulations.history`, drawn from the domain entry union. */
export type SimulationHistoryAction = ApprovalHistoryEntry['action'];

/** The only status that carries a physical-deletion approval instead of a status transition. */
export const SIMULATION_DELETION_STATUS: SimulationStatus = 'Pending Deletion Approval';

export type SimulationDecisionCode =
  | 'SIMULATION_NOT_AWAITING_APPROVAL'
  | 'SIMULATION_ROLE_FORBIDDEN'
  | 'SIMULATION_NOTE_REQUIRED';

export interface SimulationDecisionInput {
  status: SimulationStatus;
  role: UserRole;
  action: SimulationReviewAction;
  note?: string;
}

export type SimulationDecision =
  | { ok: true; nextStatus: SimulationStatus; historyAction: SimulationHistoryAction }
  | { ok: false; code: SimulationDecisionCode; message: string; status: number };

interface SimulationStage {
  /** Canonical action whose `nextStatus` row in the SCOPING table this gate advances through. */
  canonicalAction: WorkflowAction;
  /** Roles permitted to act at this gate (route vocabulary). */
  roles: UserRole[];
}

const SIMULATION_STAGES: Partial<Record<SimulationStatus, SimulationStage>> = {
  'Pending CFO': { canonicalAction: 'Review', roles: ['CFO', 'Admin'] },
  'Pending Komut': { canonicalAction: 'Approve', roles: ['Commissioner', 'Admin'] },
};

const DELETION_ROLES: UserRole[] = ['CFO', 'Commissioner', 'Admin'];

export function isDeletionApproval(status: SimulationStatus): boolean {
  return status === SIMULATION_DELETION_STATUS;
}

function noteMissing(note: string | undefined): boolean {
  return !note || !note.trim();
}

function failure(code: SimulationDecisionCode, status: number, message: string): SimulationDecision {
  return { ok: false, code, status, message };
}

/** Pure approval/rejection decision for one simulation stage. */
export function decideSimulationTransition(input: SimulationDecisionInput): SimulationDecision {
  const { status, role, action, note } = input;

  if (status === SIMULATION_DELETION_STATUS) {
    if (action === 'Approve') {
      return failure(
        'SIMULATION_NOT_AWAITING_APPROVAL', 400,
        `"${status}" is approved by deleting the row, not a status transition`,
      );
    }
    if (!DELETION_ROLES.includes(role)) {
      return failure('SIMULATION_ROLE_FORBIDDEN', 403, `Role "${role}" cannot reject a deletion request`);
    }
    if (noteMissing(note)) return failure('SIMULATION_NOTE_REQUIRED', 400, 'Note is required for rejection');
    return { ok: true, nextStatus: 'Approved', historyAction: 'Reject Deletion' };
  }

  const stage = SIMULATION_STAGES[status];
  if (!stage) {
    return failure('SIMULATION_NOT_AWAITING_APPROVAL', 400, `Simulation status "${status}" is not awaiting approval`);
  }
  if (!stage.roles.includes(role)) {
    return failure('SIMULATION_ROLE_FORBIDDEN', 403, `Role "${role}" cannot ${action.toLowerCase()} a simulation at "${status}"`);
  }
  if (action === 'Reject') {
    if (noteMissing(note)) return failure('SIMULATION_NOTE_REQUIRED', 400, 'Note is required for rejection');
    return { ok: true, nextStatus: 'Rejected', historyAction: 'Reject' };
  }

  // boundary: the canonical SCOPING table's nextStatus literals are members of
  // the SimulationStatus union — scoping-simulation-status.test.ts locks them.
  const nextStatus = WORKFLOW_TRANSITION_RULES.SCOPING[status]?.nextStatus[stage.canonicalAction] as
    | SimulationStatus
    | undefined;
  if (!nextStatus) {
    return failure(
      'SIMULATION_NOT_AWAITING_APPROVAL', 400,
      `Canonical SCOPING table has no "${stage.canonicalAction}" transition from "${status}"`,
    );
  }
  return { ok: true, nextStatus, historyAction: 'Approve' };
}
