import { rcms, rcmControls, controls, bpmNodeRcms, bpmDiagrams, bpmProcesses } from '../../db/schema';
import { eq, and, inArray, sql } from 'drizzle-orm';
import type { DrizzleDb } from '../../db';
import { collectNodeSyncEntries, extractBaseId, makeGlSpecificId } from '@shared/control-linkage';

export class BpmSyncManager {
  constructor(private db: DrizzleDb) {}

  setDb(db: DrizzleDb) {
    this.db = db;
  }

  async syncRisksAndControlsFromNodes(
    orgId: string, 
    diagramId: string, 
    nodes: any[], 
    bpmProcessId: string | null, 
    glCodes: string[], 
    processName: string, 
    subProcessName: string,
    year: number | null
  ) {
    // 1. Collect all risk entries and control entries to sync. The walk
    // over node data (precedence, legacy fallback, GL fan-out) lives in
    // the shared control-linkage seam; the manager only persists.
    const {
      risksToSync: risksToSyncMap,
      controlsToSync: controlsToSyncMap,
      nodeRcmPairs: nodeRcmPairsToInsert,
      activeRiskIds,
      activeControlIds,
      activeRiskControlPairs,
    } = collectNodeSyncEntries(nodes, glCodes, { organizationId: orgId, diagramId });

    // 2. Batch sync risks (1 SELECT instead of N SELECTs)
    const allRiskIds = Array.from(risksToSyncMap.keys());
    if (allRiskIds.length > 0) {
      const existingRisks = await this.db.select({ id: rcms.id })
        .from(rcms)
        .where(and(inArray(rcms.id, allRiskIds), eq(rcms.organizationId, orgId)));
      const existingRiskIdSet = new Set(existingRisks.map(r => r.id));

      const risksToInsert: any[] = [];
      const risksToUpdate: any[] = [];

      for (const [riskId, { reg }] of risksToSyncMap.entries()) {
        const riskValues = {
          process: processName || "Default Process",
          subProcess: subProcessName || "Default Sub Process",
          riskDescription: reg.riskDescription || "Draft Risk",
          isFraudRelated: reg.isFraudRelated || false,
          riskRating: reg.riskRating || "Low",
          status: "Draft",
          diagramId,
          year,
        };

        if (!existingRiskIdSet.has(riskId)) {
          risksToInsert.push({
            id: riskId,
            organizationId: orgId,
            ...riskValues,
          });
        } else {
          risksToUpdate.push({ id: riskId, ...riskValues });
        }
      }

      if (risksToInsert.length > 0) {
        await this.db.insert(rcms).values(risksToInsert);
      }
      for (const r of risksToUpdate) {
        await this.db.update(rcms).set({
          process: r.process,
          subProcess: r.subProcess,
          riskDescription: r.riskDescription,
          isFraudRelated: r.isFraudRelated,
          riskRating: r.riskRating,
          year: r.year,
        }).where(and(eq(rcms.id, r.id), eq(rcms.organizationId, orgId)));
      }
    }

    // 3. Batch sync controls (1 SELECT instead of N SELECTs)
    const allControlIds = Array.from(controlsToSyncMap.keys());
    if (allControlIds.length > 0) {
      const existingControls = await this.db.select({ id: controls.id })
        .from(controls)
        .where(and(inArray(controls.id, allControlIds), eq(controls.organizationId, orgId)));
      const existingControlIdSet = new Set(existingControls.map(c => c.id));

      const controlsToInsert: any[] = [];
      const controlsToUpdate: any[] = [];

      for (const [ctrlId, item] of controlsToSyncMap.entries()) {
        const controlData: any = {
          name: item.reg.controlDescription || item.nodeLabel || "Draft Control",
          level: item.reg.classification || 'TLC',
          cosoPrinciples: item.reg.cosoPrinciples || [],
          bpmProcessId: bpmProcessId,
          businessProcess: processName,
          subProcess: subProcessName,
          ...(item.noGL ? { fsliCodes: [item.noGL] } : {}),
        };

        if (!existingControlIdSet.has(ctrlId)) {
          controlsToInsert.push({
            id: ctrlId,
            organizationId: orgId,
            code: ctrlId,
            rcmId: item.riskId,
            year,
            ...controlData,
          });
        } else {
          controlsToUpdate.push({ id: ctrlId, ...controlData });
        }
      }

      if (controlsToInsert.length > 0) {
        await this.db.insert(controls).values(controlsToInsert);
      }
      for (const c of controlsToUpdate) {
        await this.db.update(controls).set({
          name: c.name,
          level: c.level,
          cosoPrinciples: c.cosoPrinciples,
          bpmProcessId: c.bpmProcessId,
          businessProcess: c.businessProcess,
          subProcess: c.subProcess,
          year: year,
          ...(c.fsliCodes ? { fsliCodes: c.fsliCodes } : {}),
        }).where(and(eq(controls.id, c.id), eq(controls.organizationId, orgId)));
      }
    }

    // 4. Batch sync rcmControls mappings for regulatory pairs
    if (controlsToSyncMap.size > 0) {
      const existingMaps = await this.db.select({ id: rcmControls.id, rcmId: rcmControls.rcmId, controlId: rcmControls.controlId })
        .from(rcmControls)
        .where(and(
          inArray(rcmControls.rcmId, allRiskIds.length > 0 ? allRiskIds : ['__NONE__']),
          inArray(rcmControls.controlId, allControlIds.length > 0 ? allControlIds : ['__NONE__']),
          eq(rcmControls.organizationId, orgId)
        ));
      
      const existingMapLookup = new Map<string, string>();
      for (const em of existingMaps) {
        existingMapLookup.set(`${em.rcmId}:${em.controlId}`, em.id);
      }

      const mappingsToInsert: any[] = [];
      const mappingsToUpdate: any[] = [];

      for (const item of controlsToSyncMap.values()) {
        const pairKey = `${item.riskId}:${item.ctrlId}`;
        const mapValues = {
          controlName: item.reg.controlDescription || item.nodeLabel,
          controlDescription: item.reg.controlDescription,
          isKeyControl: item.reg.isKeyControl,
          year: year,
          ipoC: item.reg.ipoC,
          ipoA: item.reg.ipoA,
          ipoV: item.reg.ipoV,
          ipoRa: item.reg.ipoRa,
          cosoPrinciples: item.reg.cosoPrinciples,
          itgcDomain: item.reg.itgcDomain,
          itgcAssertions: item.reg.itgcAssertions,
          controlType: item.reg.classification === 'ELC' ? 'ELC' : 'TLC',
        };

        const existingId = existingMapLookup.get(pairKey);
        if (!existingId) {
          mappingsToInsert.push({
            id: crypto.randomUUID(),
            organizationId: orgId,
            rcmId: item.riskId,
            controlId: item.ctrlId,
            ...mapValues,
          });
        } else {
          mappingsToUpdate.push({ id: existingId, ...mapValues });
        }
      }

      if (mappingsToInsert.length > 0) {
        await this.db.insert(rcmControls).values(mappingsToInsert);
      }
      for (const m of mappingsToUpdate) {
        await this.db.update(rcmControls).set(m).where(eq(rcmControls.id, m.id));
      }
    }

    // 5. Batch insert bpmNodeRcms
    if (nodeRcmPairsToInsert.length > 0) {
      await this.db.insert(bpmNodeRcms).values(nodeRcmPairsToInsert);
    }

    return { activeRiskControlPairs, activeRiskIds, activeControlIds };
  }

