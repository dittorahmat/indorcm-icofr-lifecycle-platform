import { AppError } from '../lib/utils';
import { decideTest, isPilarSatisfied, type TestingDecisionInput } from '@shared/testing-decision';
import { eventForVerdict } from './deficiency-trigger';
import type { DeficiencyTriggerEvent } from './deficiency-trigger';
import {
  CONTROL_FIELDS_MAP, LINI1_FIELDS, LINI2_FIELDS, RISK_FIELDS,
  type BatchUpdateItem, type CreateVerificationBody, type VerificationPatchBody,
} from './rcm-matrix-projection';

/** Consolidated RCM verification-write seam (arch-09 T4, SK-5/DKU.MBU/11/2024).
 *  Allow-list partition, TOD upsert via decideTest, and atomic auto-deficiency
 *  live here. Routes and the service facade are thin adapters at this seam. */
export {
  CONTROL_FIELDS_MAP, LINI1_FIELDS, LINI2_FIELDS,
  applyAssertionFallback, getCosoComponent, matchesNoGL, projectVerificationRow,
} from './rcm-matrix-projection';
export type { BatchUpdateItem, CreateVerificationBody, VerificationPatchBody } from './rcm-matrix-projection';

export const TOD_EVALUATION_PERIOD = 'TOD-Evaluation';

export interface RcmMappingRef {
  id: string;
  organizationId: string;
  rcmId: string;
  controlId: string;
}

export interface TodEvalRow {
  id: string;
  organizationId: string;
  controlId: string;
  pilarObjective: string | null;
  pilarTiming: string | null;
  pilarAuthority: string | null;
  pilarReliability: string | null;
  pilarCoverage: string | null;
  pilarEvidence: string | null;
  kkReference: string | null;
  conclusion: string | null;
  comment: string | null;
}

export interface VerificationPatchInput {
  mappingId: string;
  organizationId: string;
  userId: string;
  body: VerificationPatchBody;
}

export interface BatchUpdateInput {
  items: BatchUpdateItem[];
  organizationId: string;
}

export type CreateVerificationInput = CreateVerificationBody;

/** Persistence seam. Drizzle adapter lives in rcm-matrix-drizzle.ts;
 *  tests substitute an in-memory fake — no HTTP, no DB. */
export interface RcmMatrixWriteStore {
  findMapping(mappingId: string, organizationId: string): Promise<RcmMappingRef | null>;
  updateMapping(mappingId: string, patch: Record<string, unknown>): Promise<void>;
  findTod(controlId: string, organizationId: string): Promise<TodEvalRow | null>;
  insertTod(row: TodEvalRow & { evaluatorId: string }): Promise<void>;
  updateTod(todId: string, patch: Partial<TodEvalRow>): Promise<void>;
  findMappings(mappingIds: string[], organizationId: string): Promise<RcmMappingRef[]>;
  applyMappingUpdates(updates: Array<{ id: string; patch: Record<string, unknown> }>): Promise<void>;
  applyRiskUpdates(updates: Array<{ rcmId: string; patch: Record<string, unknown> }>): Promise<void>;
  insertRcm(row: Record<string, unknown>): Promise<void>;
  insertControl(row: Record<string, unknown>): Promise<void>;
  insertMapping(row: Record<string, unknown>): Promise<void>;
}

export interface RcmMatrixWriteEffects {
  raiseDeficiency(event: DeficiencyTriggerEvent): Promise<string>;
}

export interface RcmMatrixWriteDeps {
  store: RcmMatrixWriteStore;
  effects: RcmMatrixWriteEffects;
  now?: () => Date;
  newId?: () => string;
}

export interface VerificationPatchResult {
  todVerdict: 'Effective' | 'Ineffective' | null;
  deficiencyId: string | null;
}

function pickDefined(body: Record<string, unknown>, fields: readonly string[]): Record<string, unknown> {
  const patch: Record<string, unknown> = {};
  for (const f of fields) {
    const v = body[f];
    if (v !== undefined) patch[f] = v;
  }
  return patch;
}

