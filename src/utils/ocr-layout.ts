// ocr-layout.ts — deterministic OCR auto-layout (no dependencies, pure TS)
import { getStandardNodeDimensions, DEFAULT_SWIMLANE_DIMENSIONS } from './bpm-constants';
import { validateOcrResponse, deriveLabelFromId } from './ocr-validate';
import type { OcrRawNode, OcrRawEdge, OcrLayoutWarning } from './ocr-validate';
import {
  orderLanes,
  computeLaneWidths,
  computeUniformHeight,
  buildDepthMap,
} from './ocr-lane-geometry';

export type { OcrRawNode, OcrRawEdge, OcrLayoutWarning } from './ocr-validate';
export { deriveLabelFromId, validateOcrResponse } from './ocr-validate';

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

  // Use local intra-lane depth for vertical positioning so each swimlane starts
  // immediately below its header (HEADER_OFFSET) rather than cascading in a giant staircase
  const ROW_HEIGHT = 100;
  const HEADER_OFFSET = HEADER_H + 50;

  for (const lane of sortedLanes) {
    const children = childMap.get(lane.id) ?? [];
    if (children.length === 0) continue;
    const pos = lanePos.get(lane.id);
    if (!pos) continue;

    // Filter edges that connect nodes within this same swimlane
    const childIdSet = new Set(children.map((c) => c.id));
    const intraLaneEdges = filteredEdges.filter((e) => childIdSet.has(e.source) && childIdSet.has(e.target));
    const laneDepthMap = buildDepthMap(children, intraLaneEdges);

    const rankGroups = new Map<number, OcrRawNode[]>();
    for (const child of children) {
      const r = laneDepthMap.get(child.id) ?? 0;
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
      if (targetY <= lastUsedY + 24) {
        targetY = lastUsedY + 28;
      }

      const count = groupNodes.length;
      for (let i = 0; i < count; i++) {
        const child = groupNodes[i];
        const dims = getStandardNodeDimensions(child.type);

        let relX = Math.round((pos.width - dims.width) / 2);
        let nodeY = targetY;

        if (count > 1) {
          const stepOffset = Math.min(30, (pos.width - dims.width - 40) / count);
          relX = Math.round((pos.width - dims.width) / 2) + (i - (count - 1) / 2) * stepOffset;
          nodeY = targetY + i * (dims.height + 20);
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

    const requiredLaneHeight = lastUsedY + 80;
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
    const dims = getStandardNodeDimensions(node.type);
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
  const nodeAbsCenter = new Map<string, { x: number; y: number; parentId?: string }>();
  for (const n of nodesOut) {
    if (n.parentId && lanePos.has(n.parentId)) {
      const p = lanePos.get(n.parentId)!;
      nodeAbsCenter.set(n.id, {
        x: p.x + n.position.x + n.width / 2,
        y: p.y + n.position.y + n.height / 2,
        parentId: n.parentId,
      });
    } else {
      nodeAbsCenter.set(n.id, {
        x: n.position.x + n.width / 2,
        y: n.position.y + n.height / 2,
        parentId: undefined,
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

    const isCrossLane = s.parentId !== t.parentId;

    if (!sourceHandle || !targetHandle) {
      // If cross-lane flow with significant horizontal distance, prefer horizontal handles
      if (isCrossLane && Math.abs(dx) > 100) {
        if (dx >= 0) {
          sourceHandle = sourceHandle || 'right';
          targetHandle = targetHandle || 'left';
        } else {
          sourceHandle = sourceHandle || 'left';
          targetHandle = targetHandle || 'right';
        }
      } else if (Math.abs(dy) >= Math.abs(dx)) {
        // If mostly vertical flow
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
