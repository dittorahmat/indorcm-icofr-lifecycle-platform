import { and, eq } from 'drizzle-orm';
import type { DrizzleDb } from '../db';
import { controls, testRecords, testSamples } from '../db/schema';
import { trimText } from '@shared/ai-cache';
import { booleanField } from '../lib/coerce';
import {
  decideFromForm,
  type RawTestingControl,
  type TestingDecision,
  type TestingVerdict,
  type TestSubmissionValues,
} from '@shared/testing-decision';
import { DeficiencyService } from './deficiency-service';
import { eventForVerdict, TOD_EVALUATION_PERIOD } from './deficiency-trigger';

/**
 * csa-verdict — single server-side verdict module for CSA/TOD/TOE writes.
 *
 * Owns control-fetch + field-forwarding + deficiency event together so the
 * three route modules (`POST /tod-evaluations`, `POST /tests`,
 * `POST /csa/testing-records`) stay thin adapters that pass the raw body
 * and nothing else. External payloads and error messages stay byte-identical;
 * only the seam moves inward.
 */

export interface TodEvaluationBody {
  conclusion?: unknown;
  pilarObjective?: unknown;
  pilarTiming?: unknown;
  pilarAuthority?: unknown;
  pilarReliability?: unknown;
  pilarCoverage?: unknown;
  pilarEvidence?: unknown;
}

export interface TestSubmissionBody extends TestSubmissionValues {
  comments?: unknown;
  period?: unknown;
}

export interface TestingRecordBody {
  testType?: unknown;
  result?: unknown;
  sampleSize?: unknown;
}

export async function fetchTestingControl(
  db: DrizzleDb,
  controlId: string,
  orgId: string,
): Promise<RawTestingControl | null> {
  const row = await db.query.controls.findFirst({
    where: and(eq(controls.id, controlId), eq(controls.organizationId, orgId)),
    columns: { frequency: true, riskRating: true, nature: true },
  });
  return row ?? null;
}

/** TOD-evaluation mapping: short `pilar*` names, fixed testType TOD. */
export function decideTodEvaluation(
  control: RawTestingControl | null | undefined,
  body: TodEvaluationBody,
): TestingDecision {
  return decideFromForm(control, {
    testType: 'TOD',
    result: body.conclusion,
    todPilarObjective: body.pilarObjective,
    todPilarTiming: body.pilarTiming,
    todPilarAuthority: body.pilarAuthority,
    todPilarReliability: body.pilarReliability,
    todPilarCoverage: body.pilarCoverage,
    todPilarEvidence: body.pilarEvidence,
  });
}

/** Full `/tests` mapping: widest field set incl. samples + homogeneity. */
export function decideTestSubmission(
  control: RawTestingControl | null | undefined,
  body: TestSubmissionBody,
): TestingDecision {
  return decideFromForm(control, {
    testType: body.testType,
    result: body.result,
    sampleSize: body.sampleSize,
    homogeneityJustification: body.homogeneityJustification,
    samples: body.samples,
    todPilarObjective: body.todPilarObjective,
    todPilarTiming: body.todPilarTiming,
    todPilarAuthority: body.todPilarAuthority,
    todPilarReliability: body.todPilarReliability,
    todPilarCoverage: body.todPilarCoverage,
    todPilarEvidence: body.todPilarEvidence,
  });
}

/** Minimal `/csa/testing-records` mapping: type + result + size only. */
export function decideTestingRecord(
  control: RawTestingControl | null | undefined,
  body: TestingRecordBody,
): TestingDecision {
  return decideFromForm(control, {
    testType: body.testType,
    result: body.result,
    sampleSize: body.sampleSize,
  });
}

export async function triggerTodDeficiency(
  db: DrizzleDb,
  orgId: string,
  controlId: string | null,
  userId: string,
  verdict: TestingVerdict | unknown,
): Promise<void> {
  const event = eventForVerdict('Lini 2 - TOD Review', {
    verdict,
    organizationId: orgId,
    controlId,
    period: TOD_EVALUATION_PERIOD,
    userId,
  });
  if (!event) return;
  await new DeficiencyService(db).createAutoDeficiency(event);
}

export interface AuditDeficiencyInput {
  verdict: TestingVerdict | unknown;
  organizationId: string;
  controlId: string | null;
  period: string;
  userId: string;
  testType: 'TOD' | 'TOE';
  comments?: unknown;
}

export async function triggerAuditDeficiency(
  db: DrizzleDb,
  input: AuditDeficiencyInput,
): Promise<void> {
  const event = eventForVerdict('Lini 3 - Audit', {
    verdict: input.verdict,
    organizationId: input.organizationId,
    controlId: input.controlId,
    period: input.period,
    userId: input.userId,
    testType: input.testType,
    ...(typeof input.comments === 'string' ? { detail: input.comments } : {}),
  });
  if (!event) return;
  await new DeficiencyService(db).createAutoDeficiency(event);
}

/* ------------------------------------------------------------------------- *
 * The CSA test-record write path (issue #96)
 *
 * `POST /tests` and `POST /csa/testing-records` both create a `test_records`
 * row and had each assembled it themselves: the same control check, the same
 * testType normalisation, the same period default and the same insert — while
 * only `/tests` inserted the sample rows. The record is built here now, so the
 * two endpoints cannot drift; the ONE deliberate difference (the Lini 3 audit
 * deficiency, triggered only by `/tests`) stays at that call site.
 * ------------------------------------------------------------------------- */

