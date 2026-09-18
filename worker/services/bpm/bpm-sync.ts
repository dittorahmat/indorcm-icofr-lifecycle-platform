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
    for (const node of nodes) {
      const insertedRiskIdsForNode = new Set<string>();
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
              
              await this.syncRisk(orgId, diagramId, riskId, reg, processName, subProcessName, year);
              await this.syncControl(orgId, ctrlId, riskId, reg, bpmProcessId, gl || null, processName, subProcessName, year, node.data?.label);
              await this.syncRcmControlMapping(orgId, riskId, ctrlId, reg, year, node.data?.label);

              if (!insertedRiskIdsForNode.has(riskId)) {
                await this.db.insert(bpmNodeRcms).values({
                  id: crypto.randomUUID(),
                  organizationId: orgId,
                  diagramId,
                  nodeId: node.id,
                  rcmId: riskId
                });
                insertedRiskIdsForNode.add(riskId);
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

            if (!insertedRiskIdsForNode.has(riskId)) {
              await this.db.insert(bpmNodeRcms).values({
                id: crypto.randomUUID(),
                organizationId: orgId,
                diagramId,
                nodeId: node.id,
                rcmId: riskId
              });
              insertedRiskIdsForNode.add(riskId);
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

    return { activeRiskControlPairs, activeRiskIds, activeControlIds };
  }

  async syncRisk(orgId: string, diagramId: string, riskId: string, reg: any, processName: string, subProcessName: string, year: number | null) {
    const existingRisk = await this.db.select().from(rcms).where(and(eq(rcms.id, riskId), eq(rcms.organizationId, orgId))).limit(1);
    if (existingRisk.length === 0) {
      await this.db.insert(rcms).values({
        id: riskId,
        organizationId: orgId,
        process: processName || "Default Process",
        subProcess: subProcessName || "Default Sub Process",
        riskDescription: reg.riskDescription || "Draft Risk",
        isFraudRelated: reg.isFraudRelated || false,
        riskRating: reg.riskRating || "Low",
        status: "Draft",
        diagramId,
        year
      });
    } else {
      await this.db.update(rcms).set({
        process: processName,
        subProcess: subProcessName,
        riskDescription: reg.riskDescription,
        isFraudRelated: reg.isFraudRelated,
        riskRating: reg.riskRating,
        year: year
      }).where(eq(rcms.id, riskId));
    }
  }

  async syncControl(
    orgId: string, 
    ctrlId: string, 
    riskId: string, 
    reg: any, 
    bpmProcessId: string | null, 
    noGL: string | null, 
    processName: string, 
    subProcessName: string,
    year: number | null,
    nodeLabel?: string
  ) {
    const existingCtrl = await this.db.select().from(controls).where(and(eq(controls.id, ctrlId), eq(controls.organizationId, orgId))).limit(1);
    const controlData: any = {
      name: reg.controlDescription || nodeLabel || "Draft Control",
      level: reg.classification || 'TLC',
      cosoPrinciples: reg.cosoPrinciples || [],
      bpmProcessId: bpmProcessId,
      businessProcess: processName,
      subProcess: subProcessName,
      ...(noGL ? { fsliCodes: [noGL] } : {})
    };

    if (existingCtrl.length === 0) {
      await this.db.insert(controls).values({
        id: ctrlId,
        organizationId: orgId,
        code: ctrlId,
        rcmId: riskId,
        year,
        ...controlData
      });
    } else {
      await this.db.update(controls).set({
        ...controlData,
        year: year,
        businessProcess: processName,
        subProcess: subProcessName
      }).where(eq(controls.id, ctrlId));
    }
  }

  async syncRcmControlMapping(orgId: string, riskId: string, ctrlId: string, reg: any, year: number | null, nodeLabel?: string) {
    const existingMap = await this.db.select().from(rcmControls).where(and(
      eq(rcmControls.rcmId, riskId),
      eq(rcmControls.controlId, ctrlId),
      eq(rcmControls.organizationId, orgId)
    )).limit(1);

    const mapValues = {
      controlName: reg.controlDescription || nodeLabel,
      controlDescription: reg.controlDescription,
      isKeyControl: reg.isKeyControl,
      year: year,
      ipoC: reg.ipoC,
      ipoA: reg.ipoA,
      ipoV: reg.ipoV,
      ipoRa: reg.ipoRa,
      cosoPrinciples: reg.cosoPrinciples,
      itgcDomain: reg.itgcDomain,
      itgcAssertions: reg.itgcAssertions,
      controlType: reg.classification === 'ELC' ? 'ELC' : 'TLC',
    };

    if (existingMap.length === 0) {
      await this.db.insert(rcmControls).values({
        id: crypto.randomUUID(),
        organizationId: orgId,
        rcmId: riskId,
        controlId: ctrlId,
        ...mapValues
      });
    } else {
      await this.db.update(rcmControls).set(mapValues).where(eq(rcmControls.id, existingMap[0].id));
    }
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

    for (const pair of activeRiskControlPairs) {
      const [rcmId, ctrlId] = pair.split(':');
      const existing = await this.db.select().from(rcmControls).where(and(
        eq(rcmControls.rcmId, rcmId),
        eq(rcmControls.controlId, ctrlId),
        eq(rcmControls.organizationId, orgId)
      )).limit(1);

      if (existing.length === 0) {
        await this.db.insert(rcmControls).values({
          id: crypto.randomUUID(),
          organizationId: orgId,
          rcmId,
          controlId: ctrlId
        });
      }
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
