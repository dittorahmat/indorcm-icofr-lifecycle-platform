import { 
  bpmDiagrams, bpmProcesses, rcms, rcmControls, controls, bpmNodeRcms,
  organization, auditLogs, notifications, csaRecords, bpmProcessGlCodes
} from '../db/schema';
import { eq, and, or, inArray, sql, ne, desc, SQL, isNull, like } from 'drizzle-orm';
import type { DrizzleDb } from '../db';
import type { BPMProcess, BPMDiagram } from "@shared/types";
import { AuditService } from './audit-service';

export function extractBaseId(id: string): string {
  if (!id) return id;
  
  const legacyMatch = id.match(/^([RC]-\d+)(?:-(.+))?$/i);
  if (legacyMatch) {
    return legacyMatch[1];
  }

  const parts = id.split('-');
  if (parts.length > 1) {
    let seqIndex = -1;
    for (let i = 1; i < parts.length; i++) {
      if (/^\d{3,}$/.test(parts[i])) { // Require at least 3 digits to be confident it's a seq
        seqIndex = i;
        break;
      }
    }
    
    if (seqIndex !== -1) {
      if (seqIndex < parts.length - 1) {
        return parts.slice(0, seqIndex + 1).join('-');
      }
      return id;
    }

    const lastPart = parts[parts.length - 1];
    if (/^\d+$/.test(lastPart) || lastPart.length >= 4) {
      return parts.slice(0, -1).join('-');
    }
  }
  return id;
}

export function makeGlSpecificId(baseId: string, glCode: string): string {
  if (!glCode) return baseId;
  const base = extractBaseId(baseId);
  return `${base}-${glCode}`;
}

export class BpmService {
  private auditService: AuditService;

  constructor(private db: DrizzleDb) {
    this.auditService = new AuditService(db);
  }

  async getAllDiagrams(orgId: string, year?: number) {
    let conditions: SQL = eq(bpmDiagrams.organizationId, orgId);
    if (year) {
      conditions = and(conditions, eq(bpmDiagrams.year, year)) as SQL;
    }
    return await this.db.select().from(bpmDiagrams).where(conditions);
  }

  async getDiagramById(orgId: string, id: string, noGL?: string) {
    const diags = await this.db.select().from(bpmDiagrams).where(and(eq(bpmDiagrams.id, id), eq(bpmDiagrams.organizationId, orgId))).limit(1);
    if (diags.length === 0) return null;
    
    const diag = diags[0];
    const nodes = (diag.nodes as any[]) || [];

    const hydratedNodes = await this.hydrateDiagramNodes(id, nodes, noGL);

    const matchedProcesses = diag.subProcess
      ? await this.db.select().from(bpmProcesses)
        .where(and(
          eq(bpmProcesses.organizationId, orgId),
          diag.year ? eq(bpmProcesses.year, diag.year) : isNull(bpmProcesses.year),
          sql`TRIM(LOWER(${bpmProcesses.name})) = TRIM(LOWER(${diag.subProcess}))`
        )).limit(1)
      : [];

    let noGLs: string[] = [];
    if (matchedProcesses.length > 0) {
      const bpmProcessId = matchedProcesses[0].id;
      const gls = await this.db.select({ noGL: bpmProcessGlCodes.noGL })
        .from(bpmProcessGlCodes)
        .where(eq(bpmProcessGlCodes.bpmProcessId, bpmProcessId));
      noGLs = gls.map(g => g.noGL);
      
      if (noGLs.length === 0 && matchedProcesses[0].noGL) {
        noGLs = [matchedProcesses[0].noGL];
      }
    }

    return {
      ...diag,
      nodes: hydratedNodes,
      noGLs
    };
  }

