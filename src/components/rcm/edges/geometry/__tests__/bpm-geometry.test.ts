import { describe, it, expect } from 'vitest';
import {
  lookupNodeDimensions,
  applyNodeScale,
  normalizeSide,
  distributePoint,
  resolveAbsolutePosition,
  resolveAnchor,
  canonicalHandleForSide,
  canonicalizeHandleId,
  repairStoredEdgeHandles,
  CANONICAL_SOURCE_HANDLES,
  CANONICAL_TARGET_HANDLES,
  SAFE_HEADER_CEILING,
} from '../bpm-geometry';
import { getOrthogonalPath } from '../orthogonal-router';
import { sideFromHandleAlias } from '../../../../../utils/bpm-constants';
import {
  normalizeHandlePosition,
  getDistributedPoint,
  getNodeAbsolutePosition,
} from '../../edge-routing-utils';
import type { CanvasNodeSnapshot } from '../bpm-geometry';

describe('BPM geometry dimension table (single locality)', () => {
  it('resolves canvas-only types from the shared table instead of the 160x56 default', () => {
    expect(lookupNodeDimensions('off-page-ref')).toEqual({ width: 120, height: 50 });
    expect(lookupNodeDimensions('summing-junction')).toEqual({ width: 50, height: 50 });
    expect(lookupNodeDimensions('or')).toEqual({ width: 50, height: 50 });
  });

  it('keeps shared values identical to the OCR layout table', () => {
    expect(lookupNodeDimensions('decision')).toEqual({ width: 110, height: 110 });
    expect(lookupNodeDimensions('archive')).toEqual({ width: 64, height: 64 });
    expect(lookupNodeDimensions('data-media')).toEqual({ width: 100, height: 80 });
    expect(lookupNodeDimensions('reference')).toEqual({ width: 40, height: 40 });
    expect(lookupNodeDimensions('start')).toEqual({ width: 120, height: 40 });
  });

  it('falls back to the default activity size for unknown or missing types', () => {
    expect(lookupNodeDimensions('unknown-shape')).toEqual({ width: 160, height: 56 });
    expect(lookupNodeDimensions(undefined)).toEqual({ width: 160, height: 56 });
    expect(lookupNodeDimensions(null)).toEqual({ width: 160, height: 56 });
  });

  it('applies the canvas scale override without mutating the table value', () => {
    const base = lookupNodeDimensions('start');
    expect(applyNodeScale(base, 'sm')).toEqual({
      width: Math.round(120 * 0.8),
      height: Math.round(40 * 0.8),
    });
    expect(applyNodeScale(base, 'lg')).toEqual({
      width: Math.round(120 * 1.25),
      height: Math.round(40 * 1.25),
    });
    expect(applyNodeScale(base, 'md')).toEqual(base);
    expect(applyNodeScale(base, undefined)).toEqual(base);
    expect(base).toEqual({ width: 120, height: 40 });
  });
});

