import { eq, and, sql } from 'drizzle-orm';
import { 
  bpmDiagrams, rcms, controls, rcmControls, bpmNodeRcms, simulations,
  glSnapshots, glRows, notifications, auditLogs, user
} from '../db/schema';
import type { DrizzleDb } from '../db';
import type { MaterialitySimulation, SimulationStatus } from '@shared/types';
import { AuditService } from './audit-service';

export class ScopingService {
  private audit: AuditService;

  constructor(private db: DrizzleDb) {
    this.audit = new AuditService(db);
  }

  /**
   * Submits a simulation for CFO approval.
   */
  async submitSimulation(orgId: string, userId: string, userRole: string, id: string, body: Partial<MaterialitySimulation>) {
    const [existing] = await this.db.select().from(simulations).where(and(eq(simulations.id, id), eq(simulations.organizationId, orgId))).limit(1);
    if (!existing) throw new Error('Simulation not found');

    const history = (existing.history as any[]) || [];
    const newHistoryEntry = {
      id: crypto.randomUUID(),
      action: "Submit",
      role: userRole,
      userId: userId,
      timestamp: Date.now(),
      note: body.history?.[0]?.note || "Submitted for approval"
    };

    await this.db.update(simulations)
      .set({ 
        status: 'Pending CFO', 
        updatedAt: new Date() as any,
        omValue: body.omValue,
        pmValue: body.pmValue,
        significantAccounts: body.significantAccounts,
        history: [...history, newHistoryEntry]
      })
      .where(and(eq(simulations.id, id), eq(simulations.organizationId, orgId)));
    
    // Notify CFOs
    const cfos = await this.db.select({ id: user.id }).from(user).where(eq(user.role, 'CFO'));
    for (const cfo of cfos) {
      await this.db.insert(notifications).values({
        id: crypto.randomUUID(),
        organizationId: orgId,
        userId: cfo.id,
        message: `A new scoping simulation "${existing.name}" has been submitted for your review.`,
        type: 'info',
        link: `/scoping?id=${id}`,
        createdAt: new Date(),
      });
    }

    await this.audit.logAction({
      organizationId: orgId,
      userId,
      action: 'SUBMIT',
      entityType: 'Simulation',
      entityId: id,
      description: `Simulation ${existing.name} submitted for CFO approval`,
    });
        
    const [updated] = await this.db.select().from(simulations).where(eq(simulations.id, id)).limit(1);
    return updated;
  }

  /**
   * Sets a GL Snapshot as the active source for the organization.
   */
  async setActiveSnapshot(orgId: string, userId: string, id: string) {
    // Reset all to false first
    await this.db.update(glSnapshots).set({ isActive: false }).where(eq(glSnapshots.organizationId, orgId));
    // Set current to true
    await this.db.update(glSnapshots).set({ isActive: true }).where(and(eq(glSnapshots.id, id), eq(glSnapshots.organizationId, orgId)));
    
    await this.audit.logAction({
      organizationId: orgId,
      userId,
      action: 'SET_ACTIVE',
      entityType: 'GL_Snapshot',
      entityId: id,
      description: `GL Snapshot ${id} marked as active source`,
    });

    return { success: true };
  }

  /**
   * Purges all scoping data (simulations and snapshots) for an organization.
   * Restricted to Admin/Dev use.
   */
  async purgeData(orgId: string, userId: string) {
    await this.db.delete(simulations).where(eq(simulations.organizationId, orgId));
    await this.db.delete(glSnapshots).where(eq(glSnapshots.organizationId, orgId));
    
    await this.audit.logAction({
      organizationId: orgId,
      userId,
      action: 'PURGE',
      entityType: 'Scoping_Module',
      entityId: orgId,
      description: `All scoping simulations and GL snapshots purged`,
    });

    return { success: true };
  }

