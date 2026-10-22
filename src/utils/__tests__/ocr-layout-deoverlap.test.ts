import { describe, expect, it } from 'vitest';

import { countOverlaps, deoverlapLane, MIN_NODE_CLEARANCE, type PlacedBox } from '../ocr-layout-deoverlap';

function box(id: string, x: number, y: number, width = 160, height = 56): PlacedBox {
  return { id, x, y, width, height };
}

describe('deoverlapLane', () => {
  it('pushes vertically stacked colliding boxes apart', () => {
    const { boxes, maxBottom } = deoverlapLane([box('a', 0, 0), box('b', 0, 60)]);
    const a = boxes.find((b) => b.id === 'a');
    const b = boxes.find((b) => b.id === 'b');

    expect((b?.y ?? 0) - ((a?.y ?? 0) + (a?.height ?? 0))).toBeGreaterThanOrEqual(MIN_NODE_CLEARANCE);
    expect(maxBottom).toBe(Math.max(...boxes.map((item) => item.y + item.height)));
  });

  it('spreads same-row boxes horizontally', () => {
    const { boxes } = deoverlapLane([box('a', 0, 100), box('b', 120, 100)]);
    const a = boxes.find((b) => b.id === 'a');
    const b = boxes.find((b) => b.id === 'b');

    expect((b?.x ?? 0) - ((a?.x ?? 0) + (a?.width ?? 0))).toBeGreaterThanOrEqual(MIN_NODE_CLEARANCE);
    expect(a?.y).toBe(b?.y);
  });

  it('leaves an already clean lane untouched', () => {
    const clean = [box('a', 40, 130), box('b', 40, 230), box('c', 240, 130)];
    expect(deoverlapLane(clean).boxes).toEqual(clean);
  });

  it('is idempotent and removes every overlap it reports', () => {
    const messy = [box('a', 0, 130), box('b', 0, 150), box('c', 10, 170)];
    const once = deoverlapLane(messy).boxes;
    const twice = deoverlapLane(once).boxes;

    expect(twice).toEqual(once);
    expect(countOverlaps(once)).toBe(0);
  });

  it('preserves input order so callers can map results back by id', () => {
    const input = [box('a', 0, 0), box('b', 0, 10)];
    expect(deoverlapLane(input).boxes.map((b) => b.id)).toEqual(['a', 'b']);
  });
});
