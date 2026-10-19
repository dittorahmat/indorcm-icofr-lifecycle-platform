import {
  WorkflowAction,
} from '@shared/types';
import {
  forEntity,
  statusBadgeTone,
  WORKFLOW_TRANSITION_RULES,
  type WorkflowEntityType,
} from '@shared/workflow-transitions';
import {
  CheckCircle2, XCircle, Send, Search, RotateCcw, Trash2, Undo2,
  LucideIcon
} from 'lucide-react';

export type { WorkflowEntityType };

export interface ActionConfig {
  id: WorkflowAction;
  labelKey: string;
  variant?: 'default' | 'outline' | 'destructive' | 'indigo' | 'emerald' | 'amber';
  icon: LucideIcon;
  needsAssignee?: boolean;
  needsNote?: boolean;
}

export interface WorkflowBlueprint {
  steps: Record<string, {
    actions: ActionConfig[];
  }>;
}

interface UiHint {
  labelKey: string;
  variant?: ActionConfig['variant'];
  icon: LucideIcon;
  needsAssignee?: boolean;
}

/** Presentation-only hints. Policy (which actions exist, which need notes)
 *  derives from the canonical server table — never duplicated here. */
const UI_HINTS: Record<WorkflowEntityType, Partial<Record<WorkflowAction, UiHint>>> = {
  BPM: {
    Submit: { labelKey: 'workflow:submitForReview', icon: Send, needsAssignee: true },
    Reject: { labelKey: 'common:status.rejected', icon: XCircle, variant: 'outline' },
    Review: { labelKey: 'workflow:passReview', icon: Search, variant: 'indigo', needsAssignee: true },
    Approve: { labelKey: 'workflow:approveAndSave', icon: CheckCircle2, variant: 'emerald' },
    Rollback: { labelKey: 'workflow:rollback', icon: RotateCcw, variant: 'outline' },
  },
  ACTION_PLAN: {
    Submit: { labelKey: 'workflow:submitPlan', icon: Send, needsAssignee: true },
    Reject: { labelKey: 'workflow:rejectPlan', icon: XCircle, variant: 'outline' },
    Review: { labelKey: 'workflow:approvePlan', icon: CheckCircle2, variant: 'indigo', needsAssignee: true },
    Approve: { labelKey: 'workflow:finalApprove', icon: CheckCircle2, variant: 'emerald' },
    Rollback: { labelKey: 'workflow:rollbackIneffective', icon: RotateCcw, variant: 'outline' },
  },
  SCOPING: {
    Submit: { labelKey: 'workflow:submitForReview', icon: Send, needsAssignee: true },
    Reject: { labelKey: 'common:status.rejected', icon: XCircle, variant: 'outline' },
    Review: { labelKey: 'workflow:passReview', icon: Search, variant: 'indigo', needsAssignee: true },
    Approve: { labelKey: 'workflow:finalApprove', icon: CheckCircle2, variant: 'emerald' },
    Rollback: { labelKey: 'workflow:rollback', icon: RotateCcw, variant: 'outline' },
    'Request Deletion': { labelKey: 'workflow:requestDeletion', icon: Trash2, variant: 'outline' },
    'Reject Deletion': { labelKey: 'workflow:rejectDeletion', icon: Undo2, variant: 'outline' },
  },
  RCM_CHANGE: {
    Submit: { labelKey: 'workflow:submitForReview', icon: Send, needsAssignee: true },
    Reject: { labelKey: 'common:status.rejected', icon: XCircle, variant: 'outline' },
    Approve: { labelKey: 'workflow:approveAndSave', icon: CheckCircle2, variant: 'emerald' },
    Rollback: { labelKey: 'workflow:rollback', icon: RotateCcw, variant: 'outline' },
  },
  CSA: {
    Submit: { labelKey: 'workflow:submitForReview', icon: Send, needsAssignee: true },
    Reject: { labelKey: 'common:status.rejected', icon: XCircle, variant: 'outline' },
    Approve: { labelKey: 'workflow:validateAndSignOff', icon: CheckCircle2, variant: 'emerald' },
    Rollback: { labelKey: 'workflow:rollbackValidation', icon: RotateCcw, variant: 'outline' },
  },
};

function buildBlueprint(entityType: WorkflowEntityType): WorkflowBlueprint {
  const steps: WorkflowBlueprint['steps'] = {};
  for (const status of Object.keys(WORKFLOW_TRANSITION_RULES[entityType])) {
    const view = forEntity(entityType, status);
    steps[status] = {
      actions: view.actions.map((action) => {
        const hint = UI_HINTS[entityType][action] ?? { labelKey: `workflow:${action}`, icon: Send };
        return {
          id: action,
          labelKey: hint.labelKey,
          variant: hint.variant,
          icon: hint.icon,
          needsAssignee: hint.needsAssignee,
          needsNote: view.requiresNote[action] ?? false,
        };
      }),
    };
  }
  return { steps };
}

export const WORKFLOW_BLUEPRINTS: Record<WorkflowEntityType, WorkflowBlueprint> = {
  BPM: buildBlueprint('BPM'),
  ACTION_PLAN: buildBlueprint('ACTION_PLAN'),
  SCOPING: buildBlueprint('SCOPING'),
  RCM_CHANGE: buildBlueprint('RCM_CHANGE'),
  CSA: buildBlueprint('CSA'),
};

export function getWorkflowStep(entityType: WorkflowEntityType, currentStatus: string) {
  const blueprint = WORKFLOW_BLUEPRINTS[entityType];
  return blueprint?.steps[currentStatus] || { actions: [] };
}

const BADGE_CLASS_BY_TONE: Record<string, string> = {
  neutral: 'bg-slate-100 text-slate-700 border-slate-200',
  info: 'bg-blue-50 text-blue-700 border-blue-200',
  warning: 'bg-amber-50 text-amber-700 border-amber-200',
  success: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  danger: 'bg-rose-50 text-rose-700 border-rose-200',
};

export function getStatusBadgeClass(status: string): string {
  return BADGE_CLASS_BY_TONE[statusBadgeTone(status)] ?? 'bg-slate-50 text-slate-600';
}

export function isWorkflowLocked(entityType: WorkflowEntityType, status: string): boolean {
  return forEntity(entityType, status).locked;
}
