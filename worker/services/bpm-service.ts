import { 
  bpmDiagrams, bpmProcesses, rcms, rcmControls, controls, bpmNodeRcms,
  organization, auditLogs, notifications
} from '../db/schema';
import { eq, and, inArray, sql, ne, desc, SQL } from 'drizzle-orm';
import type { DrizzleDb } from '../db';
import type { BPMProcess, BPMDiagram } from "@shared/types";
import { AuditService } from './audit-service';

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

  async getDiagramById(orgId: string, id: string) {
    const diags = await this.db.select().from(bpmDiagrams).where(and(eq(bpmDiagrams.id, id), eq(bpmDiagrams.organizationId, orgId))).limit(1);
    if (diags.length === 0) return null;
    
    const diag = diags[0];
    const nodes = (diag.nodes as any[]) || [];

    const hydratedNodes = await this.hydrateDiagramNodes(id, nodes);

    return {
      ...diag,
      nodes: hydratedNodes
    };
  }

  private async hydrateDiagramNodes(diagramId: string, nodes: any[]) {
    return await Promise.all(nodes.map(async (node: any) => {
      if (node.type === 'activity' || node.type === 'automated-activity') {
        const mappings = await this.db.select({
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

        const regulatoryPairs = mappings.map((m: any) => ({
          riskId: m.risk.id,
          riskDescription: m.risk.riskDescription,
          isFraudRelated: m.risk.isFraudRelated,
          riskRating: m.risk.riskRating,
          controlId: m.map?.controlId || 'C-TBD',
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
    const oldDiagrams = await this.db.select().from(bpmDiagrams).where(and(eq(bpmDiagrams.id, id), eq(bpmDiagrams.organizationId, orgId))).limit(1);
    const oldDiagram = oldDiagrams[0];

    // 1. Update Diagram Metadata & Log Action
    await this.updateDiagramMetadata(orgId, userId, id, body, oldDiagram);

    // 2. Resolve BPM Process & NoGL
    const matchedProcesses = await this.db.select().from(bpmProcesses)
      .where(and(
        eq(bpmProcesses.organizationId, orgId),
        sql`TRIM(LOWER(${bpmProcesses.name})) = TRIM(LOWER(${body.subProcess}))`
      )).limit(1);
    
    const bpmProcessId = matchedProcesses.length > 0 ? matchedProcesses[0].id : null;
    const noGL = matchedProcesses.length > 0 ? matchedProcesses[0].noGL : null;

    // 3. Clear existing node-RCM mappings for this diagram
    await this.db.delete(bpmNodeRcms).where(eq(bpmNodeRcms.diagramId, id));

    const nodes = body.nodes || [];
    const edges = body.edges || [];

    // 4. Sync Risks and Controls from Nodes
    const { activeRiskControlPairs, activeRiskIds, activeControlIds } = 
      await this.syncRisksAndControlsFromNodes(orgId, id, nodes, bpmProcessId, noGL, body.name, body.subProcess);

    // 5. Sync from Edges (Risk -> Control)
    await this.syncMappingsFromEdges(orgId, edges, nodes, activeRiskControlPairs);

    // 6, 7, 8. Cleanup stale data
    await this.cleanupStaleData(orgId, id, activeRiskIds, activeControlIds, activeRiskControlPairs);

    // 9. Update Summary Counts in BPM Processes
    await this.updateProcessSummaryCounts(orgId, id);

    return { success: true };
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
    noGL: string | null, 
    processName: string, 
    subProcessName: string
  ) {
    const activeRiskControlPairs = new Set<string>();
    const activeRiskIds = new Set<string>();
    const activeControlIds = new Set<string>();

    for (const node of nodes) {
      const insertedRiskIdsForNode = new Set<string>();
      const nodePairs = node.data?.regulatoryPairs || 
                       (node.data?.regulatoryData ? [node.data.regulatoryData] : []);

      if ((node.type === 'activity' || node.type === 'automated-activity') && nodePairs.length > 0) {
        for (const reg of nodePairs) {
          const riskId = reg.riskId;
          const ctrlId = reg.controlId;

          if (riskId && ctrlId) {
            activeRiskIds.add(riskId);
            activeControlIds.add(ctrlId);
            activeRiskControlPairs.add(`${riskId}:${ctrlId}`);
            
            await this.syncRisk(orgId, diagramId, riskId, reg, processName, subProcessName);
            await this.syncControl(orgId, ctrlId, riskId, reg, bpmProcessId, noGL, processName, subProcessName, node.data?.label);
            await this.syncRcmControlMapping(orgId, riskId, ctrlId, reg, node.data?.label);

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

      // Legacy support for nodes with only .risks
      if ((node.type === 'activity' || node.type === 'automated-activity') && node.data?.risks && !node.data?.regulatoryPairs && !node.data?.regulatoryData) {
        for (const riskEntry of node.data.risks) {
          if (!insertedRiskIdsForNode.has(riskEntry.rcmId)) {
            await this.db.insert(bpmNodeRcms).values({
              id: crypto.randomUUID(),
              organizationId: orgId,
              diagramId,
              nodeId: node.id,
              rcmId: riskEntry.rcmId
            });
            insertedRiskIdsForNode.add(riskEntry.rcmId);
          }

          if (riskEntry.controlIds) {
            riskEntry.controlIds.forEach((ctrlId: string) => {
              activeRiskControlPairs.add(`${riskEntry.rcmId}:${ctrlId}`);
              activeRiskIds.add(riskEntry.rcmId);
              activeControlIds.add(ctrlId);
            });
          }
        }
      }
    }

    return { activeRiskControlPairs, activeRiskIds, activeControlIds };
  }

  private async syncRisk(orgId: string, diagramId: string, riskId: string, reg: any, processName: string, subProcessName: string) {
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
        diagramId
      });
    } else {
      await this.db.update(rcms).set({
        riskDescription: reg.riskDescription,
        isFraudRelated: reg.isFraudRelated,
        riskRating: reg.riskRating,
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
    nodeLabel?: string
  ) {
    const existingCtrl = await this.db.select().from(controls).where(and(eq(controls.id, ctrlId), eq(controls.organizationId, orgId))).limit(1);
    const controlData = {
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
        ...controlData
      });
    } else {
      await this.db.update(controls).set(controlData).where(eq(controls.id, ctrlId));
    }
  }

  private async syncRcmControlMapping(orgId: string, riskId: string, ctrlId: string, reg: any, nodeLabel?: string) {
    const existingMap = await this.db.select().from(rcmControls).where(and(
      eq(rcmControls.rcmId, riskId),
      eq(rcmControls.controlId, ctrlId),
      eq(rcmControls.organizationId, orgId)
    )).limit(1);

    const mapValues = {
      controlName: reg.controlDescription || nodeLabel,
      controlDescription: reg.controlDescription,
      isKeyControl: reg.isKeyControl,
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

  private async syncMappingsFromEdges(orgId: string, edges: any[], nodes: any[], activeRiskControlPairs: Set<string>) {
    for (const edge of edges) {
      const sourceNode = nodes.find((n: any) => n.id === edge.source);
      const targetNode = nodes.find((n: any) => n.id === edge.target);

      if (sourceNode?.type === 'risk' && targetNode?.type === 'control') {
        const rcmId = sourceNode.data?.rcmId;
        const ctrlId = targetNode.data?.controlId;
        if (rcmId && ctrlId) activeRiskControlPairs.add(`${rcmId}:${ctrlId}`);
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
          await this.db.delete(rcms).where(and(eq(rcms.id, drId), eq(rcms.organizationId, orgId)));
       }
    }
  }

  private async updateProcessSummaryCounts(orgId: string, diagramId: string) {
    const linkedRisks = await this.db.select({ id: bpmNodeRcms.rcmId })
      .from(bpmNodeRcms)
      .where(eq(bpmNodeRcms.diagramId, diagramId))
      .groupBy(bpmNodeRcms.rcmId);
    
    const riskCount = linkedRisks.length;
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
      controlCount = linkedCtrls.length;
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
    if (subProcessName) {
      const diagrams = await this.db.select().from(bpmDiagrams)
        .where(and(
          eq(bpmDiagrams.organizationId, orgId),
          eq(bpmDiagrams.subProcess, subProcessName)
        )).limit(1);

      if (diagrams.length > 0) return diagrams[0];
    }

    const processes = await this.db.select().from(bpmProcesses)
      .where(and(
        eq(bpmProcesses.organizationId, orgId),
        eq(bpmProcesses.noGL, noGL)
      )).limit(1);

    if (processes.length === 0) return null;

    const process = processes[0];

    const diagrams = await this.db.select().from(bpmDiagrams)
      .where(and(
        eq(bpmDiagrams.organizationId, orgId),
        eq(bpmDiagrams.subProcess, process.name)
      )).limit(1);

    if (diagrams.length === 0) {
        const byName = await this.db.select().from(bpmDiagrams)
            .where(and(
                eq(bpmDiagrams.organizationId, orgId),
                eq(bpmDiagrams.name, process.name)
            )).limit(1);

        if (byName.length === 0) return null;
        return byName[0];
    }

    return diagrams[0];
  }

  async getAllProcesses(orgId: string, noGL?: string, id?: string, year?: number) {
    let conditions: SQL = eq(bpmProcesses.organizationId, orgId);
    if (id) conditions = and(conditions, eq(bpmProcesses.id, id)) as SQL;
    if (noGL) conditions = and(conditions, eq(bpmProcesses.noGL, noGL)) as SQL;
    if (year) conditions = and(conditions, eq(bpmProcesses.year, year)) as SQL;

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
    await this.db.delete(bpmProcesses).where(and(eq(bpmProcesses.id, id), eq(bpmProcesses.organizationId, orgId)));
    return { success: true };
  }

  async getControlsByProcess(orgId: string, bpmProcessId: string) {
    return await this.db.select().from(controls)
      .where(and(
        eq(controls.organizationId, orgId),
        eq(controls.bpmProcessId, bpmProcessId)
      ));
  }
}
