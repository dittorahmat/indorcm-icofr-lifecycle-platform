import { 
  csaRecords, csaSamples, csaSchedules, testRecords, 
  user, member, todEvaluations, controls, bpmProcesses
} from '../db/schema';
import { eq, and, desc, SQL } from 'drizzle-orm';
import type { DrizzleDb } from '../db';
import type { CSARecord, TestRecord } from "@shared/types";
import { AuditService } from './audit-service';
import { DeficiencyService } from './deficiency-service';
import { createNotificationAndSendEmail } from './email';

export class CsaDomainService {
  private auditService: AuditService;
  private defService: DeficiencyService;

  constructor(private db: DrizzleDb) {
    this.auditService = new AuditService(db);
    this.defService = new DeficiencyService(db);
  }

  async getSchedules(orgId: string) {
    return await this.db.select().from(csaSchedules)
      .where(eq(csaSchedules.organizationId, orgId))
      .orderBy(desc(csaSchedules.plannedDate));
  }

  async createSchedules(orgId: string, body: any, env: any) {
    const startDate = new Date(body.plannedDate);
    const schedulesToInsert = [];
    const frequency = body.recurringFrequency;
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
        bpmProcessId: body.bpmProcessId || null,
        description: body.description,
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
      await this.db.insert(csaSchedules).values(schedulesToInsert);
      
      if (body.assignedTo) {
        await createNotificationAndSendEmail({
          db: this.db,
          orgId,
          userId: body.assignedTo,
          message: `Baru: ${schedulesToInsert.length} jadwal CSA telah ditugaskan kepada Anda.`,
          type: 'info',
          link: '/csa',
          env,
        });
      }
    }

    return { count: schedulesToInsert.length };
  }

  async saveCsaRecord(orgId: string, userId: string, body: any, env: any) {
    const id = body.id || crypto.randomUUID();
    const isDraft = body.isDraft ?? false;
    const assessmentDate = body.assessmentDate ? new Date(body.assessmentDate) : new Date();

    const newCsa: any = {
      id,
      organizationId: orgId,
      controlId: body.controlId || null,
      bpmProcessId: body.bpmProcessId || null,
      scheduleId: body.scheduleId || null,
      period: body.period,
      assessmentDate,
      assessedBy: userId,
      result: body.result || 'Effective',
      comments: body.notes || body.comments,
      isDraft,
      line2Status: 'Pending',
      workflowStatus: isDraft ? 'Draft' : 'In Review',
    };

    const existingRecord = await this.db.select().from(csaRecords).where(and(
      eq(csaRecords.id, id),
      eq(csaRecords.organizationId, orgId)
    )).limit(1);

    if (existingRecord.length > 0) {
      delete newCsa.createdAt;
      await this.db.update(csaRecords).set(newCsa).where(eq(csaRecords.id, id));
    } else {
      await this.db.insert(csaRecords).values(newCsa);
    }

    if (body.scheduleId) {
      await this.db.update(csaSchedules)
        .set({ status: isDraft ? 'In Progress' : 'Completed' })
        .where(and(
          eq(csaSchedules.id, body.scheduleId),
          eq(csaSchedules.organizationId, orgId)
        ));
    }

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
        await this.db.insert(csaSamples).values(samplesToInsert);
      }
    }

    if (!isDraft && newCsa.result === 'Ineffective') {
      // ARCHITECTURAL DECISION (OPTION B - BPM-Centric Single Card):
      // Instead of polluting the Kanban board with multiple cards for a single assessment session,
      // we generate exactly 1 consolidated deficiency card per CSA BPM assessment.
      // Retesting will occur in context on the whole BPM sheet (CSATabContent).
      const failedControlIds = new Set<string>();
      if (body.samples && Array.isArray(body.samples)) {
        for (const sample of body.samples) {
          if (sample.controlResults && typeof sample.controlResults === 'object') {
            for (const [ctrlId, val] of Object.entries<any>(sample.controlResults)) {
              if (val && val.implemented === false) {
                failedControlIds.add(ctrlId);
              }
            }
          }
        }
      }

      // Fetch BPM Process Name for prominent title
      let bpmProcessName = "Sub-Proses Bisnis";
      if (newCsa.bpmProcessId) {
        const bpm = await this.db.query.bpmProcesses.findFirst({
          where: eq(bpmProcesses.id, newCsa.bpmProcessId),
          columns: { name: true, noGL: true }
        });
        if (bpm) {
          bpmProcessName = `${bpm.name} (${bpm.noGL})`;
        }
      }

      let description = `Hasil CSA Ineffective untuk proses ${bpmProcessName} (periode ${newCsa.period}).`;
      if (failedControlIds.size > 0) {
        description += ` Kontrol gagal: ${Array.from(failedControlIds).join(', ')}.`;
      }

      await this.defService.createAutoDeficiency({
        organizationId: orgId,
        controlId: null,
        description,
        source: 'Lini 1 - CSA',
        userId,
        period: newCsa.period
      });
    }

    await this.auditService.logAction({
      organizationId: orgId,
      userId,
      action: 'SIGN_OFF_CSA',
      entityType: 'Control',
      entityId: newCsa.controlId,
      description: `Completed CSA for ${newCsa.period} with result: ${newCsa.result}`,
      dataAfter: { csaId: id, ...newCsa },
      isRegulatory: true,
      effectiveDate: assessmentDate,
      approvedBy: userId
    });

    if (!isDraft) {
      const line2Users = await this.db.select({ id: user.id })
        .from(user)
        .innerJoin(member, eq(user.id, member.userId))
        .where(and(
          eq(member.organizationId, orgId),
          eq(member.role, 'Line 2')
        ));
      
      if (line2Users.length > 0) {
        for (const u of line2Users) {
          await createNotificationAndSendEmail({
            db: this.db,
            orgId,
            userId: u.id,
            message: `Pemberitahuan: Laporan CSA untuk periode ${newCsa.period} telah di-sign off oleh Lini 1. Segera lakukan verifikasi desain (Lampiran 8).`,
            type: 'warning',
            link: '/csa',
            env,
          });
        }
      }
    }

    return newCsa;
  }

  async deleteCsaRecord(orgId: string, id: string) {
    const records = await this.db.select().from(csaRecords)
      .where(and(eq(csaRecords.id, id), eq(csaRecords.organizationId, orgId))).limit(1);

    if (records.length === 0) return false;
    const record = records[0];

    await this.db.delete(csaSamples).where(eq(csaSamples.csaRecordId, id));
    await this.db.delete(csaRecords).where(and(eq(csaRecords.id, id), eq(csaRecords.organizationId, orgId)));

    if (record.scheduleId) {
      await this.db.update(csaSchedules)
        .set({ status: 'Not Started' })
        .where(and(eq(csaSchedules.id, record.scheduleId), eq(csaSchedules.organizationId, orgId)));
    }

    return true;
  }
}
