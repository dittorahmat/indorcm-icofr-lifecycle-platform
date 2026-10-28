import { Hono } from "hono";
import type { HonoEnv } from '../../app';
import { ok, bad } from '../../lib/utils';
import { getDb } from '../../db';
import { csaSamples, todEvaluations, testRecords } from '../../db/schema';
import { eq, and, desc, SQL, sql, or } from 'drizzle-orm';
import type { TestRecord } from "@shared/types";
import type { TestingVerdict } from "@shared/testing-decision";
import {
  createTestRecord,
  decideTestSubmission,
  decideTestingRecord,
  decideTodEvaluation,
  fetchTestingControl,
  triggerAuditDeficiency,
  triggerTodDeficiency,
} from "../../services/csa-verdict";
import { rbac } from "../../lib/guard";

export const csaSamplesTestingRoute = new Hono<HonoEnv>();

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

csaSamplesTestingRoute.post('/csa/samples/batch', rbac(['Line 1', 'Admin']), async (c) => {
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
  const controlRow = await fetchTestingControl(db, body.controlId, orgId);
  const decision = decideTodEvaluation(controlRow, body);

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
  const yearParam = c.req.query('year');
  const year = yearParam ? parseInt(yearParam, 10) : undefined;

  let whereClause: SQL = eq(testRecords.organizationId, orgId);
  if (year && !isNaN(year) && yearParam) {
    whereClause = and(
      whereClause,
      or(
        eq(testRecords.period, yearParam),
        sql`${testRecords.period} LIKE ${yearParam + '-%'}`,
        sql`${testRecords.period} LIKE ${'%-Q%'} AND ${testRecords.period} LIKE ${'%' + yearParam + '%'}`,
        sql`EXTRACT(YEAR FROM ${testRecords.testDate}) = ${year}`
      )
    ) as SQL;
  }

  const items = await db.query.testRecords.findMany({
    where: whereClause,
    with: {
      samples: true
    },
    orderBy: [desc(testRecords.testDate)]
  });
  return ok(c, { items });
});

csaSamplesTestingRoute.post('/tests', rbac(['Line 1', 'Admin']), async (c) => {
  const db = getDb(c.env.DATABASE_URL);
  const orgId = c.get('organizationId');
  const userId = c.get('userId');
  const body = await c.req.json<any>();

  const created = await createTestRecord({
    db,
    orgId,
    userId,
    body,
    decide: decideTestSubmission,
  });
  if (created.outcome === 'rejected') {
    return bad(c, created.code, created.httpStatus, created.message);
  }

  // The ONE deliberate difference from POST /csa/testing-records: a `/tests`
  // verdict also feeds the Lini 3 audit deficiency.
  await triggerAuditDeficiency(db, {
    verdict: created.record.result,
    organizationId: orgId,
    controlId: created.record.controlId,
    period: created.record.period,
    userId,
    testType: created.record.testType === 'TOD' ? 'TOD' : 'TOE',
    comments: created.record.comments,
  });

  return ok(c, created.record);
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

csaSamplesTestingRoute.post('/csa/testing-records', rbac(['Line 1', 'Admin']), async (c) => {
  const db = getDb(c.env.DATABASE_URL);
  const orgId = c.get('organizationId');
  const userId = c.get('userId');
  const body = await c.req.json<Partial<TestRecord>>();

  const created = await createTestRecord({
    db,
    orgId,
    userId,
    body,
    decide: decideTestingRecord,
  });
  if (created.outcome === 'rejected') {
    return bad(c, created.code, created.httpStatus, created.message);
  }

  return ok(c, created.record);
});
