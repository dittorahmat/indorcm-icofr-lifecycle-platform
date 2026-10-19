import type { UserRole, WorkflowAction } from './types';

/**
 * Single source of truth for ICOFR workflow transitions (arch-09 T2, SK-5/DKU.MBU/11/2024).
 * Server validation, persistence mapping and client blueprints all derive from
 * this table — no parallel taxonomies. Pure data + pure decision, no I/O, no throws:
 * callers map a failed decision onto AppError (server) or toast/i18n (client).
 */
export type WorkflowEntityType = 'BPM' | 'ACTION_PLAN' | 'SCOPING' | 'RCM_CHANGE' | 'CSA';

export interface StepRule {
  allowedActions: WorkflowAction[];
  nextStatus: Partial<Record<WorkflowAction, string>>;
  requiredRole?: Partial<Record<WorkflowAction, UserRole[]>>;
  requiresNote?: WorkflowAction[];
}

export const WORKFLOW_TRANSITION_RULES: Record<WorkflowEntityType, Record<string, StepRule>> = {
  BPM: {
    Draft: {
      allowedActions: ['Submit'],
      nextStatus: { Submit: 'In Review' },
      requiredRole: { Submit: ['Line 1', 'Line 2', 'Admin'] },
    },
    Rejected: {
      allowedActions: ['Submit'],
      nextStatus: { Submit: 'In Review' },
      requiredRole: { Submit: ['Line 1', 'Line 2', 'Admin'] },
    },
    'In Review': {
      allowedActions: ['Reject', 'Review'],
      nextStatus: { Reject: 'Rejected', Review: 'In Approval' },
      requiredRole: { Reject: ['Line 2', 'Admin'], Review: ['Line 2', 'Admin'] },
      requiresNote: ['Reject'],
    },
    'In Approval': {
      allowedActions: ['Reject', 'Approve'],
      nextStatus: { Reject: 'Rejected', Approve: 'Resolved' },
      requiredRole: { Reject: ['Line 2', 'Admin'], Approve: ['Line 2', 'Admin'] },
      requiresNote: ['Reject'],
    },
    Resolved: {
      allowedActions: ['Rollback'],
      nextStatus: { Rollback: 'In Review' },
      requiredRole: { Rollback: ['Line 2', 'Admin'] },
      requiresNote: ['Rollback'],
    },
  },
  ACTION_PLAN: {
    Ineffective: {
      allowedActions: ['Submit'],
      nextStatus: { Submit: 'In Review' },
      requiredRole: { Submit: ['Line 1', 'Line 2', 'Admin'] },
    },
    'In Review': {
      allowedActions: ['Reject', 'Review'],
      nextStatus: { Reject: 'Ineffective', Review: 'In Approval' },
      requiredRole: { Reject: ['Line 2', 'Admin'], Review: ['Line 2', 'Admin'] },
      requiresNote: ['Reject'],
    },
    'In Approval': {
      allowedActions: ['Reject', 'Approve'],
      nextStatus: { Reject: 'Ineffective', Approve: 'Resolved' },
      requiredRole: { Reject: ['Line 2', 'Admin'], Approve: ['Line 2', 'Admin'] },
      requiresNote: ['Reject'],
    },
    Resolved: {
      allowedActions: ['Rollback'],
      nextStatus: { Rollback: 'Ineffective' },
      requiredRole: { Rollback: ['Line 2', 'Admin'] },
      requiresNote: ['Rollback'],
    },
  },
  SCOPING: {
    Draft: {
      allowedActions: ['Submit'],
      nextStatus: { Submit: 'Pending CFO' },
      requiredRole: { Submit: ['Line 1', 'Line 2', 'Admin'] },
    },
    // A rejection returns the simulation to the preparer; it stays resubmittable
    // (and editable, because the lock derives from Submit).
    Rejected: {
      allowedActions: ['Submit'],
      nextStatus: { Submit: 'Pending CFO' },
      requiredRole: { Submit: ['Line 1', 'Line 2', 'Admin'] },
    },
    'Pending CFO': {
      allowedActions: ['Reject', 'Review'],
      nextStatus: { Reject: 'Rejected', Review: 'Pending Komut' },
      requiredRole: { Reject: ['CFO', 'Admin'], Review: ['CFO', 'Admin'] },
      requiresNote: ['Reject'],
    },
    'Pending Komut': {
      allowedActions: ['Reject', 'Approve'],
      nextStatus: { Reject: 'Rejected', Approve: 'Approved' },
      requiredRole: { Reject: ['Commissioner', 'Admin'], Approve: ['Commissioner', 'Admin'] },
      requiresNote: ['Reject'],
    },
    Approved: {
      allowedActions: ['Request Deletion'],
      nextStatus: { 'Request Deletion': 'Pending Deletion Approval' },
      requiredRole: { 'Request Deletion': ['Line 2', 'Admin'] },
    },
    // Approving a deletion removes the row instead of moving it, so the action
    // has no nextStatus. Its authority is still declared here: one table owns
    // who may act at every step of the lifecycle.
    'Pending Deletion Approval': {
      allowedActions: ['Reject Deletion'],
      nextStatus: { 'Reject Deletion': 'Approved' },
      requiredRole: {
        'Reject Deletion': ['CFO', 'Commissioner', 'Admin'],
        'Approve Deletion': ['CFO', 'Commissioner', 'Admin'],
      },
      requiresNote: ['Reject Deletion'],
    },
  },
  RCM_CHANGE: {
    Draft: {
      allowedActions: ['Submit'],
      nextStatus: { Submit: 'In Review' },
      requiredRole: { Submit: ['Line 1', 'Line 2', 'Admin'] },
    },
    'In Review': {
      allowedActions: ['Reject', 'Approve'],
      nextStatus: { Reject: 'Draft', Approve: 'Approved' },
      requiredRole: { Reject: ['Line 2', 'Admin'], Approve: ['Line 2', 'Admin'] },
      requiresNote: ['Reject'],
    },
    Approved: {
      allowedActions: ['Rollback'],
      nextStatus: { Rollback: 'In Review' },
      requiredRole: { Rollback: ['Line 2', 'Admin'] },
      requiresNote: ['Rollback'],
    },
  },
  CSA: {
    Draft: {
      allowedActions: ['Submit'],
      nextStatus: { Submit: 'In Review' },
      requiredRole: { Submit: ['Line 1', 'Line 2', 'Admin'] },
    },
    'In Review': {
      allowedActions: ['Reject', 'Approve'],
      nextStatus: { Reject: 'Draft', Approve: 'Validated' },
      requiredRole: { Reject: ['Line 2', 'Admin'], Approve: ['Line 2', 'Admin'] },
      requiresNote: ['Reject'],
    },
    Validated: {
      allowedActions: ['Rollback'],
      nextStatus: { Rollback: 'In Review' },
      requiredRole: { Rollback: ['Line 2', 'Admin'] },
      requiresNote: ['Rollback'],
    },
  },
};

