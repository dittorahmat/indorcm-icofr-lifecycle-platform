import React from 'react';
import { EdgeProps, useStore, Position, EdgeLabelRenderer } from 'reactflow';

interface Point {
  x: number;
  y: number;
}

interface Segment {
  p1: Point;
  p2: Point;
}

// Nodes that must lock connection points at exact center/apex
const FIXED_CENTER_TYPES = new Set([
  'decision',
  'start',
  'end',
  'reference',
  'off-page-ref',
  'summing-junction',
  'or',
  'archive'
]);

function getNodeDimensions(node: any) {
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

function getNodeAbsolutePosition(node: any, nodeInternals: any): Point {
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

function normalizeHandlePosition(
  handleId?: string | null,
  position?: Position,
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

  if (position === Position.Left) return 'left';
  if (position === Position.Right) return 'right';
  if (position === Position.Top) return 'top';
  if (position === Position.Bottom) return 'bottom';

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

function getDistributedPoint(
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
const SAFE_HEADER_CEILING = 100;

// Generate strict 90-degree Manhattan orthogonal step path (no diagonal lines ever)
// with obstacle/gutter avoidance, arrowhead clearance, and header ceiling protection
function getOrthogonalPath(
  sPt: Point,
  sSide: string,
  rawTPt: Point,
  tSide: string,
  channelOffset: number = 0
): { path: string; segments: Segment[] } {
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

  if ((sSide === 'bottom' && tSide === 'top') || (sSide === 'top' && tSide === 'bottom')) {
    if (dy >= 0) {
      // Normal downward flow (or cross-lane downward)
      const rawMidY = sPt.y + dy / 2 + channelOffset;
      const midY = Math.max(SAFE_HEADER_CEILING, rawMidY);
      points.push({ x: sPt.x, y: midY });
      points.push({ x: tPt.x, y: midY });
    } else {
      // Backward loop (target is above source): route out and loop cleanly around
      // Ensure we never cross above the swimlane header border (SAFE_HEADER_CEILING min safe altitude)
      const loopOffset = (Math.abs(dx) > 20 ? 30 : 40) + Math.abs(channelOffset);
      const escapeX = dx >= 0 ? Math.min(sPt.x, tPt.x) - loopOffset : Math.max(sPt.x, tPt.x) + loopOffset;
      const safeTopY = Math.max(SAFE_HEADER_CEILING, Math.min(sPt.y, tPt.y) - 24 + channelOffset);
      points.push({ x: escapeX, y: sPt.y + 20 });
      points.push({ x: escapeX, y: safeTopY });
      points.push({ x: tPt.x, y: safeTopY });
    }
  } else if ((sSide === 'right' && tSide === 'left') || (sSide === 'left' && tSide === 'right')) {
    const midX = sPt.x + dx / 2 + channelOffset;
    points.push({ x: midX, y: sPt.y });
    points.push({ x: midX, y: tPt.y });
  } else if (sSide === 'bottom') {
    // Exit downward from source, then turn toward target
    if (tSide === 'left' || tSide === 'right') {
      const turnY = Math.max(SAFE_HEADER_CEILING, tPt.y + channelOffset);
      points.push({ x: sPt.x, y: turnY });
      points.push({ x: tPt.x, y: turnY });
    } else {
      // both bottom or custom
      const exitY = Math.max(SAFE_HEADER_CEILING, sPt.y + Math.max(30, dy / 2) + channelOffset);
      points.push({ x: sPt.x, y: exitY });
      points.push({ x: tPt.x, y: exitY });
    }
  } else if (sSide === 'top') {
    // Exit upward from source - enforce safe top ceiling above swimlane header
    if (tSide === 'left' || tSide === 'right') {
      const turnY = Math.max(SAFE_HEADER_CEILING, tPt.y + channelOffset);
      points.push({ x: sPt.x, y: turnY });
      points.push({ x: tPt.x, y: turnY });
    } else {
      const exitY = Math.max(SAFE_HEADER_CEILING, sPt.y - Math.max(30, Math.abs(dy) / 2) + channelOffset);
      points.push({ x: sPt.x, y: exitY });
      points.push({ x: tPt.x, y: exitY });
    }
  } else if (sSide === 'right') {
    // Exit horizontally to right
    if (tSide === 'top' || tSide === 'bottom') {
      const turnX = sPt.x + Math.max(20, (tPt.x - sPt.x) / 2) + channelOffset;
      const turnY = Math.max(SAFE_HEADER_CEILING, sPt.y);
      points.push({ x: turnX, y: turnY });
      points.push({ x: turnX, y: tPt.y });
    } else {
      const midX = Math.max(sPt.x + 30, sPt.x + dx / 2 + channelOffset);
      points.push({ x: midX, y: sPt.y });
      points.push({ x: midX, y: tPt.y });
    }
  } else if (sSide === 'left') {
    // Exit horizontally to left
    if (tSide === 'top' || tSide === 'bottom') {
      const turnX = sPt.x - Math.max(20, (sPt.x - tPt.x) / 2) + channelOffset;
      const turnY = Math.max(SAFE_HEADER_CEILING, sPt.y);
      points.push({ x: turnX, y: turnY });
      points.push({ x: turnX, y: tPt.y });
    } else {
      const midX = Math.min(sPt.x - 30, sPt.x + dx / 2 + channelOffset);
      points.push({ x: midX, y: sPt.y });
      points.push({ x: midX, y: tPt.y });
    }
  } else {
    // Fallback step routing with safe ceiling
    const midY = Math.max(SAFE_HEADER_CEILING, sPt.y + dy / 2 + channelOffset);
    points.push({ x: sPt.x, y: midY });
    points.push({ x: tPt.x, y: midY });
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

  return { path: pathStr, segments };
}

// Calculate intersection of two straight line segments
function getLineIntersection(p1: Point, p2: Point, p3: Point, p4: Point): Point | null {
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

interface BridgeEdgeProps extends EdgeProps {
  borderRadius?: number;
  sourceHandleId?: string;
  targetHandleId?: string;
}

export function BridgeEdge({
  id,
  source,
  target,
  sourceHandleId,
  targetHandleId,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
  selected,
  label,
}: BridgeEdgeProps) {
  const edges = useStore((state) => state.edges);
  const nodeInternals = useStore((state) => state.nodeInternals);

  // Force re-evaluation during node drags
  useStore((state) => {
    const nodeArray = Array.from(state.nodeInternals.values());
    return nodeArray.map((n) => `${n.id}:${n.position.x},${n.position.y}`).join('|');
  });

  const sourceNode = nodeInternals.get(source);
  const targetNode = nodeInternals.get(target);

  const sSide = normalizeHandlePosition(sourceHandleId, sourcePosition, sourceNode, targetNode, true, nodeInternals);
  const tSide = normalizeHandlePosition(targetHandleId, targetPosition, sourceNode, targetNode, false, nodeInternals);

  const sourcePt = sourceNode
    ? getDistributedPoint(sourceNode, sSide, id, edges, true, nodeInternals)
    : { x: 0, y: 0 };
  const targetPt = targetNode
    ? getDistributedPoint(targetNode, tSide, id, edges, false, nodeInternals)
    : { x: 0, y: 0 };

  // Compute channel offset for parallel edges connecting similar node pairs / directions
  // to avoid overlapping coincident orthogonal segments
  const parallelEdges = edges.filter((e) => {
    return (
      (e.source === source && e.target === target) ||
      (e.source === target && e.target === source)
    );
  });

  let channelOffset = 0;
  if (parallelEdges.length > 1) {
    parallelEdges.sort((a, b) => a.id.localeCompare(b.id));
    const edgeIndex = parallelEdges.findIndex((e) => e.id === id);
    if (edgeIndex !== -1) {
      const spacing = 20; // 20px channel spacing
      channelOffset = (edgeIndex - (parallelEdges.length - 1) / 2) * spacing;
    }
  }

  const { path: basePath, segments: currentSegments } = getOrthogonalPath(
    sourcePt,
    sSide,
    targetPt,
    tSide,
    channelOffset
  );

  const selectedEdgeStyle: React.CSSProperties = selected
    ? {
        ...style,
        stroke: '#2563eb',
        strokeWidth: 3.5,
        filter: 'drop-shadow(0 0 4px rgba(37, 99, 235, 0.5))',
      }
    : style;

  if (currentSegments.length === 0) {
    return (
      <>
        <path
          d={basePath}
          fill="none"
          stroke="transparent"
          strokeWidth={24}
          style={{ pointerEvents: 'stroke' }}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path id={id} style={selectedEdgeStyle} className="react-flow__edge-path" d={basePath} markerEnd={markerEnd} />
      </>
    );
  }

  // Get segments for all other edges
  const otherEdgesSegments: { edgeId: string; segments: Segment[] }[] = [];
  edges.forEach((e) => {
    if (e.id === id) return;
    const eSrcNode = nodeInternals.get(e.source);
    const eTgtNode = nodeInternals.get(e.target);
    if (!eSrcNode || !eTgtNode) return;

    const eSSide = normalizeHandlePosition(e.sourceHandle, undefined, eSrcNode, eTgtNode, true, nodeInternals);
    const eTSide = normalizeHandlePosition(e.targetHandle, undefined, eSrcNode, eTgtNode, false, nodeInternals);

    const eSrcPt = getDistributedPoint(eSrcNode, eSSide, e.id, edges, true, nodeInternals);
    const eTgtPt = getDistributedPoint(eTgtNode, eTSide, e.id, edges, false, nodeInternals);

    let otherOffset = 0;
    const otherParallels = edges.filter((pe) => {
      return (
        (pe.source === e.source && pe.target === e.target) ||
        (pe.source === e.target && pe.target === e.source)
      );
    });
    if (otherParallels.length > 1) {
      otherParallels.sort((a, b) => a.id.localeCompare(b.id));
      const idx = otherParallels.findIndex((pe) => pe.id === e.id);
      if (idx !== -1) {
        otherOffset = (idx - (otherParallels.length - 1) / 2) * 20;
      }
    }

    const { segments: otherSegs } = getOrthogonalPath(eSrcPt, eSSide, eTgtPt, eTSide, otherOffset);
    if (otherSegs.length > 0) {
      otherEdgesSegments.push({
        edgeId: e.id,
        segments: otherSegs,
      });
    }
  });

  // Construct final path with bridges on intersections
  const bridgeRadius = 6;
  let finalPath = `M ${currentSegments[0].p1.x} ${currentSegments[0].p1.y}`;

  currentSegments.forEach((seg) => {
    const intersections: { pt: Point; otherEdgeId: string }[] = [];
    otherEdgesSegments.forEach((other) => {
      other.segments.forEach((otherSeg) => {
        const pt = getLineIntersection(seg.p1, seg.p2, otherSeg.p1, otherSeg.p2);
        if (pt) {
          intersections.push({ pt, otherEdgeId: other.edgeId });
        }
      });
    });

    if (intersections.length > 0) {
      intersections.sort((a, b) => {
        const distA = Math.hypot(a.pt.x - seg.p1.x, a.pt.y - seg.p1.y);
        const distB = Math.hypot(b.pt.x - seg.p1.x, b.pt.y - seg.p1.y);
        return distA - distB;
      });

      intersections.forEach(({ pt, otherEdgeId }) => {
        if (id < otherEdgeId) {
          return;
        }

        const dx = seg.p2.x - seg.p1.x;
        const dy = seg.p2.y - seg.p1.y;
        const len = Math.hypot(dx, dy);
        if (len > 0) {
          const ux = dx / len;
          const uy = dy / len;

          const startX = pt.x - ux * bridgeRadius;
          const startY = pt.y - uy * bridgeRadius;
          const endX = pt.x + ux * bridgeRadius;
          const endY = pt.y + uy * bridgeRadius;

          let sweep = 1;
          if (Math.abs(ux) > Math.abs(uy)) {
            sweep = ux > 0 ? 1 : 0;
          } else {
            sweep = uy > 0 ? 0 : 1;
          }

          finalPath += ` L ${startX} ${startY}`;
          finalPath += ` A ${bridgeRadius} ${bridgeRadius} 0 0 ${sweep} ${endX} ${endY}`;
        }
      });
    }

    finalPath += ` L ${seg.p2.x} ${seg.p2.y}`;
  });

  return (
    <>
      <path
        d={finalPath}
        fill="none"
        stroke="transparent"
        strokeWidth={24}
        style={{ pointerEvents: 'stroke' }}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        id={id}
        style={selectedEdgeStyle}
        className="react-flow__edge-path"
        d={finalPath}
        markerEnd={markerEnd}
      />
      {label && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${Math.round((sourcePt.x + targetPt.x) / 2)}px, ${Math.round((sourcePt.y + targetPt.y) / 2)}px)`,
              pointerEvents: 'all',
            }}
            className="nodrag nopan px-2 py-0.5 rounded border border-slate-300 bg-white/95 text-[11px] font-semibold text-slate-700 shadow-sm backdrop-blur-sm select-none tracking-tight"
          >
            {label}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
}