describe('normalizeSide (plain anchors, no canvas internals)', () => {
  it('maps explicit handle ids without touching node geometry', () => {
    expect(normalizeSide({ handleId: 't-l', isSource: true })).toBe('top-left');
    expect(normalizeSide({ handleId: 'b-r-src', isSource: false })).toBe('bottom-right');
    expect(normalizeSide({ handleId: 'm-l-src', isSource: true })).toBe('left');
    expect(normalizeSide({ handleId: 'yes', isSource: false })).toBe('right');
    expect(normalizeSide({ handleId: 'qc-top', isSource: true })).toBe('top');
    expect(normalizeSide({ handleId: 'qc-bottom', isSource: false })).toBe('bottom');
  });

  it('falls back to the explicit position when no handle id matches', () => {
    expect(normalizeSide({ position: 'left', isSource: true })).toBe('left');
    expect(normalizeSide({ position: 'bottom', isSource: false })).toBe('bottom');
  });

  it('derives the side from plain dx/dy centers when handles are absent', () => {
    const below = {
      source: { pos: { x: 0, y: 0 }, dims: { width: 100, height: 50 } },
      target: { pos: { x: 0, y: 200 }, dims: { width: 100, height: 50 } },
    };
    expect(normalizeSide({ ...below, isSource: true })).toBe('bottom');
    expect(normalizeSide({ ...below, isSource: false })).toBe('top');

    const rightward = {
      source: { pos: { x: 0, y: 0 }, dims: { width: 100, height: 50 } },
      target: { pos: { x: 300, y: 0 }, dims: { width: 100, height: 50 } },
    };
    expect(normalizeSide({ ...rightward, isSource: true })).toBe('right');
    expect(normalizeSide({ ...rightward, isSource: false })).toBe('left');
  });

  it('uses the source/target default when no geometry is available', () => {
    expect(normalizeSide({ isSource: true })).toBe('bottom');
    expect(normalizeSide({ isSource: false })).toBe('top');
  });

  it('resolves legacy handle ids through the single alias owner in bpm-constants', () => {
    const legacy = [
      ['t-l', 'top-left'],
      ['t-l-src', 'top-left'],
      ['t-r', 'top-right'],
      ['b-l-src', 'bottom-left'],
      ['b-r', 'bottom-right'],
      ['m-l', 'left'],
      ['left-src', 'left'],
      ['no', 'left'],
      ['m-r-src', 'right'],
      ['right-tgt', 'right'],
      ['yes', 'right'],
      ['t-c-src', 'top'],
      ['qc-top', 'top'],
      ['b-c-tgt', 'bottom'],
      ['qc-bottom', 'bottom'],
    ] as const;

    for (const [handleId, side] of legacy) {
      expect(sideFromHandleAlias(handleId)).toBe(side);
      expect(normalizeSide({ handleId, isSource: true })).toBe(side);
      expect(normalizeSide({ handleId, isSource: false })).toBe(side);
    }
  });

  it('leaves unmatched handle ids to the geometric fallback', () => {
    expect(sideFromHandleAlias('mystery-handle')).toBeNull();
    expect(normalizeSide({ handleId: 'mystery-handle', position: 'right', isSource: true })).toBe('right');
  });
});

describe('distributePoint (plain anchor, no canvas internals)', () => {
  const anchor = { pos: { x: 100, y: 200 }, dims: { width: 160, height: 56 } };

  it('centers a single edge on the requested side', () => {
    expect(
      distributePoint({ anchor, side: 'bottom', edgeId: 'e1', peers: [], lockCenter: false })
    ).toEqual({ x: 180, y: 256 });
    expect(
      distributePoint({ anchor, side: 'left', edgeId: 'e1', peers: [], lockCenter: false })
    ).toEqual({ x: 100, y: 228 });
  });

  it('places corner sides at exact node corners', () => {
    expect(
      distributePoint({ anchor, side: 'top-left', edgeId: 'e1', peers: [], lockCenter: false })
    ).toEqual({ x: 100, y: 200 });
    expect(
      distributePoint({ anchor, side: 'bottom-right', edgeId: 'e1', peers: [], lockCenter: false })
    ).toEqual({ x: 260, y: 256 });
  });

  it('locks fixed-center shapes to center/apex even with peers', () => {
    const peers = [
      { edgeId: 'e1', oppositePos: { x: 0, y: 0 } },
      { edgeId: 'e2', oppositePos: { x: 500, y: 500 } },
    ];
    expect(
      distributePoint({ anchor, side: 'bottom', edgeId: 'e2', peers, lockCenter: true })
    ).toEqual({ x: 180, y: 256 });
    expect(
      distributePoint({ anchor, side: 'right', edgeId: 'e1', peers, lockCenter: true })
    ).toEqual({ x: 260, y: 228 });
  });

  it('spreads multi-edge connectors with padding and even step', () => {
    const peers = [
      { edgeId: 'e1', oppositePos: { x: 300, y: 0 } },
      { edgeId: 'e2', oppositePos: { x: 100, y: 0 } },
      { edgeId: 'e3', oppositePos: { x: 200, y: 0 } },
    ];
    // Sorted by opposite x: e2 (100), e3 (200), e1 (300); width 160 -> padding 24, step 56
    const p1 = distributePoint({ anchor, side: 'top', edgeId: 'e2', peers, lockCenter: false });
    const p2 = distributePoint({ anchor, side: 'top', edgeId: 'e3', peers, lockCenter: false });
    const p3 = distributePoint({ anchor, side: 'top', edgeId: 'e1', peers, lockCenter: false });
    expect(p1).toEqual({ x: 124, y: 200 });
    expect(p2).toEqual({ x: 180, y: 200 });
    expect(p3).toEqual({ x: 236, y: 200 });
  });

  it('centers the point when the edge id is not among the peers', () => {
    const peers = [{ edgeId: 'other', oppositePos: { x: 0, y: 0 } }];
    expect(
      distributePoint({ anchor, side: 'right', edgeId: 'missing', peers, lockCenter: false })
    ).toEqual({ x: 260, y: 228 });
  });
});

