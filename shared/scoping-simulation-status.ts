import type { ApprovalHistoryEntry, SimulationStatus, WorkflowAction, WorkflowHistoryEntry } from './types/scoping';
import type { UserRole } from './types/common';
import { allowedRolesFor, requiresNoteFor, WORKFLOW_TRANSITION_RULES } from './workflow-transitions';

/**
 * Single owner of the materiality-simulation approval lifecycle (arch round 8,
 * extended so the whole production flow is expressed here).
 *
 * Nothing about the flow is declared twice: `nextStatus`, the role authority and
 * the note requirement all come from the canonical SCOPING table in
 * `shared/workflow-transitions.ts`. What stays local is only the translation
 * between the route's two buttons (`Approve` / `Reject`) and the canonical
 * `WorkflowAction` vocabulary, which differs per stage — CFO reviews, the
 * Commissioner approves, and a deletion request is rejected rather than rolled
 * back.
 *
 * Pure: no I/O, no throws. Callers map a failed decision onto `bad()`/`AppError`.
 */

/** Route-level action for the approve/reject endpoints (mapped to a canonical `WorkflowAction`). */
export type SimulationReviewAction = 'Approve' | 'Reject';

/** History label written to `simulations.history`, drawn from the domain entry union. */
export type SimulationHistoryAction = ApprovalHistoryEntry['action'];

/** The only status that carries a physical-deletion approval instead of a status transition. */
export const SIMULATION_DELETION_STATUS: SimulationStatus = 'Pending Deletion Approval';

/** Exhaustive by construction: a new `SimulationStatus` member is a tsc error here. */
const SIMULATION_STATUS_SET: Record<SimulationStatus, true> = {
  Draft: true,
  'Pending CFO': true,
  'Pending Komut': true,
  Approved: true,
  Rejected: true,
  'Pending Deletion Approval': true,
};

export function isSimulationStatus(value: unknown): value is SimulationStatus {
  return typeof value === 'string' && Object.prototype.hasOwnProperty.call(SIMULATION_STATUS_SET, value);
}

/**
 * `status` is the column every write path and list/approval screen reads;
 * `workflowStatus` is the legacy mirror. Rows written before the two were kept
 * in sync fall back to the mirror instead of showing a stale "Draft".
 */
export function resolveSimulationStatus(row: { status?: string | null; workflowStatus?: string | null }): SimulationStatus {
  if (isSimulationStatus(row.status)) return row.status;
  if (isSimulationStatus(row.workflowStatus)) return row.workflowStatus;
  return 'Draft';
}

/**
 * Scoping keeps two history columns: `history` written by the approval/rejection
 * routes and `workflowHistory` written by the generic `/workflow` transition.
 * The timeline shows both, deduped by entry id.
 */
export function simulationTimeline(row: {
  history?: readonly ApprovalHistoryEntry[] | null;
  workflowHistory?: readonly WorkflowHistoryEntry[] | null;
}): (WorkflowHistoryEntry | ApprovalHistoryEntry)[] {
  const byId = new Map<string, WorkflowHistoryEntry | ApprovalHistoryEntry>();
  for (const entry of [...(row.history ?? []), ...(row.workflowHistory ?? [])]) {
    if (!byId.has(entry.id)) byId.set(entry.id, entry);
  }
  return [...byId.values()];
}

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
  | { ok: true; kind: 'transition'; nextStatus: SimulationStatus; historyAction: SimulationHistoryAction }
  /** Approving the deletion request removes the row; the caller deletes it. */
  | { ok: true; kind: 'delete' }
  | { ok: false; code: SimulationDecisionCode; message: string; status: number };

/** Which canonical action each route button means at each stage. */
const CANONICAL_ACTION: Partial<Record<SimulationStatus, Record<SimulationReviewAction, WorkflowAction>>> = {
  'Pending CFO': { Approve: 'Review', Reject: 'Reject' },
  'Pending Komut': { Approve: 'Approve', Reject: 'Reject' },
  [SIMULATION_DELETION_STATUS]: { Approve: 'Approve Deletion', Reject: 'Reject Deletion' },
};

function noteMissing(note: string | undefined): boolean {
  return !note || !note.trim();
}

function failure(code: SimulationDecisionCode, status: number, message: string): SimulationDecision {
  return { ok: false, code, status, message };
}

/** Pure approval/rejection decision for one simulation stage. */
export function decideSimulationTransition(input: SimulationDecisionInput): SimulationDecision {
  const { status, role, action, note } = input;

  const canonical = CANONICAL_ACTION[status]?.[action];
  if (!canonical) {
    return failure('SIMULATION_NOT_AWAITING_APPROVAL', 400, `Simulation status "${status}" is not awaiting approval`);
  }

  const roles = allowedRolesFor('SCOPING', status, canonical);
  if (!roles.includes(role)) {
    return failure('SIMULATION_ROLE_FORBIDDEN', 403, `Role "${role}" cannot ${action.toLowerCase()} a simulation at "${status}"`);
  }

  if (canonical === 'Approve Deletion') return { ok: true, kind: 'delete' };

  if (requiresNoteFor('SCOPING', status, canonical) && noteMissing(note)) {
    return failure('SIMULATION_NOTE_REQUIRED', 400, 'Note is required for rejection');
  }

  // boundary: the canonical SCOPING table's nextStatus literals are members of
  // the SimulationStatus union — scoping-simulation-status.test.ts locks them.
  const nextStatus = WORKFLOW_TRANSITION_RULES.SCOPING[status]?.nextStatus[canonical] as
    | SimulationStatus
    | undefined;
  if (!nextStatus) {
    return failure(
      'SIMULATION_NOT_AWAITING_APPROVAL', 400,
      `Canonical SCOPING table has no "${canonical}" transition from "${status}"`,
    );
  }

  const historyAction: SimulationHistoryAction =
    action === 'Reject' && status === SIMULATION_DELETION_STATUS ? 'Reject Deletion' : action;
  return { ok: true, kind: 'transition', nextStatus, historyAction };
}
