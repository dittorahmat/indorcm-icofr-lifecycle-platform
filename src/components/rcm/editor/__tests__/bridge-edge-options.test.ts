import { describe, it, expect } from 'vitest';
import { bridgeEdgeOptions } from '../canvas-hydration';

describe('bridgeEdgeOptions', () => {
  it('enforces fill none on bridge edges to prevent SVG rasterization artifacts in PDF exports', () => {
    expect(bridgeEdgeOptions.style).toHaveProperty('fill', 'none');
  });

  it('configures proportional arrow marker dimensions', () => {
    expect(bridgeEdgeOptions.markerEnd).toEqual({
      type: 'arrowclosed',
      width: 12,
      height: 12,
      color: '#0f172a',
    });
  });
});
