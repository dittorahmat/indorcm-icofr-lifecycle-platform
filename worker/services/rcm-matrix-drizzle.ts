import { and, eq, inArray } from 'drizzle-orm';
import type { DrizzleDb } from '../db';
import { controls, rcmControls, rcms, todEvaluations } from '../db/schema';
import { DeficiencyService } from './deficiency-service';
import {
  type RcmMappingRef,
  type RcmMatrixWriteDeps,
  type RcmMatrixWriteStore,
  type TodEvalRow,
} from './rcm-matrix-write';

/** BE text columns writable through the verification seam (isKeyControl handled separately). */
const MAPPING_TEXT_COLUMNS = [
  'controlName', 'controlDescription', 'supportingDocs',
  'ipoC', 'ipoA', 'ipoV', 'ipoRa',
  'assertionE', 'assertionC', 'assertionA', 'assertionCo', 'assertionVa', 'assertionRo', 'assertionPd',
  'controlType', 'controlNature', 'automatedControlType', 'frequency', 'supportingApp',
  'applicationId', 'executingFunction', 'executorRole', 'affectedFsliItem', 'effectivePeriod',
  'itgcDomain',
] as const;

function optText(value: unknown): string | null {
  return typeof value === 'string' ? value : null;
}

function reqText(value: unknown, fallback: string): string {
  return typeof value === 'string' ? value : fallback;
}

function cleanMappingPatch(raw: Record<string, unknown>): Record<string, string | boolean | null> {
  const patch: Record<string, string | boolean | null> = {};
  for (const col of MAPPING_TEXT_COLUMNS) {
    const v = raw[col];
    if (v !== undefined) patch[col] = optText(v);
  }
  if (typeof raw.isKeyControl === 'boolean') patch.isKeyControl = raw.isKeyControl;
  return patch;
}

function cleanTodPatch(raw: Record<string, unknown>): Record<string, string | null> {
  const patch: Record<string, string | null> = {};
  for (const col of [
    'pilarObjective', 'pilarTiming', 'pilarAuthority', 'pilarReliability',
    'pilarCoverage', 'pilarEvidence', 'kkReference', 'conclusion', 'comment',
  ] as const) {
    const v = raw[col];
    if (v !== undefined) patch[col] = optText(v);
  }
  return patch;
}

/** Drizzle-backed persistence for the RCM matrix-write seam. Scoped per request by organizationId. */
export class DrizzleMatrixWriteStore implements RcmMatrixWriteStore {
  constructor(
    private db: DrizzleDb,
    private organizationId: string,
  ) {}

  async findMapping(mappingId: string, organizationId: string): Promise<RcmMappingRef | null> {
    const row = await this.db.query.rcmControls.findFirst({
      where: and(eq(rcmControls.id, mappingId), eq(rcmControls.organizationId, organizationId)),
      columns: { id: true, organizationId: true, rcmId: true, controlId: true },
    });
    return row ?? null;
  }

  async updateMapping(mappingId: string, patch: Record<string, unknown>): Promise<void> {
    const clean = cleanMappingPatch(patch);
    if (Object.keys(clean).length === 0) return;
    await this.db
      .update(rcmControls)
      .set(clean)
      .where(and(eq(rcmControls.id, mappingId), eq(rcmControls.organizationId, this.organizationId)));
  }

  async findTod(controlId: string, organizationId: string): Promise<TodEvalRow | null> {
    const row = await this.db.query.todEvaluations.findFirst({
      where: and(eq(todEvaluations.controlId, controlId), eq(todEvaluations.organizationId, organizationId)),
    });
    if (!row) return null;
    return {
      id: row.id, organizationId: row.organizationId, controlId: row.controlId,
      pilarObjective: row.pilarObjective, pilarTiming: row.pilarTiming,
      pilarAuthority: row.pilarAuthority, pilarReliability: row.pilarReliability,
      pilarCoverage: row.pilarCoverage, pilarEvidence: row.pilarEvidence,
      kkReference: row.kkReference, conclusion: row.conclusion, comment: row.comment,
    };
  }

