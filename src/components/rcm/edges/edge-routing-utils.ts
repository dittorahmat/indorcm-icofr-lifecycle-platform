import type { BPMEdgeRoutingMode } from '../../../../shared/types';
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

export type { Point, Segment, OrthogonalPathResult, BPMEdgeRoutingMode };
export { 
  FIXED_CENTER_TYPES, 
  getNodeDimensions, 
  getNodeAbsolutePosition,
  SAFE_HEADER_CEILING,
  getOrthogonalPath,
  getLineIntersection
};

export function normalizeHandlePosition(
  handleId?: string | null,
  position?: any,
  sourceNode?: any,
  targetNode?: any,
  isSource?: boolean,
  nodeInternals?: any
): string {
  if (handleId === 't-l' || handleId === 't-l-src') return 'top-left';
  if (handleId === 't-r' || handleId === 't-r-src') return 'top-right';
  if (handleId === 'b-l' || handleId === 'b-l-src') return 'bottom-left';
  if (handleId === 'b-r' || handleId === 'b-r-src') return 'bottom-right';
  if (handleId === 'm-l' || handleId === 'm-l-src' || handleId === 'left' || handleId === 'no' || handleId?.includes('left')) return 'left';
  if (handleId === 'm-r' || handleId === 'm-r-src' || handleId === 'right' || handleId === 'yes' || handleId?.includes('right')) return 'right';
  if (handleId === 'top' || handleId === 't-c-src' || handleId?.includes('top') || handleId?.startsWith('t-') || handleId === 'qc-top') return 'top';
  if (handleId === 'bottom' || handleId === 'b-c-tgt' || handleId?.includes('bottom') || handleId?.startsWith('b-') || handleId === 'qc-bottom') return 'bottom';

  if (position === 'left') return 'left';
  if (position === 'right') return 'right';
  if (position === 'top') return 'top';
  if (position === 'bottom') return 'bottom';

  if (sourceNode && targetNode && nodeInternals) {
    const sPos = getNodeAbsolutePosition(sourceNode, nodeInternals);
    const tPos = getNodeAbsolutePosition(targetNode, nodeInternals);
    const sDim = getNodeDimensions(sourceNode);
    const tDim = getNodeDimensions(targetNode);

    const sCenter = { x: sPos.x + sDim.width / 2, y: sPos.y + sDim.height / 2 };
    const tCenter = { x: tPos.x + tDim.width / 2, y: tPos.y + tDim.height / 2 };

    const dx = tCenter.x - sCenter.x;
    const dy = tCenter.y - sCenter.y;

    if (isSource) {
      if (Math.abs(dy) >= Math.abs(dx)) {
        return dy >= 0 ? 'bottom' : 'top';
      } else {
        return dx >= 0 ? 'right' : 'left';
      }
    } else {
      if (Math.abs(dy) >= Math.abs(dx)) {
        return dy >= 0 ? 'top' : 'bottom';
      } else {
        return dx >= 0 ? 'left' : 'right';
      }
    }
  }

  return isSource ? 'bottom' : 'top';
}

export function getDistributedPoint(
  node: any,
  side: string,
  edgeId: string,
  allEdges: any[],
  isSource: boolean,
  nodeInternals: any
): Point {
  const dim = getNodeDimensions(node);
  const absPos = getNodeAbsolutePosition(node, nodeInternals);

  // Locked center/apex for diamond/start/end/ref
  if (FIXED_CENTER_TYPES.has(node.type)) {
    let x = absPos.x + dim.width / 2;
    let y = absPos.y + dim.height / 2;

    if (side === 'top') y = absPos.y;
    else if (side === 'bottom') y = absPos.y + dim.height;
    else if (side === 'left') x = absPos.x;
    else if (side === 'right') x = absPos.x + dim.width;
    return { x, y };
  }

  // Find all edges connected to this node and side
  const relevantEdges = allEdges.filter((e) => {
    const srcNode = nodeInternals.get(e.source);
    const tgtNode = nodeInternals.get(e.target);
    if (isSource) {
      if (e.source !== node.id) return false;
      const eSide = normalizeHandlePosition(e.sourceHandle, e.sourcePosition, srcNode, tgtNode, true, nodeInternals);
      return eSide === side;
    } else {
      if (e.target !== node.id) return false;
      const eSide = normalizeHandlePosition(e.targetHandle, e.targetPosition, srcNode, tgtNode, false, nodeInternals);
      return eSide === side;
    }
  });

  relevantEdges.sort((a, b) => {
    const oppNodeIdA = isSource ? a.target : a.source;
    const oppNodeIdB = isSource ? b.target : b.source;
    const oppNodeA = nodeInternals.get(oppNodeIdA);
    const oppNodeB = nodeInternals.get(oppNodeIdB);

    const posA = oppNodeA ? getNodeAbsolutePosition(oppNodeA, nodeInternals) : { x: 0, y: 0 };
    const posB = oppNodeB ? getNodeAbsolutePosition(oppNodeB, nodeInternals) : { x: 0, y: 0 };

    if (side === 'top' || side === 'bottom') {
      return posA.x - posB.x;
    } else {
      return posA.y - posB.y;
    }
  });

  const count = relevantEdges.length;
  const index = relevantEdges.findIndex((e) => e.id === edgeId);

  // If single edge or not found, center it
  if (count <= 1 || index === -1) {
    let x = absPos.x + dim.width / 2;
    let y = absPos.y + dim.height / 2;

    if (side === 'top') y = absPos.y;
    else if (side === 'bottom') y = absPos.y + dim.height;
    else if (side === 'left') x = absPos.x;
    else if (side === 'right') x = absPos.x + dim.width;
    else if (side === 'top-left') { x = absPos.x; y = absPos.y; }
    else if (side === 'top-right') { x = absPos.x + dim.width; y = absPos.y; }
    else if (side === 'bottom-left') { x = absPos.x; y = absPos.y + dim.height; }
    else if (side === 'bottom-right') { x = absPos.x + dim.width; y = absPos.y + dim.height; }

    return { x, y };
  }

  // Multi-edge connector distribution
  if (side === 'top' || side === 'bottom') {
    const padding = Math.min(24, dim.width * 0.2);
    const usableWidth = dim.width - padding * 2;
    const step = usableWidth / (count - 1);
    const x = absPos.x + padding + index * step;
    const y = side === 'top' ? absPos.y : absPos.y + dim.height;
    return { x, y };
  } else {
    const padding = Math.min(16, dim.height * 0.2);
    const usableHeight = dim.height - padding * 2;
    const step = usableHeight / (count - 1);
    const x = side === 'left' ? absPos.x : absPos.x + dim.width;
    const y = absPos.y + padding + index * step;
    return { x, y };
  }
}
