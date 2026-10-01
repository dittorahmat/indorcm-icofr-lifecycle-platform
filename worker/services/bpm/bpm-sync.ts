import { rcms, rcmControls, controls, bpmNodeRcms, bpmDiagrams, bpmProcesses } from '../../db/schema';
import { eq, and, inArray, sql } from 'drizzle-orm';
import type { DrizzleDb } from '../../db';
import { extractBaseId, makeGlSpecificId } from './bpm-utils';

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
    const activeRiskControlPairs = new Set<string>();
    const activeRiskIds = new Set<string>();
    const activeControlIds = new Set<string>();

    const skipTypes = ['start', 'end', 'reference', 'swimlane'];

    // 1. Collect all risk entries and control entries to sync
    interface RiskEntryToSync {
      riskId: string;
      reg: any;
      nodeId: string;
    }

    interface ControlEntryToSync {
      ctrlId: string;
      riskId: string;
      reg: any;
      noGL: string | null;
      nodeLabel?: string;
    }

    const risksToSyncMap = new Map<string, RiskEntryToSync>();
    const controlsToSyncMap = new Map<string, ControlEntryToSync>();
    const nodeRcmPairsToInsert: { id: string; organizationId: string; diagramId: string; nodeId: string; rcmId: string }[] = [];
    const insertedRiskIdsForNode = new Set<string>();

    for (const node of nodes) {
      const nodePairs = node.data?.regulatoryPairs || 
                       (node.data?.regulatoryData ? [node.data.regulatoryData] : []);

      if (node.type && !skipTypes.includes(node.type) && nodePairs.length > 0) {
        for (const reg of nodePairs) {
          const rawRiskId = reg.riskId;
          const rawCtrlId = reg.controlId;

          if (rawRiskId && rawCtrlId) {
            const baseRiskId = extractBaseId(rawRiskId);
            const baseCtrlId = extractBaseId(rawCtrlId);

            for (const gl of glCodes) {
              const riskId = makeGlSpecificId(baseRiskId, gl);
              const ctrlId = makeGlSpecificId(baseCtrlId, gl);

              activeRiskIds.add(riskId);
              activeControlIds.add(ctrlId);
              activeRiskControlPairs.add(`${riskId}:${ctrlId}`);

              risksToSyncMap.set(riskId, { riskId, reg, nodeId: node.id });
              controlsToSyncMap.set(ctrlId, {
                ctrlId,
                riskId,
                reg,
                noGL: gl || null,
                nodeLabel: node.data?.label,
              });

              const pairKey = `${node.id}:${riskId}`;
              if (!insertedRiskIdsForNode.has(pairKey)) {
                nodeRcmPairsToInsert.push({
                  id: crypto.randomUUID(),
                  organizationId: orgId,
                  diagramId,
                  nodeId: node.id,
                  rcmId: riskId,
                });
                insertedRiskIdsForNode.add(pairKey);
              }
            }
          }
        }
      }

      // Legacy support for nodes with only .risks
      if (node.type && !skipTypes.includes(node.type) && node.data?.risks && !node.data?.regulatoryPairs && !node.data?.regulatoryData) {
        for (const riskEntry of node.data.risks) {
          const baseRiskId = extractBaseId(riskEntry.rcmId);
          for (const gl of glCodes) {
            const riskId = makeGlSpecificId(baseRiskId, gl);
            activeRiskIds.add(riskId);

            risksToSyncMap.set(riskId, { riskId, reg: riskEntry, nodeId: node.id });

            const pairKey = `${node.id}:${riskId}`;
            if (!insertedRiskIdsForNode.has(pairKey)) {
              nodeRcmPairsToInsert.push({
                id: crypto.randomUUID(),
                organizationId: orgId,
                diagramId,
                nodeId: node.id,
                rcmId: riskId,
              });
              insertedRiskIdsForNode.add(pairKey);
            }

            if (riskEntry.controlIds) {
              riskEntry.controlIds.forEach((ctrlIdEntry: string) => {
                const ctrlId = makeGlSpecificId(extractBaseId(ctrlIdEntry), gl);
                activeRiskControlPairs.add(`${riskId}:${ctrlId}`);
                activeRiskIds.add(riskId);
                activeControlIds.add(ctrlId);
              });
            }
          }
        }
      }
    }

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
    activeRiskControlPairs: Set<string>
  ) {
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

    if (activeControlIdsInDiagram.size > 0) {
      const orphanCheckResult = await this.db.execute(sql`
        SELECT id FROM controls 
        WHERE organization_id = ${orgId} 
        AND id IN (${sql.join(Array.from(activeControlIdsInDiagram).map(id => sql`${id}`), sql`, `)})
        AND NOT EXISTS (
          SELECT 1 FROM rcm_controls 
          WHERE rcm_controls.control_id = controls.id 
          AND rcm_controls.organization_id = ${orgId}
        )
      `);

      const orphanIds = (orphanCheckResult.rows || orphanCheckResult).map((r: any) => r.id);

      if (orphanIds.length > 0) {
        const ids = orphanIds.map((id: any) => sql`${id}`);
        await this.db.execute(sql`DELETE FROM csa_samples WHERE csa_record_id IN (SELECT id FROM csa_records WHERE control_id IN (${sql.join(ids, sql`, `)}))`);
        await this.db.execute(sql`DELETE FROM deficiencies WHERE control_id IN (${sql.join(ids, sql`, `)})`);
        await this.db.execute(sql`DELETE FROM csa_records WHERE control_id IN (${sql.join(ids, sql`, `)})`);
        await this.db.execute(sql`DELETE FROM test_records WHERE control_id IN (${sql.join(ids, sql`, `)})`);
        await this.db.execute(sql`DELETE FROM controls WHERE id IN (${sql.join(ids, sql`, `)})`);
      }
    }

    const risksOfThisDiagram = await this.db.select({ id: rcms.id }).from(rcms).where(eq(rcms.diagramId, diagramId));
    const riskIdsOfThisDiagram = risksOfThisDiagram.map((r: any) => r.id);
    
    for (const drId of riskIdsOfThisDiagram) {
       if (!activeRiskIdsInDiagram.has(drId) && drId.startsWith('R-')) {
          await this.db.update(controls)
            .set({ rcmId: null })
            .where(and(eq(controls.rcmId, drId), eq(controls.organizationId, orgId)));
          await this.db.delete(rcms).where(and(eq(rcms.id, drId), eq(rcms.organizationId, orgId)));
       }
    }
  }

  async updateProcessSummaryCounts(orgId: string, diagramId: string) {
    const linkedRisks = await this.db.select({ id: bpmNodeRcms.rcmId })
      .from(bpmNodeRcms)
      .where(eq(bpmNodeRcms.diagramId, diagramId))
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

    const diagResult = await this.db.select().from(bpmDiagrams).where(eq(bpmDiagrams.id, diagramId)).limit(1);
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
