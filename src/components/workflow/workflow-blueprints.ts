import { 
  WorkflowAction, 
} from '@shared/types';
import { 
  CheckCircle2, XCircle, Send, Search, RotateCcw,
  LucideIcon
} from 'lucide-react';

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

export type WorkflowEntityType = 'BPM' | 'ACTION_PLAN' | 'SCOPING' | 'RCM_CHANGE' | 'CSA';

export const WORKFLOW_BLUEPRINTS: Record<WorkflowEntityType, WorkflowBlueprint> = {
  BPM: {
    steps: {
      'Draft': { actions: [{ id: 'Submit', labelKey: 'workflow:submitForReview', icon: Send, needsAssignee: true }] },
      'Rejected': { actions: [{ id: 'Submit', labelKey: 'workflow:submitForReview', icon: Send, needsAssignee: true }] },
      'In Review': { 
        actions: [
          { id: 'Reject', labelKey: 'common:status.rejected', icon: XCircle, variant: 'outline', needsNote: true },
          { id: 'Review', labelKey: 'workflow:passReview', icon: Search, variant: 'indigo', needsAssignee: true }
        ] 
      },
      'In Approval': { 
        actions: [
          { id: 'Reject', labelKey: 'common:status.rejected', icon: XCircle, variant: 'outline', needsNote: true },
          { id: 'Approve', labelKey: 'workflow:approveAndSave', icon: CheckCircle2, variant: 'emerald' }
        ] 
      },
      'Resolved': { actions: [{ id: 'Rollback', labelKey: 'workflow:rollback', icon: RotateCcw, variant: 'outline', needsNote: true }] },
    }
  },
  ACTION_PLAN: {
    steps: {
      'Ineffective': { actions: [{ id: 'Submit', labelKey: 'workflow:submitPlan', icon: Send, needsAssignee: true }] },
      'In Review': { 
        actions: [
          { id: 'Reject', labelKey: 'workflow:rejectPlan', icon: XCircle, variant: 'outline', needsNote: true },
          { id: 'Review', labelKey: 'workflow:approvePlan', icon: CheckCircle2, variant: 'indigo', needsAssignee: true }
        ] 
      },
      'In Approval': { 
        actions: [
          { id: 'Reject', labelKey: 'workflow:rejectFinal', icon: XCircle, variant: 'outline', needsNote: true },
          { id: 'Approve', labelKey: 'workflow:finalApprove', icon: CheckCircle2, variant: 'emerald' }
        ] 
      },
      'Resolved': { actions: [{ id: 'Rollback', labelKey: 'workflow:rollbackIneffective', icon: RotateCcw, variant: 'outline', needsNote: true }] },
    }
  },
  SCOPING: {
    steps: {
      'Draft': { actions: [{ id: 'Submit', labelKey: 'workflow:submitForReview', icon: Send, needsAssignee: true }] },
      'Pending CFO': { 
        actions: [
          { id: 'Reject', labelKey: 'common:status.rejected', icon: XCircle, variant: 'outline', needsNote: true },
          { id: 'Review', labelKey: 'workflow:passReview', icon: Search, variant: 'indigo', needsAssignee: true }
        ] 
      },
      'Pending Komut': { 
        actions: [
          { id: 'Reject', labelKey: 'common:status.rejected', icon: XCircle, variant: 'outline', needsNote: true },
          { id: 'Approve', labelKey: 'workflow:finalApprove', icon: CheckCircle2, variant: 'emerald' }
        ] 
      },
      'Approved': { actions: [{ id: 'Rollback', labelKey: 'workflow:rollback', icon: RotateCcw, variant: 'outline', needsNote: true }] },
    }
  },
  RCM_CHANGE: {
    steps: {
      'Draft': { actions: [{ id: 'Submit', labelKey: 'workflow:submitForReview', icon: Send, needsAssignee: true }] },
      'In Review': { 
        actions: [
          { id: 'Reject', labelKey: 'common:status.rejected', icon: XCircle, variant: 'outline', needsNote: true },
          { id: 'Approve', labelKey: 'workflow:approveAndSave', icon: CheckCircle2, variant: 'emerald' }
        ] 
      },
      'Approved': { actions: [{ id: 'Rollback', labelKey: 'workflow:rollback', icon: RotateCcw, variant: 'outline', needsNote: true }] },
    }
  },
  CSA: {
    steps: {
      'Draft': { actions: [{ id: 'Submit', labelKey: 'workflow:submitForReview', icon: Send, needsAssignee: true }] },
      'In Review': { 
        actions: [
          { id: 'Reject', labelKey: 'common:status.rejected', icon: XCircle, variant: 'outline', needsNote: true },
          { id: 'Approve', labelKey: 'workflow:validateAndSignOff', icon: CheckCircle2, variant: 'emerald' }
        ] 
      },
      'Validated': { actions: [{ id: 'Rollback', labelKey: 'workflow:rollbackValidation', icon: RotateCcw, variant: 'outline', needsNote: true }] },
    }
  }
};

export function getWorkflowStep(entityType: WorkflowEntityType, currentStatus: string) {
  const blueprint = WORKFLOW_BLUEPRINTS[entityType];
  return blueprint?.steps[currentStatus] || { actions: [] };
}

export function getStatusBadgeClass(status: string): string {
  switch (status) {
    case 'Draft':
    case 'Ineffective': 
      return 'bg-slate-100 text-slate-700 border-slate-200';
    case 'Pending Review':
    case 'In Review':
    case 'Pending CFO': 
      return 'bg-blue-50 text-blue-700 border-blue-200';
    case 'Pending Approval':
    case 'In Approval':
    case 'Pending Komut': 
      return 'bg-amber-50 text-amber-700 border-amber-200';
    case 'Approved':
    case 'Resolved':
    case 'Validated': 
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    case 'Rejected': 
      return 'bg-rose-50 text-rose-700 border-rose-200';
    default: 
      return 'bg-slate-50 text-slate-600';
  }
}

export function isWorkflowLocked(status: string): boolean {
  return status !== 'Draft' && status !== 'Rejected' && status !== 'Ineffective';
}
