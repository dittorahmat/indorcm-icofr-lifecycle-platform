import { Node, Edge } from 'reactflow';
import {
  getStandardNodeDimensions,
  DEFAULT_SWIMLANE_DIMENSIONS,
  DEFAULT_NODE_SPACING,
} from './bpm-constants';

/**
 * Topologically sort nodes within a lane using depth calculated from edges.
 */
function buildDepthMap(
  children: Node[],
  intraEdges: Edge[]
): Map<string, number> {
  const depth = new Map<string, number>();
  const incoming = new Map<string, number>();
  const idSet = new Set(children.map((c) => c.id));

  for (const c of children) {
    incoming.set(c.id, 0);
  }

  for (const e of intraEdges) {
    if (idSet.has(e.target)) {
      incoming.set(e.target, (incoming.get(e.target) ?? 0) + 1);
    }
  }

  const outgoing = new Map<string, string[]>();
  for (const c of children) {
    outgoing.set(c.id, []);
  }

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
  for (const v of depth.values()) {
    if (v > maxD) maxD = v;
  }

  const unvisited = children.filter((c) => !depth.has(c.id));
  unvisited.sort((a, b) => (a.position?.y ?? 0) - (b.position?.y ?? 0) || (a.position?.x ?? 0) - (b.position?.x ?? 0));
  for (const u of unvisited) {
    maxD += 1;
    depth.set(u.id, maxD);
  }

  return depth;
}

export interface AutoLayoutResult {
  nodes: Node[];
  edges: Edge[];
}

/**
 * Offline, deterministic auto-arrange algorithm for BPM Diagrams.
 * Organizes swimlanes, stacks and centers nodes vertically based on flow depth,
 * ensures equalized swimlane dimensions, and fixes edge handle orientations.
 */
