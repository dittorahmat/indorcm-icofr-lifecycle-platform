import { Hono } from "hono";
import type { HonoEnv } from '../app';
import { ok, bad, notFound } from '../lib/utils';
import { getDb } from '../db';
import { 
  csaRecords, csaSamples, csaSchedules, testRecords, auditLogs, 
  controls, rcms, rcmControls, deficiencies
} from '../db/schema';
import { eq, and, sql, desc, SQL } from 'drizzle-orm';
import type { CSARecord, TestRecord, Deficiency } from "@shared/types";
import { generateCsaPdf } from "../lib/csa-pdf";

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

  const startDate = new Date(body.plannedDate);
  const schedulesToInsert = [];
  const frequency = body.recurringFrequency;

  // Generate up to 12 instances or 1 year of schedules
  const iterations = frequency ? (frequency === 'Annual' ? 2 : 12) : 1;

  for (let i = 0; i < iterations; i++) {
    let plannedDate = new Date(startDate);
    if (frequency === 'Monthly') {
      plannedDate.setMonth(startDate.getMonth() + i);
    } else if (frequency === 'Quarterly') {
      plannedDate.setMonth(startDate.getMonth() + (i * 3));
    } else if (frequency === 'Semi-Annual') {
      plannedDate.setMonth(startDate.getMonth() + (i * 6));
    } else if (frequency === 'Annual') {
      plannedDate.setFullYear(startDate.getFullYear() + i);
    }

    schedulesToInsert.push({
      id: crypto.randomUUID(),
      organizationId: orgId,
      bpmProcessId: body.bpmProcessId,
      plannedDate,
      type: body.type || 'CSA',
      assignedTo: body.assignedTo,
      recurringFrequency: frequency,
      status: 'Not Started',
      createdAt: new Date(),
    });

    if (!frequency) break;
  }

  if (schedulesToInsert.length > 0) {
    await db.insert(csaSchedules).values(schedulesToInsert);
  }

  return ok(c, { count: schedulesToInsert.length });
});

csa.put('/csa/schedules/:id', async (c) => {
  const db = getDb(c.env.DATABASE_URL);
  const id = c.req.param('id');
  const orgId = c.get('organizationId');
  const body = await c.req.json<any>();

  await db.update(csaSchedules)
    .set({ ...body, plannedDate: body.plannedDate ? new Date(body.plannedDate) : undefined })
    .where(and(eq(csaSchedules.id, id), eq(csaSchedules.organizationId, orgId)));
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

csa.get('/csa', async (c) => {
  const db = getDb(c.env.DATABASE_URL);
  const orgId = c.get('organizationId');
  const controlId = c.req.query('controlId');
  const bpmProcessId = c.req.query('bpmProcessId');
  const scheduleId = c.req.query('scheduleId');

  let conditions = eq(csaRecords.organizationId, orgId);
  if (controlId) conditions = and(conditions, eq(csaRecords.controlId, controlId)) as SQL;
  if (bpmProcessId) conditions = and(conditions, eq(csaRecords.bpmProcessId, bpmProcessId)) as SQL;
  if (scheduleId) conditions = and(conditions, eq(csaRecords.scheduleId, scheduleId)) as SQL;

  const items = await db.select().from(csaRecords)
    .where(conditions)
    .orderBy(desc(csaRecords.assessmentDate));

  return ok(c, { items });
});

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

  const records = await db.select().from(csaRecords).where(and(
    eq(csaRecords.id, id),
    eq(csaRecords.organizationId, orgId)
  )).limit(1);

  if (records.length === 0) return notFound(c, 'CSA Record not found');

  const record = records[0];
  const samplesData = await db.select().from(csaSamples).where(eq(csaSamples.csaRecordId, id));

  return ok(c, {
    ...record,
    samples: samplesData.map((s: any) => ({
      id: s.id,
      sampleRef: s.sampleRef,
      glRowId: s.glRowId,
      controlResults: s.controlResults,
      itacExpectedResult: s.itacExpectedResult,
      itacActualResult: s.itacActualResult,
      itacMatch: s.itacMatch
    }))
  });
});

