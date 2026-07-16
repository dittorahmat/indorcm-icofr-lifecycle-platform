import React from 'react';
import { EdgeProps, getBezierPath, useStore } from 'reactflow';

interface Point {
  x: number;
  y: number;
}

interface Segment {
  p1: Point;
  p2: Point;
}

// Evaluate cubic bezier point at t (0 <= t <= 1)
function getBezierPoint(t: number, p0: Point, p1: Point, p2: Point, p3: Point): Point {
  const mt = 1 - t;
  const mt2 = mt * mt;
  const mt3 = mt2 * mt;
  const t2 = t * t;
  const t3 = t2 * t;

  return {
    x: mt3 * p0.x + 3 * mt2 * t * p1.x + 3 * mt * t2 * p2.x + t3 * p3.x,
    y: mt3 * p0.y + 3 * mt2 * t * p1.y + 3 * mt * t2 * p2.y + t3 * p3.y,
  };
}

// Parse SVG path "M x0 y0 C x1 y1, x2 y2, x3 y3"
function parseBezierPath(pathStr: string): { p0: Point; p1: Point; p2: Point; p3: Point } | null {
  const nums = pathStr.match(/-?\d+\.?\d*/g);
  if (!nums || nums.length < 8) return null;
  return {
    p0: { x: parseFloat(nums[0]), y: parseFloat(nums[1]) },
    p1: { x: parseFloat(nums[2]), y: parseFloat(nums[3]) },
    p2: { x: parseFloat(nums[4]), y: parseFloat(nums[5]) },
    p3: { x: parseFloat(nums[6]), y: parseFloat(nums[7]) },
  };
}

// Sample a bezier curve into straight segments
function getBezierSegments(p0: Point, p1: Point, p2: Point, p3: Point, numSamples = 40): Segment[] {
  const points: Point[] = [];
  for (let i = 0; i <= numSamples; i++) {
    points.push(getBezierPoint(i / numSamples, p0, p1, p2, p3));
  }
  const segments: Segment[] = [];
  for (let i = 0; i < points.length - 1; i++) {
    segments.push({ p1: points[i], p2: points[i + 1] });
  }
  return segments;
}

// Calculate intersection of two line segments (p1->p2) and (p3->p4)
function getLineIntersection(p1: Point, p2: Point, p3: Point, p4: Point): Point | null {
  const denom = (p4.y - p3.y) * (p2.x - p1.x) - (p4.x - p3.x) * (p2.y - p1.y);
  if (Math.abs(denom) < 0.0001) return null; // Parallel

  const ua = ((p4.x - p3.x) * (p1.y - p3.y) - (p4.y - p3.y) * (p1.x - p3.x)) / denom;
  const ub = ((p2.x - p1.x) * (p1.y - p3.y) - (p2.y - p1.y) * (p1.x - p3.x)) / denom;

  // Keep intersection away from immediate start/end of paths to avoid clutter
  if (ua >= 0.08 && ua <= 0.92 && ub >= 0.08 && ub <= 0.92) {
    return {
      x: p1.x + ua * (p2.x - p1.x),
      y: p1.y + ua * (p2.y - p1.y),
    };
  }
  return null;
}

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
  
  let parentId = node.parentNode;
  while (parentId) {
    const parentNode = nodeInternals.get(parentId);
    if (parentNode) {
      x += parentNode.position?.x ?? 0;
      y += parentNode.position?.y ?? 0;
      parentId = parentNode.parentNode;
    } else {
      break;
    }
  }
  
  return { x, y };
}