  async insertTod(row: TodEvalRow & { evaluatorId: string }): Promise<void> {
    await this.db.insert(todEvaluations).values({
      id: row.id, organizationId: row.organizationId, controlId: row.controlId, csaId: null,
      evaluatorId: optText(row.evaluatorId),
      pilarObjective: row.pilarObjective, pilarTiming: row.pilarTiming,
      pilarAuthority: row.pilarAuthority, pilarReliability: row.pilarReliability,
      pilarCoverage: row.pilarCoverage, pilarEvidence: row.pilarEvidence,
      kkReference: row.kkReference, conclusion: row.conclusion, comment: row.comment,
      createdAt: new Date(), updatedAt: new Date(),
    });
  }

  async updateTod(todId: string, patch: Partial<TodEvalRow>): Promise<void> {
    const clean = cleanTodPatch(patch as Record<string, unknown>);
    if (Object.keys(clean).length === 0) return;
    await this.db.update(todEvaluations).set({ ...clean, updatedAt: new Date() }).where(eq(todEvaluations.id, todId));
  }

  async findMappings(mappingIds: string[], organizationId: string): Promise<RcmMappingRef[]> {
    if (mappingIds.length === 0) return [];
    return this.db
      .select({
        id: rcmControls.id, organizationId: rcmControls.organizationId,
        rcmId: rcmControls.rcmId, controlId: rcmControls.controlId,
      })
      .from(rcmControls)
      .where(and(inArray(rcmControls.id, mappingIds), eq(rcmControls.organizationId, organizationId)));
  }

  async applyMappingUpdates(updates: Array<{ id: string; patch: Record<string, unknown> }>): Promise<void> {
    for (const u of updates) await this.updateMapping(u.id, u.patch);
  }

  async applyRiskUpdates(updates: Array<{ rcmId: string; patch: Record<string, unknown> }>): Promise<void> {
    for (const u of updates) {
      const patch: { riskDescription?: string; riskRating?: string | null; isFraudRelated?: boolean } = {};
      if (typeof u.patch.riskDescription === 'string') patch.riskDescription = u.patch.riskDescription;
      if (typeof u.patch.riskRating === 'string' || u.patch.riskRating === null) {
        patch.riskRating = u.patch.riskRating;
      }
      if (typeof u.patch.isFraudRelated === 'boolean') patch.isFraudRelated = u.patch.isFraudRelated;
      if (Object.keys(patch).length === 0) continue;
      await this.db
        .update(rcms)
        .set(patch)
        .where(and(eq(rcms.id, u.rcmId), eq(rcms.organizationId, this.organizationId)));
    }
  }

  async insertRcm(row: Record<string, unknown>): Promise<void> {
    await this.db.insert(rcms).values({
      id: reqText(row.id, crypto.randomUUID()),
      organizationId: reqText(row.organizationId, this.organizationId),
      process: reqText(row.process, 'New Process'),
      subProcess: reqText(row.subProcess, 'New Sub-Process'),
      riskDescription: reqText(row.riskDescription, 'New Risk'),
      isFraudRelated: typeof row.isFraudRelated === 'boolean' ? row.isFraudRelated : false,
      riskRating: reqText(row.riskRating, 'Medium'),
      status: reqText(row.status, 'Active'),
    });
  }

  async insertControl(row: Record<string, unknown>): Promise<void> {
    await this.db.insert(controls).values({
      id: reqText(row.id, crypto.randomUUID()),
      organizationId: reqText(row.organizationId, this.organizationId),
      rcmId: optText(row.rcmId),
      code: reqText(row.code, 'C-unknown'),
      name: reqText(row.name, 'New Control'),
      description: optText(row.description),
      level: reqText(row.level, 'TLC'),
      bpmProcessId: optText(row.bpmProcessId),
    });
  }

  async insertMapping(row: Record<string, unknown>): Promise<void> {
    await this.db.insert(rcmControls).values({
      id: reqText(row.id, crypto.randomUUID()),
      organizationId: reqText(row.organizationId, this.organizationId),
      rcmId: reqText(row.rcmId, ''),
      controlId: reqText(row.controlId, ''),
      ...cleanMappingPatch(row),
    });
  }
}

/** Per-request deps: drizzle store (org-scoped) + deficiency effects. */
export function createMatrixWriteDeps(db: DrizzleDb, organizationId: string): RcmMatrixWriteDeps {
  const deficiencies = new DeficiencyService(db);
  return {
    store: new DrizzleMatrixWriteStore(db, organizationId),
    effects: {
      raiseDeficiency: (event) => deficiencies.createAutoDeficiency(event),
    },
  };
}
