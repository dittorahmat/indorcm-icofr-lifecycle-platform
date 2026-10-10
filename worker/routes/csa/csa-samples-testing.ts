import { Hono } from "hono";
import type { HonoEnv } from '../../app';
import { ok, bad } from '../../lib/utils';
import { getDb } from '../../db';
import { csaSamples, todEvaluations, testRecords, testSamples, controls } from '../../db/schema';
import { eq, and, desc, SQL } from 'drizzle-orm';
import type { TestRecord } from "@shared/types";
import type { DrizzleDb } from '../../db';
import { DeficiencyService } from "../../services/deficiency-service";
import {
  decideFromControl,
  type TestingVerdict,
  type TodPillars,
} from "@shared/testing-decision";
import { rbac } from "../../lib/guard";

export const csaSamplesTestingRoute = new Hono<HonoEnv>();

/** Shared TOD deficiency policy for insert and update branches: one typed event. */
async function triggerTodDeficiency(
  db: DrizzleDb,
  orgId: string,
  controlId: string | null,
  userId: string,
  conclusion: unknown,
): Promise<void> {
  if (conclusion !== 'Ineffective') return;
  const defService = new DeficiencyService(db);
  await defService.createAutoDeficiency({
    organizationId: orgId,
    controlId,
    bpmProcessId: null,
    period: 'TOD-Evaluation',
    source: 'Lini 2 - TOD Review',
    userId,
  });
}

csaSamplesTestingRoute.get('/csa/samples', async (c) => {
  const db = getDb(c.env.DATABASE_URL);
  const orgId = c.get('organizationId');
  const csaRecordId = c.req.query('csaRecordId');

  if (!csaRecordId) return bad(c, 'csaRecordId is required');

  const items = await db.select().from(csaSamples).where(and(
    eq(csaSamples.csaRecordId, csaRecordId),
    eq(csaSamples.organizationId, orgId)
  ));
  return ok(c, { items });
});

csaSamplesTestingRoute.post('/csa/samples/batch', async (c) => {
  const db = getDb(c.env.DATABASE_URL);
  const orgId = c.get('organizationId');
  const { csaRecordId, samples } = await c.req.json<{ csaRecordId: string, samples: any[] }>();

  if (!csaRecordId || !samples) return bad(c, 'Invalid payload');

  for (const s of samples) {
    const id = s.id || crypto.randomUUID();
    const existing = await db.select().from(csaSamples).where(eq(csaSamples.id, id)).limit(1);

    const values = {
      organizationId: orgId,
      csaRecordId,
      sampleName: s.sampleName,
      status: s.status,
      evidenceUrl: s.evidenceUrl,
      notes: s.notes,
    };

    if (existing.length > 0) {
      await db.update(csaSamples).set(values).where(eq(csaSamples.id, id));
    } else {
      await db.insert(csaSamples).values({ id, ...values });
    }
  }

  return ok(c, { success: true });
});

csaSamplesTestingRoute.get('/tod-evaluations', async (c) => {
  const db = getDb(c.env.DATABASE_URL);
  const orgId = c.get('organizationId');
  const csaId = c.req.query('csaId');
  const controlId = c.req.query('controlId');

  let conditions = eq(todEvaluations.organizationId, orgId);
  if (csaId) conditions = and(conditions, eq(todEvaluations.csaId, csaId)) as SQL;
  if (controlId) conditions = and(conditions, eq(todEvaluations.controlId, controlId)) as SQL;

  const items = await db.select().from(todEvaluations).where(conditions);
  return ok(c, { items });
});

/** Maps a TOD free-text pilar onto the testing-decision seam input.
 *  Pillars are free-text justification (Lampiran 8) — a non-empty string
 *  counts as satisfied. Boolean true is accepted for forward-compat. */
function todPilarFlag(value: unknown): boolean {
  if (typeof value === 'string') return value.trim() !== '';
  return value === true;
}

