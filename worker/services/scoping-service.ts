import { eq, and } from 'drizzle-orm';
import { 
  bpmDiagrams, rcms, controls, rcmControls, bpmNodeRcms, simulations 
} from '../db/schema';
import type { DrizzleDb } from '../db';

export class ScopingService {
  constructor(private db: DrizzleDb) {}

  /**
   * Carry forward (clone) ICOFR artifacts from one year to another.
   * This ensures that Line 1/Line 2 don't have to rebuild their entire RCM/BPM from scratch every year.
   */
  async carryForward(orgId: string, userId: string, targetYear: number) {
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

    // Wrap everything in a transaction to ensure integrity (SOLID & Integrity mandate)
    await this.db.transaction(async (tx) => {
      const diagramMap = new Map<string, string>();
      const rcmMap = new Map<string, string>();
      const controlMap = new Map<string, string>();

      // 1. Clone BPM Diagrams
      for (const source of sourceBpms) {
        const newId = crypto.randomUUID();
        diagramMap.set(source.id, newId);
        await tx.insert(bpmDiagrams).values({
          ...source,
          id: newId,
          year: targetYear,
          createdAt: new Date(),
          createdBy: userId,
          updatedAt: new Date()
        });
      }

      // 2. Clone RCMs
      const sourceRcms = await tx.select().from(rcms)
        .where(and(eq(rcms.organizationId, orgId), eq(rcms.year, prevYear)));
      
      for (const source of sourceRcms) {
        const newId = crypto.randomUUID();
        rcmMap.set(source.id, newId);
        await tx.insert(rcms).values({
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
      const sourceControls = await tx.select().from(controls)
        .where(and(eq(controls.organizationId, orgId), eq(controls.year, prevYear)));
      
      for (const source of sourceControls) {
        const newId = crypto.randomUUID();
        controlMap.set(source.id, newId);
        await tx.insert(controls).values({
          ...source,
          id: newId,
          year: targetYear,
          rcmId: source.rcmId ? rcmMap.get(source.rcmId) : null,
          bpmStatus: "Approved"
        });
      }

      // 4. Clone RCM-Control Mappings
      const sourceMappings = await tx.select().from(rcmControls)
        .where(eq(rcmControls.organizationId, orgId));
      
      for (const source of sourceMappings) {
        const newRcmId = rcmMap.get(source.rcmId);
        const newControlId = controlMap.get(source.controlId);
        
        if (newRcmId && newControlId) {
          await tx.insert(rcmControls).values({
            ...source,
            id: crypto.randomUUID(),
            rcmId: newRcmId,
            controlId: newControlId,
            year: targetYear
          });
        }
      }

      // 5. Clone Node-RCM Mappings (React Flow links)
      const sourceNodeRcms = await tx.select().from(bpmNodeRcms)
        .where(eq(bpmNodeRcms.organizationId, orgId));
      
      for (const source of sourceNodeRcms) {
        const newDiagramId = diagramMap.get(source.diagramId);
        const newRcmId = rcmMap.get(source.rcmId);
        
        if (newDiagramId && newRcmId) {
          await tx.insert(bpmNodeRcms).values({
            ...source,
            id: crypto.randomUUID(),
            diagramId: newDiagramId,
            rcmId: newRcmId
          });
        }
      }
    });

    return true;
  }
}
