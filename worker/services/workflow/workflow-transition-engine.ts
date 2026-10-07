import { WorkflowAction, UserRole } from '@shared/types';
import { AppError } from '../../lib/utils';

export type WorkflowEntityType = 'BPM' | 'ACTION_PLAN' | 'SCOPING' | 'RCM_CHANGE' | 'CSA';

export interface TransitionRequest {
  entityType: WorkflowEntityType;
  entityId: string;
  currentStatus: string;
  action: WorkflowAction;
  note?: string;
  assigneeId?: string;
}

export interface TransitionContext {
  organizationId: string;
  userId: string;
  role: UserRole;
}

export interface TransitionResult {
  success: boolean;
  fromStatus: string;
  nextStatus: string;
  historyEntry: {
    id: string;
    action: WorkflowAction;
    fromStatus: string;
    toStatus: string;
    userId: string;
    role: string;
    timestamp: number;
    note: string;
    assigneeId?: string;
  };
}

interface StepRule {
  allowedActions: WorkflowAction[];
  nextStatus: Record<WorkflowAction, string>;
  requiredRole?: Record<WorkflowAction, UserRole[]>;
  requiresNote?: WorkflowAction[];
}

const STATE_RULES: Record<WorkflowEntityType, Record<string, StepRule>> = {
  BPM: {
    'Draft': {
      allowedActions: ['Submit'],
      nextStatus: { Submit: 'In Review' },
      requiredRole: { Submit: ['Line 1', 'Line 2', 'Admin'] },
    },
    'Rejected': {
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
    'Resolved': {
      allowedActions: ['Rollback'],
      nextStatus: { Rollback: 'In Review' },
      requiredRole: { Rollback: ['Line 2', 'Admin'] },
      requiresNote: ['Rollback'],
    },
  },
  ACTION_PLAN: {
    'Ineffective': {
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
    'Resolved': {
      allowedActions: ['Rollback'],
      nextStatus: { Rollback: 'Ineffective' },
      requiredRole: { Rollback: ['Line 2', 'Admin'] },
      requiresNote: ['Rollback'],
    },
  },
  SCOPING: {
    'Draft': {
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
    'Approved': {
      allowedActions: ['Rollback'],
      nextStatus: { Rollback: 'Draft' },
      requiredRole: { Rollback: ['Line 2', 'Admin'] },
      requiresNote: ['Rollback'],
    },
  },
  RCM_CHANGE: {
    'Draft': {
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
    'Approved': {
      allowedActions: ['Rollback'],
      nextStatus: { Rollback: 'In Review' },
      requiredRole: { Rollback: ['Line 2', 'Admin'] },
      requiresNote: ['Rollback'],
    },
  },
  CSA: {
    'Draft': {
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
    'Validated': {
      allowedActions: ['Rollback'],
      nextStatus: { Rollback: 'In Review' },
      requiredRole: { Rollback: ['Line 2', 'Admin'] },
      requiresNote: ['Rollback'],
    },
  },
};

export class WorkflowTransitionEngine {
  constructor(
    private db?: any,
    private auditService?: { logAction: (params: any) => Promise<any> }
  ) {}

  async executeTransition(
    request: TransitionRequest,
    context: TransitionContext
  ): Promise<TransitionResult> {
    const { entityType, entityId, currentStatus, action, note, assigneeId } = request;
    const { organizationId, userId, role } = context;

    const entityRules = STATE_RULES[entityType];
    if (!entityRules) {
      throw new AppError('UNSUPPORTED_ENTITY', `Unsupported entity type "${entityType}"`, 400);
    }

    const stepRule = entityRules[currentStatus];
    if (!stepRule || !stepRule.allowedActions.includes(action)) {
      throw new AppError(
        'INVALID_ACTION',
        `Invalid action "${action}" for status "${currentStatus}" on entity "${entityType}"`,
        400
      );
    }

    // Role check
    const allowedRoles = stepRule.requiredRole?.[action];
    if (allowedRoles && !allowedRoles.includes(role)) {
      throw new AppError(
        'FORBIDDEN_TRANSITION',
        `Unauthorized role "${role}" for action "${action}" on ${entityType}`,
        403
      );
    }

    // Note requirement check
    if (stepRule.requiresNote?.includes(action) && (!note || !note.trim())) {
      throw new AppError('NOTE_REQUIRED', `Note is required when performing action "${action}"`, 400);
    }

    const nextStatus = stepRule.nextStatus[action];
    const historyEntry = {
      id: crypto.randomUUID(),
      action,
      fromStatus: currentStatus,
      toStatus: nextStatus,
      userId,
      role,
      timestamp: Date.now(),
      note: note || '',
      assigneeId,
    };

    if (this.auditService) {
      await this.auditService.logAction({
        organizationId,
        userId,
        action: 'WORKFLOW_TRANSITION',
        entityType,
        entityId,
        description: `Workflow transition from "${currentStatus}" to "${nextStatus}" via "${action}"`,
        dataAfter: { fromStatus: currentStatus, toStatus: nextStatus, action, note, assigneeId },
        isRegulatory: true,
        effectiveDate: new Date(),
        approvedBy: userId,
      });
    }

    return {
      success: true,
      fromStatus: currentStatus,
      nextStatus,
      historyEntry,
    };
  }
}