export function autoArrangeBpmDiagram(
  currentNodes: Node[],
  currentEdges: Edge[]
): AutoLayoutResult {
  if (!currentNodes || currentNodes.length === 0) {
    return { nodes: [], edges: [] };
  }

  const nodeMap = new Map<string, Node>(currentNodes.map((n) => [n.id, { ...n }]));
  const swimlanes = currentNodes.filter((n) => n.type === 'swimlane');
  const nonSwimlaneNodes = currentNodes.filter((n) => n.type !== 'swimlane');

  // If there are no swimlanes, lay out nodes top-to-bottom
  if (swimlanes.length === 0) {
    const sortedNodes = [...nonSwimlaneNodes].sort(
      (a, b) => (a.position?.y ?? 0) - (b.position?.y ?? 0) || (a.position?.x ?? 0) - (b.position?.x ?? 0)
    );

    let curY = 40;
    const arrangedNodes: Node[] = sortedNodes.map((node) => {
      const dims = getStandardNodeDimensions(node.type || 'activity');
      const updated: Node = {
        ...node,
        position: { x: 250 - dims.width / 2, y: curY },
        style: { ...node.style, width: dims.width, height: dims.height },
        width: dims.width,
        height: dims.height,
      };
      curY += dims.height + DEFAULT_NODE_SPACING.verticalGap;
      return updated;
    });

    const enrichedEdges = enrichEdgeHandles(arrangedNodes, currentEdges, new Map());
    return { nodes: arrangedNodes, edges: enrichedEdges };
  }

  // 1. Order swimlanes horizontally by their current X position
  const sortedLanes = [...swimlanes].sort((a, b) => (a.position?.x ?? 0) - (b.position?.x ?? 0));

  // 2. Group child nodes by parentId
  const laneChildMap = new Map<string, Node[]>();
  for (const lane of sortedLanes) {
    laneChildMap.set(lane.id, []);
  }

  const unassignedNodes: Node[] = [];

  for (const node of nonSwimlaneNodes) {
    if (node.parentId && laneChildMap.has(node.parentId)) {
      laneChildMap.get(node.parentId)!.push(node);
    } else {
      // Find if node visually falls inside a swimlane's bounds
      let assigned = false;
      const nodeX = node.position?.x ?? 0;
      for (const lane of sortedLanes) {
        const laneX = lane.position?.x ?? 0;
        const laneW = (lane.width ?? (lane.style?.width as number) ?? DEFAULT_SWIMLANE_DIMENSIONS.minWidth);
        if (nodeX >= laneX && nodeX < laneX + laneW) {
          laneChildMap.get(lane.id)!.push(node);
          assigned = true;
          break;
        }
      }
      if (!assigned) {
        unassignedNodes.push(node);
      }
    }
  }

  // 3. Compute equalized swimlane width
  let globalMaxNodeWidth = 0;
  for (const node of nonSwimlaneNodes) {
    const dims = getStandardNodeDimensions(node.type || 'activity');
    if (dims.width > globalMaxNodeWidth) {
      globalMaxNodeWidth = dims.width;
    }
  }
  const equalizedLaneWidth = Math.max(
    DEFAULT_SWIMLANE_DIMENSIONS.minWidth,
    globalMaxNodeWidth + DEFAULT_SWIMLANE_DIMENSIONS.paddingHorizontal * 2
  );

  // 4. Compute required uniform height
  // 4. Compute global topological rank across all nodes to synchronize Y coordinates across lanes
  const globalInDegree = new Map<string, number>();
  const globalAdjacency = new Map<string, string[]>();
  const nonSwimlaneIdSet = new Set(nonSwimlaneNodes.map((n) => n.id));

  for (const n of nonSwimlaneNodes) {
    globalInDegree.set(n.id, 0);
    globalAdjacency.set(n.id, []);
  }

  for (const e of currentEdges) {
    if (nonSwimlaneIdSet.has(e.source) && nonSwimlaneIdSet.has(e.target)) {
      globalInDegree.set(e.target, (globalInDegree.get(e.target) ?? 0) + 1);
      globalAdjacency.get(e.source)?.push(e.target);
    }
  }

  // BFS / Topological longest-path leveling with cycle prevention
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

  // Assign fallback rank for any disconnected/cyclic nodes by bucketing
  let maxAssignedRank = 0;
  for (const r of globalRank.values()) {
    if (r > maxAssignedRank) maxAssignedRank = r;
  }

  const unranked = nonSwimlaneNodes.filter((n) => !globalRank.has(n.id));
  unranked.sort((a, b) => (a.position?.y ?? 0) - (b.position?.y ?? 0));
  if (unranked.length > 0) {
    let currentFallbackRank = maxAssignedRank + 1;
    let prevY = unranked[0].position?.y ?? 0;
    for (const n of unranked) {
      const curY = n.position?.y ?? 0;
      if (curY - prevY > 50) {
        currentFallbackRank += 1;
        prevY = curY;
      }
      globalRank.set(n.id, currentFallbackRank);
    }
  }

  // 5. Compute required uniform height and map ranks to vertical slots
  const ROW_HEIGHT = 80;
  const HEADER_OFFSET = DEFAULT_SWIMLANE_DIMENSIONS.headerHeight + 20;
  let maxRequiredHeight = DEFAULT_SWIMLANE_DIMENSIONS.minHeight;

  // Find max rank in the diagram
  let highestDiagramRank = 0;
  for (const r of globalRank.values()) {
    if (r > highestDiagramRank) highestDiagramRank = r;
  }

  const calculatedCanvasHeight = HEADER_OFFSET + (highestDiagramRank + 1) * ROW_HEIGHT + 100;
  if (calculatedCanvasHeight > maxRequiredHeight) {
    maxRequiredHeight = calculatedCanvasHeight;
  }

  // 6. Place swimlanes side by side
  let cumX = 40;
  const TOP_OFFSET = 40;
  const lanePositionMap = new Map<string, { x: number; y: number; width: number; height: number }>();
  const outputNodes: Node[] = [];

  for (const lane of sortedLanes) {
    const lanePos = {
      x: cumX,
      y: TOP_OFFSET,
      width: equalizedLaneWidth,
      height: maxRequiredHeight,
    };
    lanePositionMap.set(lane.id, lanePos);

    outputNodes.push({
      ...lane,
      position: { x: lanePos.x, y: lanePos.y },
      width: lanePos.width,
      height: lanePos.height,
      style: {
        ...lane.style,
        width: lanePos.width,
        height: lanePos.height,
      },
    });

    cumX += equalizedLaneWidth + DEFAULT_SWIMLANE_DIMENSIONS.laneGap;
  }

  // 7. Layout child nodes inside each swimlane aligned to global ranks
  for (const lane of sortedLanes) {
    const children = laneChildMap.get(lane.id) || [];
    if (children.length === 0) continue;

    // Group children by global rank so multiple nodes at same rank in same lane don't collide
    const rankGroups = new Map<number, Node[]>();
    for (const child of children) {
      const r = globalRank.get(child.id) ?? 0;
      if (!rankGroups.has(r)) rankGroups.set(r, []);
      rankGroups.get(r)!.push(child);
    }

    // Sort rank keys
    const sortedRanks = Array.from(rankGroups.keys()).sort((a, b) => a - b);

    // Track vertical placement to ensure nodes within same lane never overlap
    let lastUsedY = HEADER_OFFSET - DEFAULT_NODE_SPACING.verticalGap;

    for (const r of sortedRanks) {
      const groupNodes = rankGroups.get(r)!;
      groupNodes.sort((a, b) => (a.position?.x ?? 0) - (b.position?.x ?? 0) || (a.position?.y ?? 0) - (b.position?.y ?? 0));

      let targetY = HEADER_OFFSET + r * ROW_HEIGHT;
      if (targetY <= lastUsedY + 20) {
        targetY = lastUsedY + DEFAULT_NODE_SPACING.verticalGap + 20;
      }

      const count = groupNodes.length;
      for (let i = 0; i < count; i++) {
        const child = groupNodes[i];
        const dims = getStandardNodeDimensions(child.type || 'activity');

        // If multiple items at the same rank in same lane (e.g. Form + KTP + Emas), offset slightly
        let relX = Math.round((equalizedLaneWidth - dims.width) / 2);
        let nodeY = targetY;

        if (count > 1) {
          // Slight cascade / offset for multi-documents in the same lane
          const stepOffset = Math.min(24, (equalizedLaneWidth - dims.width - 40) / count);
          relX = Math.round((equalizedLaneWidth - dims.width) / 2) + (i - (count - 1) / 2) * stepOffset;
          nodeY = targetY + i * 28;
        }

        outputNodes.push({
          ...child,
          parentId: lane.id,
          position: { x: relX, y: nodeY },
          width: dims.width,
          height: dims.height,
          style: {
            ...child.style,
            width: dims.width,
            height: dims.height,
          },
        });

        if (nodeY + dims.height > lastUsedY) {
          lastUsedY = nodeY + dims.height;
        }
      }
    }

    // Ensure swimlane height dynamically stretches if cascaded nodes push beyond calculatedCanvasHeight
    const requiredLaneHeight = lastUsedY + 100;
    if (requiredLaneHeight > maxRequiredHeight) {
      maxRequiredHeight = requiredLaneHeight;
    }
  }

  // Update swimlane heights to the final maxRequiredHeight so all lanes stay uniform and fully contain all children
  for (const n of outputNodes) {
    if (n.type === 'swimlane') {
      n.height = maxRequiredHeight;
      n.style = {
        ...n.style,
        height: maxRequiredHeight,
      };
      if (lanePositionMap.has(n.id)) {
        lanePositionMap.get(n.id)!.height = maxRequiredHeight;
      }
    }
  }

  // 7. Place unassigned nodes (if any) horizontally below the swimlanes
  let unassignedX = 40;
  const unassignedY = maxRequiredHeight + 80;
  for (const node of unassignedNodes) {
    const dims = getStandardNodeDimensions(node.type || 'activity');
    outputNodes.push({
      ...node,
      parentId: undefined,
      position: { x: unassignedX, y: unassignedY },
      width: dims.width,
      height: dims.height,
      style: {
        ...node.style,
        width: dims.width,
        height: dims.height,
      },
    });
    unassignedX += dims.width + 40;
  }

  // 8. Re-align edge connection handles based on relative absolute centers
  const enrichedEdges = enrichEdgeHandles(outputNodes, currentEdges, lanePositionMap);

  return {
    nodes: outputNodes,
    edges: enrichedEdges,
  };
}

