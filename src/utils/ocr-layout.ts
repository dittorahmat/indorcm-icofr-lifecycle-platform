// ocr-layout.ts — deterministic OCR auto-layout orchestrator (pure TS, no deps).
//
// Two engines, one selector: coordinate-anchored rows (default) keeps the source
// drawing's geometry; the rank fallback (ocr-layout-rank.ts) preserves the legacy
// output when coordinates are degenerate. Both return the same `EngineResult`.
import { DEFAULT_SWIMLANE_DIMENSIONS } from './bpm-constants';
import { validateOcrResponse, deriveLabelFromId } from './ocr-validate';
import type { OcrRawNode, OcrRawEdge, OcrLayoutWarning } from './ocr-validate';
import { orderLanes } from './ocr-lane-geometry';
import { hasUsableGeometry, layoutCoordinateLanes } from './ocr-layout-rows';
import { layoutRankLanes } from './ocr-layout-rank';
import { resolveEdgeHandles } from './ocr-layout-edges';
import { estimateNodeBox } from './ocr-node-box';
import { deoverlapLane } from './ocr-layout-deoverlap';
import type { EngineResult, PlacedNode } from './ocr-layout-types';

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
const TOP_OFFSET = 60;
const TOP_LEVEL_GAP = 80;

interface ResolvedDiagram {
  lanes: OcrRawNode[];
  childMap: Map<string, OcrRawNode[]>;
  /** Children that ended up inside a lane; the input to the geometry check. */
  laneChildren: OcrRawNode[];
  /** Every node after parent downgrades, lanes included. */
  allNodes: OcrRawNode[];
}

/**
 * Normalize parents: drop unknown lane references, snap orphans whose x falls
 * nearest a lane column, order lanes left-to-right, then bucket children.
 */
function resolveDiagram(nodes: OcrRawNode[]): ResolvedDiagram {
  const swimlaneIdSet = new Set<string>(nodes.filter((n) => n.type === 'swimlane').map((n) => n.id));
  // Duplicate ids would corrupt every id-keyed map downstream (React Flow keys,
  // edge endpoints, the audit's id lookup), so only the first occurrence wins.
  const seenIds = new Set<string>();
  const downgraded: OcrRawNode[] = nodes
    .filter((n) => {
      if (seenIds.has(n.id)) return false;
      seenIds.add(n.id);
      return true;
    })
    .map((n) => (n.parentId && !swimlaneIdSet.has(n.parentId) ? { ...n, parentId: undefined } : { ...n }));

  const lanesRaw = downgraded.filter((n) => n.type === 'swimlane');
  const initialChildMap = new Map<string, OcrRawNode[]>(lanesRaw.map((lane) => [lane.id, []]));
  for (const n of downgraded) {
    if (n.type !== 'swimlane' && n.parentId) initialChildMap.get(n.parentId)?.push(n);
  }

  const lanes = orderLanes(lanesRaw, initialChildMap);
  const anyExplicitChildren = downgraded.some((n) => n.type !== 'swimlane' && n.parentId);

  // Determine if lanes form a top header row (e.g. swimlane cards across the top
  // where flow nodes sit physically below them, as in multi-column BPM diagrams).
  const minLaneY = lanes.length > 0 ? Math.min(...lanes.map((l) => l.position.y)) : 0;
  const maxLaneY = lanes.length > 0 ? Math.max(...lanes.map((l) => l.position.y)) : 0;
  const isTopHeaderLanes = lanes.length > 1 && maxLaneY - minLaneY < 150 && minLaneY < 300;

  if (lanes.length > 0) {
    for (const n of downgraded) {
      if (n.type === 'swimlane' || n.parentId) continue;
      // A node that already named an unknown lane is left unparented on purpose.
      const rawParent = nodes.find((candidate) => candidate.id === n.id)?.parentId;
      if (rawParent) continue;
      // If there are explicit children OR the lanes are clearly top headers,
      // snap unparented process nodes to their corresponding column lane.
      const isBelowTopHeader = isTopHeaderLanes && n.position.y >= minLaneY;
      if (!anyExplicitChildren && !isBelowTopHeader) continue;

      let closest = lanes[0].id;
      let minDistance = Math.abs(n.position.x - lanes[0].position.x);
      for (let i = 1; i < lanes.length; i += 1) {
        const distance = Math.abs(n.position.x - lanes[i].position.x);
        if (distance < minDistance) {
          minDistance = distance;
          closest = lanes[i].id;
        }
      }
      n.parentId = closest;
    }
  }

  const childMap = new Map<string, OcrRawNode[]>(lanes.map((lane) => [lane.id, []]));
  for (const n of downgraded) {
    if (n.type !== 'swimlane' && n.parentId) childMap.get(n.parentId)?.push(n);
  }

  return {
    lanes,
    childMap,
    laneChildren: downgraded.filter((n) => n.type !== 'swimlane' && n.parentId),
    allNodes: downgraded,
  };
}

