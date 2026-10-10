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
    'Pending CFO': {
      allowedActions: ['Reject', 'Review'],
      nextStatus: { Reject: 'Draft', Review: 'Pending Komut' },
      requiredRole: { Reject: ['Line 2', 'Admin'], Review: ['Line 2', 'Admin'] },
      requiresNote: ['Reject'],
    },
    'Pending Komut': {
      allowedActions: ['Reject', 'Approve'],
      nextStatus: { Reject: 'Draft', Approve: 'Approved' },
      requiredRole: { Reject: ['Line 2', 'Admin'], Approve: ['Line 2', 'Admin'] },
      requiresNote: ['Reject'],
    },
    Approved: {
      allowedActions: ['Rollback'],
      nextStatus: { Rollback: 'Draft' },
      requiredRole: { Rollback: ['Line 2', 'Admin'] },
      requiresNote: ['Rollback'],
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
