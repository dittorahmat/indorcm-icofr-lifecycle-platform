import { 
  bpmDiagrams, bpmProcesses, rcms, controls, bpmNodeRcms,
  csaRecords, bpmProcessGlCodes
} from '../db/schema';
import { eq, and, or, inArray, sql, ne, SQL, isNull, like } from 'drizzle-orm';
import type { DrizzleDb } from '../db';
import type { BPMProcess } from "@shared/types";
import { AuditService } from './audit-service';
import { extractBaseId, makeGlSpecificId, parseSequenceNumber } from './bpm/bpm-utils';
import { BpmSyncManager } from './bpm/bpm-sync';
import { BpmWorkflowManager } from './bpm/bpm-workflow';
import { BpmHydrator } from './bpm/bpm-hydrator';

export { extractBaseId, makeGlSpecificId };

export class BpmService {
  private auditService: AuditService;
  private syncManager: BpmSyncManager;
  private workflowManager: BpmWorkflowManager;
  private hydrator: BpmHydrator;

  constructor(private db: DrizzleDb) {
    this.auditService = new AuditService(db);
    this.syncManager = new BpmSyncManager(db);
    this.workflowManager = new BpmWorkflowManager(db);
    this.hydrator = new BpmHydrator(db);
  }

  private setTxDb(tx: DrizzleDb) {
    this.db = tx;
    this.syncManager.setDb(tx);
    this.workflowManager.setDb(tx);
    this.hydrator.setDb(tx);
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
    const hydratedNodes = await this.hydrator.hydrateDiagramNodes(id, nodes, noGL);

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
      this.setTxDb(tx);
      try {
        const oldDiagrams = await this.db.select().from(bpmDiagrams).where(and(eq(bpmDiagrams.id, id), eq(bpmDiagrams.organizationId, orgId))).limit(1);
        const oldDiagram = oldDiagrams[0];
        if (!oldDiagram) {
          return null;
        }

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
          await this.syncManager.syncRisksAndControlsFromNodes(orgId, id, nodes, bpmProcessId, glCodesToSync, body.name, body.subProcess, diagramYear);

        // 5. Sync from Edges (Risk -> Control)
        await this.syncManager.syncMappingsFromEdges(orgId, edges, nodes, activeRiskControlPairs, glCodesToSync);

        // 6, 7, 8. Cleanup stale data
        await this.syncManager.cleanupStaleData(orgId, id, activeRiskIds, activeControlIds, activeRiskControlPairs);

        // 9. Update Summary Counts in BPM Processes
        await this.syncManager.updateProcessSummaryCounts(orgId, id);

        return { success: true };
      } finally {
        this.setTxDb(originalDb);
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

  async deleteDiagram(orgId: string, id: string) {
    await this.db.update(rcms)
      .set({ diagramId: null })
      .where(and(eq(rcms.diagramId, id), eq(rcms.organizationId, orgId)));

    await this.db.delete(bpmNodeRcms)
      .where(and(eq(bpmNodeRcms.diagramId, id), eq(bpmNodeRcms.organizationId, orgId)));

    await this.db.delete(bpmDiagrams).where(and(eq(bpmDiagrams.id, id), eq(bpmDiagrams.organizationId, orgId)));
    return { success: true };
  }

  async getDiagramByControlId(orgId: string, controlId: string) {
    const links = await this.db.select().from(rcms).innerJoin(
      controls,
      and(
        eq(controls.id, controlId),
        eq(controls.rcmId, rcms.id),
        eq(controls.organizationId, orgId)
      )
    );

    if (links.length === 0) return null;

    const riskIds = links.map(l => l.rcms.id);
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
    const hydratedNodes = await this.hydrator.hydrateDiagramNodes(diag.id, nodes, noGL);

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

    const rawProcesses = await this.db.select({
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
      workflowHistory: bpmProcesses.workflowHistory,
      parentId: bpmProcesses.parentId,
      level: bpmProcesses.level,
    })
    .from(bpmProcesses)
    .where(conditions);

    const childCountsByParent = new Map<string, { risks: number; controls: number }>();
    for (const p of rawProcesses) {
      if (p.parentId) {
        const current = childCountsByParent.get(p.parentId) || { risks: 0, controls: 0 };
        current.risks += (p.riskCount || 0);
        current.controls += (p.controlCount || 0);
        childCountsByParent.set(p.parentId, current);
      }
    }

    return rawProcesses.map(p => {
      const childCounts = childCountsByParent.get(p.id);
      if (childCounts) {
        return {
          ...p,
          riskCount: (p.riskCount || 0) + childCounts.risks,
          controlCount: (p.controlCount || 0) + childCounts.controls
        };
      }
      return p;
    });
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

    let maxRisk = 0;
    for (const r of risks) {
      const seq = parseSequenceNumber(r.id, riskPrefix);
      if (seq > maxRisk) maxRisk = seq;
    }

    let maxCtrl = 0;
    for (const c of ctrls) {
      const seq = parseSequenceNumber(c.id, controlPrefix);
      if (seq > maxCtrl) maxCtrl = seq;
    }

    const nextRiskId = `${riskPrefix}${(maxRisk + 1).toString().padStart(4, '0')}`;
    const nextControlId = `${controlPrefix}${(maxCtrl + 1).toString().padStart(4, '0')}`;

    return { nextRiskId, nextControlId, bpmCode };
  }

  async handleWorkflowAction(orgId: string, userId: string, role: string, id: string, body: { action: any, note: string, assigneeId?: string }) {
    return await this.workflowManager.handleWorkflowAction(orgId, userId, role, id, body);
  }

  async createProcess(orgId: string, userId: string, body: Partial<BPMProcess>) {
    const id = crypto.randomUUID();
    const parentId = body.parentId || null;
    const level = body.level || (parentId ? 'sub_process' : 'process');

    const newProcess = {
      id,
      organizationId: orgId,
      noGL: body.noGL || "",
      fsliName: body.fsliName || "",
      name: body.name || "New Process",
      year: body.year ? parseInt(body.year.toString()) : null,
      parentId,
      level,
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
    if (body.parentId !== undefined) updateData.parentId = body.parentId;
    if (body.level !== undefined) updateData.level = body.level;

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

  async batchReorganizeProcesses(
    orgId: string,
    userId: string,
    payload: {
      action: 'demote' | 'promote';
      targetParentId?: string;
      processIds: string[];
    }
  ) {
    const { action, targetParentId, processIds } = payload;
    if (!processIds || processIds.length === 0) {
      throw new Error("Tidak ada proses yang dipilih untuk reorganisasi");
    }

    if (action === 'demote') {
      if (!targetParentId) {
        throw new Error("Proses Induk tujuan wajib dipilih untuk demote");
      }
      if (processIds.includes(targetParentId)) {
        throw new Error("Proses tidak dapat dijadikan sub-proses dari dirinya sendiri");
      }

      const targetParents = await this.db.select()
        .from(bpmProcesses)
        .where(and(eq(bpmProcesses.id, targetParentId), eq(bpmProcesses.organizationId, orgId)))
        .limit(1);
      
      if (targetParents.length === 0) {
        throw new Error("Proses Induk tujuan tidak ditemukan");
      }

      await this.db.update(bpmProcesses)
        .set({
          parentId: targetParentId,
          level: 'sub_process'
        })
        .where(and(
          eq(bpmProcesses.organizationId, orgId),
          inArray(bpmProcesses.id, processIds)
        ));

      await this.db.update(bpmProcesses)
        .set({
          level: 'process'
        })
        .where(and(
          eq(bpmProcesses.organizationId, orgId),
          eq(bpmProcesses.id, targetParentId)
        ));

      await this.auditService.logAction({
        organizationId: orgId,
        userId,
        action: 'UPDATE',
        entityType: 'BPMProcess',
        entityId: targetParentId,
        description: `Batch demoted ${processIds.length} processes to sub-processes under ${targetParentId}`,
        dataAfter: { action: 'batch_demote', targetParentId, processIds }
      });

      return { success: true, count: processIds.length, action: 'demote', targetParentId };
    } else if (action === 'promote') {
      await this.db.update(bpmProcesses)
        .set({
          parentId: null,
          level: 'process'
        })
        .where(and(
          eq(bpmProcesses.organizationId, orgId),
          inArray(bpmProcesses.id, processIds)
        ));

      await this.auditService.logAction({
        organizationId: orgId,
        userId,
        action: 'UPDATE',
        entityType: 'BPMProcess',
        entityId: processIds[0],
        description: `Batch promoted ${processIds.length} sub-processes to independent processes`,
        dataAfter: { action: 'batch_promote', processIds }
      });

      return { success: true, count: processIds.length, action: 'promote' };
    } else {
      throw new Error(`Aksi tidak valid: ${action}`);
    }
  }

  async deleteProcess(orgId: string, id: string) {
    const targetProcesses = await this.db.select()
      .from(bpmProcesses)
      .where(and(eq(bpmProcesses.id, id), eq(bpmProcesses.organizationId, orgId)))
      .limit(1);

    if (targetProcesses.length > 0) {
      const target = targetProcesses[0];
      const subProcessName = target.name?.trim();
      const processYear = target.year;

      if (subProcessName) {
        const otherProcesses = await this.db.select({ id: bpmProcesses.id })
          .from(bpmProcesses)
          .where(and(
            eq(bpmProcesses.organizationId, orgId),
            ne(bpmProcesses.id, id),
            processYear ? eq(bpmProcesses.year, processYear) : isNull(bpmProcesses.year),
            sql`TRIM(LOWER(${bpmProcesses.name})) = TRIM(LOWER(${subProcessName}))`
          ))
          .limit(1);

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

    await this.db.update(controls)
      .set({ bpmProcessId: null })
      .where(and(eq(controls.bpmProcessId, id), eq(controls.organizationId, orgId)));

    await this.db.update(csaRecords)
      .set({ bpmProcessId: null })
      .where(and(eq(csaRecords.bpmProcessId, id), eq(csaRecords.organizationId, orgId)));

    await this.db.delete(bpmProcessGlCodes)
      .where(eq(bpmProcessGlCodes.bpmProcessId, id));

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
