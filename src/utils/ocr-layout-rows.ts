// ocr-layout-rows.ts — coordinate-anchored OCR layout (pure TS, no DOM).
//
// The source drawing's vertical order is the contract: nodes that share a row in
// the PDF share a canvas row, so cross-lane edges stay horizontal instead of
// climbing over other lanes. Row bands are sized from the *estimated rendered*
// node box, not the registry minimum, so wrapped labels cannot collide.

import { DEFAULT_SWIMLANE_DIMENSIONS } from './bpm-constants';
import { estimateNodeBox } from './ocr-node-box';
import { deoverlapLane, MIN_NODE_CLEARANCE } from './ocr-layout-deoverlap';
import type { EngineResult, PlacedNode } from './ocr-layout-types';
import type { OcrRawNode } from './ocr-validate';

const HEADER_H = DEFAULT_SWIMLANE_DIMENSIONS.headerHeight;
const LANE_MIN_W = DEFAULT_SWIMLANE_DIMENSIONS.minWidth;

/** Source-space `y` values closer than this belong to the same global row (0–1000 space). */
export const ROW_MERGE_TOLERANCE = 36;
/** Canvas-space gap between two row bands. */
export const ROW_GAP = 40;
export const LANE_PADDING_X = 40;
export const LANE_FOOTER = 80;
export const LANE_MIN_H = 300;
/** First row starts this far below the lane origin (lane origin is the header top). */
export const CONTENT_TOP = HEADER_H + 50;

export interface RowCluster {
  key: number;
  nodes: OcrRawNode[];
}

export interface RowBand {
  y: number;
  height: number;
  nodes: OcrRawNode[];
}

/** Merge source-space `y` values into global rows, anchored on the first member. */
export function clusterRows(nodes: OcrRawNode[], tolerance: number = ROW_MERGE_TOLERANCE): RowCluster[] {
  const sorted = [...nodes].sort((a, b) => a.position.y - b.position.y || a.id.localeCompare(b.id));
  const clusters: RowCluster[] = [];
  for (const node of sorted) {
    const current = clusters[clusters.length - 1];
    if (current && node.position.y - current.key <= tolerance) {
      current.nodes.push(node);
      continue;
    }
    clusters.push({ key: node.position.y, nodes: [node] });
  }
  return clusters;
}

/** Turn rows into canvas bands: height = tallest rendered node in the row + gap. */
export function buildRowBands(clusters: RowCluster[], top: number = CONTENT_TOP): RowBand[] {
  let cursor = top;
  return clusters.map((cluster) => {
    const height = cluster.nodes.reduce((max, node) => Math.max(max, estimateNodeBox(node.type, node.label).height), 0);
    const band: RowBand = { y: cursor, height, nodes: cluster.nodes };
    cursor += height + ROW_GAP;
    return band;
  });
}

/**
 * Lane width from the widest row it must hold. Lanes are sized independently:
 * a lane with one node column no longer reserves room for a parallel branch that
 * lives in a different lane.
 */
export function computeLaneWidthsFromRows(
  bands: RowBand[],
  laneIds: string[],
): Map<string, number> {
  const out = new Map<string, number>();
  for (const laneId of laneIds) {
    let widest = 0;
    for (const band of bands) {
      const owned = band.nodes.filter((node) => node.parentId === laneId);
      if (owned.length === 0) continue;
      const width = owned.reduce((sum, node) => sum + estimateNodeBox(node.type, node.label).width, 0);
      const gaps = (owned.length - 1) * MIN_NODE_CLEARANCE;
      widest = Math.max(widest, width + gaps + LANE_PADDING_X * 2);
    }
    out.set(laneId, Math.max(LANE_MIN_W, widest));
  }
  return out;
}

