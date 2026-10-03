import type { BPMEdgeRoutingMode } from '../../../../shared/types';

export interface Point {
  x: number;
  y: number;
}

export interface Segment {
  p1: Point;
  p2: Point;
}

// Nodes that must lock connection points at exact center/apex
export const FIXED_CENTER_TYPES = new Set([
  'decision',
  'start',
  'end',
  'reference',
  'off-page-ref',
  'summing-junction',
  'or',
  'archive'
]);

export function getNodeDimensions(node: any) {
  if (node.width && node.height) {
    return { width: node.width, height: node.height };
  }

  let width = 160;
  let height = 56;

  switch (node.type) {
    case 'start':
    case 'end':
      width = 120;
      height = 40;
      break;
    case 'decision':
      width = 110;
      height = 110;
      break;
    case 'document':
      width = 130;
      height = 48;
      break;
    case 'archive':
      width = 64;
      height = 64;
      break;
    case 'data-media':
      width = 100;
      height = 80;
      break;
    case 'reference':
      width = 40;
      height = 40;
      break;
    default:
      width = 160;
      height = 56;
  }

  const nodeScale = node.data?.nodeScaleOverride || 'md';
  if (nodeScale === 'sm') {
    width = Math.round(width * 0.8);
    height = Math.round(height * 0.8);
  } else if (nodeScale === 'lg') {
    width = Math.round(width * 1.25);
    height = Math.round(height * 1.25);
  }

  return { width, height };
}

export function getNodeAbsolutePosition(node: any, nodeInternals: any): Point {
  if (!node) return { x: 0, y: 0 };
  
  let x = node.position?.x ?? 0;
  let y = node.position?.y ?? 0;
  
  let parentId = node.parentId || node.parentNode;
  while (parentId) {
    const parentNode = nodeInternals.get(parentId);
    if (parentNode) {
      x += parentNode.position?.x ?? 0;
      y += parentNode.position?.y ?? 0;
      parentId = parentNode.parentId || parentNode.parentNode;
    } else {
      break;
    }
  }
  
  return { x, y };
}

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

// Safe ceiling limit: waypoints must never cross into swimlane headers (top 100px)
export const SAFE_HEADER_CEILING = 100;

export interface OrthogonalPathResult {
  path: string;
  segments: Segment[];
  primaryHandle?: {
    x: number;
    y: number;
    axis: 'x' | 'y';
  };
}

