import {
  bpmProcesses, bpmDiagrams, rcms, controls, csaRecords, bpmProcessGlCodes
} from '../db/schema';
import { eq, and, inArray, ne, isNull, like } from 'drizzle-orm';
import type { DrizzleDb } from '../db';
import type { BPMProcess } from "@shared/types";
import { AppError } from '../lib/utils';
import { AuditService } from './audit-service';
import { extractBaseId, makeGlSpecificId, parseSequenceNumber } from './bpm/bpm-utils';
import { BpmSyncManager } from './bpm/bpm-sync';
import { BpmHydrator } from './bpm/bpm-hydrator';
import { sameSubProcess } from './bpm/bpm-match';
import {
  loadProcessHierarchy,
  planReorganize,
  type ReorganizeAction,
} from './bpm/bpm-process-hierarchy';
import * as diagramStore from './bpm/bpm-diagrams';
import type { DiagramContext, DiagramWriteBody } from './bpm/bpm-diagrams';

export { extractBaseId, makeGlSpecificId };

/** Stable codes for `AppError`s raised by this service; the route maps code+status. */
export type BpmProcessErrorCode = 'BPM_PROCESS_NOT_FOUND' | 'BPM_CODE_TAKEN';
export const BPM_PROCESS_NOT_FOUND: BpmProcessErrorCode = 'BPM_PROCESS_NOT_FOUND';
export const BPM_CODE_TAKEN: BpmProcessErrorCode = 'BPM_CODE_TAKEN';

type ProcessUpdate = Partial<typeof bpmProcesses.$inferInsert>;

export class BpmService {
  private auditService: AuditService;
  private syncManager: BpmSyncManager;
  private hydrator: BpmHydrator;

  constructor(private db: DrizzleDb) {
    this.auditService = new AuditService(db);
    this.syncManager = new BpmSyncManager(db);
    this.hydrator = new BpmHydrator(db);
  }

  private setTxDb(tx: DrizzleDb) {
    this.db = tx;
    this.syncManager.setDb(tx);
    this.hydrator.setDb(tx);
  }

  /** Runs a multi-step cascade as one transaction (all-or-nothing). */
  private async inTransaction<T>(work: () => Promise<T>): Promise<T> {
    const originalDb = this.db;
    return await originalDb.transaction(async (tx) => {
      this.setTxDb(tx);
      try {
        return await work();
      } finally {
        this.setTxDb(originalDb);
      }
    });
  }

  /**
   * The diagram seam's live handles: `db` is the transaction handle while a
   * cascade runs inside `inTransaction`, so the mutating delegates below keep
   * the class as the single transactional owner.
   */
  private diagramContext(): DiagramContext {
    return { db: this.db, audit: this.auditService, hydrator: this.hydrator, sync: this.syncManager };
  }

  // --- Diagram cluster: delegates to ./bpm/bpm-diagrams ---

  async getAllDiagrams(orgId: string, year?: number) {
    return await diagramStore.getAllDiagrams(this.db, orgId, year);
  }

  async getDiagramById(orgId: string, id: string, noGL?: string) {
    return await diagramStore.getDiagramById(this.diagramContext(), orgId, id, noGL);
  }

  async createDiagram(orgId: string, userId: string, body: DiagramWriteBody) {
    return await diagramStore.createDiagram(this.diagramContext(), orgId, userId, body);
  }

  async updateDiagram(orgId: string, userId: string, id: string, body: DiagramWriteBody) {
    return await this.inTransaction(
      () => diagramStore.updateDiagram(this.diagramContext(), orgId, userId, id, body)
    );
  }

  async deleteDiagram(orgId: string, id: string) {
    return await this.inTransaction(async () => {
      await diagramStore.cascadeDeleteDiagram(this.diagramContext(), orgId, id);
      return { success: true };
    });
  }

  async getDiagramByControlId(orgId: string, controlId: string) {
    return await diagramStore.getDiagramByControlId(this.db, orgId, controlId);
  }

  async getDiagramByGL(orgId: string, noGL: string, subProcessName?: string) {
    return await diagramStore.getDiagramByGL(this.diagramContext(), orgId, noGL, subProcessName);
  }

  async cleanupFlowPrefixes(orgId: string) {
    return await diagramStore.cleanupFlowPrefixes(this.db, orgId);
  }

  // --- Process cluster ---

  async getAllProcesses(orgId: string, noGL?: string, id?: string, year?: number) {
    // One definition of the list filter + child-count rollup: the seam.
    return loadProcessHierarchy(this.db, { orgId, id, year, noGL });
  }

  async getNextSequences(orgId: string, processId: string) {
    const processes = await this.db.select().from(bpmProcesses).where(and(eq(bpmProcesses.id, processId), eq(bpmProcesses.organizationId, orgId))).limit(1);
    if (processes.length === 0) throw new AppError(BPM_PROCESS_NOT_FOUND, 'Process not found', 404);
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
    const updateData: ProcessUpdate = {};
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
        throw new AppError(BPM_CODE_TAKEN, `BPM code already in use: ${updateData.bpmCode}`, 409);
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
      action: ReorganizeAction;
      targetParentId?: string;
      processIds: string[];
    }
  ) {
    const { action, targetParentId, processIds = [] } = payload;

    const targetExists = action === 'demote' && targetParentId
      ? (await this.db.select({ id: bpmProcesses.id })
          .from(bpmProcesses)
          .where(and(eq(bpmProcesses.id, targetParentId), eq(bpmProcesses.organizationId, orgId)))
          .limit(1)).length > 0
      : false;

    const plan = planReorganize({ action, processIds, targetParentId, targetExists });
    if (plan.ok === false) throw new AppError(plan.code, plan.message, plan.status);

    return await this.inTransaction(async () => {
      if (plan.action === 'demote') {
        await this.db.update(bpmProcesses)
          .set({
            parentId: plan.targetParentId,
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
            eq(bpmProcesses.id, plan.targetParentId)
          ));

        await this.auditService.logAction({
          organizationId: orgId,
          userId,
          action: 'UPDATE',
          entityType: 'BPMProcess',
          entityId: plan.targetParentId,
          description: `Batch demoted ${processIds.length} processes to sub-processes under ${plan.targetParentId}`,
          dataAfter: { action: 'batch_demote', targetParentId: plan.targetParentId, processIds }
        });

        return { success: true, count: processIds.length, action: 'demote', targetParentId: plan.targetParentId };
      }

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
    });
  }

  async deleteProcess(orgId: string, id: string) {
    return await this.inTransaction(async () => {
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
              sameSubProcess(bpmProcesses.name, subProcessName)
            ))
            .limit(1);

          if (otherProcesses.length === 0) {
            const associatedDiagrams = await this.db.select({ id: bpmDiagrams.id })
              .from(bpmDiagrams)
              .where(and(
                eq(bpmDiagrams.organizationId, orgId),
                processYear ? eq(bpmDiagrams.year, processYear) : isNull(bpmDiagrams.year),
                sameSubProcess(bpmDiagrams.subProcess, subProcessName)
              ));

            for (const diag of associatedDiagrams) {
              await diagramStore.cascadeDeleteDiagram(this.diagramContext(), orgId, diag.id);
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
    });
  }

  async getControlsByProcess(orgId: string, bpmProcessId: string) {
    return await this.db.select().from(controls)
      .where(and(
        eq(controls.organizationId, orgId),
        eq(controls.bpmProcessId, bpmProcessId)
      ));
  }
}