csa.post('/csa', async (c) => {
  const db = getDb(c.env.DATABASE_URL);
  const orgId = c.get('organizationId');
  const userId = c.get('userId');
  const body = await c.req.json();

  const id = crypto.randomUUID();
  const assessmentDate = new Date();

  const newCsa = {
    id,
    organizationId: orgId,
    controlId: body.controlId,
    bpmProcessId: body.bpmProcessId,
    scheduleId: body.scheduleId,
    period: body.period || "2024-Q1",
    assessmentDate,
    assessedBy: userId,
    result: body.result || "Effective",
    comments: body.comments,
    isDraft: body.isDraft ?? false,
    isBpmConfirmed: body.isBpmConfirmed ?? false,
    samplingMethodology: body.samplingMethodology,
    documentList: body.documentList,
    testProcedure: body.testProcedure,
    archiveLocation: body.archiveLocation,

    // Forensic Metadata
    gpsVerified: body.gpsVerified ?? false,
    latitude: body.latitude,
    longitude: body.longitude,
    timestampVerified: body.timestampVerified ?? false,
    capturedAt: body.capturedAt ? new Date(body.capturedAt) : null,
    hash: body.hash,
    biometricVerified: body.biometricVerified ?? false,
  };

  const isDraft = body.isDraft ?? false;

  // 1. Validation: Enforce Granular Evidence for Effective results (Skip if draft)
  if (!isDraft && body.result === 'Effective' && body.samples) {
    for (const sample of body.samples) {
      if (sample.controlResults) {
        const results = Object.values(sample.controlResults) as any[];
        const missingEvidence = results.some(r => r.implemented && !r.evidenceUrl);
        if (missingEvidence) {
          return bad(c, "Setiap poin verifikasi yang 'Pass' wajib melampirkan bukti (evidence) sebelum sign-off.");
        }
      }
    }
  }

  // 2. Insert Record
  await db.insert(csaRecords).values(newCsa);

  // 3. Update Schedule Status if provided
  if (body.scheduleId) {
    await db.update(csaSchedules)
      .set({ status: isDraft ? 'In Progress' : 'Completed' })
      .where(and(
        eq(csaSchedules.id, body.scheduleId),
        eq(csaSchedules.organizationId, orgId)
      ));
  }

  // 4. Insert Samples
  if (body.samples && Array.isArray(body.samples)) {
    const samplesToInsert = body.samples.map((sample: any) => ({
      id: crypto.randomUUID(),
      organizationId: orgId,
      csaRecordId: id,
      glRowId: sample.glRowId,
      sampleRef: sample.sampleRef,
      controlResults: sample.controlResults,
      itacExpectedResult: sample.itacExpectedResult,
      itacActualResult: sample.itacActualResult,
      itacMatch: sample.itacMatch
    }));
    if (samplesToInsert.length > 0) {
      await db.insert(csaSamples).values(samplesToInsert);
    }
  }

  // 5. Auto-Deficiency logic
  if (!isDraft && newCsa.result === 'Ineffective') {
    await db.insert(deficiencies).values({
      id: crypto.randomUUID(),
      organizationId: orgId,
      controlId: newCsa.controlId,
      description: `CSA result for ${newCsa.period} is Ineffective. Comments: ${newCsa.comments || 'No comments provided.'}`,
      severity: 'Control Deficiency',
      identifiedDate: assessmentDate,
      identifiedBy: userId,
      status: 'Open'
    });
  }

  // 6. Audit Log
  await db.insert(auditLogs).values({
    id: crypto.randomUUID(),
    organizationId: orgId,
    userId: userId,
    action: 'SIGN_OFF_CSA',
    entityType: 'Control',
    entityId: newCsa.controlId,
    descriptionAfter: `Completed CSA for ${newCsa.period} with result: ${newCsa.result}`,
    dataAfter: { csaId: id, ...newCsa },
    isRegulatory: true,
    effectiveDate: assessmentDate,
    approvedBy: userId
  });

  return ok(c, newCsa);
});

csa.delete('/csa/:id', async (c) => {
  const db = getDb(c.env.DATABASE_URL);
  const id = c.req.param('id');
  const orgId = c.get('organizationId');

  // 1. Find the record
  const records = await db.select().from(csaRecords)
    .where(and(eq(csaRecords.id, id), eq(csaRecords.organizationId, orgId))).limit(1);

  if (records.length === 0) return notFound(c);
  const record = records[0];

  // 2. Cascading delete
  await db.delete(csaSamples).where(eq(csaSamples.csaRecordId, id));
  await db.delete(csaRecords).where(and(eq(csaRecords.id, id), eq(csaRecords.organizationId, orgId)));

  // 3. Reset schedule status
  if (record.scheduleId) {
    await db.update(csaSchedules)
      .set({ status: 'Not Started' })
      .where(and(eq(csaSchedules.id, record.scheduleId), eq(csaSchedules.organizationId, orgId)));
  }

  return ok(c, { success: true });
});

csa.get('/csa/:id/export-pdf', async (c) => {
  const db = getDb(c.env.DATABASE_URL);
  const id = c.req.param('id');
  const orgId = c.get('organizationId');

  const records = await db.select().from(csaRecords).where(and(
    eq(csaRecords.id, id),
    eq(csaRecords.organizationId, orgId)
  )).limit(1);

  if (records.length === 0) return notFound(c, 'CSA Record not found');
  const record = records[0];

  const controlRes = await db.select().from(controls).where(eq(controls.id, record.controlId)).limit(1);
  const control = controlRes[0];
  const samplesData = await db.select().from(csaSamples).where(eq(csaSamples.csaRecordId, id));

  try {
    const pdfOutput = await generateCsaPdf(record, control, samplesData);
    return new Response(pdfOutput, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="CSA_${control?.code || 'EXPORT'}_${record.period}.pdf"`
      }
    });
  } catch (err: any) {
    console.error('PDF Gen Error:', err);
    return bad(c, `Failed to generate PDF: ${err.message}`);
  }
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

export default csa;
