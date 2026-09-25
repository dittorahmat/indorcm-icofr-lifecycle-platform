import { eq, and } from 'drizzle-orm';
import { controls, rcmControls, auditLogs } from '../db/schema';
import type { DrizzleDb } from '../db';
import type { Control } from '@shared/types';
import { AuditService } from './audit-service';

export class ControlService {
  private audit: AuditService;

  constructor(private db: DrizzleDb) {
    this.audit = new AuditService(db);
  }

  async getAll(orgId: string, level?: string, year?: number) {
    let conditions = eq(controls.organizationId, orgId);
    if (level) {
      conditions = and(conditions, eq(controls.level, level as any)) as any;
    }
    if (year) {
      conditions = and(conditions, eq(controls.year, year)) as any;
    }
    return this.db.select().from(controls).where(conditions);
  }

  async getById(orgId: string, id: string) {
    const [item] = await this.db.select().from(controls).where(and(eq(controls.id, id), eq(controls.organizationId, orgId))).limit(1);
    return item;
  }

  async create(orgId: string, userId: string, userLevel: string, userRole: string, data: Partial<Control>) {
    const id = crypto.randomUUID();
    const newControl = {
      id,
      organizationId: orgId,
      rcmId: data.rcmId,
      code: data.code || "CTRL-TBD",
      name: data.name || "New Control",
      description: data.description,
      ownerId: data.ownerId || userId,
      type: data.type || "Preventive",
      nature: data.nature || "Manual",
      frequency: data.frequency || "Monthly",
      bpmStatus: (userRole === 'Line 1' && userLevel === 'Staff') ? 'Draft' : 'Approved',
      fsliCodes: data.fsliCodes || [],
      businessProcess: data.businessProcess,
      subProcess: data.subProcess,
      location: data.location,
      isFraudRelated: data.isFraudRelated || false,
      isKeyControl: data.isKeyControl || false,
      ipo: data.ipos, // Matches schema field name mapping from shared type
      assertions: data.assertions,
      cosoPrinciples: data.cosoPrinciples,
      supportingDocs: data.supportingDocs,
      reference: data.reference,
      applicationId: data.applicationId,
      bpmProcessId: data.bpmProcessId,
      year: data.year,
    };

    await this.db.insert(controls).values(newControl as any);
    await this.audit.logAction({
      organizationId: orgId,
      userId,
      action: 'CREATE',
      entityType: 'Control',
      entityId: id,
      dataAfter: newControl,
    });

    return newControl;
  }

  async update(orgId: string, userId: string, id: string, data: Partial<Control>) {
    const [existing] = await this.db.select().from(controls).where(and(eq(controls.id, id), eq(controls.organizationId, orgId))).limit(1);
    if (!existing) throw new Error('Control not found');

    await this.db.update(controls)
      .set({
        ...data,
        updatedAt: new Date() as any,
      } as any)
      .where(eq(controls.id, id));
    
    await this.audit.logAction({
      organizationId: orgId,
      userId,
      action: 'UPDATE',
      entityType: 'Control',
      entityId: id,
      dataBefore: existing,
      dataAfter: { ...existing, ...data },
    });

    return { success: true };
  }

  async approve(orgId: string, userId: string, id: string, category?: string, effectiveDate?: Date) {
    await this.db.update(controls).set({ bpmStatus: 'Approved' }).where(and(eq(controls.id, id), eq(controls.organizationId, orgId)));
    const ctrl = await this.db.select().from(controls).where(and(eq(controls.id, id), eq(controls.organizationId, orgId))).then(rows => rows[0]);
    
    await this.audit.logAction({
      organizationId: orgId,
      userId,
      action: 'APPROVE_CHANGE',
      entityType: 'Control',
      entityId: id,
      description: ctrl ? `Approved change to Control: ${ctrl.name || id}` : "Updated & Approved via Workflow",
      dataAfter: ctrl ? ctrl : undefined,
      isRegulatory: true,
      effectiveDate: effectiveDate || new Date(),
      approvedBy: userId,
      changeCategory: category
    });
    return { success: true };
  }

  async submitForApproval(orgId: string, userId: string, id: string) {
    await this.db.update(controls).set({ bpmStatus: 'Pending Approval' }).where(and(eq(controls.id, id), eq(controls.organizationId, orgId)));
    const ctrl = await this.db.select().from(controls).where(and(eq(controls.id, id), eq(controls.organizationId, orgId))).then(rows => rows[0]);
    await this.audit.logAction({
      organizationId: orgId,
      userId,
      action: 'UPDATE',
      entityType: 'Control',
      entityId: id,
      description: "Submitted for approval",
      dataAfter: ctrl || undefined,
      isRegulatory: true,
      effectiveDate: new Date()
    });
    return { success: true };
  }

  async reject(orgId: string, userId: string, id: string, note?: string) {
    await this.db.update(controls).set({ bpmStatus: 'Rejected' }).where(and(eq(controls.id, id), eq(controls.organizationId, orgId)));
    const ctrl = await this.db.select().from(controls).where(and(eq(controls.id, id), eq(controls.organizationId, orgId))).then(rows => rows[0]);
    await this.audit.logAction({
      organizationId: orgId,
      userId,
      action: 'UPDATE',
      entityType: 'Control',
      entityId: id,
      description: `Rejected changes. Note: ${note || 'No note provided'}`,
      dataAfter: ctrl || undefined,
      isRegulatory: true,
      effectiveDate: new Date()
    });
    return { success: true };
  }

  async delete(orgId: string, id: string, role: string) {
    const originalDb = this.db;
    return await originalDb.transaction(async (tx) => {
      this.db = tx;
      try {
        const [control] = await this.db.select().from(controls).where(and(eq(controls.id, id), eq(controls.organizationId, orgId))).limit(1);
        if (!control) throw new Error('Control not found');

        if (control.level === 'ELC') {
          if (role !== 'Admin' && role !== 'Line 2') {
            throw new Error("Access Denied: Only Admin or Line 2 can delete ELC");
          }

          const allControls = await this.db.select().from(controls).where(eq(controls.organizationId, orgId));
          const isLinked = allControls.some((other: any) => 
            other.id !== id && 
            other.relatedControlIds && 
            Array.isArray(other.relatedControlIds) && 
            other.relatedControlIds.includes(id)
          );

          if (isLinked) {
            throw new Error("Cannot delete ELC policy while it is still linked to active Transaction Level Controls.");
          }
        }

        await this.db.delete(controls).where(eq(controls.id, id));
        await this.db.delete(rcmControls).where(eq(rcmControls.controlId, id));

        return { success: true };
      } finally {
        this.db = originalDb;
      }
    });
  }
}