  /**
   * Carry forward (clone) ICOFR artifacts from one year to another.
   * This ensures that Line 1/Line 2 don't have to rebuild their entire RCM/BPM from scratch every year.
   */
  async carryForward(orgId: string, userId: string, targetYear: number) {
    const originalDb = this.db;
    return await originalDb.transaction(async (tx) => {
      this.db = tx;
      try {
        const prevYear = targetYear - 1;

        // Check if target year already has data to prevent accidental overrides
        const existingBpm = await this.db.select({ id: bpmDiagrams.id })
          .from(bpmDiagrams)
          .where(and(eq(bpmDiagrams.organizationId, orgId), eq(bpmDiagrams.year, targetYear)))
          .limit(1);

        if (existingBpm.length > 0) {
          console.log(`[CARRY_FORWARD] Target year ${targetYear} already has data. Skipping cloning.`);
          return false;
        }

        // Get source data from previous year
        const sourceBpms = await this.db.select().from(bpmDiagrams)
          .where(and(eq(bpmDiagrams.organizationId, orgId), eq(bpmDiagrams.year, prevYear)));

        if (sourceBpms.length === 0) {
          console.log(`[CARRY_FORWARD] No data found for previous year ${prevYear}. Nothing to clone.`);
          return false;
        }

        console.log(`[CARRY_FORWARD] Cloning data from ${prevYear} to ${targetYear} for Org: ${orgId}`);

        const diagramMap = new Map<string, string>();
        const rcmMap = new Map<string, string>();
        const controlMap = new Map<string, string>();

        // 1. Clone BPM Diagrams
        for (const source of sourceBpms) {
          const newId = crypto.randomUUID();
          diagramMap.set(source.id, newId);
          await this.db.insert(bpmDiagrams).values({
            ...source,
            id: newId,
            year: targetYear,
            createdAt: new Date(),
            createdBy: userId,
            updatedAt: new Date()
          });
        }

        // 2. Clone RCMs
        const sourceRcms = await this.db.select().from(rcms)
          .where(and(eq(rcms.organizationId, orgId), eq(rcms.year, prevYear)));
        
        for (const source of sourceRcms) {
          const newId = crypto.randomUUID();
          rcmMap.set(source.id, newId);
          await this.db.insert(rcms).values({
            ...source,
            id: newId,
            year: targetYear,
            status: "Active",
            diagramId: source.diagramId ? diagramMap.get(source.diagramId) : null,
            auditTrail: [{
              action: 'CARRY_FORWARD',
              timestamp: Date.now(),
              userId,
              description: `Carried forward from year ${prevYear}`
            }] as any
          });
        }

        // 3. Clone Controls
        const sourceControls = await this.db.select().from(controls)
          .where(and(eq(controls.organizationId, orgId), eq(controls.year, prevYear)));
        
        for (const source of sourceControls) {
          const newId = crypto.randomUUID();
          controlMap.set(source.id, newId);
          await this.db.insert(controls).values({
            ...source,
            id: newId,
            year: targetYear,
            rcmId: source.rcmId ? rcmMap.get(source.rcmId) : null,
            bpmStatus: "Approved"
          });
        }

        // 4. Clone RCM-Control Mappings
        const sourceMappings = await this.db.select().from(rcmControls)
          .where(eq(rcmControls.organizationId, orgId));
        
        for (const source of sourceMappings) {
          const newRcmId = rcmMap.get(source.rcmId);
          const newControlId = controlMap.get(source.controlId);
          
          if (newRcmId && newControlId) {
            await this.db.insert(rcmControls).values({
              ...source,
              id: crypto.randomUUID(),
              rcmId: newRcmId,
              controlId: newControlId,
              year: targetYear
            });
          }
        }

        // 5. Clone Node-RCM Mappings (React Flow links)
        const sourceNodeRcms = await this.db.select().from(bpmNodeRcms)
          .where(eq(bpmNodeRcms.organizationId, orgId));
        
        for (const source of sourceNodeRcms) {
          const newDiagramId = diagramMap.get(source.diagramId);
          const newRcmId = rcmMap.get(source.rcmId);
          
          if (newDiagramId && newRcmId) {
            await this.db.insert(bpmNodeRcms).values({
              ...source,
              id: crypto.randomUUID(),
              diagramId: newDiagramId,
              rcmId: newRcmId
            });
          }
        }

        return true;
      } finally {
        this.db = originalDb;
      }
    });
  }
}
