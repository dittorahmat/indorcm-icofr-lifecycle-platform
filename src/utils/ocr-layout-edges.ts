// ocr-layout-edges.ts — handle selection for OCR-enriched edges (pure TS).
//
// Handles are chosen from the *placed* geometry, so a node that ends up left of
// its target connects left→right and a node below connects bottom→top. Called
// once after both layout engines, which keeps handle routing identical between
// coordinate mode and the rank fallback.

import { canonicalizeHandleId } from './bpm-constants';
import type { OcrRawEdge } from './ocr-validate';

export interface EdgeAnchor {
  x: number;
  y: number;
  parentId?: string;
}

function pickHandles(source: EdgeAnchor, target: EdgeAnchor): { sourceHandle: string; targetHandle: string } {
  const dx = target.x - source.x;
  const dy = target.y - source.y;
  const isCrossLane = source.parentId !== target.parentId;

  // When target sits lower down in the process flow (dy > 40), target handle should plunge from the top
  if (dy > 40) {
    if (isCrossLane && Math.abs(dx) > 100) {
      return dx >= 0 ? { sourceHandle: 'right', targetHandle: 'top' } : { sourceHandle: 'left', targetHandle: 'top' };
    }
    return { sourceHandle: 'bottom', targetHandle: 'top' };
  }

  if (isCrossLane && Math.abs(dx) > 100) {
    return dx >= 0 ? { sourceHandle: 'right', targetHandle: 'left' } : { sourceHandle: 'left', targetHandle: 'right' };
  }
  if (Math.abs(dy) >= Math.abs(dx)) {
    return dy >= 0 ? { sourceHandle: 'bottom', targetHandle: 'top' } : { sourceHandle: 'top', targetHandle: 'bottom' };
  }
  return dx >= 0 ? { sourceHandle: 'right', targetHandle: 'left' } : { sourceHandle: 'left', targetHandle: 'right' };
}

/**
 * Fill in missing handles from geometry, then canonicalize whatever the model
 * supplied (aliases such as `top-left` collapse to the canvas handle ids).
 */
export function resolveEdgeHandles(edges: OcrRawEdge[], centers: Map<string, EdgeAnchor>): OcrRawEdge[] {
  return edges.map((edge) => {
    const source = centers.get(edge.source);
    const target = centers.get(edge.target);

    let sourceHandle = edge.sourceHandle;
    let targetHandle = edge.targetHandle;

    if ((!sourceHandle || !targetHandle) && source && target) {
      const picked = pickHandles(source, target);
      sourceHandle = sourceHandle || picked.sourceHandle;
      targetHandle = targetHandle || picked.targetHandle;
    }

    return {
      ...edge,
      sourceHandle: canonicalizeHandleId(sourceHandle, true) ?? sourceHandle,
      targetHandle: canonicalizeHandleId(targetHandle, false) ?? targetHandle,
    };
  });
}