export type TransitionDecision =
  | { ok: true; nextStatus: string }
  | { ok: false; code: 'UNSUPPORTED_ENTITY' | 'INVALID_ACTION' | 'FORBIDDEN_TRANSITION' | 'NOTE_REQUIRED'; message: string; status: number };

export interface DecideTransitionInput {
  entityType: WorkflowEntityType;
  currentStatus: string;
  action: WorkflowAction;
  role: UserRole;
  note?: string;
}

/** Pure validation + next-status decision. No I/O, no throws. */
export function decideTransition(input: DecideTransitionInput): TransitionDecision {
  const { entityType, currentStatus, action, role, note } = input;
  const entityRules = WORKFLOW_TRANSITION_RULES[entityType];
  if (!entityRules) {
    return {
      ok: false, code: 'UNSUPPORTED_ENTITY', status: 400,
      message: `Unsupported entity type "${entityType}"`,
    };
  }
  const stepRule = entityRules[currentStatus];
  const nextStatus = stepRule?.nextStatus[action];
  if (!stepRule || !stepRule.allowedActions.includes(action) || !nextStatus) {
    return {
      ok: false, code: 'INVALID_ACTION', status: 400,
      message: `Invalid action "${action}" for status "${currentStatus}" on entity "${entityType}"`,
    };
  }
  const allowedRoles = stepRule.requiredRole?.[action];
  if (allowedRoles && !allowedRoles.includes(role)) {
    return {
      ok: false, code: 'FORBIDDEN_TRANSITION', status: 403,
      message: `Unauthorized role "${role}" for action "${action}" on ${entityType}`,
    };
  }
  if (stepRule.requiresNote?.includes(action) && (!note || !note.trim())) {
    return {
      ok: false, code: 'NOTE_REQUIRED', status: 400,
      message: `Note is required when performing action "${action}"`,
    };
  }
  return { ok: true, nextStatus };
}

/** Client blueprint source: allowed actions for one step. Unknown step → no actions. */
export function allowedActionsFor(entityType: WorkflowEntityType, currentStatus: string): WorkflowAction[] {
  return WORKFLOW_TRANSITION_RULES[entityType]?.[currentStatus]?.allowedActions ?? [];
}

/** Client dialog source: whether this action requires a note at this step. */
export function requiresNoteFor(entityType: WorkflowEntityType, currentStatus: string, action: WorkflowAction): boolean {
  return WORKFLOW_TRANSITION_RULES[entityType]?.[currentStatus]?.requiresNote?.includes(action) ?? false;
}

/** Roles declared for one action — including actions with no status transition
 *  (row deletion), so callers never keep a parallel authority list. */
export function allowedRolesFor(entityType: WorkflowEntityType, currentStatus: string, action: WorkflowAction): UserRole[] {
  return WORKFLOW_TRANSITION_RULES[entityType]?.[currentStatus]?.requiredRole?.[action] ?? [];
}

