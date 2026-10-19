// src/utils/bpm-constants.ts
// Single source of truth for standardized BPM node and swimlane dimensions

export interface NodeDimension {
  width: number;
  height: number;
}

export const DEFAULT_NODE_DIMENSIONS: Record<string, NodeDimension> = {
  start: { width: 120, height: 40 },
  end: { width: 120, height: 40 },
  decision: { width: 110, height: 110 },
  document: { width: 130, height: 48 },
  archive: { width: 64, height: 64 },
  'data-media': { width: 100, height: 80 },
  reference: { width: 40, height: 40 },
  'off-page-ref': { width: 120, height: 50 },
  'manual-input': { width: 160, height: 56 },
  'external-process': { width: 160, height: 56 },
  'automated-activity': { width: 160, height: 56 },
  activity: { width: 160, height: 56 },
  'alternate-process': { width: 160, height: 56 },
  data: { width: 160, height: 56 },
  'predefined-process': { width: 160, height: 56 },
  'internal-storage': { width: 160, height: 56 },
  'multi-document': { width: 160, height: 56 },
  preparation: { width: 160, height: 56 },
  'manual-operation': { width: 160, height: 56 },
  card: { width: 160, height: 56 },
  'punched-tape': { width: 160, height: 56 },
  'summing-junction': { width: 50, height: 50 },
  or: { width: 50, height: 50 },
  collate: { width: 160, height: 56 },
  sort: { width: 160, height: 56 },
  extract: { width: 160, height: 56 },
  merge: { width: 160, height: 56 },
  'stored-data': { width: 160, height: 56 },
  delay: { width: 160, height: 56 },
  'sequential-access': { width: 160, height: 56 },
  'direct-access': { width: 160, height: 56 },
  display: { width: 160, height: 56 },
  'loop-limit': { width: 160, height: 56 },
  annotation: { width: 160, height: 56 },
  output: { width: 160, height: 56 }
};

export const DEFAULT_SWIMLANE_DIMENSIONS: {
  minWidth: number;
  minHeight: number;
  defaultWidth: number;
  defaultHeight: number;
  gapX: number;
  headerHeight: number;
  gapY: number;
  paddingHorizontal: number;
  laneGap: number;
} = {
  minWidth: 400,
  minHeight: 800,
  defaultWidth: 400,
  defaultHeight: 1000,
  gapX: 16,
  headerHeight: 80,
  gapY: 70,
  paddingHorizontal: 90,
  laneGap: 16
};

export const DEFAULT_NODE_SPACING = {
  verticalGap: 70,
  horizontalGap: 60,
  topOffset: 60
};

// Safe ceiling for orthogonal edge waypoints: routes must never cross into
// swimlane headers. Single locality shared by the canvas router and OCR layout.
export const SAFE_HEADER_CEILING = 100;

export type BpmEdgeSide =
  | 'top'
  | 'bottom'
  | 'left'
  | 'right'
  | 'top-left'
  | 'top-right'
  | 'bottom-left'
  | 'bottom-right';

// Canonical canvas handle ids (single source of truth, Q5).
// Lives here — not in the edge geometry module — so both the canvas
// (src/components) and the OCR layout (src/utils) import downwards only.
// Mirrors the ids rendered by EightConnectionHandles: each side has one
// source id and one target id. OCR and stored edges must only persist
// these ids (plus decision source aliases below); anything else is
// repaired on the way in so the arrow can never invert vs the drag.
export const CANONICAL_SOURCE_HANDLES: Record<BpmEdgeSide, string> = {
  top: 'top-src',
  bottom: 'bottom',
  left: 'left-src',
  right: 'right',
  'top-left': 't-l-src',
  'top-right': 't-r-src',
  'bottom-left': 'b-l-src',
  'bottom-right': 'b-r-src',
};

export const CANONICAL_TARGET_HANDLES: Record<BpmEdgeSide, string> = {
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

/**
 * The ONE handle-id → side table. Legacy ids that stored diagrams still carry
 * (`t-c-src`, `b-c-tgt`, `m-r-src`, …) resolve here, so the geometry module
 * never keeps a second copy of this sequence.
 */
export function sideFromHandleAlias(handleId: string): BpmEdgeSide | null {
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

export function canonicalHandleForSide(side: BpmEdgeSide, isSource: boolean): string {
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

export function getStandardNodeDimensions(type: string): NodeDimension {
  return DEFAULT_NODE_DIMENSIONS[type] || { width: 160, height: 56 };
}
