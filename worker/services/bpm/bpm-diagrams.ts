import { eq, and, inArray, isNull, like, type SQL } from 'drizzle-orm';
import {
  bpmDiagrams, bpmProcesses, bpmNodeRcms, rcms, controls, bpmProcessGlCodes,
} from '../../db/schema';
import type { DrizzleDb } from '../../db';
import type { AuditService } from '../audit-service';
import type { BpmHydrator } from './bpm-hydrator';
import type { BpmSyncManager } from './bpm-sync';
import { sameSubProcess } from './bpm-match';

/**
 * Diagram seam: every `bpm_diagrams` read/write lives here.
 *
 * The functions are standalone and take an explicit context (`ctx`) built by
 * the owning service from its LIVE handles — `ctx.db` is the transaction
 * handle while the service runs a cascade inside `inTransaction`, so the
 * all-or-nothing semantics stay owned by the service (which alone swaps
 * `this.db`/`BpmSyncManager`/`BpmHydrator`). Transaction wrapping is therefore
 * deliberately NOT done here: `BpmService` is the only transactional owner.
 */

type DiagramRow = typeof bpmDiagrams.$inferSelect;

/**
 * `POST`/`PUT /bpm-diagrams` body as the editor sends it (`name`/`subProcess`
 * are part of the diagram contract; the sync manager and the column writes
 * already require them as strings).
 */
export interface DiagramWriteBody {
  name: string;
  subProcess: string;
  year?: string | number | null;
  nodes?: unknown[];
  edges?: unknown[];
  metadata?: unknown;
  noGLs?: string[];
}

/**
 * Just the capabilities this seam uses, so a test can supply a plain fake
 * instead of a whole service graph (the classes' handles are private).
 */
export interface DiagramContext {
  db: DrizzleDb;
  audit: Pick<AuditService, 'logAction'>;
  hydrator: Pick<BpmHydrator, 'hydrateDiagramNodes'>;
  sync: Pick<
    BpmSyncManager,
    | 'syncRisksAndControlsFromNodes'
    | 'syncMappingsFromEdges'
    | 'cleanupStaleData'
    | 'updateProcessSummaryCounts'
  >;
}

/** The one sub-process lookup used by the diagram read/update paths. */
async function findProcessByName(db: DrizzleDb, orgId: string, subProcessName: string, year: number | null) {
  const rows = await db.select().from(bpmProcesses)
    .where(and(
      eq(bpmProcesses.organizationId, orgId),
      year ? eq(bpmProcesses.year, year) : isNull(bpmProcesses.year),
      sameSubProcess(bpmProcesses.name, subProcessName)
    )).limit(1);
  return rows[0] ?? null;
}

export async function getAllDiagrams(db: DrizzleDb, orgId: string, year?: number) {
  let conditions: SQL = eq(bpmDiagrams.organizationId, orgId);
  if (year) {
    conditions = and(conditions, eq(bpmDiagrams.year, year)) as SQL;
  }
  return await db.select().from(bpmDiagrams).where(conditions);
}

export async function getDiagramById(ctx: DiagramContext, orgId: string, id: string, noGL?: string) {
  const diags = await ctx.db.select().from(bpmDiagrams).where(and(eq(bpmDiagrams.id, id), eq(bpmDiagrams.organizationId, orgId))).limit(1);
  if (diags.length === 0) return null;

  const diag = diags[0];
  const hydratedNodes = await ctx.hydrator.hydrateDiagramNodes(id, diag.nodes ?? [], noGL);

  const matchedProcess = diag.subProcess ? await findProcessByName(ctx.db, orgId, diag.subProcess, diag.year) : null;

  let noGLs: string[] = [];
  if (matchedProcess) {
    const gls = await ctx.db.select({ noGL: bpmProcessGlCodes.noGL })
      .from(bpmProcessGlCodes)
      .where(eq(bpmProcessGlCodes.bpmProcessId, matchedProcess.id));
    noGLs = gls.map(g => g.noGL);

    if (noGLs.length === 0 && matchedProcess.noGL) {
      noGLs = [matchedProcess.noGL];
    }
  }

  return {
    ...diag,
    nodes: hydratedNodes,
    noGLs
  };
}

