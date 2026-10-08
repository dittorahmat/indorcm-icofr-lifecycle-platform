import {
  resolveAbsolutePosition,
  resolveNodeDimensions,
  type CanvasNodeSnapshot,
  type DimensionSource,
  type GeometryDims,
  type GeometryPoint,
} from './bpm-geometry';

export type { GeometryPoint as Point } from './bpm-geometry';

export interface Segment {
  p1: GeometryPoint;
  p2: GeometryPoint;
}

// Nodes that must lock connection points at exact center/apex
export const FIXED_CENTER_TYPES = new Set([
  'decision',
  'start',
  'end',
  'reference',
  'off-page-ref',
  'summing-junction',
  'or',
  'archive'
]);

export function getNodeDimensions(node: DimensionSource): GeometryDims {
  return resolveNodeDimensions(node);
}

export function getNodeAbsolutePosition(
  node: CanvasNodeSnapshot | null | undefined,
  nodeInternals: ReadonlyMap<string, CanvasNodeSnapshot> | undefined
): GeometryPoint {
  if (!node) return { x: 0, y: 0 };

  return resolveAbsolutePosition(
    { x: node.position?.x ?? 0, y: node.position?.y ?? 0 },
    node.parentId ?? node.parentNode ?? null,
    (id) => {
      const parent = nodeInternals?.get(id);
      if (!parent) {
        return undefined;
      }
      return {
        pos: { x: parent.position?.x ?? 0, y: parent.position?.y ?? 0 },
        parentId: parent.parentId ?? parent.parentNode ?? null,
      };
    }
  );
}