/** Every role that may act at one step, across all declared actions. */
export function allowedRolesAt(entityType: WorkflowEntityType, currentStatus: string): UserRole[] {
  const required = WORKFLOW_TRANSITION_RULES[entityType]?.[currentStatus]?.requiredRole;
  if (!required) return [];
  const roles = new Set<UserRole>();
  for (const list of Object.values(required)) {
    for (const role of list ?? []) roles.add(role);
  }
  return [...roles];
}

const WORKFLOW_ENDPOINT_PREFIX: Record<WorkflowEntityType, string> = {
  BPM: '/api/bpm-processes',
  ACTION_PLAN: '/api/actionplans',
  SCOPING: '/api/simulations',
  RCM_CHANGE: '/api/rcm',
  CSA: '/api/csa',
};

/** Client + server share one route table so URLs stay byte-identical. */
export function workflowEndpointFor(entityType: WorkflowEntityType, entityId: string): string {
  return `${WORKFLOW_ENDPOINT_PREFIX[entityType]}/${entityId}/workflow`;
}

/** Presentation tone per status. Single map validated against the canonical table. */
export type StatusBadgeTone = 'neutral' | 'info' | 'warning' | 'success' | 'danger';

const STATUS_BADGE_TONES: Record<string, StatusBadgeTone> = {
  Draft: 'neutral',
  Ineffective: 'neutral',
  'In Review': 'info',
  'Pending Review': 'info',
  'Pending CFO': 'info',
  'In Approval': 'warning',
  'Pending Approval': 'warning',
  'Pending Komut': 'warning',
  Resolved: 'success',
  Approved: 'success',
  Validated: 'success',
  Rejected: 'danger',
  'Pending Deletion Approval': 'danger',
};

export function statusBadgeTone(status: string): StatusBadgeTone {
  return STATUS_BADGE_TONES[status] ?? 'neutral';
}

/** Lock derives from the table: editable exactly where Submit is allowed. */
export function isWorkflowLockedFor(entityType: WorkflowEntityType, currentStatus: string): boolean {
  return !allowedActionsFor(entityType, currentStatus).includes('Submit');
}

const WORKFLOW_INVALIDATION_KEYS: Record<WorkflowEntityType, string[][]> = {
  BPM: [['bpm-processes']],
  ACTION_PLAN: [['actionplans'], ['deficiencies']],
  SCOPING: [['simulations']],
  RCM_CHANGE: [['rcm-matrix-tlc'], ['controls'], ['changelogs']],
  CSA: [['csa-records']],
};

/** Client cache keys refreshed after a transition. Single table beside the routes. */
export function workflowInvalidationKeysFor(entityType: WorkflowEntityType): string[][] {
  return WORKFLOW_INVALIDATION_KEYS[entityType] ?? [];
}

/** Single per-entity view: actions, note requirements, lock, badge tone, and
 *  cache keys behind one interface. Client adapters (blueprints, panels,
 *  hooks) read this instead of switching on entity/status themselves. */
export interface EntityWorkflowView {
  actions: WorkflowAction[];
  requiresNote: Partial<Record<WorkflowAction, boolean>>;
  locked: boolean;
  badgeTone: StatusBadgeTone;
  invalidationKeys: string[][];
}

export function forEntity(entityType: WorkflowEntityType, currentStatus: string): EntityWorkflowView {
  const actions = allowedActionsFor(entityType, currentStatus);
  const requiresNote: Partial<Record<WorkflowAction, boolean>> = {};
  for (const action of actions) {
    requiresNote[action] = requiresNoteFor(entityType, currentStatus, action);
  }
  return {
    actions,
    requiresNote,
    locked: isWorkflowLockedFor(entityType, currentStatus),
    badgeTone: statusBadgeTone(currentStatus),
    invalidationKeys: workflowInvalidationKeysFor(entityType),
  };
}

/** Every status in the canonical table for one entity. Tone and blueprint
 *  coverage tests iterate this so parallel taxonomies cannot drift. */
export function workflowStatusesFor(entityType: WorkflowEntityType): string[] {
  return Object.keys(WORKFLOW_TRANSITION_RULES[entityType] ?? {});
}

/**
 * Pure CSA snapshot-status derivation behind the canonical seam. The Drizzle
 * adapter owns row access; the fallback policy (legacy line2Status/isDraft
 * columns when workflowStatus is null) lives here so every CSA path shares
 * one tested derivation instead of an inline ternary.
 */
export function csaSnapshotStatus(
  workflowStatus: string | null | undefined,
  line2Status: unknown,
  isDraft: unknown,
): string {
  if (workflowStatus) return workflowStatus;
  if (line2Status === 'Validated') return 'Validated';
  if (isDraft === true) return 'Draft';
  return 'In Review';
}
