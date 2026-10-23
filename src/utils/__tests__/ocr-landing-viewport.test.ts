import { describe, expect, it } from 'vitest';

import {
  computeLandingViewport,
  LANDING_MIN_ZOOM,
  LANDING_PADDING_PX,
  LANDING_ZOOM,
} from '../ocr-landing-viewport';

describe('computeLandingViewport', () => {
  it('anchors the diagram top-left inside the viewport at the landing zoom', () => {
    const viewport = computeLandingViewport({ minX: 0, minY: 60 }, LANDING_ZOOM);

    expect(viewport.zoom).toBe(0.75);
    // Screen position of the drawing's top-left corner.
    expect(viewport.x + 0 * viewport.zoom).toBe(LANDING_PADDING_PX);
    expect(viewport.y + 60 * viewport.zoom).toBe(LANDING_PADDING_PX);
  });

  it('keeps a distant top-left corner on screen', () => {
    const viewport = computeLandingViewport({ minX: 416, minY: 300 });
    expect(viewport.x + 416 * viewport.zoom).toBe(LANDING_PADDING_PX);
    expect(viewport.y + 300 * viewport.zoom).toBe(LANDING_PADDING_PX);
  });

  it('never lands below the legible zoom floor', () => {
    const viewport = computeLandingViewport({ minX: 0, minY: 0 }, 0.2);
    expect(viewport.zoom).toBe(LANDING_MIN_ZOOM);
  });

  it('falls back to identity for missing or non-finite bounds', () => {
    expect(computeLandingViewport(null)).toEqual({ x: 0, y: 0, zoom: 1 });
    expect(computeLandingViewport({ minX: Number.NaN, minY: 0 })).toEqual({ x: 0, y: 0, zoom: 1 });
  });
});
