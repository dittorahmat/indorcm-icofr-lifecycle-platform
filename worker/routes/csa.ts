import { Hono } from "hono";
import type { HonoEnv } from '../app';
import { ok, bad, notFound } from '../lib/utils';
import { getDb } from '../db';
import { 
  csaRecords, csaSamples, csaSchedules, testRecords, auditLogs, 
  controls, rcms, rcmControls
} from '../db/schema';
import { eq, and, sql, desc, SQL } from 'drizzle-orm';
import type { CSARecord, TestRecord } from "@shared/types";

const csa = new Hono<HonoEnv>();

// --- CSA Schedules (Todo List) ---

csa.get('/csa/schedules', async (c) => {
  const db = getDb(c.env.DATABASE_URL);
  const orgId = c.get('organizationId');
  const items = await db.select().from(csaSchedules).where(eq(csaSchedules.organizationId, orgId));
  return ok(c, { items });
});

csa.post('/csa/schedules', async (c) => {
  const db = getDb(c.env.DATABASE_URL);
  const orgId = c.get('organizationId');
  const body = await c.req.json<any>();
  
  const id = crypto.randomUUID();
  await db.insert(csaSchedules).values({
    id,
    organizationId: orgId,
    title: body.title,
    dueDate: body.dueDate ? new Date(body.dueDate) : new Date(),
    status: 'Upcoming',
    targetRole: body.targetRole || 'Line 1',
    createdAt: new Date(),
  });

  return ok(c, { id });
});

csa.put('/csa/schedules/:id', async (c) => {
  const db = getDb(c.env.DATABASE_URL);
  const id = c.req.param('id');
  const orgId = c.get('organizationId');
  const body = await c.req.json<any>();
  
  await db.update(csaSchedules).set(body).where(and(eq(csaSchedules.id, id), eq(csaSchedules.organizationId, orgId)));
  return ok(c, { success: true });
});

csa.delete('/csa/schedules/:id', async (c) => {
  const db = getDb(c.env.DATABASE_URL);
  const id = c.req.param('id');
  const orgId = c.get('organizationId');
  
  await db.delete(csaSchedules).where(and(eq(csaSchedules.id, id), eq(csaSchedules.organizationId, orgId)));
  return ok(c, { success: true });
});

// --- CSA & Testing Refactored (Smart CSA) ---

csa.get('/csa/records', async (c) => {
  const db = getDb(c.env.DATABASE_URL);
  const orgId = c.get('organizationId');
  const controlId = c.req.query('controlId');
  
  let conditions: SQL = eq(csaRecords.organizationId, orgId);
  if (controlId) {
    conditions = and(conditions, eq(csaRecords.controlId, controlId)) as SQL;
  }

  const items = await db.select().from(csaRecords).where(conditions);
  return ok(c, { items });
});

csa.get('/csa/:id', async (c) => {
  const db = getDb(c.env.DATABASE_URL);
  const id = c.req.param('id');
  const orgId = c.get('organizationId');
  const item = await db.select().from(csaRecords).where(and(eq(csaRecords.id, id), eq(csaRecords.organizationId, orgId))).limit(1);
  if (item.length === 0) return notFound(c);
  return ok(c, item[0]);
});

csa.post('/csa/records', async (c) => {
  const db = getDb(c.env.DATABASE_URL);
  const orgId = c.get('organizationId');
  const userId = c.get('userId');
  const body = await c.req.json<Partial<CSARecord>>();

  const id = crypto.randomUUID();
  const newRecord = {
    id,
    organizationId: orgId,
    controlId: body.controlId!,
    period: body.period || new Date().getFullYear().toString(),
    status: "Draft",
    completionPercentage: 0,
    performedBy: userId,
    performedAt: new Date(),
  };

  await db.insert(csaRecords).values(newRecord);
  return ok(c, newRecord);
});

csa.delete('/csa/:id', async (c) => {
  const db = getDb(c.env.DATABASE_URL);
  const id = c.req.param('id');
  const orgId = c.get('organizationId');
  
  await db.delete(csaRecords).where(and(eq(csaRecords.id, id), eq(csaRecords.organizationId, orgId)));
  return ok(c, { success: true });
});

csa.get('/csa/samples', async (c) => {
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

csa.post('/csa/samples/batch', async (c) => {
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

// --- TestingWorkbench Routes ---

csa.post('/tests', async (c) => {
  // Alias for testing-records
  return c.redirect('/api/csa/testing-records', 307);
});

csa.get('/csa/testing-records', async (c) => {
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

csa.post('/csa/testing-records', async (c) => {
  const db = getDb(c.env.DATABASE_URL);
  const orgId = c.get('organizationId');
  const userId = c.get('userId');
  const body = await c.req.json<Partial<TestRecord>>();

  const id = crypto.randomUUID();
  const newRecord = {
    id,
    organizationId: orgId,
    controlId: body.controlId!,
    testType: body.testType || 'TOE',
    period: body.period || new Date().getFullYear().toString(),
    status: body.status || 'Draft',
    result: body.result || 'Effective',
    testerId: userId,
    testedAt: new Date(),
    sampleSize: body.sampleSize || 0,
    exceptionCount: body.exceptionCount || 0,
    conclusionRationale: body.conclusionRationale,
  };

  await db.insert(testRecords).values(newRecord);
  return ok(c, newRecord);
});

export default csa;