  private async hydrateDiagramNodes(diagramId: string, nodes: any[], noGL?: string) {
    const skipTypes = ['start', 'end', 'reference', 'swimlane'];
    return await Promise.all(nodes.map(async (node: any) => {
      if (node.type && !skipTypes.includes(node.type)) {
        const allMappings = await this.db.select({
          risk: rcms,
          map: rcmControls
        })
        .from(bpmNodeRcms)
        .innerJoin(rcms, eq(bpmNodeRcms.rcmId, rcms.id))
        .leftJoin(rcmControls, eq(rcms.id, rcmControls.rcmId))
        .where(and(
          eq(bpmNodeRcms.diagramId, diagramId),
          eq(bpmNodeRcms.nodeId, node.id)
        ));

        let selectedMappings = allMappings;
        if (noGL && allMappings.length > 0) {
          const glMappings = allMappings.filter(m => m.risk.id.endsWith(`-${noGL}`));
          if (glMappings.length > 0) {
            selectedMappings = glMappings;
          } else {
            selectedMappings = allMappings.map(m => {
              const adaptedRiskId = makeGlSpecificId(m.risk.id, noGL);
              const adaptedControlId = m.map?.controlId ? makeGlSpecificId(m.map.controlId, noGL) : `C-TBD-${noGL}`;
              return {
                ...m,
                risk: {
                  ...m.risk,
                  id: adaptedRiskId
                },
                map: m.map ? {
                  ...m.map,
                  rcmId: adaptedRiskId,
                  controlId: adaptedControlId
                } : null
              };
            });
          }
        }

        const regulatoryPairs = selectedMappings.map((m: any) => ({
          riskId: extractBaseId(m.risk.id),
          riskDescription: m.risk.riskDescription,
          isFraudRelated: m.risk.isFraudRelated,
          riskRating: m.risk.riskRating,
          controlId: m.map?.controlId ? extractBaseId(m.map.controlId) : (noGL ? `C-TBD-${noGL}` : 'C-TBD'),
          controlDescription: m.map?.controlDescription || '',
          isKeyControl: m.map?.isKeyControl || false,
          classification: m.map?.controlType || 'TLC',
          ipoC: m.map?.ipoC,
          ipoA: m.map?.ipoA,
          ipoV: m.map?.ipoV,
          ipoRa: m.map?.ipoRa,
          cosoPrinciples: m.map?.cosoPrinciples,
          itgcDomain: m.map?.itgcDomain,
          itgcAssertions: m.map?.itgcAssertions,
        }));

        return {
          ...node,
          data: {
            ...node.data,
            regulatoryPairs
          }
        };
      }
      return node;
    }));
  }

  async createDiagram(orgId: string, userId: string, body: any) {
    const id = crypto.randomUUID();
    const yearValue = body.year ? parseInt(body.year.toString()) : null;

    const newDiagram = {
      id,
      organizationId: orgId,
      name: body.name || "New Diagram",
      subProcess: body.subProcess,
      year: yearValue,
      nodes: body.nodes || [],
      edges: body.edges || [],
      createdAt: new Date(),
      createdBy: userId,
    };
    await this.db.insert(bpmDiagrams).values(newDiagram);

    await this.auditService.logAction({
      organizationId: orgId,
      userId: userId,
      action: 'CREATE',
      entityType: 'BPMDiagram',
      entityId: id,
      dataAfter: newDiagram,
    });

    return newDiagram;
  }

