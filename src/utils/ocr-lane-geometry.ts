// ocr-lane-geometry.ts — swimlane sizing helpers for OCR auto-layout (pure TS).
// Extracted from ocr-layout.ts so the layout orchestrator stays under the
// 400 LOC soft limit; behavior is byte-identical, locked by ocr-layout.test.ts.
import { getStandardNodeDimensions, DEFAULT_SWIMLANE_DIMENSIONS } from './bpm-constants';
import type { OcrRawNode, OcrRawEdge } from './ocr-validate';

const HEADER_H = DEFAULT_SWIMLANE_DIMENSIONS.headerHeight;
const LANE_MIN_W = DEFAULT_SWIMLANE_DIMENSIONS.minWidth;
const LANE_MIN_H = DEFAULT_SWIMLANE_DIMENSIONS.defaultHeight;
const V_STEP_DEFAULT = 126;
const FOOTER_PAD = 120;

interface LaneSortMeta {
  id: string;
  median: number;
  min: number;
}

function medianOf(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 1) return sorted[mid];
  return (sorted[mid - 1] + sorted[mid]) / 2;
}

export function orderLanes(lanes: OcrRawNode[], childMap: Map<string, OcrRawNode[]>): OcrRawNode[] {
  const metas: LaneSortMeta[] = lanes.map((lane) => {
    const children = childMap.get(lane.id) ?? [];
    const xs: number[] = [lane.position.x, ...children.map((c) => c.position.x)];
    return { id: lane.id, median: medianOf(xs), min: Math.min(...xs) };
  });
  const metaById = new Map<string, LaneSortMeta>(metas.map((m) => [m.id, m]));
  return [...lanes].sort((a, b) => {
    const ma = metaById.get(a.id);
    const mb = metaById.get(b.id);
    if (!ma || !mb) return a.id.localeCompare(b.id);
    if (ma.median !== mb.median) return ma.median - mb.median;
    if (ma.min !== mb.min) return ma.min - mb.min;
    return a.id.localeCompare(b.id);
  });
}

export function computeLaneWidths(
  sortedLanes: OcrRawNode[],
  childMap: Map<string, OcrRawNode[]>,
  edges: OcrRawEdge[] = []
): Map<string, number> {
  const out = new Map<string, number>();
  let globalMaxNodeWidth = 0;
  let maxGlobalParallelInLane = 1;

  for (const lane of sortedLanes) {
    const children = childMap.get(lane.id) ?? [];
    for (const c of children) {
      const d = getStandardNodeDimensions(c.type);
      if (d.width > globalMaxNodeWidth) globalMaxNodeWidth = d.width;
    }

    if (children.length > 1) {
      const childIdSet = new Set(children.map((c) => c.id));
      const intraLaneEdges = edges.filter((e) => childIdSet.has(e.source) && childIdSet.has(e.target));
      const rankGroups = groupNodesByRank(children, intraLaneEdges);
      for (const nodesInRank of rankGroups.values()) {
        if (nodesInRank.length > maxGlobalParallelInLane) {
          maxGlobalParallelInLane = nodesInRank.length;
        }
      }
    }
  }

  // Uniform equalized width for all lanes:
  // If lanes contain multiple parallel nodes in a rank, expand width so each parallel branch has comfortable room.
  const baseNodeW = Math.max(200, globalMaxNodeWidth);
  const minRequiredByParallel = maxGlobalParallelInLane > 1
    ? maxGlobalParallelInLane * (baseNodeW + 40) + 120
    : LANE_MIN_W;

  const uniformWidth = Math.max(LANE_MIN_W, minRequiredByParallel, globalMaxNodeWidth + 180);

  for (const lane of sortedLanes) {
    out.set(lane.id, uniformWidth);
  }
  return out;
}

export function computeUniformHeight(sortedLanes: OcrRawNode[], childMap: Map<string, OcrRawNode[]>): number {
  if (sortedLanes.length === 0) return LANE_MIN_H;
  let maxH = LANE_MIN_H;
  for (const lane of sortedLanes) {
    const count = (childMap.get(lane.id) ?? []).length;
    const h = HEADER_H + count * V_STEP_DEFAULT + FOOTER_PAD;
    if (h > maxH) maxH = h;
  }
  return Math.max(LANE_MIN_H, maxH);
}

export function groupNodesByRank(children: OcrRawNode[], intraEdges: OcrRawEdge[]): Map<number, OcrRawNode[]> {
  const depthMap = buildDepthMap(children, intraEdges);
  const rankGroups = new Map<number, OcrRawNode[]>();
  for (const child of children) {
    const r = depthMap.get(child.id) ?? 0;
    const existing = rankGroups.get(r);
    if (existing) {
      existing.push(child);
    } else {
      rankGroups.set(r, [child]);
    }
  }
  return rankGroups;
}

export function buildDepthMap(children: OcrRawNode[], intraEdges: OcrRawEdge[]): Map<string, number> {
  const depth = new Map<string, number>();
  const incoming = new Map<string, number>();
  const idSet = new Set(children.map((c) => c.id));
  for (const c of children) incoming.set(c.id, 0);
  for (const e of intraEdges) {
    if (idSet.has(e.target)) {
      incoming.set(e.target, (incoming.get(e.target) ?? 0) + 1);
    }
  }
  const outgoing = new Map<string, string[]>();
  for (const c of children) outgoing.set(c.id, []);
  for (const e of intraEdges) {
    if (idSet.has(e.source) && idSet.has(e.target)) {
      const arr = outgoing.get(e.source);
      if (arr) arr.push(e.target);
    }
  }
  const queue: string[] = [];
  for (const c of children) {
    if ((incoming.get(c.id) ?? 0) === 0) {
      depth.set(c.id, 0);
      queue.push(c.id);
    }
  }
  let head = 0;
  while (head < queue.length) {
    const cur = queue[head++];
    const curD = depth.get(cur) ?? 0;
    const succs = outgoing.get(cur) ?? [];
    for (const nxt of succs) {
      if (!depth.has(nxt)) {
        depth.set(nxt, curD + 1);
        queue.push(nxt);
      }
    }
  }
  let maxD = -1;
  for (const v of depth.values()) if (v > maxD) maxD = v;
  const unvisited = children.filter((c) => !depth.has(c.id));
  unvisited.sort((a, b) => a.position.y - b.position.y || a.position.x - b.position.x);
  for (const u of unvisited) {
    maxD += 1;
    depth.set(u.id, maxD);
  }
  return depth;
}
