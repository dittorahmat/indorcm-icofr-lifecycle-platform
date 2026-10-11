import { decideTransition, type WorkflowEntityType } from '@shared/workflow-transitions';
import type { UserRole, WorkflowAction, WorkflowHistoryEntry } from '@shared/types';
import { eventForVerdict, type DeficiencyTriggerEvent } from '../deficiency-trigger';
import { AppError } from '../../lib/utils';

/**
 * Deep workflow module (arch-09 T2, SK-5/DKU.MBU/11/2024): validation
 * (canonical STATE_RULES via decideTransition) + persistence (status mapping,
 * history prepend) + side-effects (audit + deficiency fan-out + notify) in one
 * transactional interface. Routes and panels are thin adapters at this seam.
 */
export interface WorkflowTransitionInput {
  entityType: WorkflowEntityType;
  entityId: string;
  organizationId: string;
  userId: string;
  role: UserRole;
  action: WorkflowAction;
  note?: string;
  assigneeId?: string;
  /** RCM_CHANGE approve-change passthrough (defaults: Maintenance / now). */
  category?: string;
  effectiveDate?: string;
}

export interface WorkflowEntitySnapshot {
  status: string;
  history: WorkflowHistoryEntry[];
  controlId: string | null;
  bpmProcessId: string | null;
  period: string | null;
  result: string | null;
  deficiencyId: string | null;
  ownerId: string | null;
  createdBy: string | null;
  name: string | null;
  planStatus: string | null;
  failedControlIds: string[] | null;
}

export type WorkflowExtra = Record<string, string | boolean | Date | null>;

export interface WorkflowTransitionStore {
  load(ref: { entityType: WorkflowEntityType; entityId: string; organizationId: string }): Promise<WorkflowEntitySnapshot | null>;
  save(change: {
    entityType: WorkflowEntityType;
    entityId: string;
    organizationId: string;
    nextStatus: string;
    history: WorkflowHistoryEntry[];
    extra: WorkflowExtra;
  }): Promise<void>;
  markDeficiencyRemediated(deficiencyId: string): Promise<void>;
  approveRcmChange(input: {
    entityId: string;
    organizationId: string;
    userId: string;
    category: string;
    effectiveDate: Date;
  }): Promise<void>;
}

export interface WorkflowAuditEntry {
  organizationId: string;
  userId: string;
  action: string;
  entityType: string;
  entityId: string;
  description: string;
  dataAfter: unknown;
  isRegulatory: boolean;
}

export interface WorkflowNotification {
  organizationId: string;
  userId: string;
  message: string;
  type: 'info' | 'success' | 'error';
  link: string;
}

export interface WorkflowTransitionEffects {
  audit(entry: WorkflowAuditEntry): Promise<void>;
  raiseDeficiency(event: DeficiencyTriggerEvent): Promise<{ id: string; created: boolean }>;
  notify(message: WorkflowNotification): Promise<string>;
}

export interface WorkflowTransitionDeps {
  store: WorkflowTransitionStore;
  effects: WorkflowTransitionEffects;
  now?: () => number;
  newId?: () => string;
}

export interface WorkflowTransitionResult {
  success: true;
  fromStatus: string;
  nextStatus: string;
  historyEntry: WorkflowHistoryEntry & { assigneeId?: string };
  deficiencyId: string | null;
}

function extraFor(entityType: WorkflowEntityType, snapshot: WorkflowEntitySnapshot, nextStatus: string, userId: string, at: Date): WorkflowExtra {
  switch (entityType) {
    case 'CSA':
      return {
        workflowStatus: nextStatus,
        isDraft: nextStatus === 'Draft',
        line2Status: nextStatus === 'Validated' ? 'Validated' : nextStatus === 'Draft' ? 'Pending' : 'In Review',
        line2ValidatedBy: nextStatus === 'Validated' ? userId : null,
        line2ValidatedDate: nextStatus === 'Validated' ? at : null,
      };
    case 'RCM_CHANGE':
      return {
        workflowStatus: nextStatus,
        status: nextStatus === 'Approved' ? 'Active' : nextStatus === 'In Review' ? 'Pending Change Approval' : 'Draft',
      };
    case 'ACTION_PLAN':
      return {
        workflowStatus: nextStatus,
        status: nextStatus === 'Resolved' ? 'Resolved' : (snapshot.planStatus ?? 'Draft'),
        actualCompletionDate: nextStatus === 'Resolved' ? at : null,
      };
    case 'SCOPING':
      return { workflowStatus: nextStatus, status: nextStatus, updatedAt: at };
    case 'BPM':
      return { workflowStatus: nextStatus };
  }
}