function toLayoutNode(node: PlacedNode): OcrLayoutNode {
  const { x, y, ...rest } = node;
  return { ...rest, position: { x, y } };
}

export function layoutOcrDiagram(raw: { nodes: OcrRawNode[]; edges: OcrRawEdge[] }): OcrLayoutResult {
  const warnings = validateOcrResponse(raw);
  const idSet = new Set<string>(raw.nodes.map((n) => n.id));
  const edges = raw.edges.filter((e) => idSet.has(e.source) && idSet.has(e.target));
  const { lanes, childMap, laneChildren, allNodes } = resolveDiagram(raw.nodes);

  const engine: EngineResult = hasUsableGeometry(laneChildren)
    ? layoutCoordinateLanes(laneChildren, lanes.map((lane) => lane.id))
    : layoutRankLanes(lanes, childMap, edges);

  // Shapes without a swimlane keep the drawing's own arrangement (a flow chart
  // plus a sign-off table is a common single-column BPM sheet). They form one
  // block; the block that sits higher in the source stays on top.
  const laneHeight = Math.max(0, ...engine.lanes.map((lane) => lane.height));
  const laneIds = new Set(engine.lanes.map((lane) => lane.laneId));
  const topLevel = allNodes
    .filter((n) => n.type !== 'swimlane' && !laneIds.has(n.parentId ?? ''))
    .sort((a, b) => a.position.y - b.position.y || a.position.x - b.position.x);
  const looseSourceMinX = topLevel.length > 0 ? Math.min(...topLevel.map((node) => node.position.x)) : 0;
  const looseSourceMinY = topLevel.length > 0 ? Math.min(...topLevel.map((node) => node.position.y)) : 0;
  // Source spacing is in drawing units, rendered boxes are in pixels, so the
  // loose block still needs the deterministic clearance sweep.
  const loose = deoverlapLane(
    topLevel.map((node) => {
      const box = estimateNodeBox(node.type, node.label);
      return {
        id: node.id,
        node,
        x: Math.round(node.position.x - looseSourceMinX),
        y: Math.round(node.position.y - looseSourceMinY),
        width: box.width,
        height: box.height,
      };
    }),
  ).boxes;
  const looseHeight = loose.reduce((max, box) => Math.max(max, box.y + box.height), 0);
  const laneSourceY = lanes.length > 0 ? Math.min(...lanes.map((lane) => lane.position.y)) : Number.POSITIVE_INFINITY;
  const looseFirst = loose.length > 0 && looseSourceMinY < laneSourceY;

  const laneOriginY = looseFirst ? TOP_OFFSET + looseHeight + TOP_LEVEL_GAP : TOP_OFFSET;
  const lanePos = new Map<string, { x: number; y: number; width: number; height: number }>();
  let cursorX = 0;
  for (const lane of engine.lanes) {
    lanePos.set(lane.laneId, { x: cursorX, y: laneOriginY, width: lane.width, height: lane.height });
    cursorX += lane.width + GAP_X;
  }

  const nodesOut: OcrLayoutNode[] = [];
  for (const lane of lanes) {
    const placement = engine.lanes.find((candidate) => candidate.laneId === lane.id);
    const pos = lanePos.get(lane.id);
    if (!placement || !pos) continue;
    const department = lane.department?.trim() || lane.label?.trim() || deriveLabelFromId(lane.id);
    nodesOut.push({
      id: lane.id,
      type: lane.type,
      label: lane.label?.trim() || department,
      position: { x: pos.x, y: pos.y },
      parentId: undefined,
      width: placement.width,
      height: placement.height,
      department,
      function: lane.function?.trim() || '',
    });
    nodesOut.push(...placement.nodes.map(toLayoutNode));
  }

  const looseOriginY = looseFirst ? TOP_OFFSET : TOP_OFFSET + laneHeight + TOP_LEVEL_GAP;
  for (const box of loose) {
    nodesOut.push({
      id: box.node.id,
      type: box.node.type,
      label: box.node.label,
      position: { x: box.x, y: box.y + looseOriginY },
      parentId: undefined,
      width: box.width,
      height: box.height,
      department: box.node.department,
      function: box.node.function,
    });
  }

  const centers = new Map<string, { x: number; y: number; parentId?: string }>();
  for (const node of nodesOut) {
    const parent = node.parentId ? lanePos.get(node.parentId) : undefined;
    centers.set(node.id, {
      x: (parent?.x ?? 0) + node.position.x + node.width / 2,
      y: (parent?.y ?? 0) + node.position.y + node.height / 2,
      parentId: node.parentId,
    });
  }

  return { nodes: nodesOut, edges: resolveEdgeHandles(edges, centers), warnings };
}
