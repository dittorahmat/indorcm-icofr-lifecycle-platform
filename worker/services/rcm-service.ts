import { eq, and } from 'drizzle-orm';
import { rcms, rcmControls, controls, bpmNodeRcms, bpmDiagrams, bpmProcesses } from '../db/schema';
import type { DrizzleDb } from '../db';
import type { RCM } from '@shared/types';
import { AuditService } from './audit-service';

export class RcmService {
  private audit: AuditService;

  constructor(private db: DrizzleDb) {
    this.audit = new AuditService(db);
  }

  async getAll(orgId: string, year?: number) {
    let conditions = eq(rcms.organizationId, orgId);
    if (year) {
      conditions = and(conditions, eq(rcms.year, year)) as any;
    }
    return this.db.select().from(rcms).where(conditions);
  }

  async create(orgId: string, userId: string, data: Partial<RCM>) {
    const id = crypto.randomUUID();
    const newItem = {
      id,
      organizationId: orgId,
      process: data.process || "New Process",
      subProcess: data.subProcess || "New Sub-Process",
      riskDescription: data.riskDescription || "New Risk",
      isFraudRelated: data.isFraudRelated ?? false,
      riskRating: data.riskRating || "Medium",
      status: "Draft",
      year: data.year,
    };

    await this.db.insert(rcms).values(newItem as any);
    await this.audit.logAction({
      organizationId: orgId,
      userId,
      action: 'CREATE',
      entityType: 'RCM',
      entityId: id,
      dataAfter: newItem,
    });

    return newItem;
  }

  async update(orgId: string, userId: string, id: string, data: Partial<RCM>, role: string) {
    const [existing] = await this.db.select().from(rcms).where(and(eq(rcms.id, id), eq(rcms.organizationId, orgId))).limit(1);
    if (!existing) throw new Error('RCM not found');

    if (role === 'Line 1') {
      await this.db.update(rcms).set({ status: 'Pending Change Approval' }).where(eq(rcms.id, id));
      return { message: "Change request submitted" };
    }

    const updateData: any = {};
    if (data.riskDescription !== undefined) updateData.riskDescription = data.riskDescription;
    if (data.isFraudRelated !== undefined) updateData.isFraudRelated = data.isFraudRelated;
    if (data.riskRating !== undefined) updateData.riskRating = data.riskRating;
    if (data.status !== undefined) updateData.status = data.status;

    if (Object.keys(updateData).length > 0) {
      await this.db.update(rcms).set(updateData).where(eq(rcms.id, id));
      await this.audit.logAction({
        organizationId: orgId,
        userId,
        action: 'UPDATE',
        entityType: 'RCM',
        entityId: id,
        dataBefore: existing,
        dataAfter: { ...existing, ...updateData },
      });
    }

    return { success: true };
  }

  async validate(orgId: string, userId: string, id: string) {
    await this.db.update(rcms).set({ status: 'Active' }).where(and(eq(rcms.id, id), eq(rcms.organizationId, orgId)));
    await this.audit.logAction({
      organizationId: orgId,
      userId,
      action: 'VALIDATE',
      entityType: 'RCM',
      entityId: id,
      description: "RCM Design Validated and Activated",
    });
    return { success: true };
  }

  async approveChange(orgId: string, userId: string, id: string, category?: string, effectiveDate?: Date) {
    await this.db.update(rcms).set({ status: 'Active' }).where(and(eq(rcms.id, id), eq(rcms.organizationId, orgId)));
    const rcm = await this.db.select().from(rcms).where(and(eq(rcms.id, id), eq(rcms.organizationId, orgId))).then(rows => rows[0]);
    
    await this.audit.logAction({
      organizationId: orgId,
      userId,
      action: 'APPROVE_CHANGE',
      entityType: 'RCM',
      entityId: id,
      description: rcm ? `Approved change to RCM: ${rcm.process} - ${rcm.subProcess}` : "RCM Design Approved",
      dataAfter: rcm ? rcm : undefined,
      isRegulatory: true,
      effectiveDate: effectiveDate || new Date(),
      approvedBy: userId,
      changeCategory: category
    });
    return { success: true };
  }

  async delete(orgId: string, id: string) {
    await this.db.update(controls)
      .set({ rcmId: null })
      .where(and(eq(controls.rcmId, id), eq(controls.organizationId, orgId)));
    await this.db.delete(rcms).where(and(eq(rcms.id, id), eq(rcms.organizationId, orgId)));
    return { success: true };
  }
}
