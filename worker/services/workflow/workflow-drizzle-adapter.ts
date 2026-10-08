import { and, eq } from 'drizzle-orm';
import type { DrizzleDb } from '../../db';
import {
  actionPlans, bpmProcesses, csaRecords, csaSamples, deficiencies, rcms, simulations,
} from '../../db/schema';
import type { WorkflowEntityType } from '@shared/workflow-transitions';
import { AuditService } from '../audit-service';
import { DeficiencyService } from '../deficiency-service';
import { RcmService } from '../rcm-service';
import { createNotificationAndSendEmail } from '../email';
import {
  executeWorkflowTransition,
  type WorkflowTransitionDeps,
  type WorkflowTransitionInput,
  type WorkflowTransitionStore,
  type WorkflowEntitySnapshot,
} from './workflow-execution';

type CsaRow = typeof csaRecords.$inferSelect;

function historyOf(row: { workflowHistory: unknown }): WorkflowEntitySnapshot['history'] {
  return Array.isArray(row.workflowHistory) ? row.workflowHistory : [];
}

function textOf(value: string | null | undefined): string | null {
  return value ?? null;
}

/** Legacy aggregate-CSA scan: failed control ids from sample results. Narrowed from unknown, no any. */
export function collectFailedControlIds(samples: { controlResults: unknown }[]): string[] {
  const failed = new Set<string>();
  for (const sample of samples) {
    const results = sample.controlResults;
    if (!results || typeof results !== 'object') continue;
    for (const [controlId, value] of Object.entries(results) as [string, unknown][]) {
      if (value && typeof value === 'object' && (value as { implemented?: unknown }).implemented === false) {
        failed.add(controlId);
      }
    }
  }
  return [...failed];
}

class DrizzleWorkflowStore implements WorkflowTransitionStore {
  constructor(private db: DrizzleDb) {}

  async load(ref: { entityType: WorkflowEntityType; entityId: string; organizationId: string }): Promise<WorkflowEntitySnapshot | null> {
    const { entityType, entityId, organizationId } = ref;

    if (entityType === 'CSA') {
      const rows = await this.db
        .select().from(csaRecords)
        .where(and(eq(csaRecords.id, entityId), eq(csaRecords.organizationId, organizationId))).limit(1);
      if (rows.length === 0) return null;
      const row: CsaRow = rows[0];
      let failedControlIds: string[] | null = null;
      if (!row.controlId) {
        const samples = await this.db.select().from(csaSamples).where(eq(csaSamples.csaRecordId, entityId));
        failedControlIds = collectFailedControlIds(samples);
      }
      return {
        status: row.workflowStatus ?? (row.line2Status === 'Validated' ? 'Validated' : row.isDraft ? 'Draft' : 'In Review'),
        history: historyOf(row),
        controlId: textOf(row.controlId),
        bpmProcessId: textOf(row.bpmProcessId),
        period: textOf(row.period),
        result: textOf(row.result),
        deficiencyId: null,
        ownerId: null,
        createdBy: textOf(row.assessedBy),
        name: row.period,
        planStatus: null,
        failedControlIds,
      };
    }
    if (entityType === 'BPM') {
      const rows = await this.db
        .select().from(bpmProcesses)
        .where(and(eq(bpmProcesses.id, entityId), eq(bpmProcesses.organizationId, organizationId))).limit(1);
      if (rows.length === 0) return null;
      const row = rows[0];
      return {
        status: row.workflowStatus ?? 'Draft',
        history: historyOf(row),
        controlId: null, bpmProcessId: null, period: null, result: null, deficiencyId: null, ownerId: null,
        createdBy: textOf(row.createdBy), name: row.name, planStatus: null, failedControlIds: null,
      };
    }
    if (entityType === 'ACTION_PLAN') {
      const rows = await this.db
        .select().from(actionPlans)
        .where(and(eq(actionPlans.id, entityId), eq(actionPlans.organizationId, organizationId))).limit(1);
      if (rows.length === 0) return null;
      const row = rows[0];
      return {
        status: row.workflowStatus ?? 'Ineffective',
        history: historyOf(row),
        controlId: null, bpmProcessId: null, period: null, result: null,
        deficiencyId: textOf(row.deficiencyId),
        ownerId: textOf(row.ownerId),
        createdBy: null, name: row.description, planStatus: textOf(row.status), failedControlIds: null,
      };
    }
    if (entityType === 'SCOPING') {
      const rows = await this.db
        .select().from(simulations)
        .where(and(eq(simulations.id, entityId), eq(simulations.organizationId, organizationId))).limit(1);
      if (rows.length === 0) return null;
      const row = rows[0];
      return {
        status: row.workflowStatus ?? 'Draft',
        history: historyOf(row),
        controlId: null, bpmProcessId: null, period: null, result: null, deficiencyId: null, ownerId: null,
        createdBy: textOf(row.createdBy), name: row.name, planStatus: null, failedControlIds: null,
      };
    }
    const rows = await this.db
      .select().from(rcms)
      .where(and(eq(rcms.id, entityId), eq(rcms.organizationId, organizationId))).limit(1);
    if (rows.length === 0) return null;
    const row = rows[0];
    return {
      status: (row.workflowStatus as string) ?? 'Draft',
      history: historyOf(row),
      controlId: null, bpmProcessId: null, period: null, result: null, deficiencyId: null, ownerId: null,
      createdBy: null, name: row.process, planStatus: null, failedControlIds: null,
    };
  }

