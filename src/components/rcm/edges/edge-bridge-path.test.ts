import { describe, expect, it } from 'vitest';
import { buildBridgedPath } from './edge-bridge-path';

const HORIZONTAL = [{ p1: { x: 0, y: 0 }, p2: { x: 100, y: 0 } }];
const VERTICAL = [{ p1: { x: 50, y: -50 }, p2: { x: 50, y: 50 } }];

describe('edge-bridge-path seam (bridge arcs over crossings)', () => {
  it('draws a straight line with no crossings', () => {
    expect(buildBridgedPath('e1', HORIZONTAL, [])).toBe('M 0 0 L 100 0');
  });

  it('adds one arc over a crossing edge', () => {
    const path = buildBridgedPath('e2', HORIZONTAL, [{ edgeId: 'e1', segments: VERTICAL }]);
    expect(path).toContain(' A 6 6 0 0 ');
    expect(path.startsWith('M 0 0')).toBe(true);
    expect(path.endsWith('L 100 0')).toBe(true);
  });

  it('skips the arc when this edge wins the id tie-break', () => {
    const path = buildBridgedPath('e1', HORIZONTAL, [{ edgeId: 'e2', segments: VERTICAL }]);
    expect(path).toBe('M 0 0 L 100 0');
  });

  it('keeps parallel non-touching segments arc-free', () => {
    const path = buildBridgedPath('e2', HORIZONTAL, [{ edgeId: 'e1', segments: [{ p1: { x: 0, y: 20 }, p2: { x: 100, y: 20 } }] }]);
    expect(path).toBe('M 0 0 L 100 0');
  });
});