describe('resolveAbsolutePosition (swimlane nesting, plain lookup)', () => {
  const lookup = (id: string) => {
    const lanes: Record<string, { pos: { x: number; y: number }; parentId?: string }> = {
      'lane-a': { pos: { x: 0, y: 60 } },
      'lane-b': { pos: { x: 416, y: 60 }, parentId: 'lane-a' },
    };
    return lanes[id];
  };

  it('adds the swimlane offset to a nested child', () => {
    expect(resolveAbsolutePosition({ x: 120, y: 130 }, 'lane-a', lookup)).toEqual({
      x: 120,
      y: 190,
    });
  });

  it('walks multiple nesting levels', () => {
    expect(resolveAbsolutePosition({ x: 10, y: 20 }, 'lane-b', lookup)).toEqual({
      x: 426,
      y: 140,
    });
  });

  it('stops at a missing parent instead of throwing', () => {
    expect(resolveAbsolutePosition({ x: 10, y: 20 }, 'ghost-lane', lookup)).toEqual({
      x: 10,
      y: 20,
    });
  });

  it('returns the local position when there is no parent', () => {
    expect(resolveAbsolutePosition({ x: 10, y: 20 }, null, lookup)).toEqual({ x: 10, y: 20 });
    expect(resolveAbsolutePosition({ x: 10, y: 20 }, undefined, lookup)).toEqual({
      x: 10,
      y: 20,
    });
  });
});

describe('resolveAnchor (canvas snapshot to plain anchor)', () => {
  it('prefers explicit measured dimensions over the type table', () => {
    const anchor = resolveAnchor(
      { id: 'n1', type: 'activity', position: { x: 5, y: 7 }, width: 200, height: 90 },
      () => undefined
    );
    expect(anchor).toEqual({ pos: { x: 5, y: 7 }, dims: { width: 200, height: 90 } });
  });

  it('resolves table dimensions with scale and nests inside the swimlane', () => {
    const anchor = resolveAnchor(
      {
        id: 'n2',
        type: 'start',
        position: { x: 120, y: 130 },
        parentId: 'lane-a',
        data: { nodeScaleOverride: 'sm' },
      },
      (id) => (id === 'lane-a' ? { pos: { x: 0, y: 60 } } : undefined)
    );
    expect(anchor).toEqual({
      pos: { x: 120, y: 190 },
      dims: { width: Math.round(120 * 0.8), height: Math.round(40 * 0.8) },
    });
  });

  it('treats parentNode as the parent link for legacy canvas nodes', () => {
    const anchor = resolveAnchor(
      { id: 'n3', type: 'document', position: { x: 10, y: 10 }, parentNode: 'lane-a' },
      (id) => (id === 'lane-a' ? { pos: { x: 400, y: 60 } } : undefined)
    );
    expect(anchor.pos).toEqual({ x: 410, y: 70 });
  });
});

