import type { BPMEdgeRoutingMode } from '../../../../../shared/types';
import type { Point, Segment } from './node-dimensions';
import { SAFE_HEADER_CEILING } from '../../../../utils/bpm-constants';

// Safe ceiling limit: waypoints must never cross into swimlane headers (top 100px).
// Single definition lives in utils/bpm-constants; re-exported here so existing
// canvas callers keep working byte-identically.
export { SAFE_HEADER_CEILING };

export interface OrthogonalPathResult {
  path: string;
  segments: Segment[];
  primaryHandle?: {
    x: number;
    y: number;
    axis: 'x' | 'y';
  };
}

export function getOrthogonalPath(
  sPt: Point,
  sSide: string,
  rawTPt: Point,
  tSide: string,
  channelOffset: number = 0,
  bendOffset?: { x?: number; y?: number },
  routingMode: BPMEdgeRoutingMode = 'auto'
): OrthogonalPathResult {
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

  if (routingMode === '1-corner') {
    if (sSide === 'left' || sSide === 'right') {
      const corner = { x: tPt.x, y: sPt.y };
      points.push(corner);
      primaryHandle = { x: corner.x, y: corner.y, axis: 'x' };
    } else {
      const corner = { x: sPt.x, y: tPt.y };
      points.push(corner);
      primaryHandle = { x: corner.x, y: corner.y, axis: 'y' };
    }
  } else if ((sSide === 'bottom' && tSide === 'top') || (sSide === 'top' && tSide === 'bottom')) {
    if (dy >= 0) {
      let midY = sPt.y + dy / 2 + channelOffset;
      if (bendOffset?.y !== undefined) {
        midY += bendOffset.y;
      }
      midY = Math.max(SAFE_HEADER_CEILING, midY);
      points.push({ x: sPt.x, y: midY });
      points.push({ x: tPt.x, y: midY });
      primaryHandle = { x: (sPt.x + tPt.x) / 2, y: midY, axis: 'y' };
    } else {
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
    if (tSide === 'left' || tSide === 'right') {
      let turnY = tPt.y + channelOffset;
      if (bendOffset?.y !== undefined) {
        turnY += bendOffset.y;
      }
      turnY = Math.max(SAFE_HEADER_CEILING, turnY);
      points.push({ x: sPt.x, y: turnY });
      primaryHandle = { x: sPt.x, y: turnY, axis: 'y' };
    } else {
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
    if (tSide === 'top') {
      // Lateral exit from right going to top handle of a node below or above.
      // 1. Step right at least 24px clearance from source.
      // 2. If target is to the left or below, step out right past both source and target if needed,
      //    or if target is further right, turn at midpoint or comfortable clearance.
      // 3. For a clean vertical entry into target top: (sPt) -> (turnX, sPt.y) -> (turnX, entryY) -> (tPt.x, entryY) -> (tPt.x, tPt.y)
      //    where entryY is at least 20px above tPt.y.
      const lateralClearance = 24;
      let turnX = Math.max(sPt.x + lateralClearance, tPt.x > sPt.x ? sPt.x + (tPt.x - sPt.x) / 2 : sPt.x + lateralClearance) + channelOffset;
      if (bendOffset?.x !== undefined) {
        turnX += bendOffset.x;
      }
      points.push({ x: turnX, y: sPt.y });

      if (tPt.y > sPt.y) {
        // Target is below: descend and turn horizontally into target top from above
        let entryY = tPt.y - 20;
        if (bendOffset?.y !== undefined) {
          entryY += bendOffset.y;
        }
        entryY = Math.max(SAFE_HEADER_CEILING, Math.min(entryY, tPt.y - 12));
        points.push({ x: turnX, y: entryY });
        points.push({ x: tPt.x, y: entryY });
        primaryHandle = { x: turnX, y: (sPt.y + entryY) / 2, axis: 'x' };
      } else {
        // Target is above: ascend and enter target top
        let entryY = tPt.y - 24;
        if (bendOffset?.y !== undefined) {
          entryY += bendOffset.y;
        }
        entryY = Math.max(SAFE_HEADER_CEILING, entryY);
        points.push({ x: turnX, y: entryY });
        points.push({ x: tPt.x, y: entryY });
        primaryHandle = { x: turnX, y: (sPt.y + entryY) / 2, axis: 'x' };
      }
    } else if (tSide === 'bottom') {
      const lateralClearance = 24;
      let turnX = Math.max(sPt.x + lateralClearance, tPt.x > sPt.x ? sPt.x + (tPt.x - sPt.x) / 2 : sPt.x + lateralClearance) + channelOffset;
      if (bendOffset?.x !== undefined) {
        turnX += bendOffset.x;
      }
      points.push({ x: turnX, y: sPt.y });

      let entryY = tPt.y + 20;
      if (bendOffset?.y !== undefined) {
        entryY += bendOffset.y;
      }
      points.push({ x: turnX, y: entryY });
      points.push({ x: tPt.x, y: entryY });
      primaryHandle = { x: turnX, y: (sPt.y + entryY) / 2, axis: 'x' };
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
    if (tSide === 'top') {
      const lateralClearance = 24;
      let turnX = Math.min(sPt.x - lateralClearance, tPt.x < sPt.x ? sPt.x - (sPt.x - tPt.x) / 2 : sPt.x - lateralClearance) + channelOffset;
      if (bendOffset?.x !== undefined) {
        turnX += bendOffset.x;
      }
      points.push({ x: turnX, y: sPt.y });

      if (tPt.y > sPt.y) {
        let entryY = tPt.y - 20;
        if (bendOffset?.y !== undefined) {
          entryY += bendOffset.y;
        }
        entryY = Math.max(SAFE_HEADER_CEILING, Math.min(entryY, tPt.y - 12));
        points.push({ x: turnX, y: entryY });
        points.push({ x: tPt.x, y: entryY });
        primaryHandle = { x: turnX, y: (sPt.y + entryY) / 2, axis: 'x' };
      } else {
        let entryY = tPt.y - 24;
        if (bendOffset?.y !== undefined) {
          entryY += bendOffset.y;
        }
        entryY = Math.max(SAFE_HEADER_CEILING, entryY);
        points.push({ x: turnX, y: entryY });
        points.push({ x: tPt.x, y: entryY });
        primaryHandle = { x: turnX, y: (sPt.y + entryY) / 2, axis: 'x' };
      }
    } else if (tSide === 'bottom') {
      const lateralClearance = 24;
      let turnX = Math.min(sPt.x - lateralClearance, tPt.x < sPt.x ? sPt.x - (sPt.x - tPt.x) / 2 : sPt.x - lateralClearance) + channelOffset;
      if (bendOffset?.x !== undefined) {
        turnX += bendOffset.x;
      }
      points.push({ x: turnX, y: sPt.y });

      let entryY = tPt.y + 20;
      if (bendOffset?.y !== undefined) {
        entryY += bendOffset.y;
      }
      points.push({ x: turnX, y: entryY });
      points.push({ x: tPt.x, y: entryY });
      primaryHandle = { x: turnX, y: (sPt.y + entryY) / 2, axis: 'x' };
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

  const minYBound = Math.min(sPt.y, tPt.y);
  if (minYBound >= SAFE_HEADER_CEILING) {
    for (let i = 1; i < points.length - 1; i++) {
      if (points[i].y < SAFE_HEADER_CEILING) {
        points[i].y = SAFE_HEADER_CEILING;
      }
    }
  }

  const cleaned: Point[] = [points[0]];
  for (let i = 1; i < points.length; i++) {
    const prev = cleaned[cleaned.length - 1];
    const curr = points[i];
    if (Math.abs(prev.x - curr.x) < 0.5 && Math.abs(prev.y - curr.y) < 0.5) {
      continue;
    }
    cleaned.push(curr);
  }

  const orthogonalPoints: Point[] = [cleaned[0]];
  for (let i = 1; i < cleaned.length; i++) {
    const prev = orthogonalPoints[orthogonalPoints.length - 1];
    const curr = cleaned[i];
    if (Math.abs(prev.x - curr.x) > 0.5 && Math.abs(prev.y - curr.y) > 0.5) {
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

export function getLineIntersection(p1: Point, p2: Point, p3: Point, p4: Point): Point | null {
  const denom = (p4.y - p3.y) * (p2.x - p1.x) - (p4.x - p3.x) * (p2.y - p1.y);
  if (Math.abs(denom) < 0.0001) return null;

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
