import { describe, it, expect } from 'vitest';
import { 
  getNodeDimensions, 
  FIXED_CENTER_TYPES 
} from '../geometry/node-dimensions';
import { 
  getOrthogonalPath, 
  SAFE_HEADER_CEILING, 
  getLineIntersection 
} from '../geometry/orthogonal-router';

describe('BPM Diagram Geometry Engine', () => {
  it('correctly calculates default and scaled node dimensions', () => {
    const defaultNode = { type: 'decision' };
    expect(getNodeDimensions(defaultNode)).toEqual({ width: 110, height: 110 });

    const scaledSmNode = { type: 'start', data: { nodeScaleOverride: 'sm' } };
    expect(getNodeDimensions(scaledSmNode)).toEqual({ 
      width: Math.round(120 * 0.8), 
      height: Math.round(40 * 0.8) 
    });

    const scaledLgNode = { type: 'document', data: { nodeScaleOverride: 'lg' } };
    expect(getNodeDimensions(scaledLgNode)).toEqual({ 
      width: Math.round(130 * 1.25), 
      height: Math.round(48 * 1.25) 
    });
  });

  it('recognizes apex locked shapes in FIXED_CENTER_TYPES', () => {
    expect(FIXED_CENTER_TYPES.has('decision')).toBe(true);
    expect(FIXED_CENTER_TYPES.has('start')).toBe(true);
    expect(FIXED_CENTER_TYPES.has('end')).toBe(true);
    expect(FIXED_CENTER_TYPES.has('archive')).toBe(true);
    expect(FIXED_CENTER_TYPES.has('custom-process')).toBe(false);
  });

  it('generates strict Manhattan orthogonal path without diagonal segments', () => {
    const sPt = { x: 100, y: 150 };
    const tPt = { x: 300, y: 350 };
    const result = getOrthogonalPath(sPt, 'bottom', tPt, 'top');

    expect(result.path).toBeDefined();
    expect(result.segments.length).toBeGreaterThanOrEqual(1);

    // Each segment must be strictly horizontal or strictly vertical
    for (const seg of result.segments) {
      const isHorizontal = Math.abs(seg.p1.y - seg.p2.y) < 0.001;
      const isVertical = Math.abs(seg.p1.x - seg.p2.x) < 0.001;
      expect(isHorizontal || isVertical).toBe(true);
    }
  });

  it('protects safe header ceiling (y >= 100) for waypoints', () => {
    const sPt = { x: 150, y: 120 };
    const tPt = { x: 150, y: 80 };
    const result = getOrthogonalPath(sPt, 'bottom', tPt, 'top');

    for (const seg of result.segments) {
      // Any intermediate waypoints should not violate ceiling
      if (seg.p1.y >= SAFE_HEADER_CEILING && seg.p2.y >= SAFE_HEADER_CEILING) {
        expect(seg.p1.y).toBeGreaterThanOrEqual(SAFE_HEADER_CEILING);
        expect(seg.p2.y).toBeGreaterThanOrEqual(SAFE_HEADER_CEILING);
      }
    }
  });

  it('detects perpendicular segment line intersections', () => {
    const seg1 = { p1: { x: 0, y: 50 }, p2: { x: 100, y: 50 } };
    const seg2 = { p1: { x: 50, y: 0 }, p2: { x: 50, y: 100 } };
    const intersection = getLineIntersection(seg1.p1, seg1.p2, seg2.p1, seg2.p2);

    expect(intersection).not.toBeNull();
    expect(intersection?.x).toBeCloseTo(50);
    expect(intersection?.y).toBeCloseTo(50);
  });
});