/** Maps an RCM verification row onto the testing-decision seam. Control is
 *  always null (row may be missing) so Table 22 minimum is skipped while
 *  Zero-Tolerance and the 6-pilar TOD rule are still enforced. Pilar
 *  normalization is the shared seam semantics (no local variant). */
export function toTodDecisionInput(body: VerificationPatchBody): TestingDecisionInput {
  return {
    testType: 'TOD',
    claimedResult: body.conclusion === 'Ineffective' ? 'Ineffective' : 'Effective',
    todPillars: {
      objective: isPilarSatisfied(body.pilarObjective), timing: isPilarSatisfied(body.pilarTiming),
      authority: isPilarSatisfied(body.pilarAuthority), reliability: isPilarSatisfied(body.pilarReliability),
      coverage: isPilarSatisfied(body.pilarCoverage), evidence: isPilarSatisfied(body.pilarEvidence),
    },
  };
}

/** Single TOD upsert + typed-deficiency seam shared by the patch and
 *  create paths. Recomputes the verdict via decideTest, upserts the TOD row
 *  by control, and raises one typed event on Ineffective. No behavior
 *  change — pure extraction of the duplicated block. */
async function persistTodAndRaise(
  deps: RcmMatrixWriteDeps,
  args: {
    organizationId: string;
    userId: string;
    controlId: string;
    body: Record<string, unknown>;
  },
): Promise<VerificationPatchResult> {
  const verdict = decideTest(null, toTodDecisionInput(args.body as VerificationPatchBody)).verdict ?? 'Effective';
  const todPatch: Partial<TodEvalRow> = {
    ...(pickDefined(args.body, LINI2_FIELDS) as Partial<TodEvalRow>),
    conclusion: verdict,
  };
  const existing = await deps.store.findTod(args.controlId, args.organizationId);
  if (existing) {
    await deps.store.updateTod(existing.id, todPatch);
  } else {
    const newId = deps.newId ?? (() => crypto.randomUUID());
    await deps.store.insertTod({
      id: newId(), organizationId: args.organizationId, controlId: args.controlId,
      pilarObjective: null, pilarTiming: null, pilarAuthority: null,
      pilarReliability: null, pilarCoverage: null, pilarEvidence: null,
      kkReference: null, conclusion: null, comment: null,
      ...todPatch, evaluatorId: args.userId,
    });
  }
  if (verdict !== 'Ineffective') return { todVerdict: verdict, deficiencyId: null };
  const comment = args.body['comment'];
  const todEvent = eventForVerdict('Lini 2 - TOD Review', {
    verdict,
    organizationId: args.organizationId,
    controlId: args.controlId,
    period: TOD_EVALUATION_PERIOD,
    userId: args.userId,
    ...(typeof comment === 'string' ? { detail: comment } : {}),
  });
  if (!todEvent) return { todVerdict: verdict, deficiencyId: null };
  const deficiencyId = await deps.effects.raiseDeficiency(todEvent);
  return { todVerdict: verdict, deficiencyId };
}

export async function applyVerificationDesignPatch(
  deps: RcmMatrixWriteDeps,
  input: VerificationPatchInput,
): Promise<VerificationPatchResult> {
  const mapping = await deps.store.findMapping(input.mappingId, input.organizationId);
  if (!mapping) throw new AppError('RCM_MAPPING_NOT_FOUND', `RCM mapping "${input.mappingId}" not found`, 404);
  const body = input.body as Record<string, unknown>;
  const lini1Patch = pickDefined(body, LINI1_FIELDS);
  if (Object.keys(lini1Patch).length > 0) await deps.store.updateMapping(input.mappingId, lini1Patch);
  if (!LINI2_FIELDS.some((f) => body[f] !== undefined)) return { todVerdict: null, deficiencyId: null };
  return persistTodAndRaise(deps, {
    organizationId: input.organizationId,
    userId: input.userId,
    controlId: mapping.controlId,
    body,
  });
}