/** Keep the drawing's horizontal order, spread proportionally inside the lane. */
function placeRowInLane(nodes: OcrRawNode[], laneWidth: number, bandY: number): PlacedNode[] {
  const ordered = [...nodes].sort((a, b) => a.position.x - b.position.x || a.id.localeCompare(b.id));
  const boxes = ordered.map((node) => estimateNodeBox(node.type, node.label));
  const minX = Math.min(...ordered.map((node) => node.position.x));
  const maxX = Math.max(...ordered.map((node) => node.position.x));
  const travel = Math.max(0, laneWidth - LANE_PADDING_X * 2);

  // Proportional to the source x when it fits, otherwise evenly spaced: a dense
  // row must never push its last node past the lane border.
  const proportional = ordered.map((node, index) => {
    const width = boxes[index].width;
    if (ordered.length === 1) return (laneWidth - width) / 2;
    if (maxX - minX < 1) return LANE_PADDING_X + (travel * index) / (ordered.length - 1);
    return LANE_PADDING_X + ((node.position.x - minX) / (maxX - minX)) * Math.max(0, travel - width);
  });

  const totalWidth = boxes.reduce((sum, box) => sum + box.width, 0);
  const available = laneWidth - LANE_PADDING_X * 2;
  const required = totalWidth + MIN_NODE_CLEARANCE * (ordered.length - 1);

  const chain = (starts: number[]): number[] => {
    let cursor = LANE_PADDING_X;
    return ordered.map((_, index) => {
      const x = Math.max(starts[index], cursor);
      cursor = x + boxes[index].width + MIN_NODE_CLEARANCE;
      return x;
    });
  };

  const evenlySpaced = (): number[] => {
    const gap = ordered.length > 1 ? (available - totalWidth) / (ordered.length - 1) : 0;
    return ordered.map((_, index) => {
      const before = boxes.slice(0, index).reduce((sum, box) => sum + box.width, 0);
      return LANE_PADDING_X + before + gap * index;
    });
  };

  let xs = chain(proportional);
  const lastRight = xs[xs.length - 1] + boxes[boxes.length - 1].width;
  // The clearance pass can push the tail past the border even when the row fits;
  // fall back to an even distribution, which always fits by construction.
  if (lastRight > laneWidth - LANE_PADDING_X + 0.5 && required <= available) {
    xs = chain(evenlySpaced());
  }

  return ordered.map((node, index) => {
    const box = boxes[index];
    const maxX2 = Math.max(LANE_PADDING_X, laneWidth - LANE_PADDING_X - box.width);
    return {
      id: node.id,
      type: node.type,
      label: node.label,
      parentId: node.parentId ?? '',
      department: node.department,
      function: node.function,
      width: box.width,
      height: box.height,
      x: Math.round(Math.min(Math.max(LANE_PADDING_X, xs[index]), maxX2)),
      y: Math.round(bandY),
    };
  });
}

export function placeNodesInLanes(
  bands: RowBand[],
  laneWidths: Map<string, number>,
): Map<string, PlacedNode[]> {
  const out = new Map<string, PlacedNode[]>();
  for (const laneId of laneWidths.keys()) out.set(laneId, []);

  for (const band of bands) {
    const byLane = new Map<string, OcrRawNode[]>();
    for (const node of band.nodes) {
      const laneId = node.parentId;
      if (!laneId || !laneWidths.has(laneId)) continue;
      const bucket = byLane.get(laneId);
      if (bucket) bucket.push(node);
      else byLane.set(laneId, [node]);
    }

    for (const [laneId, nodes] of byLane) {
      const width = laneWidths.get(laneId) ?? LANE_MIN_W;
      const placed = placeRowInLane(nodes, width, band.y);
      const bucket = out.get(laneId);
      if (bucket) bucket.push(...placed);
    }
  }
  return out;
}

/**
 * Gate for the fallback engine: coordinates are only trusted when most nodes
 * carry distinct values, the drawing actually uses vertical space, and at least
 * two rows can be formed.
 */
export function hasUsableGeometry(nodes: OcrRawNode[]): boolean {
  const ys = nodes.map((node) => node.position.y).filter((y) => Number.isFinite(y));
  if (ys.length < 3) return false;

  const distinct = new Set(ys.map((y) => Math.round(y)));
  if (distinct.size / ys.length < 0.5) return false;

  const sorted = [...ys].sort((a, b) => a - b);
  const span = sorted[sorted.length - 1] - sorted[0];
  if (span <= 0) return false;

  const quantile = (p: number): number => {
    const index = (sorted.length - 1) * p;
    const low = Math.floor(index);
    const high = Math.ceil(index);
    return sorted[low] + (sorted[high] - sorted[low]) * (index - low);
  };
  const iqr = quantile(0.75) - quantile(0.25);

  return iqr >= span * 0.15 && clusterRows(nodes).length >= 2;
}

/** Lane height from the deepest placed node plus footer padding. */
export function contentLaneHeight(maxBottom: number): number {
  return Math.max(LANE_MIN_H, Math.round(maxBottom + LANE_FOOTER));
}

/**
 * Coordinate engine: one shared row per source row, lanes sized from their own
 * content, then a de-overlap sweep per lane. Lane height is uniform so the
 * canvas keeps a clean band, but it follows the deepest node instead of the
 * historical fixed 1000px.
 */
export function layoutCoordinateLanes(nodes: OcrRawNode[], laneIds: string[]): EngineResult {
  const bands = buildRowBands(clusterRows(nodes));
  const widths = computeLaneWidthsFromRows(bands, laneIds);
  const placedByLane = placeNodesInLanes(bands, widths);

  let height = LANE_MIN_H;
  const lanes = laneIds.map((laneId) => {
    const { boxes, maxBottom } = deoverlapLane(placedByLane.get(laneId) ?? []);
    height = Math.max(height, contentLaneHeight(maxBottom));
    return { laneId, width: widths.get(laneId) ?? LANE_MIN_W, nodes: boxes };
  });

  return { lanes: lanes.map((lane) => ({ ...lane, height })) };
}
