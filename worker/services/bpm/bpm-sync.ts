import { rcms, rcmControls, controls, bpmNodeRcms, bpmDiagrams, bpmProcesses } from '../../db/schema';
import { eq, and, inArray, sql } from 'drizzle-orm';
import type { DrizzleDb } from '../../db';
import {
  collectNodeSyncEntries,
  extractBaseId,
  makeGlSpecificId,
  type NodeRcmPairToInsert,
  type SyncNodeLike,
} from '@shared/control-linkage';
import { runCleanup } from './bpm-sync-cleanup';

/** An edge as the sync path needs it: endpoints only. */
export interface SyncEdgeLike {
  source: string;
  target: string;
}

type RiskRow = typeof rcms.$inferInsert & { id: string };
type ControlRow = typeof controls.$inferInsert & { id: string };
type MappingRow = typeof rcmControls.$inferInsert & { id: string };

/** Narrow helpers for the open `RegulatoryPair` payload this seam persists. */
const asText = (value: unknown): string | undefined => (typeof value === 'string' ? value : undefined);
const textOr = (value: unknown, fallback: string): string => asText(value) ?? fallback;
const boolOr = (value: unknown, fallback = false): boolean =>
  typeof value === 'boolean' ? value : fallback;
const numbersOf = (value: unknown): number[] =>
  Array.isArray(value) ? value.filter((item): item is number => typeof item === 'number') : [];

export class BpmSyncManager {
  constructor(private db: DrizzleDb) {}

  setDb(db: DrizzleDb) {
    this.db = db;
  }

  /**
   * Internal seam: every sync table follows the same read-then-split write
   * shape (insert unknown ids in one batch, update the known ones). Keeping it
   * private stops three copies of the loop drifting apart.
   */
  private async persistRows<Row extends { id: string }>(
    rows: readonly Row[],
    existingIds: ReadonlySet<string>,
    insert: (rows: Row[]) => Promise<unknown>,
    update: (row: Row) => Promise<unknown>,
  ) {
    const toInsert = rows.filter((row) => !existingIds.has(row.id));
    const toUpdate = rows.filter((row) => existingIds.has(row.id));

    if (toInsert.length > 0) await insert(toInsert);
    for (const row of toUpdate) await update(row);
  }

  async syncRisksAndControlsFromNodes(
    orgId: string,
    diagramId: string,
    nodes: readonly SyncNodeLike[],
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
    } = collectNodeSyncEntries([...nodes], glCodes, { organizationId: orgId, diagramId });

    // 2. Batch sync risks (1 SELECT instead of N SELECTs)
    const allRiskIds = Array.from(risksToSyncMap.keys());
    if (allRiskIds.length > 0) {
      const existingRisks = await this.db.select({ id: rcms.id })
        .from(rcms)
        .where(and(inArray(rcms.id, allRiskIds), eq(rcms.organizationId, orgId)));
      const existingRiskIdSet = new Set(existingRisks.map(r => r.id));

      const riskRows: RiskRow[] = [];
      for (const [riskId, { reg }] of risksToSyncMap.entries()) {
        riskRows.push({
          id: riskId,
          organizationId: orgId,
          process: processName || "Default Process",
          subProcess: subProcessName || "Default Sub Process",
          riskDescription: textOr(reg.riskDescription, "Draft Risk"),
          isFraudRelated: boolOr(reg.isFraudRelated),
          riskRating: textOr(reg.riskRating, "Low"),
          status: "Draft",
          diagramId,
          year,
        });
      }

      await this.persistRows(
        riskRows,
        existingRiskIdSet,
        (rows) => this.db.insert(rcms).values(rows),
        (row) => this.db.update(rcms).set({
          process: row.process,
          subProcess: row.subProcess,
          riskDescription: row.riskDescription,
          isFraudRelated: row.isFraudRelated,
          riskRating: row.riskRating,
          year: row.year,
        }).where(and(eq(rcms.id, row.id), eq(rcms.organizationId, orgId))),
      );
    }

