import { Hono } from "hono";
import type { HonoEnv } from '../app';
import { ok, bad, notFound } from '../lib/utils';
import { getDb } from '../db';
import { 
  csaRecords, csaSamples, csaSchedules, testRecords, 
  controls, testSamples, todEvaluations, bpmProcesses
} from '../db/schema';
import { eq, and, desc, SQL, sql } from 'drizzle-orm';
import type { TestRecord } from "@shared/types";
import { generateCsaPdf } from "../lib/csa-pdf";
import { AuditService } from "../services/audit-service";
import { DeficiencyService } from "../services/deficiency-service";
import { CsaDomainService } from "../services/csa-domain-service";
import { rbac } from "../lib/guard";

const csa = new Hono<HonoEnv>();

csa.get('/csa/schedules', async (c) => {
  const db = getDb(c.env.DATABASE_URL);
  const orgId = c.get('organizationId');
  const service = new CsaDomainService(db);
  const items = await service.getSchedules(orgId);
  return ok(c, { items });
});

csa.post('/csa/schedules', async (c) => {
  const db = getDb(c.env.DATABASE_URL);
  const orgId = c.get('organizationId');
  const body = await c.req.json<any>();
  const service = new CsaDomainService(db);
  const result = await service.createSchedules(orgId, body, c.env);
  return ok(c, result);
});

csa.patch('/csa/schedules/:id', async (c) => {
  const db = getDb(c.env.DATABASE_URL);
  const id = c.req.param('id');
  const orgId = c.get('organizationId');
  const body = await c.req.json<any>();

  const updateData = { ...body };
  if (updateData.bpmProcessId === '') updateData.bpmProcessId = null;
  if (updateData.plannedDate) updateData.plannedDate = new Date(updateData.plannedDate);

  await db.update(csaSchedules)
    .set(updateData)
    .where(and(eq(csaSchedules.id, id), eq(csaSchedules.organizationId, orgId)));
  return ok(c, { success: true });
});

csa.delete('/csa/schedules/:id', async (c) => {
  const db = getDb(c.env.DATABASE_URL);
  const id = c.req.param('id');
  const orgId = c.get('organizationId');

  await db.delete(csaSchedules)
    .where(and(eq(csaSchedules.id, id), eq(csaSchedules.organizationId, orgId)));
  return ok(c, { success: true });
});

csa.get('/csa', async (c) => {
  const db = getDb(c.env.DATABASE_URL);
  const orgId = c.get('organizationId');
  const controlId = c.req.query('controlId');
  const period = c.req.query('period');
  const year = c.req.query('year');
  const bpmProcessId = c.req.query('bpmProcessId');
  const scheduleId = c.req.query('scheduleId');

  let conditions: SQL = eq(csaRecords.organizationId, orgId);
  if (controlId) conditions = and(conditions, eq(csaRecords.controlId, controlId)) as SQL;
  if (period) conditions = and(conditions, eq(csaRecords.period, period)) as SQL;
  if (year) conditions = and(conditions, sql`${csaRecords.period} LIKE ${'%' + year + '%'}`) as SQL;
  if (bpmProcessId) conditions = and(conditions, eq(csaRecords.bpmProcessId, bpmProcessId)) as SQL;
  if (scheduleId) conditions = and(conditions, eq(csaRecords.scheduleId, scheduleId)) as SQL;

  const items = await db.select().from(csaRecords).where(conditions);
  return ok(c, { items });
});

csa.post('/csa', async (c) => {
  const db = getDb(c.env.DATABASE_URL);
  const orgId = c.get('organizationId');
  const userId = c.get('userId');
  const body = await c.req.json<any>();
  const service = new CsaDomainService(db);
  const result = await service.saveCsaRecord(orgId, userId, body, c.env);
  return ok(c, result);
});

