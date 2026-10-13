import type { BPMEdgeRoutingMode, BPMEdge } from '../../../../shared/types';
import {
  Point,
  Segment,
  FIXED_CENTER_TYPES,
  getNodeDimensions,
  getNodeAbsolutePosition
} from './geometry/node-dimensions';
import {
  SAFE_HEADER_CEILING,
  OrthogonalPathResult,
  getOrthogonalPath,
  getLineIntersection
} from './geometry/orthogonal-router';
import {
  normalizeSide,
  distributePoint,
  resolveAnchor,
  canonicalHandleForSide,
  canonicalizeHandleId,
  repairStoredEdgeHandles,
  type CanvasNodeSnapshot,
  type EdgeSide,
  type ParentLookup,
} from './geometry/bpm-geometry';

export type { Point, Segment, OrthogonalPathResult, BPMEdgeRoutingMode };
export type { CanvasNodeSnapshot, EdgeSide };
export {
  FIXED_CENTER_TYPES,
  getNodeDimensions,
  getNodeAbsolutePosition,
  canonicalHandleForSide,
  canonicalizeHandleId,
  repairStoredEdgeHandles,
  SAFE_HEADER_CEILING,
  getOrthogonalPath,
  getLineIntersection
};

export type RoutingEdge = Pick<
  BPMEdge,
  'id' | 'source' | 'target' | 'sourceHandle' | 'targetHandle'
> & {
  sourcePosition?: string | null;
  targetPosition?: string | null;
};

function toParentLookup(
  nodeInternals: ReadonlyMap<string, CanvasNodeSnapshot> | undefined
): ParentLookup {
  return (id) => {
    const parent = nodeInternals?.get(id);
    if (!parent) {
      return undefined;
    }
    return {
      pos: { x: parent.position?.x ?? 0, y: parent.position?.y ?? 0 },
      parentId: parent.parentId ?? parent.parentNode ?? null,
    };
  };
}

export function normalizeHandlePosition(
  handleId?: string | null,
  position?: string | null,
  sourceNode?: CanvasNodeSnapshot | null,
  targetNode?: CanvasNodeSnapshot | null,
  isSource?: boolean,
  nodeInternals?: ReadonlyMap<string, CanvasNodeSnapshot>
): EdgeSide {
  const sourceIsSet = Boolean(isSource);
  if (sourceNode && targetNode && nodeInternals) {
    const lookup = toParentLookup(nodeInternals);
    return normalizeSide({
      handleId,
      position,
      source: resolveAnchor(sourceNode, lookup),
      target: resolveAnchor(targetNode, lookup),
      isSource: sourceIsSet,
    });
  }

  return normalizeSide({ handleId, position, isSource: sourceIsSet });
}

export function getDistributedPoint(
  node: CanvasNodeSnapshot,
  side: EdgeSide,
  edgeId: string,
  allEdges: readonly RoutingEdge[],
  isSource: boolean,
  nodeInternals?: ReadonlyMap<string, CanvasNodeSnapshot>
): Point {
  const lookup = toParentLookup(nodeInternals);
  const anchor = resolveAnchor(node, lookup);

  // Locked center/apex for diamond/start/end/ref
  if (FIXED_CENTER_TYPES.has(node.type ?? '')) {
    return distributePoint({ anchor, side, edgeId, peers: [], lockCenter: true });
  }

  // Find all edges connected to this node and side
  const relevantPeers: { edgeId: string; oppositePos: Point }[] = [];
  for (const e of allEdges) {
    const srcNode = nodeInternals?.get(e.source);
    const tgtNode = nodeInternals?.get(e.target);
    if (isSource) {
      if (e.source !== node.id) continue;
      const eSide = normalizeHandlePosition(e.sourceHandle, e.sourcePosition, srcNode, tgtNode, true, nodeInternals);
      if (eSide !== side) continue;
      const oppNode = nodeInternals?.get(e.target);
      relevantPeers.push({
        edgeId: e.id,
        oppositePos: oppNode ? getNodeAbsolutePosition(oppNode, nodeInternals) : { x: 0, y: 0 },
      });
    } else {
      if (e.target !== node.id) continue;
      const eSide = normalizeHandlePosition(e.targetHandle, e.targetPosition, srcNode, tgtNode, false, nodeInternals);
      if (eSide !== side) continue;
      const oppNode = nodeInternals?.get(e.source);
      relevantPeers.push({
        edgeId: e.id,
        oppositePos: oppNode ? getNodeAbsolutePosition(oppNode, nodeInternals) : { x: 0, y: 0 },
      });
    }
  }

  return distributePoint({ anchor, side, edgeId, peers: relevantPeers, lockCenter: false });
}
