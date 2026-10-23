// ocr-layout-audit.ts — geometry audit oracle for OCR layout results.
//
// This module is a test oracle, not product code: it has no production caller.
// `src/test/` replays captured model responses through it and `src/utils/__tests__/`
// proves the rules themselves can fail (overlap, lane escape, lane height,
// source order, invented upward edges). Keeping the verdict logic pure means one
// rule set covers a hand-written fixture, a captured response, and the opt-in
// live PDF probe.

import { boxesOverlap, type PlacedBox } from './ocr-layout-deoverlap';
import { contentLaneHeight } from './ocr-layout-rows';
import { computeLandingViewport } from './ocr-landing-viewport';
import type { OcrLayoutNode, OcrLayoutResult } from './ocr-layout';
import type { OcrRawNode } from './ocr-validate';

/** Canvas-space box of one shape; identical shape to the de-overlap `PlacedBox`. */
export type AuditBox = PlacedBox;

export interface LayoutAuditStats {
  laneCount: number;
  shapeCount: number;
  bbox: { minX: number; minY: number; width: number; height: number };
  /** Zoom `fitView` would pick for the given viewport (unreadable on big sheets). */
  fitZoom: number;
  /** Zoom the import actually lands at. */
  landingZoom: number;
  upwardEdgeIds: string[];
}

export interface LayoutAudit {
  ok: boolean;
  violations: string[];
  stats: LayoutAuditStats;
}

const DEFAULT_VIEWPORT = { width: 1440, height: 900 };
const EPSILON = 1;

function laneMap(layout: OcrLayoutResult): Map<string, OcrLayoutNode> {
  return new Map(layout.nodes.filter((node) => node.type === 'swimlane').map((node) => [node.id, node]));
}

/** Absolute canvas boxes for every shape (lane children offset by their lane). */
export function absoluteBoxes(layout: OcrLayoutResult): AuditBox[] {
  const lanes = laneMap(layout);
  return layout.nodes
    .filter((node) => node.type !== 'swimlane')
    .map((node) => {
      const lane = node.parentId ? lanes.get(node.parentId) : undefined;
      return {
        id: node.id,
        x: (lane?.position.x ?? 0) + node.position.x,
        y: (lane?.position.y ?? 0) + node.position.y,
        width: node.width,
        height: node.height,
      };
    });
}

/** Edges whose target starts above its source on the canvas (legit for some drawings). */
export function upwardEdgeIds(layout: OcrLayoutResult): string[] {
  const boxes = new Map(absoluteBoxes(layout).map((box) => [box.id, box]));
  return layout.edges
    .filter((edge) => {
      const source = boxes.get(edge.source);
      const target = boxes.get(edge.target);
      return source !== undefined && target !== undefined && target.y < source.y;
    })
    .map((edge) => edge.id);
}

/**
 * Edges the layout turned upward although the source had them running downward.
 * A drawing may legitimately contain upward connectors (real hand-offs / loops);
 * the invariant is that the layout must not invent new ones.
 */
export function auditUpwardDrift(source: OcrRawNode[], layout: OcrLayoutResult): string[] {
  // First occurrence wins, matching the layout's duplicate-id rule.
  const sourceById = new Map<string, OcrRawNode>();
  for (const node of source) {
    if (!sourceById.has(node.id)) sourceById.set(node.id, node);
  }
  const upwardInSource = new Set(
    layout.edges
      .filter((edge) => {
        const from = sourceById.get(edge.source);
        const to = sourceById.get(edge.target);
        return from !== undefined && to !== undefined && to.position.y < from.position.y;
      })
      .map((edge) => edge.id),
  );
  return upwardEdgeIds(layout).filter((edgeId) => !upwardInSource.has(edgeId));
}

function overlaps(boxes: AuditBox[]): string[] {
  const violations: string[] = [];
  for (let i = 0; i < boxes.length; i += 1) {
    for (let j = i + 1; j < boxes.length; j += 1) {
      if (boxesOverlap(boxes[i], boxes[j])) {
        violations.push(`overlap: ${boxes[i].id} x ${boxes[j].id}`);
      }
    }
  }
  return violations;
}

function containment(boxes: AuditBox[], layout: OcrLayoutResult): string[] {
  const lanes = laneMap(layout);
  const violations: string[] = [];
  for (const node of layout.nodes) {
    if (node.type === 'swimlane' || !node.parentId) continue;
    const lane = lanes.get(node.parentId);
    const box = boxes.find((candidate) => candidate.id === node.id);
    if (!lane || !box) {
      violations.push(`orphan: ${node.id} (no lane ${node.parentId})`);
      continue;
    }
    const right = lane.position.x + lane.width + EPSILON;
    const bottom = lane.position.y + lane.height + EPSILON;
    if (box.x < lane.position.x - EPSILON || box.x + box.width > right || box.y < lane.position.y || box.y + box.height > bottom) {
      violations.push(`outside lane: ${node.id}`);
    }
  }
  return violations;
}

