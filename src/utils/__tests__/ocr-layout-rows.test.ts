import { describe, expect, it } from 'vitest';

import {
  buildRowBands,
  clusterRows,
  computeLaneWidthsFromRows,
  contentLaneHeight,
  CONTENT_TOP,
  hasUsableGeometry,
  LANE_MIN_H,
  placeNodesInLanes,
  ROW_GAP,
  ROW_MERGE_TOLERANCE,
} from '../ocr-layout-rows';
import { estimateNodeBox } from '../ocr-node-box';
import type { OcrRawNode } from '../ocr-validate';

function node(id: string, type: string, label: string, x: number, y: number, parentId?: string): OcrRawNode {
  return { id, type, label, position: { x, y }, parentId };
}

const APPROVAL = 'MEMBUAT PERTIMBANGAN DAN PERSETUJUAN';

describe('clusterRows', () => {
  it('merges nodes from different lanes that share a source row', () => {
    const clusters = clusterRows([node('a', 'activity', 'Terima', 0, 100, 'lane-a'), node('b', 'activity', 'Verifikasi', 500, 120, 'lane-b')]);

    expect(clusters).toHaveLength(1);
    expect(clusters[0].nodes.map((n) => n.id)).toEqual(['a', 'b']);
  });

  it('keeps rows separate once the gap exceeds the tolerance', () => {
    const clusters = clusterRows([
      node('a', 'activity', 'Terima', 0, 100, 'lane-a'),
      node('b', 'activity', 'Verifikasi', 0, 100 + ROW_MERGE_TOLERANCE + 1, 'lane-a'),
    ]);

    expect(clusters).toHaveLength(2);
  });

  it('orders rows by source y regardless of input order', () => {
    const clusters = clusterRows([
      node('low', 'activity', 'Setuju', 0, 600, 'lane-a'),
      node('high', 'activity', 'Terima', 0, 100, 'lane-a'),
    ]);

    expect(clusters.map((cluster) => cluster.nodes[0].id)).toEqual(['high', 'low']);
  });
});

describe('buildRowBands', () => {
  it('starts below the lane header and reserves the tallest rendered node plus the gap', () => {
    const bands = buildRowBands(
      clusterRows([
        node('a', 'activity', 'Terima', 0, 100, 'lane-a'),
        node('b', 'activity', APPROVAL, 0, 600, 'lane-a'),
      ]),
    );

    expect(bands[0].y).toBe(CONTENT_TOP);
    expect(bands[1].y).toBe(bands[0].y + bands[0].height + ROW_GAP);
    expect(bands[1].height).toBe(estimateNodeBox('activity', APPROVAL).height);
  });
});

describe('computeLaneWidthsFromRows', () => {
  it('widens only the lane that holds parallel nodes in one row', () => {
    const nodes = [
      node('a1', 'activity', 'Terima', 0, 100, 'lane-a'),
      node('a2', 'activity', 'Periksa', 300, 100, 'lane-a'),
      node('b1', 'activity', 'Setuju', 600, 100, 'lane-b'),
    ];
    const widths = computeLaneWidthsFromRows(buildRowBands(clusterRows(nodes)), ['lane-a', 'lane-b']);

    expect(widths.get('lane-a')).toBeGreaterThan(widths.get('lane-b') ?? 0);
    expect(widths.get('lane-b')).toBe(400);
  });
});

describe('placeNodesInLanes', () => {
  it('puts cross-lane row peers on the same canvas row', () => {
    const nodes = [node('a', 'activity', 'Terima', 0, 100, 'lane-a'), node('b', 'activity', 'Verifikasi', 500, 110, 'lane-b')];
    const bands = buildRowBands(clusterRows(nodes));
    const widths = new Map([
      ['lane-a', 400],
      ['lane-b', 400],
    ]);
    const placed = placeNodesInLanes(bands, widths);

    expect(placed.get('lane-a')?.[0].y).toBe(placed.get('lane-b')?.[0].y);
  });

  it('centres a lone node in its lane', () => {
    const nodes = [node('a', 'activity', 'Terima', 0, 100, 'lane-a')];
    const placed = placeNodesInLanes(buildRowBands(clusterRows(nodes)), new Map([['lane-a', 400]]));
    const box = placed.get('lane-a')?.[0];

    expect(box?.x).toBe(Math.round((400 - (box?.width ?? 0)) / 2));
  });

  it('keeps a dense row inside the lane with 40px clearance', () => {
    const nodes = Array.from({ length: 6 }, (_, index) =>
      node(`n${index}`, 'activity', `Aktivitas ${index}`, 100 + index, 100, 'lane-a'),
    );
    const bands = buildRowBands(clusterRows(nodes));
    const widths = computeLaneWidthsFromRows(bands, ['lane-a']);
    const placed = placeNodesInLanes(bands, widths).get('lane-a') ?? [];
    const laneWidth = widths.get('lane-a') ?? 0;

    const ordered = [...placed].sort((a, b) => a.x - b.x);
    for (let i = 0; i < ordered.length - 1; i += 1) {
      expect(ordered[i + 1].x - (ordered[i].x + ordered[i].width)).toBeGreaterThanOrEqual(40);
    }
    for (const box of ordered) {
      expect(box.x).toBeGreaterThanOrEqual(0);
      expect(box.x + box.width).toBeLessThanOrEqual(laneWidth);
    }
  });

  it('keeps source left-to-right order inside a row', () => {
    const nodes = [node('right', 'activity', 'B', 800, 100, 'lane-a'), node('left', 'activity', 'A', 200, 100, 'lane-a')];
    const placed = placeNodesInLanes(buildRowBands(clusterRows(nodes)), new Map([['lane-a', 400]]));
    const boxes = placed.get('lane-a') ?? [];

    expect(boxes.find((b) => b.id === 'left')?.x).toBeLessThan(boxes.find((b) => b.id === 'right')?.x ?? 0);
  });
});

describe('hasUsableGeometry', () => {
  it('rejects a degenerate response where every node shares one y', () => {
    const nodes = [node('a', 'activity', 'A', 0, 0, 'lane-a'), node('b', 'activity', 'B', 0, 0, 'lane-b'), node('c', 'activity', 'C', 0, 0, 'lane-c')];
    expect(hasUsableGeometry(nodes)).toBe(false);
  });

  it('accepts a drawing that spreads nodes over the page', () => {
    const nodes = [
      node('a', 'activity', 'A', 0, 80, 'lane-a'),
      node('b', 'activity', 'B', 0, 300, 'lane-a'),
      node('c', 'activity', 'C', 0, 520, 'lane-b'),
      node('d', 'activity', 'D', 0, 760, 'lane-b'),
    ];
    expect(hasUsableGeometry(nodes)).toBe(true);
  });

  it('rejects fewer than three nodes (no geometry to trust)', () => {
    expect(hasUsableGeometry([node('a', 'activity', 'A', 0, 0, 'lane-a')])).toBe(false);
  });
});

describe('contentLaneHeight', () => {
  it('follows content instead of the fixed 1000px band', () => {
    expect(contentLaneHeight(686 + 56)).toBe(686 + 56 + 80);
    expect(contentLaneHeight(10)).toBe(LANE_MIN_H);
  });
});