  async updateDiagram(orgId: string, userId: string, id: string, body: any) {
    const originalDb = this.db;
    return await originalDb.transaction(async (tx) => {
      this.db = tx;
      try {
        const oldDiagrams = await this.db.select().from(bpmDiagrams).where(and(eq(bpmDiagrams.id, id), eq(bpmDiagrams.organizationId, orgId))).limit(1);
        const oldDiagram = oldDiagrams[0];

        // 1. Update Diagram Metadata & Log Action
        await this.updateDiagramMetadata(orgId, userId, id, body, oldDiagram);

        const diagramYear = body.year ? parseInt(body.year.toString()) : (oldDiagram?.year || null);

        // 2. Resolve BPM Process & NoGL
        const matchedProcesses = body.subProcess
          ? await this.db.select().from(bpmProcesses)
            .where(and(
              eq(bpmProcesses.organizationId, orgId),
              diagramYear ? eq(bpmProcesses.year, diagramYear) : isNull(bpmProcesses.year),
              sql`TRIM(LOWER(${bpmProcesses.name})) = TRIM(LOWER(${body.subProcess}))`
            )).limit(1)
          : [];
        
        const bpmProcessId = matchedProcesses.length > 0 ? matchedProcesses[0].id : null;
        let noGL = matchedProcesses.length > 0 ? matchedProcesses[0].noGL : "";
        let currentGLCodes: string[] = [];

        if (bpmProcessId && body.noGLs !== undefined) {
          await this.db.delete(bpmProcessGlCodes).where(eq(bpmProcessGlCodes.bpmProcessId, bpmProcessId));
          if (Array.isArray(body.noGLs) && body.noGLs.length > 0) {
            for (const glCode of body.noGLs) {
              await this.db.insert(bpmProcessGlCodes).values({
                id: crypto.randomUUID(),
                organizationId: orgId,
                bpmProcessId,
                noGL: glCode
              });
            }
            noGL = body.noGLs[0];
            await this.db.update(bpmProcesses).set({ noGL }).where(eq(bpmProcesses.id, bpmProcessId));
            currentGLCodes = body.noGLs;
          }
        } else if (bpmProcessId) {
          const existingGLs = await this.db.select({ noGL: bpmProcessGlCodes.noGL })
            .from(bpmProcessGlCodes)
            .where(eq(bpmProcessGlCodes.bpmProcessId, bpmProcessId));
          currentGLCodes = existingGLs.map(g => g.noGL);
          if (currentGLCodes.length === 0 && noGL) {
            currentGLCodes = [noGL];
          }
        }

        const glCodesToSync = currentGLCodes.length > 0 ? currentGLCodes : [""];

        // 3. Clear existing node-RCM mappings for this diagram
        await this.db.delete(bpmNodeRcms).where(eq(bpmNodeRcms.diagramId, id));

        const nodes = body.nodes || [];
        const edges = body.edges || [];

        // 4. Sync Risks and Controls from Nodes
        const { activeRiskControlPairs, activeRiskIds, activeControlIds } = 
          await this.syncRisksAndControlsFromNodes(orgId, id, nodes, bpmProcessId, glCodesToSync, body.name, body.subProcess, diagramYear);

        // 5. Sync from Edges (Risk -> Control)
        await this.syncMappingsFromEdges(orgId, edges, nodes, activeRiskControlPairs, glCodesToSync);

        // 6, 7, 8. Cleanup stale data
        await this.cleanupStaleData(orgId, id, activeRiskIds, activeControlIds, activeRiskControlPairs);

        // 9. Update Summary Counts in BPM Processes
        await this.updateProcessSummaryCounts(orgId, id);

        return { success: true };
      } finally {
        this.db = originalDb;
      }
    });
  }

  private async updateDiagramMetadata(orgId: string, userId: string, id: string, body: any, oldDiagram: any) {
    const yearValue = body.year ? parseInt(body.year.toString()) : undefined;

    await this.db.update(bpmDiagrams)
      .set({
        name: body.name,
        year: yearValue,
        subProcess: body.subProcess,
        nodes: body.nodes,
        edges: body.edges,
        metadata: body.metadata,
        updatedAt: new Date(),
      })
      .where(and(eq(bpmDiagrams.id, id), eq(bpmDiagrams.organizationId, orgId)));

    await this.auditService.logAction({
      organizationId: orgId,
      userId: userId,
      action: 'UPDATE_BPM',
      entityType: 'BPMDiagram',
      entityId: id,
      dataBefore: oldDiagram,
      dataAfter: body,
      description: `Updated BPM Diagram: ${body.name}`
    });
  }

