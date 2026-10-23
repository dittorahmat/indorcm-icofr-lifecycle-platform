// ocr-layout-deoverlap.ts — deterministic overlap sweep for OCR layout (pure TS).
//
// Placement already reserves room from estimated boxes; this sweep is the safety
// net for the cases the estimate cannot see (a label much wider than its column,
// several siblings forced into one row). No randomness and no unbounded loops:
// the same input always yields the same canvas.

export interface PlacedBox {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

/** Minimum gap between two node boxes, used both horizontally and vertically. */
export const MIN_NODE_CLEARANCE = 40;

const EPSILON = 0.5;

function horizontallyOverlapping(a: PlacedBox, b: PlacedBox): boolean {
  return a.x < b.x + b.width && b.x < a.x + a.width;
}

/** Spread boxes that share a row so consecutive boxes keep the clearance gap. */
function spreadRow(boxes: PlacedBox[]): PlacedBox[] {
  const byRow = new Map<number, PlacedBox[]>();
  for (const box of boxes) {
    const key = Math.round(box.y);
    const row = byRow.get(key);
    if (row) row.push(box);
    else byRow.set(key, [box]);
  }

  const out = new Map<string, PlacedBox>();
  for (const row of byRow.values()) {
    row.sort((a, b) => a.x - b.x || a.id.localeCompare(b.id));
    let cursor = Number.NEGATIVE_INFINITY;
    for (const box of row) {
      const x = Math.max(box.x, cursor + MIN_NODE_CLEARANCE);
      out.set(box.id, x === box.x ? box : { ...box, x });
      cursor = x + box.width;
    }
  }

  return boxes.map((box) => out.get(box.id) ?? box);
}

/** Push boxes down until no two horizontally-overlapping boxes sit too close. */
function spreadColumn(boxes: PlacedBox[]): PlacedBox[] {
  const ordered = [...boxes].sort((a, b) => a.y - b.y || a.x - b.x);
  const placed: PlacedBox[] = [];
  const moved = new Map<string, PlacedBox>();

  for (const box of ordered) {
    let candidate = { ...box };
    // Each pass can only push down over previously placed boxes; the loop is
    // bounded by their count, so the sweep always terminates. The predicate is
    // the exported one, so the sweep and `countOverlaps` cannot disagree.
    for (let guard = 0; guard <= placed.length; guard += 1) {
      const collision = placed.find((other) => boxesOverlap(candidate, other));
      if (!collision) break;
      candidate = { ...candidate, y: collision.y + collision.height + MIN_NODE_CLEARANCE };
    }
    placed.push(candidate);
    moved.set(box.id, candidate.y === box.y ? box : candidate);
  }

  return boxes.map((box) => moved.get(box.id) ?? box);
}

/**
 * Resolve overlaps inside one lane. Returns boxes in their original order plus
 * the lowest occupied edge so the caller can size the lane from content.
 */
export function deoverlapLane<T extends PlacedBox>(boxes: T[]): { boxes: T[]; maxBottom: number } {
  const spread = spreadColumn(spreadRow(boxes));
  const byId = new Map(spread.map((box) => [box.id, box]));
  const resolved = boxes.map((box) => {
    const next = byId.get(box.id);
    return next ? ({ ...box, x: next.x, y: next.y } as T) : box;
  });

  const maxBottom = resolved.reduce((max, box) => Math.max(max, box.y + box.height), 0);
  return { boxes: resolved, maxBottom };
}

/** True when two boxes violate the clearance contract (used by tests and guards). */
export function boxesOverlap(a: PlacedBox, b: PlacedBox): boolean {
  return (
    horizontallyOverlapping(a, b) &&
    a.y < b.y + b.height + MIN_NODE_CLEARANCE - EPSILON &&
    b.y < a.y + a.height + MIN_NODE_CLEARANCE - EPSILON
  );
}

export function countOverlaps(boxes: PlacedBox[]): number {
  let count = 0;
  for (let i = 0; i < boxes.length; i += 1) {
    for (let j = i + 1; j < boxes.length; j += 1) {
      if (boxesOverlap(boxes[i], boxes[j])) count += 1;
    }
  }
  return count;
}
