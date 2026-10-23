// ocr-layout-rank.ts — per-lane topological rank layout (fallback engine).
//
// This is the pre-existing algorithm, moved out of the orchestrator unchanged:
// each lane stacks its nodes by intra-lane depth with a fixed row height. It is
// used when the extracted coordinates are unusable (see `hasUsableGeometry`).

import { getStandardNodeDimensions, DEFAULT_SWIMLANE_DIMENSIONS } from './bpm-constants';
import { computeLaneWidths, groupNodesByRank } from './ocr-lane-geometry';
import { LANE_FOOTER, LANE_MIN_H, LANE_MIN_W } from './ocr-layout-rows';
import type { OcrRawEdge, OcrRawNode } from './ocr-validate';
import type { EngineResult, PlacedNode } from './ocr-layout-types';

const GAP_Y = DEFAULT_SWIMLANE_DIMENSIONS.gapY;
const HEADER_H = DEFAULT_SWIMLANE_DIMENSIONS.headerHeight;
const ROW_HEIGHT = 100;
const HEADER_OFFSET = HEADER_H + 50;

function placeRankNodes(children: OcrRawNode[], intraLaneEdges: OcrRawEdge[], laneWidth: number): PlacedNode[] {
  const rankGroups = groupNodesByRank(children, intraLaneEdges);
  const sortedRanks = Array.from(rankGroups.keys()).sort((a, b) => a - b);
  const nodes: PlacedNode[] = [];
  let lastUsedY = HEADER_OFFSET - GAP_Y;

  for (const rank of sortedRanks) {
    const groupNodes = [...(rankGroups.get(rank) ?? [])].sort((a, b) => a.position.x - b.position.x || a.position.y - b.position.y);

    let targetY = HEADER_OFFSET + rank * ROW_HEIGHT;
    if (targetY < lastUsedY + 50) targetY = lastUsedY + 50;

    for (let index = 0; index < groupNodes.length; index += 1) {
      const child = groupNodes[index];
      const dims = getStandardNodeDimensions(child.type);

      let relX = Math.round((laneWidth - dims.width) / 2);
      if (groupNodes.length > 1) {
        const availableW = laneWidth - 60;
        const slotW = availableW / groupNodes.length;
        relX = Math.round(30 + index * slotW + (slotW - dims.width) / 2);
      }

      nodes.push({
        id: child.id,
        type: child.type,
        label: child.label,
        parentId: child.parentId ?? '',
        department: child.department,
        function: child.function,
        x: relX,
        y: targetY,
        width: dims.width,
        height: dims.height,
      });

      lastUsedY = Math.max(lastUsedY, targetY + dims.height);
    }
  }

  return nodes;
}

/** Uniform lane width + height, per-lane rank placement (legacy behaviour). */
export function layoutRankLanes(
  sortedLanes: OcrRawNode[],
  childMap: Map<string, OcrRawNode[]>,
  edges: OcrRawEdge[],
): EngineResult {
  const widths = computeLaneWidths(sortedLanes, childMap, edges);
  // Content-sized like the coordinate engine: the legacy uniform minimum left
  // empty 1000px bands under the flow (e.g. a sign-off table read as lanes).
  let height = LANE_MIN_H;

  const placed = sortedLanes.map((lane) => {
    const width = widths.get(lane.id) ?? LANE_MIN_W;
    const children = childMap.get(lane.id) ?? [];
    const childIdSet = new Set(children.map((child) => child.id));
    const intraLaneEdges = edges.filter((edge) => childIdSet.has(edge.source) && childIdSet.has(edge.target));
    const nodes = placeRankNodes(children, intraLaneEdges, width);

    for (const node of nodes) height = Math.max(height, node.y + node.height + LANE_FOOTER);
    return { laneId: lane.id, width, nodes };
  });

  return { lanes: placed.map((lane) => ({ ...lane, height })) };
}
