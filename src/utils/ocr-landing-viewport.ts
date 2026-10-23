// ocr-landing-viewport.ts — where the canvas lands after an OCR import.
//
// Fit-to-screen on a four-lane drawing lands near 22% zoom, which renders 12px
// labels at ~2.6px. The import instead anchors the drawing's top-left corner at
// a legible zoom and leaves panning to the user.

export interface DiagramBounds {
  minX: number;
  minY: number;
}

export interface LandingViewport {
  x: number;
  y: number;
  zoom: number;
}

export const LANDING_ZOOM = 0.75;
export const LANDING_MIN_ZOOM = 0.7;
export const LANDING_PADDING_PX = 24;

export function computeLandingViewport(
  bounds: DiagramBounds | null | undefined,
  zoom: number = LANDING_ZOOM,
): LandingViewport {
  const finite = bounds !== null && bounds !== undefined && Number.isFinite(bounds.minX) && Number.isFinite(bounds.minY);
  if (!finite) return { x: 0, y: 0, zoom: 1 };

  const appliedZoom = Math.max(LANDING_MIN_ZOOM, zoom);
  return {
    x: LANDING_PADDING_PX - bounds.minX * appliedZoom,
    y: LANDING_PADDING_PX - bounds.minY * appliedZoom,
    zoom: appliedZoom,
  };
}