/**
 * Re-aligns edge connection handles with valid ReactFlow Handle IDs
 * according to node types (EightConnectionHandles, Decision, Start/End) and geometric deltas.
 */
function enrichEdgeHandles(
  nodes: Node[],
  edges: Edge[],
  lanePositionMap: Map<string, { x: number; y: number }>
): Edge[] {
  const nodeMap = new Map<string, Node>(nodes.map((n) => [n.id, n]));
  const nodeAbsCenter = new Map<string, { x: number; y: number }>();

  for (const n of nodes) {
    if (n.type === 'swimlane') continue;
    const w = (n.width as number) || 160;
    const h = (n.height as number) || 56;
    if (n.parentId && lanePositionMap.has(n.parentId)) {
      const lp = lanePositionMap.get(n.parentId)!;
      nodeAbsCenter.set(n.id, {
        x: lp.x + n.position.x + w / 2,
        y: lp.y + n.position.y + h / 2,
      });
    } else {
      nodeAbsCenter.set(n.id, {
        x: n.position.x + w / 2,
        y: n.position.y + h / 2,
      });
    }
  }

  return edges.map((e) => {
    const s = nodeAbsCenter.get(e.source);
    const t = nodeAbsCenter.get(e.target);
    if (!s || !t) return e;

    const dx = t.x - s.x;
    const dy = t.y - s.y;

    const sNode = nodeMap.get(e.source);
    const tNode = nodeMap.get(e.target);
    const sType = sNode?.type;
    const tType = tNode?.type;

    let sourceHandle: string | undefined = undefined;
    let targetHandle: string | undefined = undefined;

    // Mostly vertical flow
    if (Math.abs(dy) >= Math.abs(dx)) {
      if (dy >= 0) {
        // Source flows downward
        if (sType === 'start') {
          sourceHandle = undefined;
        } else if (sType === 'decision') {
          sourceHandle = undefined; // bottom handle on decision has no id
        } else {
          sourceHandle = 'bottom'; // source handle on bottom
        }

        // Target receives from top
        if (tType === 'end') {
          targetHandle = undefined;
        } else if (tType === 'decision') {
          targetHandle = undefined; // top handle on decision has no id
        } else {
          targetHandle = 'top'; // target handle on top
        }
      } else {
        // Flowing upwards (backward loop / revisit)
        if (sType === 'start') {
          sourceHandle = undefined;
        } else if (sType === 'decision') {
          sourceHandle = undefined;
        } else {
          sourceHandle = 't-c-src'; // source handle on top
        }

        if (tType === 'end') {
          targetHandle = undefined;
        } else if (tType === 'decision') {
          targetHandle = undefined;
        } else {
          targetHandle = 'b-c-tgt'; // target handle on bottom
        }
      }
    } else {
      // Mostly horizontal flow (e.g. across swimlanes or lateral branching)
      if (dx >= 0) {
        // Flowing right
        if (sType === 'start') {
          sourceHandle = undefined;
        } else if (sType === 'decision') {
          sourceHandle = 'yes'; // right handle on decision is 'yes'
        } else {
          sourceHandle = 'm-r-src'; // EightConnectionHandles right SOURCE handle
        }

        if (tType === 'end') {
          targetHandle = undefined;
        } else if (tType === 'decision') {
          targetHandle = undefined; // top handle on decision
        } else {
          targetHandle = 'left'; // EightConnectionHandles left TARGET handle
        }
      } else {
        // Flowing left
        if (sType === 'start') {
          sourceHandle = undefined;
        } else if (sType === 'decision') {
          sourceHandle = 'no'; // left handle on decision is 'no'
        } else {
          sourceHandle = 'm-l-src'; // EightConnectionHandles left SOURCE handle
        }

        if (tType === 'end') {
          targetHandle = undefined;
        } else if (tType === 'decision') {
          targetHandle = undefined;
        } else {
          targetHandle = 'right'; // EightConnectionHandles right TARGET handle
        }
      }
    }

    // Preserve explicit decision handle if user/OCR already labeled it or set it
    if (sType === 'decision') {
      const labelUpper = e.label?.toString().trim().toUpperCase();
      if (labelUpper === 'YES' || e.sourceHandle === 'yes') {
        sourceHandle = 'yes';
      } else if (labelUpper === 'NO' || e.sourceHandle === 'no') {
        sourceHandle = 'no';
      }
    }

    return {
      ...e,
      sourceHandle,
      targetHandle,
    };
  });
}
