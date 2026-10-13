import {
  getStandardNodeDimensions,
  SAFE_HEADER_CEILING,
} from '../../../../utils/bpm-constants';

export { SAFE_HEADER_CEILING };

export interface GeometryPoint {
  x: number;
  y: number;
}

export interface GeometryDims {
  width: number;
  height: number;
}

export type EdgeSide =
  | 'top'
  | 'bottom'
  | 'left'
  | 'right'
  | 'top-left'
  | 'top-right'
  | 'bottom-left'
  | 'bottom-right';

export interface PlainAnchor {
  pos: GeometryPoint;
  dims: GeometryDims;
}

export interface NormalizeSideInput {
  handleId?: string | null;
  position?: string | null;
  source?: PlainAnchor | null;
  target?: PlainAnchor | null;
  isSource: boolean;
}

export function normalizeSide(input: NormalizeSideInput): EdgeSide {
  const { handleId, position, source, target, isSource } = input;

  if (handleId === 't-l' || handleId === 't-l-src') return 'top-left';
  if (handleId === 't-r' || handleId === 't-r-src') return 'top-right';
  if (handleId === 'b-l' || handleId === 'b-l-src') return 'bottom-left';
  if (handleId === 'b-r' || handleId === 'b-r-src') return 'bottom-right';
  if (handleId === 'm-l' || handleId === 'm-l-src' || handleId === 'left' || handleId === 'no' || handleId?.includes('left')) return 'left';
  if (handleId === 'm-r' || handleId === 'm-r-src' || handleId === 'right' || handleId === 'yes' || handleId?.includes('right')) return 'right';
  if (handleId === 'top' || handleId === 't-c-src' || handleId?.includes('top') || handleId?.startsWith('t-') || handleId === 'qc-top') return 'top';
  if (handleId === 'bottom' || handleId === 'b-c-tgt' || handleId?.includes('bottom') || handleId?.startsWith('b-') || handleId === 'qc-bottom') return 'bottom';

  if (position === 'left') return 'left';
  if (position === 'right') return 'right';
  if (position === 'top') return 'top';
  if (position === 'bottom') return 'bottom';

  if (source && target) {
    const sCenter = { x: source.pos.x + source.dims.width / 2, y: source.pos.y + source.dims.height / 2 };
    const tCenter = { x: target.pos.x + target.dims.width / 2, y: target.pos.y + target.dims.height / 2 };

    const dx = tCenter.x - sCenter.x;
    const dy = tCenter.y - sCenter.y;

    if (isSource) {
      if (Math.abs(dy) >= Math.abs(dx)) {
        return dy >= 0 ? 'bottom' : 'top';
      }
      return dx >= 0 ? 'right' : 'left';
    }
    if (Math.abs(dy) >= Math.abs(dx)) {
      return dy >= 0 ? 'top' : 'bottom';
    }
    return dx >= 0 ? 'left' : 'right';
  }

  return isSource ? 'bottom' : 'top';
}

// Canonical canvas handle ids (Q5 single source of truth).
// Mirrors the ids rendered by EightConnectionHandles: each side has one
// source id and one target id. OCR and stored edges must only persist
// these ids (plus decision source aliases below); anything else is
// repaired on the way in so the arrow can never invert vs the drag.
export const CANONICAL_SOURCE_HANDLES: Record<EdgeSide, string> = {
  top: 'top-src',
  bottom: 'bottom',
  left: 'left-src',
  right: 'right',
  'top-left': 't-l-src',
  'top-right': 't-r-src',
  'bottom-left': 'b-l-src',
  'bottom-right': 'b-r-src',
};

export const CANONICAL_TARGET_HANDLES: Record<EdgeSide, string> = {
  top: 'top',
  bottom: 'bottom-tgt',
  left: 'left',
  right: 'right-tgt',
  'top-left': 't-l',
  'top-right': 't-r',
  'bottom-left': 'b-l',
  'bottom-right': 'b-r',
};

