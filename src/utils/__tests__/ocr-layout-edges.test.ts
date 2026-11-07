import { describe, expect, it } from 'vitest';

import { resolveEdgeHandles, type EdgeAnchor } from '../ocr-layout-edges';
import type { OcrRawEdge } from '../ocr-validate';

function centers(entries: Record<string, EdgeAnchor>): Map<string, EdgeAnchor> {
  return new Map(Object.entries(entries));
}

describe('resolveEdgeHandles', () => {
  it('uses horizontal handles for a long cross-lane jump', () => {
    const edges: OcrRawEdge[] = [{ id: 'e1', source: 'a', target: 'b' }];
    const [edge] = resolveEdgeHandles(
      edges,
      centers({
        a: { x: 100, y: 100, parentId: 'lane-1' },
        b: { x: 600, y: 110, parentId: 'lane-2' },
      }),
    );

    expect(edge.sourceHandle).toBe('right');
    expect(edge.targetHandle).toBe('left');
  });

  it('uses top target handle when cross-lane jump flows downwards into another step', () => {
    const edges: OcrRawEdge[] = [{ id: 'e1', source: 'a', target: 'b' }];
    const [edge] = resolveEdgeHandles(
      edges,
      centers({
        a: { x: 100, y: 100, parentId: 'lane-1' },
        b: { x: 450, y: 250, parentId: 'lane-2' },
      }),
    );

    expect(edge.sourceHandle).toBe('right');
    expect(edge.targetHandle).toBe('top');
  });

  it('uses vertical handles when the target sits below the source', () => {
    const edges: OcrRawEdge[] = [{ id: 'e1', source: 'a', target: 'b' }];
    const [edge] = resolveEdgeHandles(
      edges,
      centers({
        a: { x: 100, y: 100, parentId: 'lane-1' },
        b: { x: 110, y: 400, parentId: 'lane-1' },
      }),
    );

    expect(edge.sourceHandle).toBe('bottom');
    expect(edge.targetHandle).toBe('top');
  });

  it('enforces strict vertical bottom -> top for sequential nodes in the same lane even with horizontal offset', () => {
    const edges: OcrRawEdge[] = [{ id: 'e1', source: 'a', target: 'b' }];
    const [edge] = resolveEdgeHandles(
      edges,
      centers({
        a: { x: 100, y: 100, parentId: 'lane-1' },
        b: { x: 160, y: 130, parentId: 'lane-1' }, // dx=60, dy=30 (within same lane)
      }),
    );

    expect(edge.sourceHandle).toBe('bottom');
    expect(edge.targetHandle).toBe('top');
  });

  it('canonicalizes model-supplied handle aliases instead of overriding them', () => {
    const edges: OcrRawEdge[] = [{ id: 'e1', source: 'a', target: 'b', sourceHandle: 'top-left', targetHandle: 'bottom-right' }];
    const [edge] = resolveEdgeHandles(edges, centers({}));

    expect(edge.sourceHandle).toBe('left-src');
    expect(edge.targetHandle).toBe('right-tgt');
  });
});
