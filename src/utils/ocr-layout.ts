// ocr-layout.ts — deterministic OCR auto-layout (no dependencies, pure TS)
import { getStandardNodeDimensions, DEFAULT_SWIMLANE_DIMENSIONS } from './bpm-constants';

export interface OcrRawNode {
  id: string;
  type: string;
  label: string;
  position: { x: number; y: number };
  parentId?: string;
  department?: string;
  function?: string;
  width?: number;
  height?: number;
}

export interface OcrRawEdge {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string;
  targetHandle?: string;
  label?: string;
}

export interface OcrLayoutWarning {
  code: 'orphan-edge' | 'unlabeled-node' | 'missing-dims' | 'unknown-parent';
  message: string;
  nodeId?: string;
  edgeId?: string;
}

export interface OcrLayoutNode {
  id: string;
  type: string;
  label: string;
  position: { x: number; y: number };
  parentId?: string;
  width: number;
  height: number;
  department?: string;
  function?: string;
}

export interface OcrLayoutResult {
  nodes: OcrLayoutNode[];
  edges: OcrRawEdge[];
  warnings: OcrLayoutWarning[];
}

const GAP_X = DEFAULT_SWIMLANE_DIMENSIONS.gapX;
const HEADER_H = DEFAULT_SWIMLANE_DIMENSIONS.headerHeight;
const GAP_Y = DEFAULT_SWIMLANE_DIMENSIONS.gapY;
const LANE_MIN_W = DEFAULT_SWIMLANE_DIMENSIONS.minWidth;
const LANE_MIN_H = DEFAULT_SWIMLANE_DIMENSIONS.defaultHeight;
const V_STEP_DEFAULT = 126;
const FOOTER_PAD = 120;

export function deriveLabelFromId(id: string): string {
  if (!id) return '';
  const cleaned = id.replace(/^(swimlane|lane)[-_]/i, '').replace(/[-_]/g, ' ').trim();
  return cleaned ? cleaned.toUpperCase() : '';
}

function getNodeDimensions(type: string): { width: number; height: number } {
  return getStandardNodeDimensions(type);
}

function medianOf(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 1) return sorted[mid];
  return (sorted[mid - 1] + sorted[mid]) / 2;
}

export function validateOcrResponse(raw: { nodes: OcrRawNode[]; edges: OcrRawEdge[] }): OcrLayoutWarning[] {
  const warnings: OcrLayoutWarning[] = [];
  const idSet = new Set<string>(raw.nodes.map((n) => n.id));
  const swimlaneIdSet = new Set<string>(raw.nodes.filter((n) => n.type === 'swimlane').map((n) => n.id));

  for (const e of raw.edges) {
    const missingSource = !idSet.has(e.source);
    const missingTarget = !idSet.has(e.target);
    if (missingSource || missingTarget) {
      const missing = missingSource && missingTarget ? `source ${e.source} and target ${e.target}` : missingSource ? `source ${e.source}` : `target ${e.target}`;
      warnings.push({
        code: 'orphan-edge',
        message: `Edge ${e.id} references unknown node: ${missing}`,
        edgeId: e.id,
      });
    }
  }

  for (const n of raw.nodes) {
    const isSwimlane = n.type === 'swimlane';
    const effectiveLabel = isSwimlane
      ? (n.label?.trim() || n.department?.trim() || deriveLabelFromId(n.id))
      : n.label?.trim();

    if (!effectiveLabel) {
      warnings.push({
        code: 'unlabeled-node',
        message: `Node ${n.id} has empty label`,
        nodeId: n.id,
      });
    }
  }

  for (const n of raw.nodes) {
    if (n.type === 'swimlane') {
      const missW = n.width === undefined || n.width === null;
      const missH = n.height === undefined || n.height === null;
      const belowMin = n.width !== undefined && n.width !== null && n.width < LANE_MIN_W;
      if (missW || missH || belowMin) {
        const reason = missW && missH ? 'missing width and height' : missW ? 'missing width' : missH ? 'missing height' : `width ${n.width} below minimum ${LANE_MIN_W}`;
        warnings.push({
          code: 'missing-dims',
          message: `Lane ${n.id} has ${reason}`,
          nodeId: n.id,
        });
      }
    }
  }

  for (const n of raw.nodes) {
    if (n.parentId !== undefined && n.parentId !== null && n.parentId !== '' && !swimlaneIdSet.has(n.parentId)) {
      warnings.push({
        code: 'unknown-parent',
        message: `Node ${n.id} references unknown parent ${n.parentId}`,
        nodeId: n.id,
      });
    }
  }

  return warnings;
}

