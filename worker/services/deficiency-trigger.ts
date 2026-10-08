import { AppError } from '../lib/utils';

/** Sources permitted to raise a deficiency through the structured trigger. */
export type DeficiencySource =
  | 'Lini 1 - CSA'
  | 'Lini 2 - CSA Validation'
  | 'Lini 2 - TOD Review'
  | 'Lini 2 - TOE Review'
  | 'Lini 3 - Audit';

/** Typed trigger event. Callers pass data only — description, severity,
 *  dedup key and action-plan bootstrap are owned by this module. */
export interface DeficiencyTriggerEvent {
  organizationId: string;
  controlId: string | null;
  bpmProcessId: string | null;
  period: string;
  source: DeficiencySource;
  userId: string;
  failedControlIds?: string[];
  testType?: 'TOD' | 'TOE';
  detail?: string;
  /** Verbatim description for not-yet-migrated callers (RCM matrix).
   *  @deprecated T4 migrates the last callers, then this field is removed. */
  description?: string;
}

/** Structured dedup key: one open deficiency per key. Replaces LIKE-%period% matching. */
export interface DeficiencyDedupKey {
  organizationId: string;
  controlId: string | null;
  bpmProcessId: string | null;
  period: string;
  source: DeficiencySource;
}

export interface ControlMeta {
  code: string;
  name: string;
}

export interface BpmProcessMeta {
  name: string;
  noGL: string | null;
}

/** Persistence seam. Drizzle adapter lives in deficiency-service.ts;
 *  tests substitute an in-memory fake — no HTTP, no DB. */
export interface DeficiencyTriggerStore {
  findOpenId(key: DeficiencyDedupKey): Promise<string | null>;
  resolveControl(controlId: string): Promise<ControlMeta | null>;
  resolveBpmProcess(bpmProcessId: string): Promise<BpmProcessMeta | null>;
  insertDeficiency(row: {
    organizationId: string;
    controlId: string | null;
    bpmProcessId: string | null;
    period: string;
    source: DeficiencySource;
    severity: string;
    description: string;
    identifiedBy: string;
  }): Promise<string>;
  insertActionPlan(row: {
    organizationId: string;
    deficiencyId: string;
    description: string;
    status: string;
    workflowStatus: string;
    ownerId: string;
    dueDate: Date;
    targetDate: Date;
  }): Promise<void>;
}

export const DEFICIENCY_SEVERITY = 'Control Deficiency';
const FALLBACK_PROCESS_NAME = 'Sub-Proses Bisnis';

export function normalizeId(value: string | null | undefined): string | null {
  if (value === null || value === undefined) return null;
  const trimmed = value.trim();
  return trimmed === '' ? null : trimmed;
}

export function buildDedupKey(event: DeficiencyTriggerEvent): DeficiencyDedupKey {
  return {
    organizationId: event.organizationId,
    controlId: normalizeId(event.controlId),
    bpmProcessId: normalizeId(event.bpmProcessId),
    period: event.period.trim(),
    source: event.source,
  };
}

function bpmDisplayName(bpm: BpmProcessMeta | null): string {
  if (!bpm) return FALLBACK_PROCESS_NAME;
  return bpm.noGL ? `${bpm.name} (${bpm.noGL})` : bpm.name;
}

function baseDescription(event: DeficiencyTriggerEvent, bpm: BpmProcessMeta | null): string {
  if (event.description) return event.description;
  switch (event.source) {
    case 'Lini 2 - TOD Review':
      return `Hasil Verifikasi Desain (TOD) Ineffective.${event.detail ? ` ${event.detail}` : ''}`;
    case 'Lini 3 - Audit':
      return `Hasil Pengujian ${event.testType ?? 'TOE'} Ineffective: ${event.detail ?? 'No comments.'}`;
    default: {
      if (event.controlId) return `Hasil CSA Ineffective untuk periode ${event.period.trim()}.`;
      return `Hasil CSA Ineffective untuk proses ${bpmDisplayName(bpm)} (periode ${event.period.trim()}).`;
    }
  }
}

export function buildDeficiencyDescription(
  event: DeficiencyTriggerEvent,
  control: ControlMeta | null,
  bpm: BpmProcessMeta | null,
): string {
  let description = baseDescription(event, bpm);
  if (event.failedControlIds && event.failedControlIds.length > 0 && !event.description) {
    description += ` Kontrol gagal: ${event.failedControlIds.join(', ')}.`;
  }
  if (control && !description.startsWith('[')) {
    description = `[${control.code} - ${control.name}] ${description}`;
  }
  return description;
}

export function buildActionPlanDescription(source: DeficiencySource, period: string): string {
  return `Rencana tindak lanjut atas temuan ${source} (${period.trim()})`;
}

export function yearEndDueDate(now: Date = new Date()): Date {
  return new Date(now.getFullYear(), 11, 31, 23, 59, 59);
}

function requireField(value: string | null | undefined, field: string): void {
  if (value === null || value === undefined || value.trim() === '') {
    throw new AppError('DEFICIENCY_TRIGGER_INVALID_EVENT', `Deficiency trigger requires ${field}`, 400);
  }
}

/**
 * Structured find-or-create. Returns the existing open deficiency id when the
 * key already exists (idempotent period reruns), otherwise creates the
 * deficiency plus its bootstrapped action plan and returns the new id.
 */
export async function triggerDeficiency(
  event: DeficiencyTriggerEvent,
  store: DeficiencyTriggerStore,
): Promise<{ id: string; created: boolean }> {
  requireField(event.organizationId, 'organizationId');
  requireField(event.period, 'period');
  requireField(event.source, 'source');
  requireField(event.userId, 'userId');

  const key = buildDedupKey(event);
  const existingId = await store.findOpenId(key);
  if (existingId) return { id: existingId, created: false };

  const control = key.controlId ? await store.resolveControl(key.controlId) : null;
  const bpm = !key.controlId && key.bpmProcessId ? await store.resolveBpmProcess(key.bpmProcessId) : null;
  const description = buildDeficiencyDescription(event, control, bpm);

  const id = await store.insertDeficiency({
    organizationId: key.organizationId,
    controlId: key.controlId,
    bpmProcessId: key.bpmProcessId,
    period: key.period,
    source: key.source,
    severity: DEFICIENCY_SEVERITY,
    description,
    identifiedBy: event.userId,
  });

  const dueDate = yearEndDueDate();
  await store.insertActionPlan({
    organizationId: key.organizationId,
    deficiencyId: id,
    description: buildActionPlanDescription(key.source, key.period),
    status: 'Draft',
    workflowStatus: 'Ineffective',
    ownerId: event.userId,
    dueDate,
    targetDate: dueDate,
  });

  return { id, created: true };
}