/** Consolidated batch write: one mapping read, then one mapping pass and one
 *  risk pass. Items without a known mappingId are skipped. */
export async function applyBatchUpdate(
  deps: RcmMatrixWriteDeps,
  input: BatchUpdateInput,
): Promise<{ updated: number }> {
  const ids = [...new Set(input.items.map((i) => i.mappingId).filter((v): v is string => !!v))];
  if (ids.length === 0) return { updated: 0 };
  const byId = new Map((await deps.store.findMappings(ids, input.organizationId)).map((r) => [r.id, r]));
  const mappingUpdates: Array<{ id: string; patch: Record<string, unknown> }> = [];
  const riskUpdates: Array<{ rcmId: string; patch: Record<string, unknown> }> = [];
  for (const item of input.items) {
    if (!item.mappingId) continue;
    const ref = byId.get(item.mappingId);
    if (!ref) continue;
    const riskPatch = pickDefined(item as Record<string, unknown>, RISK_FIELDS);
    if (Object.keys(riskPatch).length > 0) riskUpdates.push({ rcmId: ref.rcmId, patch: riskPatch });
    const patch: Record<string, unknown> = {};
    for (const [feKey, beKey] of Object.entries(CONTROL_FIELDS_MAP)) {
      const v = item[feKey];
      if (v !== undefined) patch[beKey] = v;
    }
    if (Object.keys(patch).length > 0) mappingUpdates.push({ id: item.mappingId, patch });
  }
  await deps.store.applyMappingUpdates(mappingUpdates);
  await deps.store.applyRiskUpdates(riskUpdates);
  return { updated: mappingUpdates.length };
}

export interface CreateVerificationResult extends VerificationPatchResult {
  mappingId: string;
  controlId: string;
  rcmId: string;
}

export async function createVerificationDesign(
  deps: RcmMatrixWriteDeps,
  input: CreateVerificationInput & { organizationId: string; userId: string },
): Promise<CreateVerificationResult> {
  if (input.createNewRcm && (!input.process || !input.subProcess || !input.riskDescription)) {
    throw new AppError('RCM_CREATE_INVALID', 'Process, Sub-Process, and Risk Description are required when creating a new RCM.', 400);
  }
  const newId = deps.newId ?? (() => crypto.randomUUID());
  const finalRcmId = input.createNewRcm ? newId() : (input.rcmId ?? '');
  if (!finalRcmId) throw new AppError('RCM_CREATE_INVALID', 'An existing RCM must be selected or a new one must be created.', 400);
  if (input.createNewRcm) {
    await deps.store.insertRcm({
      id: finalRcmId, organizationId: input.organizationId,
      process: input.process ?? 'New Process', subProcess: input.subProcess ?? 'New Sub-Process',
      riskDescription: input.riskDescription ?? 'New Risk', isFraudRelated: input.isFraudRelated ?? false,
      riskRating: input.riskRating ?? 'Medium', status: 'Active',
    });
  }
  const newControlId = newId();
  await deps.store.insertControl({
    id: newControlId, organizationId: input.organizationId, rcmId: finalRcmId,
    code: input.controlCode ?? `C-${newControlId.substring(0, 8)}`,
    name: input.controlName ?? 'New Control', description: input.controlDescription ?? null,
    level: 'TLC', bpmProcessId: input.bpmProcessId ?? null,
  });
  const newMappingId = newId();
  await deps.store.insertMapping({
    id: newMappingId, organizationId: input.organizationId, rcmId: finalRcmId,
    controlId: newControlId, ...pickDefined(input as Record<string, unknown>, LINI1_FIELDS),
  });
  const { todVerdict, deficiencyId } = await persistTodAndRaise(deps, {
    organizationId: input.organizationId,
    userId: input.userId,
    controlId: newControlId,
    body: input as Record<string, unknown>,
  });
  return { todVerdict, deficiencyId, mappingId: newMappingId, controlId: newControlId, rcmId: finalRcmId };
}