  private async syncRisksAndControlsFromNodes(
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

  private async syncRisk(orgId: string, diagramId: string, riskId: string, reg: any, processName: string, subProcessName: string, year: number | null) {
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

  private async syncControl(
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

  private async syncRcmControlMapping(orgId: string, riskId: string, ctrlId: string, reg: any, year: number | null, nodeLabel?: string) {
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

  private async syncMappingsFromEdges(orgId: string, edges: any[], nodes: any[], activeRiskControlPairs: Set<string>, glCodes: string[]) {
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

  private async cleanupStaleData(
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

  private async updateProcessSummaryCounts(orgId: string, diagramId: string) {
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

  async deleteDiagram(orgId: string, id: string) {
    // 1. Decouple rcms foreign key referencing this diagram
    await this.db.update(rcms)
      .set({ diagramId: null })
      .where(and(eq(rcms.diagramId, id), eq(rcms.organizationId, orgId)));

    // 2. Delete linked node-rcm mappings
    await this.db.delete(bpmNodeRcms)
      .where(and(eq(bpmNodeRcms.diagramId, id), eq(bpmNodeRcms.organizationId, orgId)));

    // 3. Delete the diagram itself
    await this.db.delete(bpmDiagrams).where(and(eq(bpmDiagrams.id, id), eq(bpmDiagrams.organizationId, orgId)));
    return { success: true };
  }

  async getDiagramByControlId(orgId: string, controlId: string) {
    const links = await this.db.select().from(rcmControls).where(and(
      eq(rcmControls.controlId, controlId),
      eq(rcmControls.organizationId, orgId)
    ));

    if (links.length === 0) return null;

    const riskIds = links.map((l: any) => l.rcmId);
    const nodeLinks = await this.db.select().from(bpmNodeRcms).where(and(
      inArray(bpmNodeRcms.rcmId, riskIds),
      eq(bpmNodeRcms.organizationId, orgId)
    ));

    if (nodeLinks.length === 0) return null;

    const firstLink = nodeLinks[0];
    const diag = await this.db.select().from(bpmDiagrams).where(and(
      eq(bpmDiagrams.id, firstLink.diagramId),
      eq(bpmDiagrams.organizationId, orgId)
    )).limit(1);

    if (diag.length === 0) return null;

    return {
      diagram: diag[0],
      nodeId: firstLink.nodeId
    };
  }

  async getDiagramByGL(orgId: string, noGL: string, subProcessName?: string) {
    let diag: any = null;
    if (subProcessName) {
      const diagrams = await this.db.select().from(bpmDiagrams)
        .where(and(
          eq(bpmDiagrams.organizationId, orgId),
          eq(bpmDiagrams.subProcess, subProcessName)
        )).limit(1);

      if (diagrams.length > 0) {
        diag = diagrams[0];
      }
    }

    if (!diag) {
      const processes = await this.db.select().from(bpmProcesses)
        .where(and(
          eq(bpmProcesses.organizationId, orgId),
          eq(bpmProcesses.noGL, noGL)
        )).limit(1);

      if (processes.length > 0) {
        const process = processes[0];
        const diagrams = await this.db.select().from(bpmDiagrams)
          .where(and(
            eq(bpmDiagrams.organizationId, orgId),
            eq(bpmDiagrams.subProcess, process.name)
          )).limit(1);

        if (diagrams.length > 0) {
          diag = diagrams[0];
        } else {
          const byName = await this.db.select().from(bpmDiagrams)
            .where(and(
              eq(bpmDiagrams.organizationId, orgId),
              eq(bpmDiagrams.name, process.name)
            )).limit(1);

          if (byName.length > 0) diag = byName[0];
        }
      }
    }

    if (!diag) return null;

    const nodes = (diag.nodes as any[]) || [];
    const hydratedNodes = await this.hydrateDiagramNodes(diag.id, nodes, noGL);

    return {
      ...diag,
      nodes: hydratedNodes
    };
  }

  async getAllProcesses(orgId: string, noGL?: string, id?: string, year?: number) {
    let conditions: SQL = eq(bpmProcesses.organizationId, orgId);
    if (id) conditions = and(conditions, eq(bpmProcesses.id, id)) as SQL;
    if (year) conditions = and(conditions, eq(bpmProcesses.year, year)) as SQL;

    if (noGL) {
      const mappings = await this.db.select({ id: bpmProcessGlCodes.bpmProcessId })
        .from(bpmProcessGlCodes)
        .where(and(
          eq(bpmProcessGlCodes.organizationId, orgId),
          eq(bpmProcessGlCodes.noGL, noGL)
        ));
      const mappedIds = mappings.map(m => m.id);

      conditions = and(
        conditions,
        or(
          eq(bpmProcesses.noGL, noGL),
          mappedIds.length > 0 ? inArray(bpmProcesses.id, mappedIds) : sql`false`
        )
      ) as SQL;
    }

    return await this.db.select({
      id: bpmProcesses.id,
      organizationId: bpmProcesses.organizationId,
      noGL: bpmProcesses.noGL,
      fsliName: bpmProcesses.fsliName,
      name: bpmProcesses.name,
      year: bpmProcesses.year,
      createdAt: bpmProcesses.createdAt,
      createdBy: bpmProcesses.createdBy,
      controlCount: bpmProcesses.controlCount,
      riskCount: bpmProcesses.riskCount,
      bpmCode: bpmProcesses.bpmCode,
      standardTestProcedure: bpmProcesses.standardTestProcedure,
      workflowStatus: bpmProcesses.workflowStatus,
      workflowHistory: bpmProcesses.workflowHistory
    })
    .from(bpmProcesses)
    .where(conditions);
  }

  async getNextSequences(orgId: string, processId: string) {
    const processes = await this.db.select().from(bpmProcesses).where(and(eq(bpmProcesses.id, processId), eq(bpmProcesses.organizationId, orgId))).limit(1);
    if (processes.length === 0) throw new Error("Process not found");
    const process = processes[0];
    const bpmCode = process.bpmCode || 'DEFAULT';

    const riskPrefix = `R-${bpmCode}-`;
    const controlPrefix = `C-${bpmCode}-`;

    const risks = await this.db.select({ id: rcms.id }).from(rcms).where(
      and(
        eq(rcms.organizationId, orgId),
        like(rcms.id, `${riskPrefix}%`)
      )
    );
    const ctrls = await this.db.select({ id: controls.id }).from(controls).where(
      and(
        eq(controls.organizationId, orgId),
        like(controls.id, `${controlPrefix}%`)
      )
    );

    const parseSeq = (id: string, prefix: string) => {
      const remainder = id.substring(prefix.length);
      const match = remainder.match(/^(\d+)/);
      if (match) {
        return parseInt(match[1], 10);
      }
      return 0;
    };

    let maxRisk = 0;
    for (const r of risks) {
      const seq = parseSeq(r.id, riskPrefix);
      if (seq > maxRisk) maxRisk = seq;
    }

    let maxCtrl = 0;
    for (const c of ctrls) {
      const seq = parseSeq(c.id, controlPrefix);
      if (seq > maxCtrl) maxCtrl = seq;
    }

    const nextRiskId = `${riskPrefix}${(maxRisk + 1).toString().padStart(4, '0')}`;
    const nextControlId = `${controlPrefix}${(maxCtrl + 1).toString().padStart(4, '0')}`;

    return { nextRiskId, nextControlId, bpmCode };
  }

  async handleWorkflowAction(orgId: string, userId: string, role: string, id: string, body: { action: any, note: string, assigneeId?: string }) {
    const processes = await this.db.select().from(bpmProcesses).where(and(eq(bpmProcesses.id, id), eq(bpmProcesses.organizationId, orgId))).limit(1);
    if (processes.length === 0) throw new Error("Process not found");

    const process = processes[0];
    const currentStatus = (process.workflowStatus as any) || "Draft";
    let nextStatus = currentStatus;

    if (body.action === "Submit") {
      nextStatus = "In Review";
    } else if (body.action === "Review") {
      nextStatus = "In Approval";
    } else if (body.action === "Approve") {
      nextStatus = "Resolved";
    } else if (body.action === "Reject") {
      if (!body.note) throw new Error("Rejection requires a note");
      nextStatus = "Rejected";
    } else if (body.action === "Rollback") {
      if (!body.note) throw new Error("Rollback requires a note");
      nextStatus = "Draft";
    }

    const historyEntry = {
      id: crypto.randomUUID(),
      action: body.action,
      fromStatus: currentStatus,
      toStatus: nextStatus,
      userId,
      role,
      timestamp: Date.now(),
      note: body.note
    };

    const currentHistory = (process.workflowHistory as any[]) || [];
    const newHistory = [historyEntry, ...currentHistory];

    await this.db.update(bpmProcesses)
      .set({ 
        workflowStatus: nextStatus,
        workflowHistory: newHistory
      })
      .where(and(eq(bpmProcesses.id, id), eq(bpmProcesses.organizationId, orgId)));

    if (nextStatus !== currentStatus) {
      const targetUserId = body.assigneeId || process.createdBy || userId;
      await this.db.insert(notifications).values({
        id: crypto.randomUUID(),
        organizationId: orgId,
        userId: targetUserId,
        message: `Status BPM "${process.name}" berubah menjadi ${nextStatus}. ${body.note ? 'Catatan: ' + body.note : ''}`,
        type: body.action === 'Reject' ? 'error' : (body.action === 'Approve' ? 'success' : 'info'),
        link: `/bpm?id=${id}`,
        readStatus: false,
        createdAt: new Date(),
      });
    }

    return { success: true, nextStatus };
  }

  async createProcess(orgId: string, userId: string, body: Partial<BPMProcess>) {
    const id = crypto.randomUUID();
    const newProcess = {
      id,
      organizationId: orgId,
      noGL: body.noGL || "",
      fsliName: body.fsliName || "",
      name: body.name || "New Process",
      year: body.year ? parseInt(body.year.toString()) : null,
      createdAt: new Date(),
      createdBy: userId,
    };

    await this.db.insert(bpmProcesses).values(newProcess);
    
    await this.auditService.logAction({
      organizationId: orgId,
      userId: userId,
      action: 'CREATE',
      entityType: 'BPMProcess',
      entityId: id,
      dataAfter: newProcess,
    });

    return newProcess;
  }

  async updateProcess(orgId: string, id: string, body: Partial<BPMProcess>) {
    const updateData: any = {};
    if (body.name !== undefined) updateData.name = body.name;
    if (body.bpmCode !== undefined && body.bpmCode !== null) updateData.bpmCode = body.bpmCode.trim().toUpperCase();
    if (body.fsliName !== undefined) updateData.fsliName = body.fsliName;
    if (body.standardTestProcedure !== undefined) updateData.standardTestProcedure = body.standardTestProcedure;

    if (updateData.bpmCode) {
      const existing = await this.db.select()
        .from(bpmProcesses)
        .where(and(
          eq(bpmProcesses.organizationId, orgId),
          eq(bpmProcesses.bpmCode, updateData.bpmCode),
          ne(bpmProcesses.id, id)
        ))
        .limit(1);
      
      if (existing.length > 0) {
        throw new Error(`BPM Code '${updateData.bpmCode}' sudah digunakan oleh proses lain.`);
      }
    }

    if (Object.keys(updateData).length > 0) {
      await this.db.update(bpmProcesses)
        .set(updateData)
        .where(and(eq(bpmProcesses.id, id), eq(bpmProcesses.organizationId, orgId)));
    }

    return { success: true };
  }

  async deleteProcess(orgId: string, id: string) {
    // Note: neon-http driver does not support transactions. 
    // We execute these sequentially. Data integrity risk is low for this operation.
    
    // 0. Fetch the target process to know its name and year
    const targetProcesses = await this.db.select()
      .from(bpmProcesses)
      .where(and(eq(bpmProcesses.id, id), eq(bpmProcesses.organizationId, orgId)))
      .limit(1);

    if (targetProcesses.length > 0) {
      const target = targetProcesses[0];
      const subProcessName = target.name?.trim();
      const processYear = target.year;

      if (subProcessName) {
        // Check if any other BPM process in the same org and year shares this sub-process name
        const otherProcesses = await this.db.select({ id: bpmProcesses.id })
          .from(bpmProcesses)
          .where(and(
            eq(bpmProcesses.organizationId, orgId),
            ne(bpmProcesses.id, id),
            processYear ? eq(bpmProcesses.year, processYear) : isNull(bpmProcesses.year),
            sql`TRIM(LOWER(${bpmProcesses.name})) = TRIM(LOWER(${subProcessName}))`
          ))
          .limit(1);

        // If no other process uses this sub-process name, cascade delete associated diagrams
        if (otherProcesses.length === 0) {
          const associatedDiagrams = await this.db.select({ id: bpmDiagrams.id })
            .from(bpmDiagrams)
            .where(and(
              eq(bpmDiagrams.organizationId, orgId),
              processYear ? eq(bpmDiagrams.year, processYear) : isNull(bpmDiagrams.year),
              sql`TRIM(LOWER(${bpmDiagrams.subProcess})) = TRIM(LOWER(${subProcessName}))`
            ));

          for (const diag of associatedDiagrams) {
            await this.deleteDiagram(orgId, diag.id);
          }
        }
      }
    }

    // 1. Decouple controls
    await this.db.update(controls)
      .set({ bpmProcessId: null })
      .where(and(eq(controls.bpmProcessId, id), eq(controls.organizationId, orgId)));

    // 2. Decouple CSA records
    await this.db.update(csaRecords)
      .set({ bpmProcessId: null })
      .where(and(eq(csaRecords.bpmProcessId, id), eq(csaRecords.organizationId, orgId)));

    // 3. Delete BPM Process GL Codes
    await this.db.delete(bpmProcessGlCodes)
      .where(eq(bpmProcessGlCodes.bpmProcessId, id));

    // 4. Delete the process
    await this.db.delete(bpmProcesses)
      .where(and(eq(bpmProcesses.id, id), eq(bpmProcesses.organizationId, orgId)));

    return { success: true };
  }

  async getControlsByProcess(orgId: string, bpmProcessId: string) {
    return await this.db.select().from(controls)
      .where(and(
        eq(controls.organizationId, orgId),
        eq(controls.bpmProcessId, bpmProcessId)
      ));
  }

  async cleanupFlowPrefixes(orgId: string) {
    const records = await this.db.select({ id: bpmDiagrams.id, name: bpmDiagrams.name })
      .from(bpmDiagrams)
      .where(and(eq(bpmDiagrams.organizationId, orgId), like(bpmDiagrams.name, 'Flow: %')));

    let cleanedCount = 0;
    for (const record of records) {
      if (record.name && record.name.startsWith('Flow: ')) {
        const cleanName = record.name.replace(/^Flow:\s*/, '');
        await this.db.update(bpmDiagrams)
          .set({ name: cleanName })
          .where(and(eq(bpmDiagrams.id, record.id), eq(bpmDiagrams.organizationId, orgId)));
        cleanedCount++;
      }
    }
    return { cleanedCount };
  }
}
