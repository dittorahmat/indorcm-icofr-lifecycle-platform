import { Hono } from "hono";
import type { HonoEnv } from '../../app';
import { ok, bad, notFound } from '../../lib/utils';
import { getDb } from '../../db';
import { csaRecords, csaSamples, controls, bpmProcesses } from '../../db/schema';
import { eq, and, SQL, sql, or } from 'drizzle-orm';
import { CsaDomainService } from "../../services/csa-domain-service";
import { runWorkflowTransition } from "../../services/workflow/workflow-drizzle-adapter";
import { generateCsaPdf } from "../../lib/csa-pdf";
import type { WorkflowAction } from '@shared/types';
import { rbac } from '../../lib/guard';

export const csaRecordsRoute = new Hono<HonoEnv>();

csaRecordsRoute.get('/csa', async (c) => {
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
  if (year) {
    const yearNum = parseInt(year, 10);
    conditions = and(
      conditions,
      or(
        sql`${csaRecords.period} LIKE ${'%' + year + '%'}`,
        and(
          or(sql`${csaRecords.period} IS NULL`, sql`${csaRecords.period} = ''`, sql`NOT (${csaRecords.period} ~ '[0-9]{4}')`),
          sql`EXISTS (SELECT 1 FROM controls WHERE controls.id = ${csaRecords.controlId} AND controls.organization_id = ${orgId} AND controls.year = ${yearNum})`
        ),
        and(
          or(sql`${csaRecords.period} IS NULL`, sql`${csaRecords.period} = ''`, sql`NOT (${csaRecords.period} ~ '[0-9]{4}')`),
          sql`EXTRACT(YEAR FROM ${csaRecords.assessmentDate}) = ${yearNum}`
        )
      )
    ) as SQL;
  }
  if (bpmProcessId) conditions = and(conditions, eq(csaRecords.bpmProcessId, bpmProcessId)) as SQL;
  if (scheduleId) conditions = and(conditions, eq(csaRecords.scheduleId, scheduleId)) as SQL;

  const items = await db.select().from(csaRecords).where(conditions);
  return ok(c, { items });
});

csaRecordsRoute.get('/csa/:id', async (c) => {
  const db = getDb(c.env.DATABASE_URL);
  const orgId = c.get('organizationId');
  const id = c.req.param('id');

  const records = await db.select().from(csaRecords).where(and(
    eq(csaRecords.id, id),
    eq(csaRecords.organizationId, orgId)
  )).limit(1);

  if (records.length === 0) return notFound(c, 'CSA Record not found');
  const record = records[0];

  const samples = await db.select().from(csaSamples).where(eq(csaSamples.csaRecordId, id));
  return ok(c, { ...record, samples });
});

csaRecordsRoute.post('/csa', rbac(['Line 1', 'Admin']), async (c) => {
  const db = getDb(c.env.DATABASE_URL);
  const orgId = c.get('organizationId');
  const userId = c.get('userId');
  const body = await c.req.json<any>();
  const service = new CsaDomainService(db);
  const result = await service.saveCsaRecord(orgId, userId, body, c.env);
  return ok(c, result);
});

csaRecordsRoute.put('/csa/:id', rbac(['Line 1', 'Admin']), async (c) => {
  const db = getDb(c.env.DATABASE_URL);
  const orgId = c.get('organizationId');
  const userId = c.get('userId');
  const id = c.req.param('id');
  const existing = await db.select({ id: csaRecords.id }).from(csaRecords).where(and(
    eq(csaRecords.id, id),
    eq(csaRecords.organizationId, orgId)
  )).limit(1);
  if (existing.length === 0) return notFound(c, 'CSA Record not found');
  const body = await c.req.json<any>();
  const service = new CsaDomainService(db);
  const result = await service.saveCsaRecord(orgId, userId, { ...body, id }, c.env);
  return ok(c, result);
});

// Line 2 validates and advances what Line 1 filled in, so the CSA workflow keeps
// the repo's workflow-route role union.
csaRecordsRoute.post('/csa/:id/workflow', rbac(['Line 1', 'Line 2', 'Admin']), async (c) => {  const db = getDb(c.env.DATABASE_URL);
  const id = c.req.param('id');
  const body = await c.req.json<{ action: WorkflowAction; note?: string; assigneeId?: string }>();

  const result = await runWorkflowTransition(db, c.env, {
    entityType: 'CSA',
    entityId: id,
    organizationId: c.get('organizationId'),
    userId: c.get('userId'),
    role: c.get('userRole'),
    action: body.action,
    note: body.note,
    assigneeId: body.assigneeId,
  });
  return ok(c, result);
});

csaRecordsRoute.delete('/csa/:id', rbac(['Line 1', 'Admin']), async (c) => {
  const db = getDb(c.env.DATABASE_URL);
  const id = c.req.param('id');
  const orgId = c.get('organizationId');
  const service = new CsaDomainService(db);
  const deleted = await service.deleteCsaRecord(orgId, id);
  if (!deleted) return notFound(c);
  return ok(c, { success: true });
});

csaRecordsRoute.get('/csa/:id/export-pdf', async (c) => {
  const db = getDb(c.env.DATABASE_URL);
  const id = c.req.param('id');
  const orgId = c.get('organizationId');

  const records = await db.select().from(csaRecords).where(and(
    eq(csaRecords.id, id),
    eq(csaRecords.organizationId, orgId)
  )).limit(1);

  if (records.length === 0) return notFound(c, 'CSA Record not found');
  const record = records[0];

  let control: { code?: string; name?: string } | undefined;
  let processControls: Array<{ code?: string; name?: string; description?: string | null }> | undefined;

  if (record.controlId) {
    const controlRes = await db.select().from(controls).where(eq(controls.id, record.controlId)).limit(1);
    control = controlRes[0];
  } else if (record.bpmProcessId) {
    const processRes = await db.select().from(bpmProcesses).where(and(
      eq(bpmProcesses.id, record.bpmProcessId),
      eq(bpmProcesses.organizationId, orgId)
    )).limit(1);
    const bpmProcess = processRes[0];
    control = {
      code: bpmProcess?.bpmCode || 'BPM',
      name: bpmProcess?.name || 'Proses Bisnis',
    };
    const relatedControls = await db.select().from(controls).where(and(
      eq(controls.bpmProcessId, record.bpmProcessId),
      eq(controls.organizationId, orgId)
    ));
    processControls = relatedControls.map((rc) => ({
      code: rc.code,
      name: rc.name,
      description: rc.description,
    }));
  } else {
    return bad(c, 'INVALID_CSA_SCOPE', 'CSA Record has no associated control or process');
  }

  const samplesData = await db.select().from(csaSamples).where(eq(csaSamples.csaRecordId, id));

  try {
    const pdfOutput = await generateCsaPdf(record, control, samplesData, processControls);
    const rawFilename = control?.code || control?.name || 'EXPORT';
    const cleanFilename = rawFilename.replace(/[^a-zA-Z0-9_-]/g, '_');
    return new Response(pdfOutput, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="CSA_${cleanFilename}_${record.period || '2026'}.pdf"`
      }
    });
  } catch (err: any) {
    return bad(c, `Failed to generate PDF: ${err.message}`);
  }
});