    // 3. Batch sync controls (1 SELECT instead of N SELECTs)
    const allControlIds = Array.from(controlsToSyncMap.keys());
    if (allControlIds.length > 0) {
      const existingControls = await this.db.select({ id: controls.id })
        .from(controls)
        .where(and(inArray(controls.id, allControlIds), eq(controls.organizationId, orgId)));
      const existingControlIdSet = new Set(existingControls.map(c => c.id));

      const controlRows: ControlRow[] = [];
      for (const [ctrlId, item] of controlsToSyncMap.entries()) {
        controlRows.push({
          id: ctrlId,
          organizationId: orgId,
          code: ctrlId,
          rcmId: item.riskId,
          name: textOr(item.reg.controlDescription, item.nodeLabel ?? "Draft Control"),
          level: textOr(item.reg.classification, 'TLC'),
          cosoPrinciples: numbersOf(item.reg.cosoPrinciples),
          bpmProcessId: bpmProcessId,
          businessProcess: processName,
          subProcess: subProcessName,
          year,
          ...(item.noGL ? { fsliCodes: [item.noGL] } : {}),
        });
      }

      await this.persistRows(
        controlRows,
        existingControlIdSet,
        (rows) => this.db.insert(controls).values(rows),
        (row) => this.db.update(controls).set({
          name: row.name,
          level: row.level,
          cosoPrinciples: row.cosoPrinciples,
          bpmProcessId: row.bpmProcessId,
          businessProcess: row.businessProcess,
          subProcess: row.subProcess,
          year: row.year,
          ...(row.fsliCodes ? { fsliCodes: row.fsliCodes } : {}),
        }).where(and(eq(controls.id, row.id), eq(controls.organizationId, orgId))),
      );
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

      const mappingRows: MappingRow[] = [];
      for (const item of controlsToSyncMap.values()) {
        const pairKey = `${item.riskId}:${item.ctrlId}`;
        mappingRows.push({
          id: existingMapLookup.get(pairKey) ?? crypto.randomUUID(),
          organizationId: orgId,
          rcmId: item.riskId,
          controlId: item.ctrlId,
          controlName: asText(item.reg.controlDescription) ?? item.nodeLabel,
          controlDescription: asText(item.reg.controlDescription),
          isKeyControl: boolOr(item.reg.isKeyControl),
          year: year,
          ipoC: asText(item.reg.ipoC),
          ipoA: asText(item.reg.ipoA),
          ipoV: asText(item.reg.ipoV),
          ipoRa: asText(item.reg.ipoRa),
          cosoPrinciples: numbersOf(item.reg.cosoPrinciples),
          itgcDomain: asText(item.reg.itgcDomain),
          itgcAssertions: item.reg.itgcAssertions,
          controlType: item.reg.classification === 'ELC' ? 'ELC' : 'TLC',
        });
      }

      const existingMappingIds = new Set(existingMapLookup.values());
      await this.persistRows(
        mappingRows,
        existingMappingIds,
        (rows) => this.db.insert(rcmControls).values(rows),
        (row) => this.db.update(rcmControls).set({
          controlName: row.controlName,
          controlDescription: row.controlDescription,
          isKeyControl: row.isKeyControl,
          year: row.year,
          ipoC: row.ipoC,
          ipoA: row.ipoA,
          ipoV: row.ipoV,
          ipoRa: row.ipoRa,
          cosoPrinciples: row.cosoPrinciples,
          itgcDomain: row.itgcDomain,
          itgcAssertions: row.itgcAssertions,
          controlType: row.controlType,
        }).where(eq(rcmControls.id, row.id)),
      );
    }

    // 5. Batch insert bpmNodeRcms
    if (nodeRcmPairsToInsert.length > 0) {
      await this.db.insert(bpmNodeRcms).values(nodeRcmPairsToInsert satisfies NodeRcmPairToInsert[]);
    }

    return { activeRiskControlPairs, activeRiskIds, activeControlIds };
  }

  async syncMappingsFromEdges(
    orgId: string,
    edges: readonly SyncEdgeLike[],
    nodes: readonly SyncNodeLike[],
    activeRiskControlPairs: Set<string>,
    glCodes: string[],
  ) {
    const nodeById = new Map(nodes.map((node) => [node.id, node]));

    for (const edge of edges) {
      const sourceNode = nodeById.get(edge.source);
      const targetNode = nodeById.get(edge.target);

      if (sourceNode?.type === 'risk' && targetNode?.type === 'control') {
        // boundary: node data is an open canvas payload; the linkage keys are read
        // through their declared slots by the sync seam (see shared/control-linkage).
        const rawRcmId = (sourceNode.data as { rcmId?: unknown } | null | undefined)?.rcmId;
        const rawCtrlId = (targetNode.data as { controlId?: unknown } | null | undefined)?.controlId;
        if (typeof rawRcmId === 'string' && typeof rawCtrlId === 'string') {
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

    const newMappingsToInsert: MappingRow[] = [];
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
    return runCleanup(
      this.db,
      orgId,
      diagramId,
      activeRiskIdsInDiagram,
      activeControlIdsInDiagram,
      activeRiskControlPairs,
      bpmProcessId,
      subProcessName,
    );
  }

  async updateProcessSummaryCounts(orgId: string, diagramId: string) {
    const linkedRisks = await this.db.select({ id: bpmNodeRcms.rcmId })
      .from(bpmNodeRcms)
      .where(and(
        eq(bpmNodeRcms.diagramId, diagramId),
        eq(bpmNodeRcms.organizationId, orgId)
      ))
      .groupBy(bpmNodeRcms.rcmId);
    
    const uniqueBaseRiskIds = new Set(linkedRisks.map((r) => extractBaseId(r.id)));
    const riskCount = uniqueBaseRiskIds.size;
    const uniqueRiskIds = linkedRisks.map((r) => r.id);
    
    let controlCount = 0;
    if (uniqueRiskIds.length > 0) {
      const linkedCtrls = await this.db.select({ id: rcmControls.controlId })
        .from(rcmControls)
        .where(and(
          inArray(rcmControls.rcmId, uniqueRiskIds),
          eq(rcmControls.organizationId, orgId)
        ))
        .groupBy(rcmControls.controlId);
      const uniqueBaseControlIds = new Set(linkedCtrls.map((c) => extractBaseId(c.id)));
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