function getEdgeCoords(edge: any, nodeInternals: any) {
  const sourceNode = nodeInternals.get(edge.source);
  const targetNode = nodeInternals.get(edge.target);
  if (!sourceNode || !targetNode) return null;

  const sDim = getNodeDimensions(sourceNode);
  const tDim = getNodeDimensions(targetNode);

  const sPos = edge.sourceHandle?.includes('left') ? 'left' : edge.sourceHandle?.includes('right') ? 'right' : 'bottom';
  const tPos = edge.targetHandle?.includes('left') ? 'left' : edge.targetHandle?.includes('right') ? 'right' : 'top';

  const sAbs = getNodeAbsolutePosition(sourceNode, nodeInternals);
  const tAbs = getNodeAbsolutePosition(targetNode, nodeInternals);

  let sX = sAbs.x + sDim.width / 2;
  let sY = sAbs.y + sDim.height;
  if (sPos === 'left') {
    sX = sAbs.x;
    sY = sAbs.y + sDim.height / 2;
  } else if (sPos === 'right') {
    sX = sAbs.x + sDim.width;
    sY = sAbs.y + sDim.height / 2;
  }

  let tX = tAbs.x + tDim.width / 2;
  let tY = tAbs.y;
  if (tPos === 'left') {
    tX = tAbs.x;
    tY = tAbs.y + tDim.height / 2;
  } else if (tPos === 'right') {
    tX = tAbs.x + tDim.width;
    tY = tAbs.y + tDim.height / 2;
  }

  return { sX, sY, tX, tY, sPos, tPos };
}

interface BridgeEdgeProps extends EdgeProps {
  borderRadius?: number;
}

export function BridgeEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
}: BridgeEdgeProps) {
  const edges = useStore((state) => state.edges);
  const nodeInternals = useStore((state) => state.nodeInternals);

  // 1. Get base Bezier curve path for current edge
  const [basePath] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const bezierPoints = parseBezierPath(basePath);
  if (!bezierPoints) {
    return <path id={id} style={style} className="react-flow__edge-path" d={basePath} markerEnd={markerEnd} />;
  }

  const currentSegments = getBezierSegments(bezierPoints.p0, bezierPoints.p1, bezierPoints.p2, bezierPoints.p3);

  // 2. Get segments for all other edges (using their Bezier paths)
  const otherEdgesSegments: { edgeId: string; segments: Segment[] }[] = [];
  edges.forEach((e) => {
    if (e.id === id) return;
    const coords = getEdgeCoords(e, nodeInternals);
    if (!coords) return;

    const [otherPath] = getBezierPath({
      sourceX: coords.sX,
      sourceY: coords.sY,
      sourcePosition: coords.sPos as any,
      targetX: coords.tX,
      targetY: coords.tY,
      targetPosition: coords.tPos as any,
    });

    const otherBezier = parseBezierPath(otherPath);
    if (otherBezier) {
      otherEdgesSegments.push({
        edgeId: e.id,
        segments: getBezierSegments(otherBezier.p0, otherBezier.p1, otherBezier.p2, otherBezier.p3),
      });
    }
  });

  // 3. Find intersections and construct the path with bridges (semi-circular humps)
  const bridgeRadius = 6;
  let finalPath = `M ${currentSegments[0].p1.x} ${currentSegments[0].p1.y}`;

  currentSegments.forEach((seg) => {
    // Find intersections on this specific segment
    const intersections: { pt: Point; otherEdgeId: string }[] = [];
    otherEdgesSegments.forEach((other) => {
      other.segments.forEach((otherSeg) => {
        const pt = getLineIntersection(seg.p1, seg.p2, otherSeg.p1, otherSeg.p2);
        if (pt) {
          intersections.push({ pt, otherEdgeId: other.edgeId });
        }
      });
    });

    // Draw the segment, inserting bridges if there are intersections
    if (intersections.length > 0) {
      // Sort intersections by proximity to seg.p1 to draw them in order
      intersections.sort((a, b) => {
        const distA = Math.hypot(a.pt.x - seg.p1.x, a.pt.y - seg.p1.y);
        const distB = Math.hypot(b.pt.x - seg.p1.x, b.pt.y - seg.p1.y);
        return distA - distB;
      });

      intersections.forEach(({ pt, otherEdgeId }) => {
        // Tie-breaker: only draw the bridge on the edge with the lexicographically larger ID
        if (id < otherEdgeId) {
          // The other edge will draw the bridge, this edge goes straight through
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

          // Hump sweep: Arch UP for horizontal lines, arch RIGHT for vertical lines
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
    <path
      id={id}
      style={style}
      className="react-flow__edge-path"
      d={finalPath}
      markerEnd={markerEnd}
    />
  );
}