// Decision sources render under their own DOM ids, not the 8-handle set.
const DECISION_SOURCE_ALIASES = new Set(['no', 'yes']);

function sideFromHandleAlias(handleId: string): EdgeSide | null {
  if (handleId === 't-l' || handleId === 't-l-src') return 'top-left';
  if (handleId === 't-r' || handleId === 't-r-src') return 'top-right';
  if (handleId === 'b-l' || handleId === 'b-l-src') return 'bottom-left';
  if (handleId === 'b-r' || handleId === 'b-r-src') return 'bottom-right';
  if (
    handleId === 'm-l' ||
    handleId === 'm-l-src' ||
    handleId === 'left' ||
    handleId === 'no' ||
    handleId.includes('left')
  )
    return 'left';
  if (
    handleId === 'm-r' ||
    handleId === 'm-r-src' ||
    handleId === 'right' ||
    handleId === 'yes' ||
    handleId.includes('right')
  )
    return 'right';
  if (
    handleId === 'top' ||
    handleId === 't-c-src' ||
    handleId.includes('top') ||
    handleId.startsWith('t-') ||
    handleId === 'qc-top'
  )
    return 'top';
  if (
    handleId === 'bottom' ||
    handleId === 'b-c-tgt' ||
    handleId.includes('bottom') ||
    handleId.startsWith('b-') ||
    handleId === 'qc-bottom'
  )
    return 'bottom';
  return null;
}

export function canonicalHandleForSide(side: EdgeSide, isSource: boolean): string {
  return isSource ? CANONICAL_SOURCE_HANDLES[side] : CANONICAL_TARGET_HANDLES[side];
}

export function canonicalizeHandleId(
  handleId: string | null | undefined,
  isSource: boolean,
): string | null {
  if (!handleId) return null;
  if (isSource && DECISION_SOURCE_ALIASES.has(handleId)) return handleId;
  const side = sideFromHandleAlias(handleId);
  if (!side) return null;
  return canonicalHandleForSide(side, isSource);
}

interface StoredEdgeHandles {
  sourceHandle?: string | null;
  targetHandle?: string | null;
}

export function repairStoredEdgeHandles<T extends StoredEdgeHandles>(
  edge: T,
): { sourceHandle?: string; targetHandle?: string } {
  const repaired: { sourceHandle?: string; targetHandle?: string } = {};
  const source = canonicalizeHandleId(edge.sourceHandle ?? null, true);
  const target = canonicalizeHandleId(edge.targetHandle ?? null, false);
  if (source) repaired.sourceHandle = source;
  if (target) repaired.targetHandle = target;
  return repaired;
}

export interface EdgePeer {
  edgeId: string;
  oppositePos: GeometryPoint;
}

export interface DistributePointInput {
  anchor: PlainAnchor;
  side: EdgeSide;
  edgeId: string;
  peers: EdgePeer[];
  lockCenter: boolean;
}

function sidePoint(absPos: GeometryPoint, dim: GeometryDims, side: EdgeSide): GeometryPoint {
  let x = absPos.x + dim.width / 2;
  let y = absPos.y + dim.height / 2;

  if (side === 'top') y = absPos.y;
  else if (side === 'bottom') y = absPos.y + dim.height;
  else if (side === 'left') x = absPos.x;
  else if (side === 'right') x = absPos.x + dim.width;
  else if (side === 'top-left') { x = absPos.x; y = absPos.y; }
  else if (side === 'top-right') { x = absPos.x + dim.width; y = absPos.y; }
  else if (side === 'bottom-left') { x = absPos.x; y = absPos.y + dim.height; }
  else if (side === 'bottom-right') { x = absPos.x + dim.width; y = absPos.y + dim.height; }

  return { x, y };
}

