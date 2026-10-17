import { and, eq, inArray, or, sql, type SQL } from 'drizzle-orm';
import type { DrizzleDb } from '../../db';
import { bpmProcesses, bpmProcessGlCodes } from '../../db/schema';

/**
 * Process-hierarchy seam: the child-count rollup and the reorganize decision
 * are pure and tested with no DB (`__tests__/bpm-process-hierarchy.test.ts`);
 * `loadProcessHierarchy` composes them around the list query.
 */

export interface ProcessCountRow {
  id: string;
  parentId: string | null;
  riskCount: number | null;
  controlCount: number | null;
}

export interface ChildCounts {
  risks: number;
  controls: number;
}

/** Sums every child's risk/control counts onto its parent id. Pure. */
export function rollupChildCounts(rows: readonly ProcessCountRow[]): Map<string, ChildCounts> {
  const byParent = new Map<string, ChildCounts>();
  for (const row of rows) {
    if (!row.parentId) continue;
    const current = byParent.get(row.parentId) ?? { risks: 0, controls: 0 };
    current.risks += row.riskCount ?? 0;
    current.controls += row.controlCount ?? 0;
    byParent.set(row.parentId, current);
  }
  return byParent;
}

export type ReorganizeAction = 'demote' | 'promote';

/**
 * Reason codes emitted by `planReorganize`. Produced once here; asserted as
 * known-good literals on every consuming side (CODING_STANDARDS §"Seam codes").
 */
export type ReorganizeReasonCode =
  | 'BPM_REORGANIZE_EMPTY'
  | 'BPM_DEMOTE_TARGET_REQUIRED'
  | 'BPM_SELF_PARENT'
  | 'BPM_TARGET_NOT_FOUND'
  | 'BPM_ACTION_INVALID';

export interface ReorganizePlanInput {
  action: string;
  processIds: readonly string[];
  targetParentId?: string;
  /** Whether the demote target row was found by the caller's lookup. */
  targetExists: boolean;
}

export type ReorganizePlan =
  | { ok: true; action: 'demote'; targetParentId: string }
  | { ok: true; action: 'promote' }
  | { ok: false; code: ReorganizeReasonCode; message: string; status: number };

function rejected(code: ReorganizeReasonCode, message: string, status: number): ReorganizePlan {
  return { ok: false, code, message, status };
}

/** Decides whether a batch reorganize is valid and which action to apply. Pure. */
export function planReorganize(input: ReorganizePlanInput): ReorganizePlan {
  const { action, processIds, targetParentId, targetExists } = input;
  if (processIds.length === 0) {
    return rejected('BPM_REORGANIZE_EMPTY', 'No processes selected for reorganize', 400);
  }
  if (action === 'demote') {
    if (!targetParentId) {
      return rejected('BPM_DEMOTE_TARGET_REQUIRED', 'Demote requires a target parent process', 400);
    }
    if (processIds.includes(targetParentId)) {
      return rejected('BPM_SELF_PARENT', 'A process cannot be its own parent', 400);
    }
    if (!targetExists) {
      return rejected('BPM_TARGET_NOT_FOUND', 'Target parent process not found', 404);
    }
    return { ok: true, action: 'demote', targetParentId };
  }
  if (action === 'promote') {
    return { ok: true, action: 'promote' };
  }
  return rejected('BPM_ACTION_INVALID', `Invalid reorganize action: ${action}`, 400);
}

export interface ProcessHierarchyFilter {
  orgId: string;
  id?: string;
  year?: number;
  noGL?: string;
}

/** `WHERE` for the process list, incl. the noGL `bpm_process_gl_codes` OR-map. Pure. */
export function buildProcessFilter(input: {
  orgId: string;
  id?: string;
  year?: number;
  noGL?: string;
  noGLMappedIds?: readonly string[];
}): SQL | undefined {
  const { orgId, id, year, noGL, noGLMappedIds = [] } = input;
  const conditions: SQL[] = [eq(bpmProcesses.organizationId, orgId)];
  if (id) conditions.push(eq(bpmProcesses.id, id));
  if (year) conditions.push(eq(bpmProcesses.year, year));
  if (noGL) {
    conditions.push(
      or(
        eq(bpmProcesses.noGL, noGL),
        noGLMappedIds.length > 0 ? inArray(bpmProcesses.id, [...noGLMappedIds]) : sql`false`
      ) as SQL
    );
  }
  return and(...conditions);
}

/** Reads the process list with child counts rolled onto each parent. */
export async function loadProcessHierarchy(db: DrizzleDb, filter: ProcessHierarchyFilter) {
  const { orgId, noGL } = filter;
  const noGLMappedIds = noGL
    ? (await db.select({ id: bpmProcessGlCodes.bpmProcessId })
        .from(bpmProcessGlCodes)
        .where(and(
          eq(bpmProcessGlCodes.organizationId, orgId),
          eq(bpmProcessGlCodes.noGL, noGL)
        ))).map((m) => m.id)
    : [];

  const rawProcesses = await db.select({
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
  .where(buildProcessFilter({ ...filter, noGLMappedIds }));

  const childCountsByParent = rollupChildCounts(rawProcesses);

  return rawProcesses.map((p) => {
    const childCounts = childCountsByParent.get(p.id);
    if (!childCounts) return p;
    return {
      ...p,
      riskCount: (p.riskCount ?? 0) + childCounts.risks,
      controlCount: (p.controlCount ?? 0) + childCounts.controls,
    };
  });
}
