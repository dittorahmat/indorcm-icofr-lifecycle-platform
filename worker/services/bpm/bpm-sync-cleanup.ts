import { eq, and, inArray, sql } from 'drizzle-orm';
import { rcms, rcmControls, controls } from '../../db/schema';
import type { DrizzleDb } from '../../db';
import { controlCascadeStatements } from './bpm-sync-cascade';

/**
 * Stale-row cleanup for one diagram. Extracted from `BpmSyncManager` so the
 * write manager stays under the soft LOC limit; the manager delegates and the
 * cleanup tests still cross the public method.
 */
export async function runCleanup(
  db: DrizzleDb,
  orgId: string,
  diagramId: string,
  activeRiskIdsInDiagram: Set<string>,
  activeControlIdsInDiagram: Set<string>,
  activeRiskControlPairs: Set<string>,
  bpmProcessId?: string | null,
  subProcessName?: string | null,
) {
    // 1. Collect candidate control IDs associated with this diagram before modifying mappings
    const candidateControlIds = new Set<string>(activeControlIdsInDiagram);

    const risksOfThisDiagram = await db.select({ id: rcms.id })
      .from(rcms)
      .where(and(eq(rcms.diagramId, diagramId), eq(rcms.organizationId, orgId)));
    const riskIdsOfThisDiagram = risksOfThisDiagram.map((r) => r.id);
    const allDiagramRiskIds = Array.from(new Set([...Array.from(activeRiskIdsInDiagram), ...riskIdsOfThisDiagram]));

    if (allDiagramRiskIds.length > 0) {
      const mapped = await db.select({ controlId: rcmControls.controlId })
        .from(rcmControls)
        .where(and(
          inArray(rcmControls.rcmId, allDiagramRiskIds),
          eq(rcmControls.organizationId, orgId)
        ));
      for (const m of mapped) {
        if (m.controlId) candidateControlIds.add(m.controlId);
      }

      const byRcm = await db.select({ id: controls.id })
        .from(controls)
        .where(and(
          inArray(controls.rcmId, allDiagramRiskIds),
          eq(controls.organizationId, orgId)
        ));
      for (const c of byRcm) {
        if (c.id) candidateControlIds.add(c.id);
      }
    }

    if (bpmProcessId) {
      const byProcess = await db.select({ id: controls.id })
        .from(controls)
        .where(and(
          eq(controls.bpmProcessId, bpmProcessId),
          eq(controls.organizationId, orgId)
        ));
      for (const c of byProcess) {
        if (c.id) candidateControlIds.add(c.id);
      }
    }

    if (subProcessName) {
      const bySubProc = await db.select({ id: controls.id })
        .from(controls)
        .where(and(
          eq(controls.subProcess, subProcessName),
          eq(controls.organizationId, orgId)
        ));
      for (const c of bySubProc) {
        if (c.id) candidateControlIds.add(c.id);
      }
    }

    // 2. Delete stale rcm_controls for active risks in this diagram
    if (activeRiskIdsInDiagram.size > 0) {
      for (const rcmId of activeRiskIdsInDiagram) {
        const activeCtrlsForThisRisk = Array.from(activeRiskControlPairs)
          .filter(p => p.startsWith(`${rcmId}:`))
          .map(p => p.split(':')[1]);

        if (activeCtrlsForThisRisk.length > 0) {
          await db.execute(sql`
            DELETE FROM rcm_controls
            WHERE organization_id = ${orgId}
            AND rcm_id = ${rcmId}
            AND control_id NOT IN (${sql.join(activeCtrlsForThisRisk.map(id => sql`${id}`), sql`, `)})
          `);
        } else {
          await db.delete(rcmControls).where(and(
            eq(rcmControls.rcmId, rcmId),
            eq(rcmControls.organizationId, orgId)
          ));
        }
      }
    }

    // 3. Remove inactive risks of this diagram and their mappings
    for (const drId of riskIdsOfThisDiagram) {
      if (!activeRiskIdsInDiagram.has(drId) && drId.startsWith('R-')) {
        await db.delete(rcmControls).where(and(
          eq(rcmControls.rcmId, drId),
          eq(rcmControls.organizationId, orgId)
        ));
        await db.update(controls)
          .set({ rcmId: null })
          .where(and(eq(controls.rcmId, drId), eq(controls.organizationId, orgId)));
        await db.delete(rcms).where(and(eq(rcms.id, drId), eq(rcms.organizationId, orgId)));
      }
    }

    // 4. Find orphaned controls among candidate IDs and cascade delete
    if (candidateControlIds.size > 0) {
      const candidateList = Array.from(candidateControlIds);
      const orphanCheckResult = await db.execute(sql`
        SELECT id FROM controls 
        WHERE organization_id = ${orgId} 
        AND id IN (${sql.join(candidateList.map((id) => sql`${id}`), sql`, `)})
        AND NOT EXISTS (
          SELECT 1 FROM rcm_controls 
          WHERE rcm_controls.control_id = controls.id 
          AND rcm_controls.organization_id = ${orgId}
        )
      `);
      const orphanRows = (orphanCheckResult.rows ?? orphanCheckResult) as Array<{ id: string }>;
      const orphanIds = orphanRows.map(r => r.id).filter((id): id is string => typeof id === 'string');

      for (const statement of controlCascadeStatements(orgId, orphanIds)) {
        await db.execute(statement);
      }
    }
}