describe('canonical handle ids (Q5 single source of truth)', () => {
  it('exposes the canvas handle ids from EightConnectionHandles per side and role', () => {
    expect(canonicalHandleForSide('left', true)).toBe('left-src');
    expect(canonicalHandleForSide('left', false)).toBe('left');
    expect(canonicalHandleForSide('right', true)).toBe('right');
    expect(canonicalHandleForSide('right', false)).toBe('right-tgt');
    expect(canonicalHandleForSide('top', true)).toBe('top-src');
    expect(canonicalHandleForSide('top', false)).toBe('top');
    expect(canonicalHandleForSide('bottom', true)).toBe('bottom');
    expect(canonicalHandleForSide('bottom', false)).toBe('bottom-tgt');
    expect(canonicalHandleForSide('top-left', true)).toBe('t-l-src');
    expect(canonicalHandleForSide('top-left', false)).toBe('t-l');
    expect(canonicalHandleForSide('top-right', true)).toBe('t-r-src');
    expect(canonicalHandleForSide('top-right', false)).toBe('t-r');
    expect(canonicalHandleForSide('bottom-left', true)).toBe('b-l-src');
    expect(canonicalHandleForSide('bottom-left', false)).toBe('b-l');
    expect(canonicalHandleForSide('bottom-right', true)).toBe('b-r-src');
    expect(canonicalHandleForSide('bottom-right', false)).toBe('b-r');
  });

  it('keeps handles that are already canonical untouched', () => {
    expect(canonicalizeHandleId('right', true)).toBe('right');
    expect(canonicalizeHandleId('left', false)).toBe('left');
    expect(canonicalizeHandleId('bottom', true)).toBe('bottom');
    expect(canonicalizeHandleId('top', false)).toBe('top');
    expect(canonicalizeHandleId('left-src', true)).toBe('left-src');
    expect(canonicalizeHandleId('right-tgt', false)).toBe('right-tgt');
  });

  it('repairs legacy OCR aliases to the canonical id for the same side and role', () => {
    expect(canonicalizeHandleId('left', true)).toBe('left-src');
    expect(canonicalizeHandleId('right', false)).toBe('right-tgt');
    expect(canonicalizeHandleId('top', true)).toBe('top-src');
    expect(canonicalizeHandleId('bottom', false)).toBe('bottom-tgt');
    expect(canonicalizeHandleId('m-l-src', true)).toBe('left-src');
    expect(canonicalizeHandleId('m-r-src', true)).toBe('right');
    expect(canonicalizeHandleId('t-c-src', true)).toBe('top-src');
    expect(canonicalizeHandleId('b-c-tgt', false)).toBe('bottom-tgt');
  });

  it('maps quick-connect drag ids to the persisted canonical id', () => {
    expect(canonicalizeHandleId('qc-top', true)).toBe('top-src');
    expect(canonicalizeHandleId('qc-right', true)).toBe('right');
    expect(canonicalizeHandleId('qc-bottom', true)).toBe('bottom');
    expect(canonicalizeHandleId('qc-left', true)).toBe('left-src');
  });

  it('preserves decision node source aliases that exist in the DOM', () => {
    expect(canonicalizeHandleId('no', true)).toBe('no');
    expect(canonicalizeHandleId('yes', true)).toBe('yes');
  });

  it('leaves missing handles alone so geometry fallback can decide', () => {
    expect(canonicalizeHandleId(undefined, true)).toBeNull();
    expect(canonicalizeHandleId(null, false)).toBeNull();
    expect(canonicalizeHandleId('mystery-handle', true)).toBeNull();
  });

  it('repairs both ends of a stored legacy OCR edge in one call', () => {
    expect(
      repairStoredEdgeHandles({ sourceHandle: 'left', targetHandle: 'right' }),
    ).toEqual({ sourceHandle: 'left-src', targetHandle: 'right-tgt' });
    expect(
      repairStoredEdgeHandles({ sourceHandle: 'top', targetHandle: 'bottom' }),
    ).toEqual({ sourceHandle: 'top-src', targetHandle: 'bottom-tgt' });
    expect(
      repairStoredEdgeHandles({ sourceHandle: 'right', targetHandle: 'left' }),
    ).toEqual({ sourceHandle: 'right', targetHandle: 'left' });
    expect(repairStoredEdgeHandles({})).toEqual({});
  });

  it('covers every side in both canonical tables', () => {
    const sides = [
      'top',
      'bottom',
      'left',
      'right',
      'top-left',
      'top-right',
      'bottom-left',
      'bottom-right',
    ] as const;
    for (const side of sides) {
      expect(typeof CANONICAL_SOURCE_HANDLES[side]).toBe('string');
      expect(typeof CANONICAL_TARGET_HANDLES[side]).toBe('string');
    }
  });
});