export function distributePoint(input: DistributePointInput): GeometryPoint {
  const { anchor, side, edgeId, peers, lockCenter } = input;
  const absPos = anchor.pos;
  const dim = anchor.dims;

  if (lockCenter) {
    let x = absPos.x + dim.width / 2;
    let y = absPos.y + dim.height / 2;

    if (side === 'top') y = absPos.y;
    else if (side === 'bottom') y = absPos.y + dim.height;
    else if (side === 'left') x = absPos.x;
    else if (side === 'right') x = absPos.x + dim.width;
    return { x, y };
  }

  const sorted = [...peers].sort((a, b) => {
    if (side === 'top' || side === 'bottom') {
      return a.oppositePos.x - b.oppositePos.x;
    }
    return a.oppositePos.y - b.oppositePos.y;
  });

  const count = sorted.length;
  const index = sorted.findIndex((e) => e.edgeId === edgeId);

  if (count <= 1 || index === -1) {
    return sidePoint(absPos, dim, side);
  }

  if (side === 'top' || side === 'bottom') {
    const padding = Math.min(24, dim.width * 0.2);
    const usableWidth = dim.width - padding * 2;
    const step = usableWidth / (count - 1);
    const x = absPos.x + padding + index * step;
    const y = side === 'top' ? absPos.y : absPos.y + dim.height;
    return { x, y };
  }

  const padding = Math.min(16, dim.height * 0.2);
  const usableHeight = dim.height - padding * 2;
  const step = usableHeight / (count - 1);
  const x = side === 'left' ? absPos.x : absPos.x + dim.width;
  const y = absPos.y + padding + index * step;
  return { x, y };
}

export interface ParentLink {
  pos: GeometryPoint;
  parentId?: string | null;
}

export type ParentLookup = (id: string) => ParentLink | undefined;

export function resolveAbsolutePosition(
  pos: GeometryPoint,
  parentId: string | null | undefined,
  lookupParent: ParentLookup
): GeometryPoint {
  let x = pos.x;
  let y = pos.y;

  let current = parentId;
  while (current) {
    const parent = lookupParent(current);
    if (!parent) {
      break;
    }
    x += parent.pos.x;
    y += parent.pos.y;
    current = parent.parentId;
  }

  return { x, y };
}

export interface CanvasNodeSnapshot extends DimensionSource {
  readonly id: string;
  readonly position?: GeometryPoint | null;
  readonly parentId?: string | null;
  readonly parentNode?: string | null;
}

export function resolveAnchor(node: CanvasNodeSnapshot, lookupParent: ParentLookup): PlainAnchor {
  const dims = resolveNodeDimensions(node);
  const pos = resolveAbsolutePosition(
    { x: node.position?.x ?? 0, y: node.position?.y ?? 0 },
    node.parentId ?? node.parentNode ?? null,
    lookupParent
  );
  return { pos, dims };
}

export function lookupNodeDimensions(type?: string | null): GeometryDims {
  const dims = getStandardNodeDimensions(type ?? '');
  return { width: dims.width, height: dims.height };
}

export function applyNodeScale(dims: GeometryDims, scaleOverride?: string | null): GeometryDims {
  if (scaleOverride === 'sm') {
    return { width: Math.round(dims.width * 0.8), height: Math.round(dims.height * 0.8) };
  }
  if (scaleOverride === 'lg') {
    return { width: Math.round(dims.width * 1.25), height: Math.round(dims.height * 1.25) };
  }
  return { width: dims.width, height: dims.height };
}

export interface DimensionSource {
  readonly type?: string | null;
  readonly width?: number | null;
  readonly height?: number | null;
  readonly data?: Record<string, unknown> | null;
}

function readScaleOverride(data?: Record<string, unknown> | null): string | null {
  const raw = data?.['nodeScaleOverride'];
  return typeof raw === 'string' ? raw : null;
}

export function resolveNodeDimensions(node: DimensionSource): GeometryDims {
  const base =
    node.width && node.height
      ? { width: node.width, height: node.height }
      : lookupNodeDimensions(node.type ?? null);
  return applyNodeScale(base, readScaleOverride(node.data));
}