  async syncMappingsFromEdges(orgId: string, edges: any[], nodes: any[], activeRiskControlPairs: Set<string>, glCodes: string[]) {
    for (const edge of edges) {
      const sourceNode = nodes.find((n: any) => n.id === edge.source);
      const targetNode = nodes.find((n: any) => n.id === edge.target);

      if (sourceNode?.type === 'risk' && targetNode?.type === 'control') {
        const rawRcmId = sourceNode.data?.rcmId;
        const rawCtrlId = targetNode.data?.controlId;
        if (rawRcmId && rawCtrlId) {
          const baseRiskId = extractBaseId(rawRcmId);
          const baseCtrlId = extractBaseId(rawCtrlId);
          for (const gl of glCodes) {
            activeRiskControlPairs.add(`${makeGlSpecificId(baseRiskId, gl)}:${makeGlSpecificId(baseCtrlId, gl)}`);
          }
        }
      }
    }

    if (activeRiskControlPairs.size === 0) return;

    const pairArray = Array.from(activeRiskControlPairs).map(p => {
      const [rcmId, ctrlId] = p.split(':');
      return { rcmId, ctrlId };
    });

    const riskIds = Array.from(new Set(pairArray.map(p => p.rcmId)));
    const controlIds = Array.from(new Set(pairArray.map(p => p.ctrlId)));

    const existingMappings = await this.db.select({ rcmId: rcmControls.rcmId, controlId: rcmControls.controlId })
      .from(rcmControls)
      .where(and(
        inArray(rcmControls.rcmId, riskIds),
        inArray(rcmControls.controlId, controlIds),
        eq(rcmControls.organizationId, orgId)
      ));

    const existingSet = new Set(existingMappings.map(m => `${m.rcmId}:${m.controlId}`));
    const newMappingsToInsert: any[] = [];

    for (const pair of pairArray) {
      const key = `${pair.rcmId}:${pair.ctrlId}`;
      if (!existingSet.has(key)) {
        newMappingsToInsert.push({
          id: crypto.randomUUID(),
          organizationId: orgId,
          rcmId: pair.rcmId,
          controlId: pair.ctrlId,
        });
        existingSet.add(key);
      }
    }

    if (newMappingsToInsert.length > 0) {
      await this.db.insert(rcmControls).values(newMappingsToInsert);
    }
  }