function laneHeights(layout: OcrLayoutResult): string[] {
  const violations: string[] = [];
  const lanes = layout.nodes.filter((node) => node.type === 'swimlane');
  // The engine sizes every lane to the deepest *lane child* so the canvas keeps
  // one clean band (uniform height contract). Shapes outside lanes keep their own
  // block (above or below) and never inflate this expectation.
  const bottom = layout.nodes
    .filter((node) => node.type !== 'swimlane' && node.parentId)
    .reduce((max, node) => Math.max(max, node.position.y + node.height), 0);
  // Same helper the engine uses, so the audit cannot silently agree with a
  // changed lane-height rule.
  const expected = contentLaneHeight(bottom);

  for (const lane of lanes) {
    if (Math.abs(lane.height - expected) > EPSILON) {
      violations.push(`lane height: ${lane.id} is ${lane.height}, deepest content + footer is ${expected}`);
    }
  }
  return violations;
}

export function auditOcrLayout(
  layout: OcrLayoutResult,
  viewport: { width: number; height: number } = DEFAULT_VIEWPORT,
): LayoutAudit {
  const boxes = absoluteBoxes(layout);
  const violations = [...overlaps(boxes), ...containment(boxes, layout), ...laneHeights(layout)];

  const lanes = layout.nodes.filter((node) => node.type === 'swimlane');
  const minX = Math.min(0, ...lanes.map((lane) => lane.position.x));
  const minY = Math.min(0, ...lanes.map((lane) => lane.position.y));
  const maxX = Math.max(0, ...lanes.map((lane) => lane.position.x + lane.width));
  const maxY = Math.max(0, ...lanes.map((lane) => lane.position.y + lane.height));
  const width = Math.max(1, maxX - minX);
  const height = Math.max(1, maxY - minY);
  const fitZoom = Math.min(1, viewport.width / width, viewport.height / height);

  return {
    ok: violations.length === 0,
    violations,
    stats: {
      laneCount: lanes.length,
      shapeCount: boxes.length,
      bbox: { minX, minY, width, height },
      fitZoom: Number(fitZoom.toFixed(3)),
      landingZoom: computeLandingViewport({ minX, minY }).zoom,
      upwardEdgeIds: upwardEdgeIds(layout),
    },
  };
}

/**
 * The contract that keeps the drawing recognisable: inside each lane, the canvas
 * top-to-bottom order must match the order the nodes had in the source drawing.
 */
export function auditSourceOrder(source: OcrRawNode[], layout: OcrLayoutResult): string[] {
  const violations: string[] = [];
  const sourceById = new Map(source.map((node) => [node.id, node]));
  const laneIds = new Set(layout.nodes.filter((node) => node.type === 'swimlane').map((node) => node.id));

  for (const laneId of laneIds) {
    const placed = layout.nodes.filter((node) => node.parentId === laneId);
    const ordered = placed
      .map((node) => ({ node, sourceY: sourceById.get(node.id)?.position.y }))
      .filter((entry): entry is { node: OcrLayoutNode; sourceY: number } => entry.sourceY !== undefined)
      .sort((a, b) => a.sourceY - b.sourceY);

    for (let i = 0; i < ordered.length - 1; i += 1) {
      if (ordered[i + 1].node.position.y < ordered[i].node.position.y) {
        violations.push(`order: ${ordered[i + 1].node.id} sits above ${ordered[i].node.id} in ${laneId}`);
      }
    }
  }

  // Shapes outside any lane (flow chart + sign-off table sheets) keep their
  // source top-to-bottom order and stay on the side of the lanes the source had
  // them on, instead of always being pinned below the lane block.
  const laneNodes = layout.nodes.filter((node) => node.type === 'swimlane');
  const loose = layout.nodes
    .filter((node) => node.type !== 'swimlane' && !node.parentId)
    .map((node) => ({ node, sourceY: sourceById.get(node.id)?.position.y }))
    .filter((entry): entry is { node: OcrLayoutNode; sourceY: number } => entry.sourceY !== undefined)
    .sort((a, b) => a.sourceY - b.sourceY);

  for (let i = 0; i < loose.length - 1; i += 1) {
    const first = loose[i].node;
    // Clearance is enforced per column, so only shapes that share a column are
    // guaranteed to keep their source order; side branches shift horizontally.
    for (let j = i + 1; j < loose.length; j += 1) {
      const second = loose[j].node;
      const sharesColumn =
        first.position.x < second.position.x + second.width && second.position.x < first.position.x + first.width;
      if (sharesColumn && second.position.y < first.position.y) {
        violations.push(`order: ${second.id} sits above ${first.id} outside lanes`);
      }
    }
  }

  if (loose.length > 0 && laneNodes.length > 0) {
    const laneSourceY = Math.min(...laneNodes.map((lane) => sourceById.get(lane.id)?.position.y ?? Number.POSITIVE_INFINITY));
    const looseSourceY = Math.min(...loose.map((entry) => entry.sourceY));
    const looseBottom = Math.max(...loose.map((entry) => entry.node.position.y + entry.node.height));
    const laneTop = Math.min(...laneNodes.map((lane) => lane.position.y));
    const laneBottom = Math.max(...laneNodes.map((lane) => lane.position.y + lane.height));

    if (looseSourceY < laneSourceY && looseBottom > laneTop + 1) {
      violations.push('block order: loose shapes sit above the lanes in the source but below them on the canvas');
    }
    if (looseSourceY > laneSourceY && Math.min(...loose.map((entry) => entry.node.position.y)) < laneBottom - 1) {
      violations.push('block order: loose shapes sit below the lanes in the source but above them on the canvas');
    }
  }

  return violations;
}