/** Stable codes produced once here and asserted with literals by the routes. */
export const TEST_RECORD_MISSING_CONTROL = 'CONTROL_ID_REQUIRED';
export const TEST_RECORD_SAMPLE_SIZE_BELOW_TABLE22 = 'SAMPLE_SIZE_BELOW_TABLE22';

const MISSING_CONTROL_MESSAGE = 'controlId is required';
const SAMPLE_SIZE_MESSAGE =
  'Sample size is below Table 22 minimum without homogeneity justification';

/** The row as inserted — both create endpoints share exactly this shape. */
export type TestRecordDraft = typeof testRecords.$inferInsert;

export type CreateTestRecordOutcome =
  | { outcome: 'created'; record: TestRecordDraft }
  | { outcome: 'rejected'; code: string; httpStatus: number; message: string };

/** Every field the write path reads. All `unknown`: this is a request body. */
export interface TestRecordBodyFields {
  controlId?: unknown;
  testType?: unknown;
  period?: unknown;
  sampleSize?: unknown;
  comments?: unknown;
  homogeneityJustification?: unknown;
  evaluationAttributes?: unknown;
  todPilarObjective?: unknown;
  todPilarTiming?: unknown;
  todPilarAuthority?: unknown;
  todPilarReliability?: unknown;
  todPilarCoverage?: unknown;
  todPilarEvidence?: unknown;
  todPilarComments?: unknown;
  samples?: unknown;
}

/** Validates every entry before asserting the shape — never a blind cast. */
function stringRecordField(value: unknown): Record<string, string> | undefined {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return undefined;
  const entries = Object.entries(value);
  if (!entries.every(([, entry]) => typeof entry === 'string')) return undefined;
  // boundary: each entry above was proven to be a string, so the shape is sound.
  return Object.fromEntries(entries) as Record<string, string>;
}

function sampleRows(
  recordId: string,
  orgId: string,
  samples: unknown,
): (typeof testSamples.$inferInsert)[] {
  if (!Array.isArray(samples)) return [];
  return samples.map((raw) => {
    const sample: Record<string, unknown> = typeof raw === 'object' && raw !== null ? raw : {};
    return {
      id: crypto.randomUUID(),
      organizationId: orgId,
      testRecordId: recordId,
      sampleRef: typeof sample.sampleRef === 'string' ? sample.sampleRef : undefined,
      attrA: booleanField(sample.attrA),
      attrB: booleanField(sample.attrB),
      attrC: booleanField(sample.attrC),
      attrD: booleanField(sample.attrD),
      status: typeof sample.status === 'string' ? sample.status : 'Pass',
      comments: typeof sample.comments === 'string' ? sample.comments : undefined,
    };
  });
}

export interface CreateTestRecordArgs<B extends TestRecordBodyFields> {
  db: DrizzleDb;
  orgId: string;
  userId: string;
  body: B;
  /**
   * The endpoint's mapping onto the shared decision seam, injected rather than
   * branched on here: `/tests` keeps its widest field set (samples, homogeneity,
   * the six TOD pillars), `/csa/testing-records` its minimal one.
   */
  decide: (control: RawTestingControl | null, body: B) => TestingDecision;
}

/**
 * Creates one CSA test record. Returns a string-discriminated outcome so the
 * call site narrows correctly under BOTH tsconfigs (a boolean discriminant does
 * not narrow under `strict: false`, which is how worker code is checked when it
 * is reachable from `src/test` — see CODING_STANDARDS).
 */
export async function createTestRecord<B extends TestRecordBodyFields>(
  args: CreateTestRecordArgs<B>,
): Promise<CreateTestRecordOutcome> {
  const { db, orgId, userId, body, decide } = args;

  const controlId = body.controlId;
  if (typeof controlId !== 'string' || controlId === '') {
    return {
      outcome: 'rejected',
      code: TEST_RECORD_MISSING_CONTROL,
      httpStatus: 400,
      message: MISSING_CONTROL_MESSAGE,
    };
  }

  const control = await fetchTestingControl(db, controlId, orgId);
  const decision = decide(control, body);
  if (!decision.isValid || decision.verdict === undefined) {
    return {
      outcome: 'rejected',
      code: TEST_RECORD_SAMPLE_SIZE_BELOW_TABLE22,
      httpStatus: 400,
      message: SAMPLE_SIZE_MESSAGE,
    };
  }

  const id = crypto.randomUUID();
  const record: TestRecordDraft = {
    id,
    organizationId: orgId,
    controlId,
    testType: body.testType === 'TOD' ? 'TOD' : 'TOE',
    period: trimText(body.period) || String(new Date().getFullYear()),
    result: decision.verdict,
    testedBy: userId,
    testDate: new Date(),
    sampleSize: typeof body.sampleSize === 'number' ? body.sampleSize : 0,
    comments: typeof body.comments === 'string' ? body.comments : undefined,
    homogeneityJustification:
      typeof body.homogeneityJustification === 'string' ? body.homogeneityJustification : undefined,
    evaluationAttributes: body.evaluationAttributes,
    todPilarObjective: booleanField(body.todPilarObjective),
    todPilarTiming: booleanField(body.todPilarTiming),
    todPilarAuthority: booleanField(body.todPilarAuthority),
    todPilarReliability: booleanField(body.todPilarReliability),
    todPilarCoverage: booleanField(body.todPilarCoverage),
    todPilarEvidence: booleanField(body.todPilarEvidence),
    todPilarComments: stringRecordField(body.todPilarComments),
  };

  await db.insert(testRecords).values(record);

  const rows = sampleRows(id, orgId, body.samples);
  if (rows.length > 0) await db.insert(testSamples).values(rows);

  return { outcome: 'created', record };
}