export async function createDiagram(ctx: DiagramContext, orgId: string, userId: string, body: DiagramWriteBody) {
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
  await ctx.db.insert(bpmDiagrams).values(newDiagram);

  await ctx.audit.logAction({
    organizationId: orgId,
    userId: userId,
    action: 'CREATE',
    entityType: 'BPMDiagram',
    entityId: id,
    dataAfter: newDiagram,
  });

  return newDiagram;
}

/** Raw `bpm_diagrams` metadata write + audit entry; the caller owns the transaction. */
async function updateDiagramMetadata(
  ctx: DiagramContext,
  orgId: string,
  userId: string,
  id: string,
  body: DiagramWriteBody,
  oldDiagram: DiagramRow,
) {
  const yearValue = body.year ? parseInt(body.year.toString()) : undefined;

  await ctx.db.update(bpmDiagrams)
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

  await ctx.audit.logAction({
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

/** Full diagram write (metadata + process/NoGL + risk/control sync); the caller owns the transaction. */
export async function updateDiagram(ctx: DiagramContext, orgId: string, userId: string, id: string, body: DiagramWriteBody) {
  const oldDiagrams = await ctx.db.select().from(bpmDiagrams).where(and(eq(bpmDiagrams.id, id), eq(bpmDiagrams.organizationId, orgId))).limit(1);
  const oldDiagram = oldDiagrams[0];
  if (!oldDiagram) {
    return null;
  }

  // 1. Update Diagram Metadata & Log Action
  await updateDiagramMetadata(ctx, orgId, userId, id, body, oldDiagram);

  const diagramYear = body.year ? parseInt(body.year.toString()) : (oldDiagram.year || null);

  // 2. Resolve BPM Process & NoGL
  const matchedProcess = body.subProcess ? await findProcessByName(ctx.db, orgId, body.subProcess, diagramYear) : null;
  const bpmProcessId = matchedProcess?.id ?? null;
  let noGL = matchedProcess?.noGL ?? "";
  let currentGLCodes: string[] = [];

  if (bpmProcessId && body.noGLs !== undefined) {
    await ctx.db.delete(bpmProcessGlCodes).where(and(
      eq(bpmProcessGlCodes.bpmProcessId, bpmProcessId),
      eq(bpmProcessGlCodes.organizationId, orgId)
    ));
    if (Array.isArray(body.noGLs) && body.noGLs.length > 0) {
      for (const glCode of body.noGLs) {
        await ctx.db.insert(bpmProcessGlCodes).values({
          id: crypto.randomUUID(),
          organizationId: orgId,
          bpmProcessId,
          noGL: glCode
        });
      }
      noGL = body.noGLs[0];
      await ctx.db.update(bpmProcesses).set({ noGL }).where(and(
        eq(bpmProcesses.id, bpmProcessId),
        eq(bpmProcesses.organizationId, orgId)
      ));
      currentGLCodes = body.noGLs;
    }
  } else if (bpmProcessId) {
    const existingGLs = await ctx.db.select({ noGL: bpmProcessGlCodes.noGL })
      .from(bpmProcessGlCodes)
      .where(and(
        eq(bpmProcessGlCodes.bpmProcessId, bpmProcessId),
        eq(bpmProcessGlCodes.organizationId, orgId)
      ));
    currentGLCodes = existingGLs.map(g => g.noGL);
    if (currentGLCodes.length === 0 && noGL) {
      currentGLCodes = [noGL];
    }
  }

  const glCodesToSync = currentGLCodes.length > 0 ? currentGLCodes : [""];

  // 3. Clear existing node-RCM mappings for this diagram
  await ctx.db.delete(bpmNodeRcms).where(and(
    eq(bpmNodeRcms.diagramId, id),
    eq(bpmNodeRcms.organizationId, orgId)
  ));

  const nodes = body.nodes || [];
  const edges = body.edges || [];

  // 4. Sync Risks and Controls from Nodes
  const { activeRiskControlPairs, activeRiskIds, activeControlIds } =
    await ctx.sync.syncRisksAndControlsFromNodes(orgId, id, nodes, bpmProcessId, glCodesToSync, body.name, body.subProcess, diagramYear);

  // 5. Sync from Edges (Risk -> Control)
  await ctx.sync.syncMappingsFromEdges(orgId, edges, nodes, activeRiskControlPairs, glCodesToSync);

  // 6, 7, 8. Cleanup stale data
  await ctx.sync.cleanupStaleData(
    orgId, 
    id, 
    activeRiskIds, 
    activeControlIds, 
    activeRiskControlPairs, 
    bpmProcessId,
    body.subProcess || oldDiagram.subProcess
  );

  // 9. Update Summary Counts in BPM Processes
  await ctx.sync.updateProcessSummaryCounts(orgId, id);

  return { success: true };
}

/** Raw diagram cascade (unlink RCMs, drop node-RCM mappings, drop the diagram); the caller owns the transaction. */
export async function cascadeDeleteDiagram(ctx: DiagramContext, orgId: string, id: string) {
  await ctx.db.update(rcms)
    .set({ diagramId: null })
    .where(and(eq(rcms.diagramId, id), eq(rcms.organizationId, orgId)));

  await ctx.db.delete(bpmNodeRcms)
    .where(and(eq(bpmNodeRcms.diagramId, id), eq(bpmNodeRcms.organizationId, orgId)));

  await ctx.db.delete(bpmDiagrams).where(and(eq(bpmDiagrams.id, id), eq(bpmDiagrams.organizationId, orgId)));
}

export async function getDiagramByControlId(db: DrizzleDb, orgId: string, controlId: string) {
  const links = await db.select().from(rcms).innerJoin(
    controls,
    and(
      eq(controls.id, controlId),
      eq(controls.rcmId, rcms.id),
      eq(controls.organizationId, orgId)
    )
  );

  if (links.length === 0) return null;

  const riskIds = links.map(l => l.rcms.id);
  const nodeLinks = await db.select().from(bpmNodeRcms).where(and(
    inArray(bpmNodeRcms.rcmId, riskIds),
    eq(bpmNodeRcms.organizationId, orgId)
  ));

  if (nodeLinks.length === 0) return null;

  const firstLink = nodeLinks[0];
  const diag = await db.select().from(bpmDiagrams).where(and(
    eq(bpmDiagrams.id, firstLink.diagramId),
    eq(bpmDiagrams.organizationId, orgId)
  )).limit(1);

  if (diag.length === 0) return null;

  return {
    diagram: diag[0],
    nodeId: firstLink.nodeId
  };
}

export async function getDiagramByGL(ctx: DiagramContext, orgId: string, noGL: string, subProcessName?: string) {
  let diag: DiagramRow | null = null;
  if (subProcessName) {
    const diagrams = await ctx.db.select().from(bpmDiagrams)
      .where(and(
        eq(bpmDiagrams.organizationId, orgId),
        eq(bpmDiagrams.subProcess, subProcessName)
      )).limit(1);

    if (diagrams.length > 0) {
      diag = diagrams[0];
    }
  }

  if (!diag) {
    const processes = await ctx.db.select().from(bpmProcesses)
      .where(and(
        eq(bpmProcesses.organizationId, orgId),
        eq(bpmProcesses.noGL, noGL)
      )).limit(1);

    if (processes.length > 0) {
      const process = processes[0];
      const diagrams = await ctx.db.select().from(bpmDiagrams)
        .where(and(
          eq(bpmDiagrams.organizationId, orgId),
          eq(bpmDiagrams.subProcess, process.name)
        )).limit(1);

      if (diagrams.length > 0) {
        diag = diagrams[0];
      } else {
        const byName = await ctx.db.select().from(bpmDiagrams)
          .where(and(
            eq(bpmDiagrams.organizationId, orgId),
            eq(bpmDiagrams.name, process.name)
          )).limit(1);

        if (byName.length > 0) diag = byName[0];
      }
    }
  }

  if (!diag) return null;

  const hydratedNodes = await ctx.hydrator.hydrateDiagramNodes(diag.id, diag.nodes ?? [], noGL);

  return {
    ...diag,
    nodes: hydratedNodes
  };
}

export async function cleanupFlowPrefixes(db: DrizzleDb, orgId: string) {
  const records = await db.select({ id: bpmDiagrams.id, name: bpmDiagrams.name })
    .from(bpmDiagrams)
    .where(and(eq(bpmDiagrams.organizationId, orgId), like(bpmDiagrams.name, 'Flow: %')));

  let cleanedCount = 0;
  for (const record of records) {
    if (record.name && record.name.startsWith('Flow: ')) {
      const cleanName = record.name.replace(/^Flow:\s*/, '');
      await db.update(bpmDiagrams)
        .set({ name: cleanName })
        .where(and(eq(bpmDiagrams.id, record.id), eq(bpmDiagrams.organizationId, orgId)));
      cleanedCount++;
    }
  }
  return { cleanedCount };
}