  async save(change: Parameters<WorkflowTransitionStore['save']>[0]): Promise<void> {
    const { entityType, entityId, organizationId, nextStatus, history, extra } = change;
    const str = (v: unknown): string | undefined => (typeof v === 'string' ? v : undefined);
    const flag = (v: unknown): boolean | undefined => (typeof v === 'boolean' ? v : undefined);
    const date = (v: unknown): Date | undefined => (v instanceof Date ? v : undefined);

    if (entityType === 'CSA') {
      const patch: {
        workflowStatus: string;
        workflowHistory: typeof history;
        isDraft?: boolean;
        line2Status?: string;
        line2ValidatedBy?: string;
        line2ValidatedDate?: Date;
      } = { workflowStatus: nextStatus, workflowHistory: history };
      const isDraft = flag(extra.isDraft);
      const line2Status = str(extra.line2Status);
      const validatedBy = str(extra.line2ValidatedBy);
      const validatedDate = date(extra.line2ValidatedDate);
      if (isDraft !== undefined) patch.isDraft = isDraft;
      if (line2Status !== undefined) patch.line2Status = line2Status;
      // Null extras mean "leave unchanged" — only set validator stamps on Validated.
      if (validatedBy !== undefined) patch.line2ValidatedBy = validatedBy;
      if (validatedDate !== undefined) patch.line2ValidatedDate = validatedDate;
      await this.db.update(csaRecords).set(patch)
        .where(and(eq(csaRecords.id, entityId), eq(csaRecords.organizationId, organizationId)));
    } else if (entityType === 'BPM') {
      await this.db.update(bpmProcesses).set({ workflowStatus: nextStatus, workflowHistory: history })
        .where(and(eq(bpmProcesses.id, entityId), eq(bpmProcesses.organizationId, organizationId)));
    } else if (entityType === 'ACTION_PLAN') {
      const patch: { workflowStatus: string; workflowHistory: typeof history; status?: string; actualCompletionDate?: Date } =
        { workflowStatus: nextStatus, workflowHistory: history };
      const status = str(extra.status);
      const completedAt = date(extra.actualCompletionDate);
      if (status !== undefined) patch.status = status;
      if (completedAt !== undefined) patch.actualCompletionDate = completedAt;
      await this.db.update(actionPlans).set(patch)
        .where(and(eq(actionPlans.id, entityId), eq(actionPlans.organizationId, organizationId)));
    } else if (entityType === 'SCOPING') {
      const patch: { workflowStatus: string; workflowHistory: typeof history; status?: string; updatedAt?: Date } =
        { workflowStatus: nextStatus, workflowHistory: history };
      const status = str(extra.status);
      const updatedAt = date(extra.updatedAt);
      if (status !== undefined) patch.status = status;
      if (updatedAt !== undefined) patch.updatedAt = updatedAt;
      await this.db.update(simulations).set(patch)
        .where(and(eq(simulations.id, entityId), eq(simulations.organizationId, organizationId)));
    } else {
      const patch: { workflowStatus: string; workflowHistory: typeof history; status?: string } =
        { workflowStatus: nextStatus, workflowHistory: history };
      const status = str(extra.status);
      if (status !== undefined) patch.status = status;
      await this.db.update(rcms).set(patch)
        .where(and(eq(rcms.id, entityId), eq(rcms.organizationId, organizationId)));
    }
  }

  async markDeficiencyRemediated(deficiencyId: string): Promise<void> {
    await this.db.update(deficiencies).set({ status: 'Remediated' }).where(eq(deficiencies.id, deficiencyId));
  }

  async approveRcmChange(input: Parameters<WorkflowTransitionStore['approveRcmChange']>[0]): Promise<void> {
    const service = new RcmService(this.db);
    await service.approveChange(input.organizationId, input.userId, input.entityId, input.category, input.effectiveDate);
  }
}

/** Per-request deps: drizzle store + service-backed effects. Env-guard stays in routes. */
export function createWorkflowDeps(db: DrizzleDb, env: unknown): WorkflowTransitionDeps {
  const store = new DrizzleWorkflowStore(db);
  const audit = new AuditService(db);
  const deficiencies = new DeficiencyService(db);
  return {
    store,
    effects: {
      audit: (entry) => audit.logAction({ ...entry }),
      raiseDeficiency: async (event) => ({ id: await deficiencies.createAutoDeficiency(event), created: true }),
      notify: (message) =>
        createNotificationAndSendEmail({
          db,
          orgId: message.organizationId,
          userId: message.userId,
          message: message.message,
          type: message.type,
          link: message.link,
          env,
        }),
    },
  };
}

/** Thin-adapter entry point for all five workflow routes. URLs stay byte-identical. */
export async function runWorkflowTransition(
  db: DrizzleDb,
  env: unknown,
  input: WorkflowTransitionInput,
): Promise<{ success: true; nextStatus: string; deficiencyId: string | null }> {
  const result = await executeWorkflowTransition(input, createWorkflowDeps(db, env));
  return { success: true, nextStatus: result.nextStatus, deficiencyId: result.deficiencyId };
}