describe('header ceiling (single locality)', () => {
  it('exposes the same ceiling the orthogonal router enforces', () => {
    expect(SAFE_HEADER_CEILING).toBe(100);
  });

  it('clamps intermediate waypoints at the ceiling for plain point inputs', () => {
    const result = getOrthogonalPath({ x: 100, y: 120 }, 'top', { x: 300, y: 110 }, 'bottom', 0, {
      y: -80,
    });
    for (const seg of result.segments) {
      expect(seg.p1.y).toBeGreaterThanOrEqual(SAFE_HEADER_CEILING);
      expect(seg.p2.y).toBeGreaterThanOrEqual(SAFE_HEADER_CEILING);
    }
  });
});

describe('canvas adapters (nodeInternals hidden inside implementation)', () => {
  const lane = { id: 'lane-a', position: { x: 0, y: 60 } };
  const nodeA = { id: 'a', type: 'activity', position: { x: 120, y: 130 }, parentId: 'lane-a' };
  const nodeB1 = { id: 'b1', type: 'activity', position: { x: 150, y: 400 }, parentId: 'lane-a' };
  const nodeB2 = { id: 'b2', type: 'activity', position: { x: 200, y: 400 }, parentId: 'lane-a' };
  const nodeB3 = { id: 'b3', type: 'activity', position: { x: 250, y: 400 }, parentId: 'lane-a' };
  const internals = new Map<string, CanvasNodeSnapshot>([
    ['lane-a', lane],
    ['a', nodeA],
    ['b1', nodeB1],
    ['b2', nodeB2],
    ['b3', nodeB3],
  ]);

  it('resolves absolute positions through swimlane nesting', () => {
    expect(getNodeAbsolutePosition(nodeA, internals)).toEqual({ x: 120, y: 190 });
  });

  it('falls back to dx/dy centers when handles are absent', () => {
    expect(normalizeHandlePosition(undefined, undefined, nodeA, nodeB1, true, internals)).toBe(
      'bottom'
    );
    expect(normalizeHandlePosition(undefined, undefined, nodeA, nodeB1, false, internals)).toBe(
      'top'
    );
  });

  it('centers a single edge on the resolved anchor', () => {
    expect(
      getDistributedPoint(nodeA, 'bottom', 'e1', [{ id: 'e1', source: 'a', target: 'b1' }], true, internals)
    ).toEqual({ x: 200, y: 246 });
  });

  it('spreads three same-side edges with the shared padding and step', () => {
    const edges = [
      { id: 'e1', source: 'a', target: 'b1' },
      { id: 'e2', source: 'a', target: 'b2' },
      { id: 'e3', source: 'a', target: 'b3' },
    ];
    expect(getDistributedPoint(nodeA, 'bottom', 'e1', edges, true, internals)).toEqual({
      x: 144,
      y: 246,
    });
    expect(getDistributedPoint(nodeA, 'bottom', 'e2', edges, true, internals)).toEqual({
      x: 200,
      y: 246,
    });
    expect(getDistributedPoint(nodeA, 'bottom', 'e3', edges, true, internals)).toEqual({
      x: 256,
      y: 246,
    });
  });
});