// Generate strict 90-degree Manhattan orthogonal step path (no diagonal lines ever)
// with obstacle/gutter avoidance, arrowhead clearance, header ceiling protection,
// and Visio-style flexible corner routing (1-corner L-shape vs 2-corner step + bendOffset).
export function getOrthogonalPath(
  sPt: Point,
  sSide: string,
  rawTPt: Point,
  tSide: string,
  channelOffset: number = 0,
  bendOffset?: { x?: number; y?: number },
  routingMode: BPMEdgeRoutingMode = 'auto'
): OrthogonalPathResult {
  // Arrowhead clearance offset: back off target point by 6px along arrival direction
  // so the arrow marker tip rests right on the border and is not occluded by the node
  const ARROW_OFFSET = 6;
  const tPt: Point = { ...rawTPt };
  if (tSide === 'top') {
    tPt.y -= ARROW_OFFSET;
  } else if (tSide === 'bottom') {
    tPt.y += ARROW_OFFSET;
  } else if (tSide === 'left') {
    tPt.x -= ARROW_OFFSET;
  } else if (tSide === 'right') {
    tPt.x += ARROW_OFFSET;
  }

  const points: Point[] = [sPt];
  const dx = tPt.x - sPt.x;
  const dy = tPt.y - sPt.y;

  let primaryHandle: { x: number; y: number; axis: 'x' | 'y' } | undefined = undefined;

  // Single-Corner (L-shape) routing requested
  if (routingMode === '1-corner') {
    if (sSide === 'left' || sSide === 'right') {
      // Exit horizontally to target X, then vertical to target Y
      const corner = { x: tPt.x, y: sPt.y };
      points.push(corner);
      primaryHandle = { x: corner.x, y: corner.y, axis: 'x' };
    } else {
      // Exit vertically (top/bottom) to target Y, then horizontal to target X
      const corner = { x: sPt.x, y: tPt.y };
      points.push(corner);
      primaryHandle = { x: corner.x, y: corner.y, axis: 'y' };
    }
  } else if ((sSide === 'bottom' && tSide === 'top') || (sSide === 'top' && tSide === 'bottom')) {
    if (dy >= 0) {
      // Normal downward flow (or cross-lane downward)
      let midY = sPt.y + dy / 2 + channelOffset;
      if (bendOffset?.y !== undefined) {
        midY += bendOffset.y;
      }
      midY = Math.max(SAFE_HEADER_CEILING, midY);
      points.push({ x: sPt.x, y: midY });
      points.push({ x: tPt.x, y: midY });
      primaryHandle = { x: (sPt.x + tPt.x) / 2, y: midY, axis: 'y' };
    } else {
      // Backward loop (target is above source): route out and loop cleanly around
      const loopOffset = (Math.abs(dx) > 20 ? 30 : 40) + Math.abs(channelOffset);
      let escapeX = dx >= 0 ? Math.min(sPt.x, tPt.x) - loopOffset : Math.max(sPt.x, tPt.x) + loopOffset;
      if (bendOffset?.x !== undefined) {
        escapeX += bendOffset.x;
      }
      let safeTopY = Math.min(sPt.y, tPt.y) - 24 + channelOffset;
      if (bendOffset?.y !== undefined) {
        safeTopY += bendOffset.y;
      }
      safeTopY = Math.max(SAFE_HEADER_CEILING, safeTopY);
      points.push({ x: escapeX, y: sPt.y + 20 });
      points.push({ x: escapeX, y: safeTopY });
      points.push({ x: tPt.x, y: safeTopY });
      primaryHandle = { x: escapeX, y: (sPt.y + 20 + safeTopY) / 2, axis: 'x' };
    }
  } else if ((sSide === 'right' && tSide === 'left') || (sSide === 'left' && tSide === 'right')) {
    let midX = sPt.x + dx / 2 + channelOffset;
    if (bendOffset?.x !== undefined) {
      midX += bendOffset.x;
    }
    points.push({ x: midX, y: sPt.y });
    points.push({ x: midX, y: tPt.y });
    primaryHandle = { x: midX, y: (sPt.y + tPt.y) / 2, axis: 'x' };
  } else if (sSide === 'bottom') {
    // Exit downward from source, then turn toward target
    if (tSide === 'left' || tSide === 'right') {
      let turnY = tPt.y + channelOffset;
      if (bendOffset?.y !== undefined) {
        turnY += bendOffset.y;
      }
      turnY = Math.max(SAFE_HEADER_CEILING, turnY);
      points.push({ x: sPt.x, y: turnY });
      primaryHandle = { x: sPt.x, y: turnY, axis: 'y' };
    } else {
      // both bottom or custom
      let exitY = sPt.y + Math.max(30, dy / 2) + channelOffset;
      if (bendOffset?.y !== undefined) {
        exitY += bendOffset.y;
      }
      exitY = Math.max(SAFE_HEADER_CEILING, exitY);
      points.push({ x: sPt.x, y: exitY });
      points.push({ x: tPt.x, y: exitY });
      primaryHandle = { x: (sPt.x + tPt.x) / 2, y: exitY, axis: 'y' };
    }
  } else if (sSide === 'top') {
    // Exit upward from source - enforce safe top ceiling above swimlane header
    if (tSide === 'left' || tSide === 'right') {
      let turnY = tPt.y + channelOffset;
      if (bendOffset?.y !== undefined) {
        turnY += bendOffset.y;
      }
      turnY = Math.max(SAFE_HEADER_CEILING, turnY);
      points.push({ x: sPt.x, y: turnY });
      primaryHandle = { x: sPt.x, y: turnY, axis: 'y' };
    } else {
      let exitY = sPt.y - Math.max(30, Math.abs(dy) / 2) + channelOffset;
      if (bendOffset?.y !== undefined) {
        exitY += bendOffset.y;
      }
      exitY = Math.max(SAFE_HEADER_CEILING, exitY);
      points.push({ x: sPt.x, y: exitY });
      points.push({ x: tPt.x, y: exitY });
      primaryHandle = { x: (sPt.x + tPt.x) / 2, y: exitY, axis: 'y' };
    }
  } else if (sSide === 'right') {
    // Exit horizontally to right
    if (tSide === 'top' || tSide === 'bottom') {
      let turnX = sPt.x + Math.max(20, (tPt.x - sPt.x) / 2) + channelOffset;
      if (bendOffset?.x !== undefined) {
        turnX += bendOffset.x;
      }
      points.push({ x: turnX, y: sPt.y });
      points.push({ x: turnX, y: tPt.y });
      primaryHandle = { x: turnX, y: (sPt.y + tPt.y) / 2, axis: 'x' };
    } else {
      let midX = Math.max(sPt.x + 30, sPt.x + dx / 2 + channelOffset);
      if (bendOffset?.x !== undefined) {
        midX += bendOffset.x;
      }
      points.push({ x: midX, y: sPt.y });
      points.push({ x: midX, y: tPt.y });
      primaryHandle = { x: midX, y: (sPt.y + tPt.y) / 2, axis: 'x' };
    }
  } else if (sSide === 'left') {
    // Exit horizontally to left
    if (tSide === 'top' || tSide === 'bottom') {
      let turnX = sPt.x - Math.max(20, (sPt.x - tPt.x) / 2) + channelOffset;
      if (bendOffset?.x !== undefined) {
        turnX += bendOffset.x;
      }
      points.push({ x: turnX, y: sPt.y });
      points.push({ x: turnX, y: tPt.y });
      primaryHandle = { x: turnX, y: (sPt.y + tPt.y) / 2, axis: 'x' };
    } else {
      let midX = Math.min(sPt.x - 30, sPt.x + dx / 2 + channelOffset);
      if (bendOffset?.x !== undefined) {
        midX += bendOffset.x;
      }
      points.push({ x: midX, y: sPt.y });
      points.push({ x: midX, y: tPt.y });
      primaryHandle = { x: midX, y: (sPt.y + tPt.y) / 2, axis: 'x' };
    }
  } else {
    // Fallback step routing with safe ceiling
    let midY = sPt.y + dy / 2 + channelOffset;
    if (bendOffset?.y !== undefined) {
      midY += bendOffset.y;
    }
    midY = Math.max(SAFE_HEADER_CEILING, midY);
    points.push({ x: sPt.x, y: midY });
    points.push({ x: tPt.x, y: midY });
    primaryHandle = { x: (sPt.x + tPt.x) / 2, y: midY, axis: 'y' };
  }

  points.push(tPt);

  // Strictly clamp all intermediate waypoints to stay at or below SAFE_HEADER_CEILING
  // (unless source or target itself legitimately starts above, e.g. top banner)
  const minYBound = Math.min(sPt.y, tPt.y);
  if (minYBound >= SAFE_HEADER_CEILING) {
    for (let i = 1; i < points.length - 1; i++) {
      if (points[i].y < SAFE_HEADER_CEILING) {
        points[i].y = SAFE_HEADER_CEILING;
      }
    }
  }

  // Filter out redundant points that are collinear or too close
  const cleaned: Point[] = [points[0]];
  for (let i = 1; i < points.length; i++) {
    const prev = cleaned[cleaned.length - 1];
    const curr = points[i];
    if (Math.abs(prev.x - curr.x) < 0.5 && Math.abs(prev.y - curr.y) < 0.5) {
      continue;
    }
    cleaned.push(curr);
  }

  // Create intermediate step if there's any diagonal left between adjacent points
  const orthogonalPoints: Point[] = [cleaned[0]];
  for (let i = 1; i < cleaned.length; i++) {
    const prev = orthogonalPoints[orthogonalPoints.length - 1];
    const curr = cleaned[i];
    if (Math.abs(prev.x - curr.x) > 0.5 && Math.abs(prev.y - curr.y) > 0.5) {
      // Turn diagonal into a 90-degree step corner
      orthogonalPoints.push({ x: prev.x, y: curr.y });
    }
    orthogonalPoints.push(curr);
  }

  let pathStr = `M ${orthogonalPoints[0].x} ${orthogonalPoints[0].y}`;
  const segments: Segment[] = [];

  for (let i = 1; i < orthogonalPoints.length; i++) {
    pathStr += ` L ${orthogonalPoints[i].x} ${orthogonalPoints[i].y}`;
    segments.push({ p1: orthogonalPoints[i - 1], p2: orthogonalPoints[i] });
  }

  return { path: pathStr, segments, primaryHandle };
}

// Calculate intersection of two straight line segments
export function getLineIntersection(p1: Point, p2: Point, p3: Point, p4: Point): Point | null {
  const denom = (p4.y - p3.y) * (p2.x - p1.x) - (p4.x - p3.x) * (p2.y - p1.y);
  if (Math.abs(denom) < 0.0001) return null; // Parallel

  const ua = ((p4.x - p3.x) * (p1.y - p3.y) - (p4.y - p3.y) * (p1.x - p3.x)) / denom;
  const ub = ((p2.x - p1.x) * (p1.y - p3.y) - (p2.y - p1.y) * (p1.x - p3.x)) / denom;

  if (ua >= 0.08 && ua <= 0.92 && ub >= 0.08 && ub <= 0.92) {
    return {
      x: p1.x + ua * (p2.x - p1.x),
      y: p1.y + ua * (p2.y - p1.y),
    };
  }
  return null;
}
