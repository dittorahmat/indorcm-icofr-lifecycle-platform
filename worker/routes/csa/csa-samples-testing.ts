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
  decideFromForm,
  type TestingVerdict,
} from "@shared/testing-decision";
import { eventForVerdict } from "../../services/deficiency-trigger";
import { rbac } from "../../lib/guard";

export const csaSamplesTestingRoute = new Hono<HonoEnv>();

/** Shared TOD deficiency policy for insert and update branches: one verdict + snapshot at the seam. */
async function triggerTodDeficiency(
  db: DrizzleDb,
  orgId: string,
  controlId: string | null,
  userId: string,
  conclusion: unknown,
): Promise<void> {
  const event = eventForVerdict('Lini 2 - TOD Review', {
    verdict: conclusion,
    organizationId: orgId,
    controlId,
    period: 'TOD-Evaluation',
    userId,
  });
  if (!event) return;
  const defService = new DeficiencyService(db);
  await defService.createAutoDeficiency(event);
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

csaSamplesTestingRoute.post('/tod-evaluations', rbac(['Line 2', 'Admin']), async (c) => {
  const db = getDb(c.env.DATABASE_URL);
  const orgId = c.get('organizationId');
  const userId = c.get('userId');
  const body = await c.req.json<any>();

  if (!body.csaId || !body.controlId) return bad(c, "csaId and controlId are required");

  // Server recomputes the verdict through the single testing-decision
  // seam — body.conclusion is treated as a claim, never as the decision.
  const controlRow = await db.query.controls.findFirst({
    where: and(eq(controls.id, body.controlId), eq(controls.organizationId, orgId)),
    columns: { frequency: true, riskRating: true, nature: true },
  });
  const decision = decideFromForm(controlRow, {
    testType: 'TOD',
    result: body.conclusion,
    todPilarObjective: body.pilarObjective,
    todPilarTiming: body.pilarTiming,
    todPilarAuthority: body.pilarAuthority,
    todPilarReliability: body.pilarReliability,
    todPilarCoverage: body.pilarCoverage,
    todPilarEvidence: body.pilarEvidence,
  });

  if (!decision.isValid || decision.verdict === undefined) {
    return bad(c, 'Invalid TOD evaluation');
  }
  const conclusion: TestingVerdict = decision.verdict;

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

  // Server recomputes the verdict through the single testing-decision
  // seam — body.result is treated as a claim, never as the decision.
  const controlRow = await db.query.controls.findFirst({
    where: and(eq(controls.id, body.controlId), eq(controls.organizationId, orgId)),
    columns: { frequency: true, riskRating: true, nature: true },
  });
  const decision = decideFromForm(controlRow, {
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

  if (!decision.isValid || decision.verdict === undefined) {
    return bad(
      c,
      'Sample size is below Table 22 minimum without homogeneity justification',
    );
  }
  const result: TestingVerdict = decision.verdict;
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

  const auditEvent = eventForVerdict('Lini 3 - Audit', {
    verdict: result,
    organizationId: orgId,
    controlId: body.controlId,
    period,
    userId,
    testType,
    ...(typeof body.comments === 'string' ? { detail: body.comments } : {}),
  });
  if (auditEvent) {
    const defService = new DeficiencyService(db);
    await defService.createAutoDeficiency(auditEvent);
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

  if (!body.controlId) return bad(c, 'controlId is required');

  // Server recomputes the verdict through the single testing-decision
  // seam — body.result is treated as a claim, never as the decision.
  const controlRow = await db.query.controls.findFirst({
    where: and(eq(controls.id, body.controlId), eq(controls.organizationId, orgId)),
    columns: { frequency: true, riskRating: true, nature: true },
  });
  const decision = decideFromForm(controlRow, {
    testType: body.testType,
    result: body.result,
    sampleSize: body.sampleSize,
  });

  if (!decision.isValid || decision.verdict === undefined) {
    return bad(
      c,
      'Sample size is below Table 22 minimum without homogeneity justification',
    );
  }

  const id = crypto.randomUUID();
  const newRecord = {
    id,
    organizationId: orgId,
    controlId: body.controlId,
    testType: body.testType === 'TOD' ? 'TOD' : 'TOE',
    period: body.period || new Date().getFullYear().toString(),
    result: decision.verdict,
    testedBy: userId,
    testDate: new Date(),
    sampleSize: body.sampleSize || 0,
    comments: body.comments,
  };

  await db.insert(testRecords).values(newRecord);
  return ok(c, newRecord);
});
