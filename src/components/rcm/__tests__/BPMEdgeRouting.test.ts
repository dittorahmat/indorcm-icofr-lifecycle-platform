import { describe, it, expect } from 'vitest';
import { getOrthogonalPath } from '../edges/edge-routing-utils';

describe('BPM Edge Flexible Routing (Visio-Style)', () => {
  const sourcePt = { x: 100, y: 100 };
  const targetPt = { x: 300, y: 300 };

  it('generates standard step path (2 bends) in auto routing mode', () => {
    const result = getOrthogonalPath(
      sourcePt,
      'bottom',
      targetPt,
      'top',
      0,
      undefined,
      'auto'
    );

    expect(result.path).toBeDefined();
    expect(result.segments.length).toBeGreaterThanOrEqual(3);
    expect(result.primaryHandle).toBeDefined();
    expect(result.primaryHandle?.axis).toBe('y');
  });

  it('generates single-corner L-shaped path (1 bend) when routingMode is 1-corner', () => {
    const resultFromRight = getOrthogonalPath(
      sourcePt,
      'right',
      targetPt,
      'top',
      0,
      undefined,
      '1-corner'
    );

    // From right: starts at (100, 100), corner at (tPt.x, sPt.y) -> (300, 100), ends at tPt -> (300, 294) with arrow offset
    expect(resultFromRight.segments.length).toBe(2);
    expect(resultFromRight.primaryHandle).toEqual({
      x: expect.any(Number),
      y: sourcePt.y,
      axis: 'x',
    });

    const resultFromBottom = getOrthogonalPath(
      sourcePt,
      'bottom',
      targetPt,
      'left',
      0,
      undefined,
      '1-corner'
    );

    // From bottom: starts at (100, 100), corner at (sPt.x, tPt.y) -> (100, 300), ends at tPt
    expect(resultFromBottom.segments.length).toBe(2);
    expect(resultFromBottom.primaryHandle).toEqual({
      x: sourcePt.x,
      y: expect.any(Number),
      axis: 'y',
    });
  });

  it('applies bendOffset to shift the orthogonal segment and waypoint position', () => {
    const unshifted = getOrthogonalPath(
      sourcePt,
      'bottom',
      targetPt,
      'top',
      0,
      undefined,
      '2-corner'
    );

    const shifted = getOrthogonalPath(
      sourcePt,
      'bottom',
      targetPt,
      'top',
      0,
      { y: 40 },
      '2-corner'
    );

    expect(shifted.primaryHandle?.y).toBe((unshifted.primaryHandle?.y ?? 0) + 40);
  });

  it('respects SAFE_HEADER_CEILING of 100px for intermediate waypoints', () => {
    const highSource = { x: 100, y: 120 };
    const highTarget = { x: 300, y: 110 };

    const result = getOrthogonalPath(
      highSource,
      'top',
      highTarget,
      'bottom',
      0,
      { y: -80 },
      'auto'
    );

    // None of the intermediate points should be < 100
    for (const seg of result.segments) {
      expect(seg.p1.y).toBeGreaterThanOrEqual(100);
      expect(seg.p2.y).toBeGreaterThanOrEqual(100);
    }
  });

  it('routes lateral decision exit (right) to top handle below with obstacle clearance', () => {
    // Decision node at right apex (200, 200), process node below at (150, 300)
    const decisionApexRight = { x: 200, y: 200 };
    const processTop = { x: 150, y: 300 };

    const result = getOrthogonalPath(
      decisionApexRight,
      'right',
      processTop,
      'top',
      0,
      undefined,
      'auto'
    );

    expect(result.segments.length).toBeGreaterThanOrEqual(3);
    // Path must step laterally outward to the right beyond source apex (>= 224)
    const firstHorizontal = result.segments[0];
    expect(firstHorizontal.p2.x).toBeGreaterThanOrEqual(224);
    // Vertical entry into processTop should arrive at processTop.x
    const lastVertical = result.segments[result.segments.length - 1];
    expect(lastVertical.p2.x).toBe(processTop.x);
    // Entry Y should stay above process top (clearance >= 12px)
    expect(lastVertical.p1.y).toBeLessThan(processTop.y);
  });
});
