import type { DrizzleDb } from '../db';
import { deficiencies, actionPlans, controls, bpmProcesses } from '../db/schema';
import { and, eq, isNull } from 'drizzle-orm';
import {
  triggerDeficiency,
  type BpmProcessMeta,
  type ControlMeta,
  type DeficiencyDedupKey,
  type DeficiencySource,
  type DeficiencyTriggerEvent,
  type DeficiencyTriggerStore,
} from './deficiency-trigger';

/** Legacy hand-built input from not-yet-migrated callers (RCM matrix).
 *  Dedup is still structural — only the description stays verbatim.
 *  @deprecated Pass a DeficiencyTriggerEvent instead; T4 removes this shape. */
export interface LegacyAutoDeficiencyInput {
  organizationId: string;
  controlId: string | null;
  description: string;
  source: DeficiencySource;
  userId: string;
  period: string;
}

function isTriggerEvent(input: DeficiencyTriggerEvent | LegacyAutoDeficiencyInput): input is DeficiencyTriggerEvent {
  return 'bpmProcessId' in input || 'failedControlIds' in input || 'testType' in input;
}

/** Maps legacy hand-built input onto the structured event. Pure — unit-tested without a DB. */
export function toTriggerEvent(
  input: DeficiencyTriggerEvent | LegacyAutoDeficiencyInput,
): DeficiencyTriggerEvent {
  if (isTriggerEvent(input)) return input;
  return {
    organizationId: input.organizationId,
    controlId: input.controlId,
    bpmProcessId: null,
    period: input.period,
    source: input.source,
    userId: input.userId,
    description: input.description,
  };
}

/** Drizzle-backed persistence for the deficiency-trigger seam. No LIKE matching. */
class DrizzleDeficiencyStore implements DeficiencyTriggerStore {
  constructor(private db: DrizzleDb) {}

  async findOpenId(key: DeficiencyDedupKey): Promise<string | null> {
    const rows = await this.db
      .select({ id: deficiencies.id })
      .from(deficiencies)
      .where(
        and(
          eq(deficiencies.organizationId, key.organizationId),
          eq(deficiencies.status, 'Open'),
          eq(deficiencies.period, key.period),
          eq(deficiencies.source, key.source),
          key.controlId ? eq(deficiencies.controlId, key.controlId) : isNull(deficiencies.controlId),
          key.bpmProcessId
            ? eq(deficiencies.bpmProcessId, key.bpmProcessId)
            : isNull(deficiencies.bpmProcessId),
        ),
      )
      .limit(1);
    return rows.length > 0 ? rows[0].id : null;
  }

  async resolveControl(controlId: string): Promise<ControlMeta | null> {
    const ctrl = await this.db.query.controls.findFirst({
      where: eq(controls.id, controlId),
      columns: { code: true, name: true },
    });
    return ctrl ? { code: ctrl.code, name: ctrl.name } : null;
  }

  async resolveBpmProcess(bpmProcessId: string): Promise<BpmProcessMeta | null> {
    const bpm = await this.db.query.bpmProcesses.findFirst({
      where: eq(bpmProcesses.id, bpmProcessId),
      columns: { name: true, noGL: true },
    });
    return bpm ? { name: bpm.name, noGL: bpm.noGL } : null;
  }

  async insertDeficiency(row: Parameters<DeficiencyTriggerStore['insertDeficiency']>[0]): Promise<string> {
    const id = crypto.randomUUID();
    await this.db.insert(deficiencies).values({
      id,
      organizationId: row.organizationId,
      controlId: row.controlId,
      bpmProcessId: row.bpmProcessId,
      period: row.period,
      description: row.description,
      severity: row.severity,
      identifiedDate: new Date(),
      identifiedBy: row.identifiedBy,
      status: 'Open',
      source: row.source,
    });
    return id;
  }

  async insertActionPlan(row: Parameters<DeficiencyTriggerStore['insertActionPlan']>[0]): Promise<void> {
    await this.db.insert(actionPlans).values({
      id: crypto.randomUUID(),
      organizationId: row.organizationId,
      deficiencyId: row.deficiencyId,
      description: row.description,
      status: row.status,
      workflowStatus: row.workflowStatus,
      ownerId: row.ownerId,
      dueDate: row.dueDate,
      targetDate: row.targetDate,
    });
  }
}

export class DeficiencyService {
  constructor(private db: DrizzleDb) {}

  async createAutoDeficiency(input: DeficiencyTriggerEvent | LegacyAutoDeficiencyInput): Promise<string> {
    const { id } = await triggerDeficiency(toTriggerEvent(input), new DrizzleDeficiencyStore(this.db));
    return id;
  }
}
