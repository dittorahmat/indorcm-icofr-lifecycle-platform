import { and, eq } from 'drizzle-orm';
import type { DrizzleDb } from '../db';
import { controls } from '../db/schema';
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