  async cleanupStaleData(
    orgId: string, 
    diagramId: string, 
    activeRiskIdsInDiagram: Set<string>, 
    activeControlIdsInDiagram: Set<string>, 
    activeRiskControlPairs: Set<string>,
    bpmProcessId?: string | null,
    subProcessName?: string | null
  ) {
    // 1. Collect candidate control IDs associated with this diagram before modifying mappings
    const candidateControlIds = new Set<string>(activeControlIdsInDiagram);

    const risksOfThisDiagram = await this.db.select({ id: rcms.id })
      .from(rcms)
      .where(and(eq(rcms.diagramId, diagramId), eq(rcms.organizationId, orgId)));
    const riskIdsOfThisDiagram = risksOfThisDiagram.map((r: { id: string }) => r.id);
    const allDiagramRiskIds = Array.from(new Set([...Array.from(activeRiskIdsInDiagram), ...riskIdsOfThisDiagram]));

    if (allDiagramRiskIds.length > 0) {
      const mapped = await this.db.select({ controlId: rcmControls.controlId })
        .from(rcmControls)
        .where(and(
          inArray(rcmControls.rcmId, allDiagramRiskIds),
          eq(rcmControls.organizationId, orgId)
        ));
      for (const m of mapped) {
        if (m.controlId) candidateControlIds.add(m.controlId);
      }

      const byRcm = await this.db.select({ id: controls.id })
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
      const byProcess = await this.db.select({ id: controls.id })
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
      const bySubProc = await this.db.select({ id: controls.id })
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
          await this.db.execute(sql`
            DELETE FROM rcm_controls
            WHERE organization_id = ${orgId}
            AND rcm_id = ${rcmId}
            AND control_id NOT IN (${sql.join(activeCtrlsForThisRisk.map(id => sql`${id}`), sql`, `)})
          `);
        } else {
          await this.db.delete(rcmControls).where(and(
            eq(rcmControls.rcmId, rcmId),
            eq(rcmControls.organizationId, orgId)
          ));
        }
      }
    }

    // 3. Remove inactive risks of this diagram and their mappings
    for (const drId of riskIdsOfThisDiagram) {
      if (!activeRiskIdsInDiagram.has(drId) && drId.startsWith('R-')) {
        await this.db.delete(rcmControls).where(and(
          eq(rcmControls.rcmId, drId),
          eq(rcmControls.organizationId, orgId)
        ));
        await this.db.update(controls)
          .set({ rcmId: null })
          .where(and(eq(controls.rcmId, drId), eq(controls.organizationId, orgId)));
        await this.db.delete(rcms).where(and(eq(rcms.id, drId), eq(rcms.organizationId, orgId)));
      }
    }

    // 4. Find orphaned controls among candidate IDs and cascade delete
    if (candidateControlIds.size > 0) {
      const candidateList = Array.from(candidateControlIds).map(id => sql`${id}`);
      const orphanCheckResult = await this.db.execute(sql`
        SELECT id FROM controls 
        WHERE organization_id = ${orgId} 
        AND id IN (${sql.join(candidateList, sql`, `)})
        AND NOT EXISTS (
          SELECT 1 FROM rcm_controls 
          WHERE rcm_controls.control_id = controls.id 
          AND rcm_controls.organization_id = ${orgId}
        )
      `);

      const orphanRows = (orphanCheckResult.rows || orphanCheckResult) as Array<{ id: string }>;
      const orphanIds = orphanRows.map(r => r.id).filter((id): id is string => typeof id === 'string');

      if (orphanIds.length > 0) {
        const ids = orphanIds.map(id => sql`${id}`);
        const idList = sql.join(ids, sql`, `);
        await this.db.execute(sql`DELETE FROM action_plans WHERE organization_id = ${orgId} AND deficiency_id IN (SELECT id FROM deficiencies WHERE organization_id = ${orgId} AND control_id IN (${idList}))`);
        await this.db.execute(sql`DELETE FROM deficiencies WHERE organization_id = ${orgId} AND control_id IN (${idList})`);
        await this.db.execute(sql`DELETE FROM tod_evaluations WHERE organization_id = ${orgId} AND control_id IN (${idList})`);
        await this.db.execute(sql`DELETE FROM csa_samples WHERE organization_id = ${orgId} AND csa_record_id IN (SELECT id FROM csa_records WHERE organization_id = ${orgId} AND control_id IN (${idList}))`);
        await this.db.execute(sql`DELETE FROM csa_records WHERE organization_id = ${orgId} AND control_id IN (${idList})`);
        await this.db.execute(sql`DELETE FROM test_samples WHERE organization_id = ${orgId} AND test_record_id IN (SELECT id FROM test_records WHERE organization_id = ${orgId} AND control_id IN (${idList}))`);
        await this.db.execute(sql`DELETE FROM test_records WHERE organization_id = ${orgId} AND control_id IN (${idList})`);
        await this.db.execute(sql`DELETE FROM rcm_controls WHERE organization_id = ${orgId} AND control_id IN (${idList})`);
        await this.db.execute(sql`DELETE FROM controls WHERE organization_id = ${orgId} AND id IN (${idList})`);
      }
    }
  }

  async updateProcessSummaryCounts(orgId: string, diagramId: string) {
    const linkedRisks = await this.db.select({ id: bpmNodeRcms.rcmId })
      .from(bpmNodeRcms)
      .where(and(
        eq(bpmNodeRcms.diagramId, diagramId),
        eq(bpmNodeRcms.organizationId, orgId)
      ))
      .groupBy(bpmNodeRcms.rcmId);
    
    const uniqueBaseRiskIds = new Set(linkedRisks.map((r: any) => extractBaseId(r.id)));
    const riskCount = uniqueBaseRiskIds.size;
    const uniqueRiskIds = linkedRisks.map((r: any) => r.id);
    
    let controlCount = 0;
    if (uniqueRiskIds.length > 0) {
      const linkedCtrls = await this.db.select({ id: rcmControls.controlId })
        .from(rcmControls)
        .where(and(
          inArray(rcmControls.rcmId, uniqueRiskIds),
          eq(rcmControls.organizationId, orgId)
        ))
        .groupBy(rcmControls.controlId);
      const uniqueBaseControlIds = new Set(linkedCtrls.map((c: any) => extractBaseId(c.id)));
      controlCount = uniqueBaseControlIds.size;
    }

    const diagResult = await this.db.select()
      .from(bpmDiagrams)
      .where(and(
        eq(bpmDiagrams.id, diagramId),
        eq(bpmDiagrams.organizationId, orgId)
      ))
      .limit(1);
    if (diagResult.length > 0 && diagResult[0].subProcess) {
      await this.db.update(bpmProcesses)
        .set({ riskCount, controlCount })
        .where(and(
          eq(bpmProcesses.organizationId, orgId),
          eq(bpmProcesses.name, diagResult[0].subProcess)
        ));
    }
  }
}
