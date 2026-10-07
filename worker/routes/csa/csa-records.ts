import { Hono } from "hono";
import type { HonoEnv } from '../../app';
import { ok, bad, notFound } from '../../lib/utils';
import { getDb } from '../../db';
import { csaRecords, csaSamples, controls, bpmProcesses } from '../../db/schema';
import { eq, and, SQL, sql } from 'drizzle-orm';
import { CsaDomainService } from "../../services/csa-domain-service";
import { DeficiencyService } from "../../services/deficiency-service";
import { AuditService } from "../../services/audit-service";
import { generateCsaPdf } from "../../lib/csa-pdf";
import { WorkflowTransitionEngine } from "../../services/workflow/workflow-transition-engine";

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
  if (year) conditions = and(conditions, sql`${csaRecords.period} LIKE ${'%' + year + '%'}`) as SQL;
  if (bpmProcessId) conditions = and(conditions, eq(csaRecords.bpmProcessId, bpmProcessId)) as SQL;
  if (scheduleId) conditions = and(conditions, eq(csaRecords.scheduleId, scheduleId)) as SQL;

  const items = await db.select().from(csaRecords).where(conditions);
  return ok(c, { items });
});

csaRecordsRoute.post('/csa', async (c) => {
  const db = getDb(c.env.DATABASE_URL);
  const orgId = c.get('organizationId');
  const userId = c.get('userId');
  const body = await c.req.json<any>();
  const service = new CsaDomainService(db);
  const result = await service.saveCsaRecord(orgId, userId, body, c.env);
  return ok(c, result);
});

csaRecordsRoute.post('/csa/:id/workflow', async (c) => {
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
  const transitionEngine = new WorkflowTransitionEngine(db, new AuditService(db));
  const transition = await transitionEngine.executeTransition({
    entityType: 'CSA',
    entityId: id,
    currentStatus,
    action: body.action,
    note: body.note,
    assigneeId: body.assigneeId
  }, {
    organizationId,
    userId,
    role
  });

  const nextStatus = transition.nextStatus;
  const currentHistory = (csaRecord.workflowHistory as any[]) || [];
  const newHistory = [transition.historyEntry, ...currentHistory];

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

csaRecordsRoute.delete('/csa/:id', async (c) => {
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