csa.post('/csa/:id/workflow', async (c) => {
  const db = getDb(c.env.DATABASE_URL);
  const id = c.req.param('id');
  const orgId = c.get('organizationId')!;
  const userId = c.get('userId')!;
  const role = c.get('userRole')!;
  const body = await c.req.json<{ action: any, note: string, assigneeId?: string }>();

  const existing = await db.select().from(csaRecords).where(and(eq(csaRecords.id, id), eq(csaRecords.organizationId, orgId))).limit(1);
  if (existing.length === 0) return notFound(c, 'CSA record not found');

  const csaRecord = existing[0];
  const currentStatus = csaRecord.workflowStatus || (csaRecord.line2Status === 'Validated' ? 'Validated' : (csaRecord.isDraft ? 'Draft' : 'In Review'));
  let nextStatus = currentStatus;

  if (body.action === "Submit") {
    nextStatus = "In Review";
  } else if (body.action === "Approve") {
    nextStatus = "Validated";
  } else if (body.action === "Reject") {
    if (!body.note) return bad(c, "Rejection requires a note");
    nextStatus = "Draft";
  } else if (body.action === "Rollback") {
    if (!body.note) return bad(c, "Rollback requires a note");
    nextStatus = "In Review";
  }

  const historyEntry = {
    id: crypto.randomUUID(),
    action: body.action,
    fromStatus: currentStatus,
    toStatus: nextStatus,
    userId,
    role,
    timestamp: Date.now(),
    note: body.note || ''
  };

  const currentHistory = (csaRecord.workflowHistory as any[]) || [];
  const newHistory = [historyEntry, ...currentHistory];

  const updateData: any = {
    workflowStatus: nextStatus,
    workflowHistory: newHistory,
    isDraft: nextStatus === 'Draft',
    line2Status: nextStatus === 'Validated' ? 'Validated' : (nextStatus === 'Draft' ? 'Pending' : 'In Review')
  };

  if (nextStatus === 'Validated') {
    updateData.line2ValidatedBy = userId;
    updateData.line2ValidatedDate = new Date();

    if (csaRecord.result === 'Ineffective') {
      const defService = new DeficiencyService(db);
      if (csaRecord.controlId) {
        await defService.createAutoDeficiency({
          organizationId: orgId,
          controlId: csaRecord.controlId,
          description: `Hasil CSA Ineffective untuk periode ${csaRecord.period}.`,
          source: 'Lini 2 - CSA Validation',
          userId,
          period: csaRecord.period
        });
      } else {
        // Query samples to find failed controls for description
        const samples = await db.select().from(csaSamples).where(eq(csaSamples.csaRecordId, id));
        const failedControlIds = new Set<string>();
        for (const sample of samples) {
          if (sample.controlResults && typeof sample.controlResults === 'object') {
            for (const [ctrlId, val] of Object.entries<any>(sample.controlResults)) {
              if (val && val.implemented === false) {
                failedControlIds.add(ctrlId);
              }
            }
          }
        }

        let bpmProcessName = "Sub-Proses Bisnis";
        if (csaRecord.bpmProcessId) {
          const bpm = await db.query.bpmProcesses.findFirst({
            where: eq(bpmProcesses.id, csaRecord.bpmProcessId),
            columns: { name: true, noGL: true }
          });
          if (bpm) {
            bpmProcessName = `${bpm.name} (${bpm.noGL})`;
          }
        }

        let description = `Hasil CSA Ineffective untuk proses ${bpmProcessName} (periode ${csaRecord.period}).`;
        if (failedControlIds.size > 0) {
          description += ` Kontrol gagal: ${Array.from(failedControlIds).join(', ')}.`;
        }

        await defService.createAutoDeficiency({
          organizationId: orgId,
          controlId: null,
          description,
          source: 'Lini 2 - CSA Validation',
          userId,
          period: csaRecord.period
        });
      }
    }

    const auditService = new AuditService(db);
    await auditService.logAction({
      organizationId: orgId,
      userId,
      action: 'SIGN_OFF_CSA',
      entityType: 'Control',
      entityId: csaRecord.controlId || csaRecord.id,
      description: `Validated CSA for ${csaRecord.period} with result: ${csaRecord.result}`,
      dataAfter: { csaId: id, ...csaRecord, ...updateData },
      isRegulatory: true,
      effectiveDate: new Date(),
      approvedBy: userId
    });
  }

  await db.update(csaRecords).set(updateData).where(eq(csaRecords.id, id));
  return ok(c, { success: true, nextStatus });
});

csa.delete('/csa/:id', async (c) => {
  const db = getDb(c.env.DATABASE_URL);
  const id = c.req.param('id');
  const orgId = c.get('organizationId');
  const service = new CsaDomainService(db);
  const deleted = await service.deleteCsaRecord(orgId, id);
  if (!deleted) return notFound(c);
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

  if (!record.controlId) return bad(c, 'CSA Record has no associated control');
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

// --- TOD (Lampiran 8) Routes ---

csa.get('/tod-evaluations', async (c) => {
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

csa.post('/tod-evaluations', rbac(['Line 2', 'Admin']), async (c) => {
  const db = getDb(c.env.DATABASE_URL);
  const orgId = c.get('organizationId');
  const userId = c.get('userId');
  const body = await c.req.json<any>();

  if (!body.csaId || !body.controlId) return bad(c, "csaId and controlId are required");

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
    conclusion: body.conclusion,
    comment: body.comment,
    updatedAt: new Date(),
  };

  if (existing.length > 0) {
    await db.update(todEvaluations)
      .set(values)
      .where(eq(todEvaluations.id, existing[0].id));
    
    if (body.conclusion === 'Ineffective') {
       const defService = new DeficiencyService(db);
       await defService.createAutoDeficiency({
         organizationId: orgId,
         controlId: body.controlId,
         description: `Hasil Verifikasi Desain (TOD) Ineffective.`,
         source: 'Lini 2 - TOD Review',
         userId,
         period: 'TOD-Evaluation'
       });
    }
    return ok(c, { ...existing[0], ...values });
  } else {
    const newId = crypto.randomUUID();
    await db.insert(todEvaluations).values({ id: newId, ...values, createdAt: new Date() });
    
    if (body.conclusion === 'Ineffective') {
       const defService = new DeficiencyService(db);
       await defService.createAutoDeficiency({
         organizationId: orgId,
         controlId: body.controlId,
         description: `Hasil Verifikasi Desain (TOD) Ineffective.`,
         source: 'Lini 2 - TOD Review',
         userId,
         period: 'TOD-Evaluation'
       });
    }
    return ok(c, { id: newId, ...values });
  }
});

// --- TestingWorkbench Routes ---

csa.get('/tests', async (c) => {
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

csa.post('/tests', async (c) => {
  const db = getDb(c.env.DATABASE_URL);
  const orgId = c.get('organizationId');
  const userId = c.get('userId');
  const body = await c.req.json<any>();

  const id = crypto.randomUUID();
  const newRecord = {
    id,
    organizationId: orgId,
    controlId: body.controlId!,
    testType: body.testType || 'TOE',
    period: body.period || new Date().getFullYear().toString(),
    result: body.result || 'Effective',
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

  if (body.result === 'Ineffective') {
     const defService = new DeficiencyService(db);
     await defService.createAutoDeficiency({
       organizationId: orgId,
       controlId: body.controlId!,
       description: `Hasil Pengujian ${body.testType} Ineffective: ${body.comments || 'No comments.'}`,
       source: 'Lini 3 - Audit',
       userId,
       period: body.period || new Date().getFullYear().toString()
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