function notifyFor(
  input: WorkflowTransitionInput,
  snapshot: WorkflowEntitySnapshot,
  fromStatus: string,
  nextStatus: string,
): WorkflowNotification | null {
  const suffix = input.note ? ` Catatan: ${input.note}` : '';
  if (input.entityType === 'BPM' && nextStatus !== fromStatus) {
    return {
      organizationId: input.organizationId,
      userId: input.assigneeId ?? snapshot.createdBy ?? input.userId,
      message: `Status BPM "${snapshot.name ?? input.entityId}" berubah menjadi ${nextStatus}.${suffix}`,
      type: input.action === 'Reject' ? 'error' : input.action === 'Approve' ? 'success' : 'info',
      link: `/bpm?id=${input.entityId}`,
    };
  }
  if (input.entityType === 'ACTION_PLAN' && nextStatus !== fromStatus) {
    return {
      organizationId: input.organizationId,
      userId: input.assigneeId ?? snapshot.ownerId ?? input.userId,
      message: `Status Rencana Aksi berubah menjadi ${nextStatus}.${suffix}`,
      type: input.action === 'Reject' ? 'error' : input.action === 'Approve' ? 'success' : 'info',
      link: '/deficiencies',
    };
  }
  if (input.entityType === 'SCOPING' && (nextStatus === 'Approved' || input.action === 'Reject')) {
    const rejected = input.action === 'Reject';
    return {
      organizationId: input.organizationId,
      userId: snapshot.createdBy ?? input.userId,
      message: rejected
        ? `Scoping simulation "${snapshot.name ?? input.entityId}" was rejected: ${input.note ?? ''}`
        : `Your scoping simulation "${snapshot.name ?? input.entityId}" has been fully approved.`,
      type: rejected ? 'error' : 'success',
      link: `/scoping?id=${input.entityId}`,
    };
  }
  return null;
}

export async function executeWorkflowTransition(
  input: WorkflowTransitionInput,
  deps: WorkflowTransitionDeps,
): Promise<WorkflowTransitionResult> {
  const { entityType, entityId, organizationId, userId, role, action } = input;
  const now = deps.now ?? Date.now;
  const newId = deps.newId ?? (() => crypto.randomUUID());

  const snapshot = await deps.store.load({ entityType, entityId, organizationId });
  if (!snapshot) {
    throw new AppError('ENTITY_NOT_FOUND', `Workflow entity "${entityId}" not found`, 404);
  }

  const decision = decideTransition({ entityType, currentStatus: snapshot.status, action, role, note: input.note });
  if (decision.ok === false) {
    throw new AppError(decision.code, decision.message, decision.status);
  }
  const fromStatus = snapshot.status;
  const priorHistory = [...snapshot.history];
  const nextStatus = decision.nextStatus;

  const historyEntry: WorkflowTransitionResult['historyEntry'] = {
    id: newId(),
    action,
    fromStatus,
    toStatus: nextStatus,
    userId,
    role,
    timestamp: now(),
    note: input.note ?? '',
    ...(input.assigneeId ? { assigneeId: input.assigneeId } : {}),
  };
  const history = [historyEntry, ...priorHistory];
  const at = new Date(now());

  await deps.store.save({
    entityType, entityId, organizationId, nextStatus, history,
    extra: extraFor(entityType, snapshot, nextStatus, userId, at),
  });

  await deps.effects.audit({
    organizationId,
    userId,
    action: 'WORKFLOW_TRANSITION',
    entityType,
    entityId,
    description: `Workflow transition from "${fromStatus}" to "${nextStatus}" via "${action}"`,
    dataAfter: { fromStatus, toStatus: nextStatus, action, note: input.note, assigneeId: input.assigneeId },
    isRegulatory: true,
  });

  let deficiencyId: string | null = null;
  if (entityType === 'CSA' && nextStatus === 'Validated') {
    const csaEvent = eventForVerdict('Lini 2 - CSA Validation', {
      verdict: snapshot.result,
      organizationId,
      controlId: snapshot.controlId,
      bpmProcessId: snapshot.bpmProcessId,
      period: snapshot.period ?? undefined,
      userId,
      ...(snapshot.failedControlIds ? { failedControlIds: snapshot.failedControlIds } : {}),
    });
    if (csaEvent) {
      const raised = await deps.effects.raiseDeficiency(csaEvent);
      deficiencyId = raised.id;
    }
    await deps.effects.audit({
      organizationId,
      userId,
      action: 'SIGN_OFF_CSA',
      entityType: 'Control',
      entityId: snapshot.controlId ?? entityId,
      description: `Validated CSA for ${snapshot.period ?? ''} with result: ${snapshot.result ?? ''}`,
      dataAfter: { csaId: entityId, nextStatus },
      isRegulatory: true,
    });
  }

  if (entityType === 'ACTION_PLAN' && nextStatus === 'Resolved' && snapshot.deficiencyId) {
    await deps.store.markDeficiencyRemediated(snapshot.deficiencyId);
  }

  if (entityType === 'RCM_CHANGE' && nextStatus === 'Approved') {
    await deps.store.approveRcmChange({
      entityId,
      organizationId,
      userId,
      category: input.category ?? 'Maintenance',
      effectiveDate: input.effectiveDate ? new Date(input.effectiveDate) : at,
    });
  }

  const notification = notifyFor(input, snapshot, fromStatus, nextStatus);
  if (notification) await deps.effects.notify(notification);

  return { success: true, fromStatus, nextStatus, historyEntry, deficiencyId };
}