csaSamplesTestingRoute.post('/tod-evaluations', rbac(['Line 2', 'Admin']), async (c) => {
  const db = getDb(c.env.DATABASE_URL);
  const orgId = c.get('organizationId');
  const userId = c.get('userId');
  const body = await c.req.json<any>();

  if (!body.csaId || !body.controlId) return bad(c, "csaId and controlId are required");

  const claimedConclusion: TestingVerdict =
    body.conclusion === 'Ineffective' ? 'Ineffective' : 'Effective';

  // Server recomputes the verdict through the single testing-decision
  // seam — body.conclusion is treated as a claim, never as the decision.
  const controlRow = await db.query.controls.findFirst({
    where: and(eq(controls.id, body.controlId), eq(controls.organizationId, orgId)),
    columns: { frequency: true, riskRating: true, nature: true },
  });
  const todPillars: TodPillars = {
    objective: todPilarFlag(body.pilarObjective),
    timing: todPilarFlag(body.pilarTiming),
    authority: todPilarFlag(body.pilarAuthority),
    reliability: todPilarFlag(body.pilarReliability),
    coverage: todPilarFlag(body.pilarCoverage),
    evidence: todPilarFlag(body.pilarEvidence),
  };
  const decision = decideFromControl(controlRow, {
    testType: 'TOD',
    claimedResult: claimedConclusion,
    todPillars,
  });

  if (!decision.isValid) {
    return bad(c, 'Invalid TOD evaluation');
  }
  const conclusion = decision.verdict ?? claimedConclusion;

  const existing = await db.select().from(todEvaluations).where(and(
    eq(todEvaluations.csaId, body.csaId),
    eq(todEvaluations.controlId, body.controlId),
    eq(todEvaluations.organizationId, orgId)
  )).limit(1);

  const values = {
    organizationId: orgId,
    csaId: body.csaId,
    controlId: body.controlId,
    evaluatorId: userId,
    pilarObjective: body.pilarObjective,
    pilarTiming: body.pilarTiming,
    pilarAuthority: body.pilarAuthority,
    pilarReliability: body.pilarReliability,
    pilarCoverage: body.pilarCoverage,
    pilarEvidence: body.pilarEvidence,
    kkReference: body.kkReference,
    conclusion,
    comment: body.comment,
    updatedAt: new Date(),
  };

  if (existing.length > 0) {
    await db.update(todEvaluations)
      .set(values)
      .where(eq(todEvaluations.id, existing[0].id));

    await triggerTodDeficiency(db, orgId, body.controlId, userId, conclusion);
    return ok(c, { ...existing[0], ...values });
  } else {
    const newId = crypto.randomUUID();
    await db.insert(todEvaluations).values({ id: newId, ...values, createdAt: new Date() });

    await triggerTodDeficiency(db, orgId, body.controlId, userId, conclusion);
    return ok(c, { id: newId, ...values });
  }
});

csaSamplesTestingRoute.get('/tests', async (c) => {
  const db = getDb(c.env.DATABASE_URL);
  const orgId = c.get('organizationId');
  const items = await db.query.testRecords.findMany({
    where: eq(testRecords.organizationId, orgId),
    with: {
      samples: true
    },
    orderBy: [desc(testRecords.testDate)]
  });
  return ok(c, { items });
});