interface LaneSortMeta {
  id: string;
  median: number;
  min: number;
}

function orderLanes(lanes: OcrRawNode[], childMap: Map<string, OcrRawNode[]>): OcrRawNode[] {
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

function computeLaneWidths(sortedLanes: OcrRawNode[], childMap: Map<string, OcrRawNode[]>): Map<string, number> {
  const out = new Map<string, number>();
  let globalMaxNodeWidth = 0;

  for (const lane of sortedLanes) {
    const children = childMap.get(lane.id) ?? [];
    for (const c of children) {
      const d = getNodeDimensions(c.type);
      if (d.width > globalMaxNodeWidth) globalMaxNodeWidth = d.width;
    }
  }

  // Uniform equalized width for all lanes: at least LANE_MIN_W, or comfortably wide for the largest node
  const uniformWidth = Math.max(LANE_MIN_W, globalMaxNodeWidth + 180);

  for (const lane of sortedLanes) {
    out.set(lane.id, uniformWidth);
  }
  return out;
}

function computeUniformHeight(sortedLanes: OcrRawNode[], childMap: Map<string, OcrRawNode[]>): number {
  if (sortedLanes.length === 0) return LANE_MIN_H;
  let maxH = LANE_MIN_H;
  for (const lane of sortedLanes) {
    const count = (childMap.get(lane.id) ?? []).length;
    const h = HEADER_H + count * V_STEP_DEFAULT + FOOTER_PAD;
    if (h > maxH) maxH = h;
  }
  return Math.max(LANE_MIN_H, maxH);
}

function buildDepthMap(children: OcrRawNode[], intraEdges: OcrRawEdge[]): Map<string, number> {
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

export function layoutOcrDiagram(raw: { nodes: OcrRawNode[]; edges: OcrRawEdge[] }): OcrLayoutResult {
  const warnings = validateOcrResponse(raw);

  const idSet = new Set<string>(raw.nodes.map((n) => n.id));
  const swimlaneIdSet = new Set<string>(raw.nodes.filter((n) => n.type === 'swimlane').map((n) => n.id));

  const downgraded: OcrRawNode[] = raw.nodes.map((n) => {
    if (n.parentId !== undefined && n.parentId !== '' && !swimlaneIdSet.has(n.parentId)) {
      return { ...n, parentId: undefined };
    }
    return { ...n };
  });

  const filteredEdges: OcrRawEdge[] = raw.edges.filter((e) => idSet.has(e.source) && idSet.has(e.target));

  const lanesRaw = downgraded.filter((n) => n.type === 'swimlane');
  const initialChildMap = new Map<string, OcrRawNode[]>();
  for (const lane of lanesRaw) initialChildMap.set(lane.id, []);
  for (const n of downgraded) {
    if (n.type !== 'swimlane' && n.parentId !== undefined && initialChildMap.has(n.parentId)) {
      const arr = initialChildMap.get(n.parentId);
      if (arr) arr.push(n);
    }
  }

  const sortedLanes = orderLanes(lanesRaw, initialChildMap);

  // Spatial Geometric Snapping Fallback:
  // If a node has no parent specified (undefined or empty), check if its x position falls
  // inside the column bounds of one of the swimlanes (with reasonable padding).
  // This ensures nodes positioned inside a column (like initial docs in Column 1) snap to that lane,
  // while intentional top-level/footer nodes remain unparented.
  if (sortedLanes.length > 0) {
    for (const n of downgraded) {
      if (n.type !== 'swimlane' && (n.parentId === undefined || n.parentId === '')) {
        const rawNode = raw.nodes.find((rn) => rn.id === n.id);
        const hadExplicitUnknownParent = rawNode?.parentId && !swimlaneIdSet.has(rawNode.parentId);

        if (!hadExplicitUnknownParent) {
          // Check if there are already explicit child mappings indicating an established lane structure
          const anyExplicitChildren = downgraded.some((d) => d.type !== 'swimlane' && d.parentId && swimlaneIdSet.has(d.parentId));

          // If there are explicit children in the diagram, snap orphan nodes whose X matches lane distribution
          if (anyExplicitChildren) {
            let closestLaneId = sortedLanes[0].id;
            let minDistance = Math.abs(n.position.x - sortedLanes[0].position.x);

            for (let i = 1; i < sortedLanes.length; i++) {
              const dist = Math.abs(n.position.x - sortedLanes[i].position.x);
              if (dist < minDistance) {
                minDistance = dist;
                closestLaneId = sortedLanes[i].id;
              }
            }
            n.parentId = closestLaneId;
          }
        }
      }
    }
  }

  const childMap = new Map<string, OcrRawNode[]>();
  for (const lane of sortedLanes) childMap.set(lane.id, []);
  for (const n of downgraded) {
    if (n.type !== 'swimlane' && n.parentId !== undefined && childMap.has(n.parentId)) {
      const arr = childMap.get(n.parentId);
      if (arr) arr.push(n);
    }
  }

  const laneWidthMap = computeLaneWidths(sortedLanes, childMap);
  let uniformHeight = computeUniformHeight(sortedLanes, childMap);

  const lanePos = new Map<string, { x: number; y: number; width: number; height: number }>();
  let cumX = 0;
  const TOP_OFFSET = 60;
  for (const lane of sortedLanes) {
    const w = laneWidthMap.get(lane.id) ?? LANE_MIN_W;
    lanePos.set(lane.id, { x: cumX, y: TOP_OFFSET, width: w, height: uniformHeight });
    cumX += w + GAP_X;
  }

  const parentById = new Map<string, string | undefined>();
  for (const n of downgraded) parentById.set(n.id, n.parentId);

  const nodesOut: OcrLayoutNode[] = [];

  for (const lane of sortedLanes) {
    const pos = lanePos.get(lane.id);
    if (!pos) continue;
    const resolvedDept = lane.department?.trim() || lane.label?.trim() || deriveLabelFromId(lane.id);
    const resolvedLabel = lane.label?.trim() || resolvedDept;
    nodesOut.push({
      id: lane.id,
      type: lane.type,
      label: resolvedLabel,
      position: { x: pos.x, y: pos.y },
      parentId: undefined,
      width: pos.width,
      height: pos.height,
      department: resolvedDept,
      function: lane.function?.trim() || '',
    });
  }

  // Compute global topological rank across all nodes to synchronize Y coordinates across lanes
  const nonSwimlaneNodes = downgraded.filter((n) => n.type !== 'swimlane');
  const globalInDegree = new Map<string, number>();
  const globalAdjacency = new Map<string, string[]>();
  const nonSwimlaneIdSet = new Set(nonSwimlaneNodes.map((n) => n.id));

  for (const n of nonSwimlaneNodes) {
    globalInDegree.set(n.id, 0);
    globalAdjacency.set(n.id, []);
  }

  for (const e of filteredEdges) {
    if (nonSwimlaneIdSet.has(e.source) && nonSwimlaneIdSet.has(e.target)) {
      globalInDegree.set(e.target, (globalInDegree.get(e.target) ?? 0) + 1);
      globalAdjacency.get(e.source)?.push(e.target);
    }
  }

  const globalRank = new Map<string, number>();
  const queue: string[] = [];
  const maxAllowedDepth = nonSwimlaneNodes.length;

  for (const n of nonSwimlaneNodes) {
    if ((globalInDegree.get(n.id) ?? 0) === 0) {
      globalRank.set(n.id, 0);
      queue.push(n.id);
    }
  }

  let head = 0;
  while (head < queue.length) {
    const u = queue[head++];
    const r = globalRank.get(u) ?? 0;
    if (r >= maxAllowedDepth) continue; // cycle guard
    const neighbors = globalAdjacency.get(u) ?? [];
    for (const v of neighbors) {
      const nextRank = r + 1;
      const currentRank = globalRank.get(v);
      if (currentRank === undefined || nextRank > currentRank) {
        if (nextRank <= maxAllowedDepth) {
          globalRank.set(v, nextRank);
          queue.push(v);
        }
      }
    }
  }

  let maxAssignedRank = 0;
  for (const r of globalRank.values()) {
    if (r > maxAssignedRank) maxAssignedRank = r;
  }

  const unranked = nonSwimlaneNodes.filter((n) => !globalRank.has(n.id));
  unranked.sort((a, b) => a.position.y - b.position.y);
  for (const n of unranked) {
    maxAssignedRank += 1;
    globalRank.set(n.id, maxAssignedRank);
  }

  // Increased minimum row step and adaptive spacing to avoid crowded text
  const ROW_HEIGHT = 120;
  const HEADER_OFFSET = HEADER_H + 30;

  for (const lane of sortedLanes) {
    const children = childMap.get(lane.id) ?? [];
    if (children.length === 0) continue;
    const pos = lanePos.get(lane.id);
    if (!pos) continue;

    const rankGroups = new Map<number, OcrRawNode[]>();
    for (const child of children) {
      const r = globalRank.get(child.id) ?? 0;
      if (!rankGroups.has(r)) rankGroups.set(r, []);
      rankGroups.get(r)!.push(child);
    }

    const sortedRanks = Array.from(rankGroups.keys()).sort((a, b) => a - b);
    let lastUsedY = HEADER_OFFSET - GAP_Y;

    for (const r of sortedRanks) {
      const groupNodes = rankGroups.get(r)!;
      groupNodes.sort((a, b) => a.position.x - b.position.x || a.position.y - b.position.y);

      // Ensure targetY respects both rank spacing and the actual bounding box of previously placed nodes
      let targetY = HEADER_OFFSET + r * ROW_HEIGHT;
      if (targetY <= lastUsedY + 30) {
        targetY = lastUsedY + 35;
      }

      const count = groupNodes.length;
      for (let i = 0; i < count; i++) {
        const child = groupNodes[i];
        const dims = getNodeDimensions(child.type);

        let relX = Math.round((pos.width - dims.width) / 2);
        let nodeY = targetY;

        if (count > 1) {
          const stepOffset = Math.min(30, (pos.width - dims.width - 40) / count);
          relX = Math.round((pos.width - dims.width) / 2) + (i - (count - 1) / 2) * stepOffset;
          nodeY = targetY + i * (dims.height + 24);
        }

        nodesOut.push({
          id: child.id,
          type: child.type,
          label: child.label,
          position: { x: relX, y: nodeY },
          parentId: lane.id,
          width: dims.width,
          height: dims.height,
          department: child.department,
          function: child.function,
        });

        if (nodeY + dims.height > lastUsedY) {
          lastUsedY = nodeY + dims.height;
        }
      }
    }

    const requiredLaneHeight = lastUsedY + 100;
    if (requiredLaneHeight > uniformHeight) {
      uniformHeight = requiredLaneHeight;
    }
  }

  // Update swimlane heights to final uniformHeight
  for (const n of nodesOut) {
    if (n.type === 'swimlane') {
      n.height = uniformHeight;
      if (lanePos.has(n.id)) {
        lanePos.get(n.id)!.height = uniformHeight;
      }
    }
  }

  const topLevel = downgraded.filter((n) => n.type !== 'swimlane' && (n.parentId === undefined || !lanePos.has(n.parentId)));
  const sortedTop = [...topLevel].sort((a, b) => a.position.y - b.position.y || a.position.x - b.position.x);

  const topY = uniformHeight + 80;
  let curX = 0;
  for (const node of sortedTop) {
    const dims = getNodeDimensions(node.type);
    const x = curX;
    nodesOut.push({
      id: node.id,
      type: node.type,
      label: node.label,
      position: { x, y: topY },
      parentId: undefined,
      width: dims.width,
      height: dims.height,
      department: node.department,
      function: node.function,
    });
    curX += dims.width + 40;
  }

  // Build map of absolute node centers to determine clean, un-inverted edge connection handles
  const nodeAbsCenter = new Map<string, { x: number; y: number }>();
  for (const n of nodesOut) {
    if (n.parentId && lanePos.has(n.parentId)) {
      const p = lanePos.get(n.parentId)!;
      nodeAbsCenter.set(n.id, {
        x: p.x + n.position.x + n.width / 2,
        y: p.y + n.position.y + n.height / 2,
      });
    } else {
      nodeAbsCenter.set(n.id, {
        x: n.position.x + n.width / 2,
        y: n.position.y + n.height / 2,
      });
    }
  }

  const enrichedEdges: OcrRawEdge[] = filteredEdges.map((e) => {
    const s = nodeAbsCenter.get(e.source);
    const t = nodeAbsCenter.get(e.target);
    if (!s || !t) return e;

    const dx = t.x - s.x;
    const dy = t.y - s.y;

    let sourceHandle = e.sourceHandle;
    let targetHandle = e.targetHandle;

    if (!sourceHandle || !targetHandle) {
      // If mostly vertical flow
      if (Math.abs(dy) >= Math.abs(dx)) {
        if (dy >= 0) {
          sourceHandle = sourceHandle || 'bottom';
          targetHandle = targetHandle || 'top';
        } else {
          sourceHandle = sourceHandle || 'top';
          targetHandle = targetHandle || 'bottom';
        }
      } else {
        // Mostly horizontal flow
        if (dx >= 0) {
          sourceHandle = sourceHandle || 'right';
          targetHandle = targetHandle || 'left';
        } else {
          sourceHandle = sourceHandle || 'left';
          targetHandle = targetHandle || 'right';
        }
      }
    }

    return {
      ...e,
      sourceHandle,
      targetHandle,
    };
  });

  return { nodes: nodesOut, edges: enrichedEdges, warnings };
}
