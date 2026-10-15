import { getLineIntersection } from './edge-routing-utils';
import type { Point, Segment } from './edge-routing-utils';

export interface OtherEdgeSegments {
  edgeId: string;
  segments: Segment[];
}

export const BRIDGE_RADIUS = 6;

export function buildBridgedPath(edgeId: string, current: Segment[], others: OtherEdgeSegments[], radius: number = BRIDGE_RADIUS): string {
  let path = `M ${current[0]?.p1.x} ${current[0]?.p1.y}`;
  for (const seg of current) {
    const hits: { pt: Point; otherEdgeId: string }[] = [];
    for (const other of others) {
      for (const otherSeg of other.segments) {
        const pt = getLineIntersection(seg.p1, seg.p2, otherSeg.p1, otherSeg.p2);
        if (pt) hits.push({ pt, otherEdgeId: other.edgeId });
      }
    }
    if (hits.length > 0) {
      hits.sort((a, b) => Math.hypot(a.pt.x - seg.p1.x, a.pt.y - seg.p1.y) - Math.hypot(b.pt.x - seg.p1.x, b.pt.y - seg.p1.y));
      for (const { pt, otherEdgeId } of hits) {
        if (edgeId < otherEdgeId) continue;
        const dx = seg.p2.x - seg.p1.x;
        const dy = seg.p2.y - seg.p1.y;
        const len = Math.hypot(dx, dy);
        if (len > 0) {
          const ux = dx / len;
          const uy = dy / len;
          const sweep = Math.abs(ux) > Math.abs(uy) ? (ux > 0 ? 1 : 0) : uy > 0 ? 0 : 1;
          path += ` L ${pt.x - ux * radius} ${pt.y - uy * radius}`;
          path += ` A ${radius} ${radius} 0 0 ${sweep} ${pt.x + ux * radius} ${pt.y + uy * radius}`;
        }
      }
    }
    path += ` L ${seg.p2.x} ${seg.p2.y}`;
  }
  return path;
}