csaSamplesTestingRoute.post('/tests', async (c) => {
  const db = getDb(c.env.DATABASE_URL);
  const orgId = c.get('organizationId');
  const userId = c.get('userId');
  const body = await c.req.json<any>();

  if (!body.controlId) return bad(c, 'controlId is required');

  const testType = body.testType === 'TOD' ? 'TOD' : 'TOE';
  const claimedResult: TestingVerdict =
    body.result === 'Ineffective' ? 'Ineffective' : 'Effective';

  // Server recomputes the verdict through the single testing-decision
  // seam — body.result is treated as a claim, never as the decision.
  const controlRow = await db.query.controls.findFirst({
    where: and(eq(controls.id, body.controlId), eq(controls.organizationId, orgId)),
    columns: { frequency: true, riskRating: true, nature: true },
  });
  const todPillars: TodPillars | undefined =
    testType === 'TOD'
      ? {
          objective: body.todPilarObjective !== false,
          timing: body.todPilarTiming !== false,
          authority: body.todPilarAuthority !== false,
          reliability: body.todPilarReliability !== false,
          coverage: body.todPilarCoverage !== false,
          evidence: body.todPilarEvidence !== false,
        }
      : undefined;
  const decision = decideFromControl(controlRow, {
    testType,
    claimedResult,
    sampleSize: typeof body.sampleSize === 'number' ? body.sampleSize : undefined,
    homogeneityJustification:
      typeof body.homogeneityJustification === 'string'
        ? body.homogeneityJustification
        : undefined,
    samples: Array.isArray(body.samples)
      ? body.samples.filter(
          (s: { status?: unknown }) => s && (s.status === 'Pass' || s.status === 'Fail'),
        )
      : [],
    todPillars,
  });

  if (!decision.isValid) {
    return bad(
      c,
      'Sample size is below Table 22 minimum without homogeneity justification',
    );
  }
  const result = decision.verdict ?? claimedResult;
  const period =
    typeof body.period === 'string' && body.period.trim() !== ''
      ? body.period
      : new Date().getFullYear().toString();

  const id = crypto.randomUUID();
  const newRecord = {
    id,
    organizationId: orgId,
    controlId: body.controlId,
    testType,
    period,
    result,
    testedBy: userId,
    testDate: new Date(),
    sampleSize: body.sampleSize || 0,
    comments: body.comments,
    homogeneityJustification: body.homogeneityJustification,
    evaluationAttributes: body.evaluationAttributes,
    todPilarObjective: body.todPilarObjective,
    todPilarTiming: body.todPilarTiming,
    todPilarAuthority: body.todPilarAuthority,
    todPilarReliability: body.todPilarReliability,
    todPilarCoverage: body.todPilarCoverage,
    todPilarEvidence: body.todPilarEvidence,
    todPilarComments: body.todPilarComments,
  };

  await db.insert(testRecords).values(newRecord as any);

  if (result === 'Ineffective') {
    const defService = new DeficiencyService(db);
    await defService.createAutoDeficiency({
      organizationId: orgId,
      controlId: body.controlId,
      bpmProcessId: null,
      period,
      source: 'Lini 3 - Audit',
      userId,
      testType,
      detail: typeof body.comments === 'string' ? body.comments : undefined,
    });
  }

  if (body.samples && Array.isArray(body.samples) && body.samples.length > 0) {
    const samplesToInsert = body.samples.map((s: any) => ({
      id: crypto.randomUUID(),
      organizationId: orgId,
      testRecordId: id,
      sampleRef: s.sampleRef,
      attrA: s.attrA,
      attrB: s.attrB,
      attrC: s.attrC,
      attrD: s.attrD,
      status: s.status || 'Pass',
      comments: s.comments
    }));
    await db.insert(testSamples).values(samplesToInsert);
  }

  return ok(c, newRecord);
});

csaSamplesTestingRoute.get('/csa/testing-records', async (c) => {
  const db = getDb(c.env.DATABASE_URL);
  const orgId = c.get('organizationId');
  const controlId = c.req.query('controlId');

  let conditions: SQL = eq(testRecords.organizationId, orgId);
  if (controlId) {
    conditions = and(conditions, eq(testRecords.controlId, controlId)) as SQL;
  }

  const items = await db.select().from(testRecords).where(conditions);
  return ok(c, { items });
});

csaSamplesTestingRoute.post('/csa/testing-records', async (c) => {
  const db = getDb(c.env.DATABASE_URL);
  const orgId = c.get('organizationId');
  const userId = c.get('userId');
  const body = await c.req.json<Partial<TestRecord>>();

  const id = crypto.randomUUID();
  const newRecord = {
    id,
    organizationId: orgId,
    controlId: body.controlId!,
    testType: (body.testType as any) || 'TOE',
    period: body.period || new Date().getFullYear().toString(),
    result: (body.result as any) || 'Effective',
    testedBy: userId,
    testDate: new Date(),
    sampleSize: body.sampleSize || 0,
    comments: body.comments,
  };

  await db.insert(testRecords).values(newRecord as any);
  return ok(c, newRecord);
});
