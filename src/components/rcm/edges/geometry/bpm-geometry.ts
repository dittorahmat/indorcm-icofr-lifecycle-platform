import {
  getStandardNodeDimensions,
  sideFromHandleAlias,
  SAFE_HEADER_CEILING,
  DOWNWARD_PLUNGE_THRESHOLD_DY,
  type BpmEdgeSide,
} from '../../../../utils/bpm-constants';

export { SAFE_HEADER_CEILING, DOWNWARD_PLUNGE_THRESHOLD_DY };

// Canonical handle ids live in bpm-constants (importable by utils and
// components alike); re-exported here so the geometry seam stays single.
export {
  CANONICAL_SOURCE_HANDLES,
  CANONICAL_TARGET_HANDLES,
  canonicalHandleForSide,
  canonicalizeHandleId,
  repairStoredEdgeHandles,
} from '../../../../utils/bpm-constants';

export interface GeometryPoint {
  x: number;
  y: number;
}

export interface GeometryDims {
  width: number;
  height: number;
}

export type EdgeSide = BpmEdgeSide;

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

  // Alias resolution has one owner (bpm-constants); this module owns only the
  // geometric fallback below.
  if (handleId) {
    const aliased = sideFromHandleAlias(handleId);
    if (aliased) return aliased;
  }

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
    // Target handle fallback: if target is clearly lower than source, plunge into 'top'
    if (dy > DOWNWARD_PLUNGE_THRESHOLD_DY) {
      return 'top';
    }
    if (Math.abs(dy) >= Math.abs(dx)) {
      return dy >= 0 ? 'top' : 'bottom';
    }
    return dx >= 0 ? 'left' : 'right';
  }

  return isSource ? 'bottom' : 'top';
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
