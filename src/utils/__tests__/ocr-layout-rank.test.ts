import { describe, expect, it } from 'vitest';

import { layoutRankLanes } from '../ocr-layout-rank';
import type { OcrRawEdge, OcrRawNode } from '../ocr-validate';

function run(lanes: OcrRawNode[], nodes: OcrRawNode[], edges: OcrRawEdge[] = []) {
  const childMap = new Map(lanes.map((lane) => [lane.id, [] as OcrRawNode[]]));
  for (const node of nodes) {
    if (node.parentId) childMap.get(node.parentId)?.push(node);
  }
  const result = layoutRankLanes(lanes, childMap, edges);
  return {
    result,
    laneById: new Map(result.lanes.map((lane) => [lane.laneId, lane])),
    nodeById: new Map(result.lanes.flatMap((lane) => lane.nodes.map((node) => [node.id, node] as const))),
  };
}

function lane(id: string, x: number): OcrRawNode {
  return { id, type: 'swimlane', label: id, position: { x, y: 0 }, department: id };
}

describe('layoutRankLanes (fallback engine)', () => {
  it('expands the lane for parallel branches and keeps 40px horizontal clearance', () => {
    const { laneById, nodeById } = run(
      [lane('lane-main', 0)],
      [
        { id: 'start', type: 'start', label: 'Mulai', position: { x: 50, y: 50 }, parentId: 'lane-main' },
        { id: 'branch-a', type: 'activity', label: 'Cabang A', position: { x: 30, y: 150 }, parentId: 'lane-main' },
        { id: 'branch-b', type: 'activity', label: 'Cabang B', position: { x: 150, y: 150 }, parentId: 'lane-main' },
        { id: 'end', type: 'end', label: 'Selesai', position: { x: 50, y: 250 }, parentId: 'lane-main' },
      ],
      [
        { id: 'e1', source: 'start', target: 'branch-a' },
        { id: 'e2', source: 'start', target: 'branch-b' },
        { id: 'e3', source: 'branch-a', target: 'end' },
        { id: 'e4', source: 'branch-b', target: 'end' },
      ],
    );

    expect(laneById.get('lane-main')?.width).toBeGreaterThanOrEqual(480);

    const a = nodeById.get('branch-a')!;
    const b = nodeById.get('branch-b')!;
    const [left, right] = a.x < b.x ? [a, b] : [b, a];
    expect(right.x - (left.x + left.width)).toBeGreaterThanOrEqual(40);

    const start = nodeById.get('start')!;
    expect(a.y - (start.y + start.height)).toBeGreaterThanOrEqual(50);
  });

  it('stacks unlinked document requirements sequentially', () => {
    const { nodeById } = run(
      [lane('lane-nasabah', 0)],
      [
        { id: 'doc-form', type: 'document', label: 'Formulir Permohonan', position: { x: 50, y: 120 }, parentId: 'lane-nasabah' },
        { id: 'doc-ktp', type: 'document', label: 'Fotokopi KTP', position: { x: 50, y: 220 }, parentId: 'lane-nasabah' },
        { id: 'doc-kk', type: 'document', label: 'Kartu Keluarga', position: { x: 50, y: 320 }, parentId: 'lane-nasabah' },
        { id: 'doc-sku', type: 'document', label: 'Surat Keterangan Usaha', position: { x: 50, y: 420 }, parentId: 'lane-nasabah' },
      ],
    );

    const docs = ['doc-form', 'doc-ktp', 'doc-kk', 'doc-sku'].map((id) => nodeById.get(id)!);
    for (let i = 0; i < docs.length - 1; i += 1) {
      expect(docs[i + 1].y - (docs[i].y + docs[i].height)).toBeGreaterThanOrEqual(50);
    }
  });

  it('places each lane by its own intra-lane depth, not a global staircase', () => {
    const { nodeById } = run(
      [lane('lane-a', 0), lane('lane-b', 500)],
      [
        { id: 'a1', type: 'activity', label: 'A1', position: { x: 10, y: 10 }, parentId: 'lane-a' },
        { id: 'b1', type: 'activity', label: 'B1', position: { x: 510, y: 10 }, parentId: 'lane-b' },
        { id: 'b2', type: 'activity', label: 'B2', position: { x: 515, y: 100 }, parentId: 'lane-b' },
      ],
      [
        { id: 'e1', source: 'a1', target: 'b2' },
        { id: 'e2', source: 'b1', target: 'b2' },
      ],
    );

    expect(nodeById.get('a1')?.y).toBe(nodeById.get('b1')?.y);
    expect(nodeById.get('b1')!.y).toBeLessThan(nodeById.get('b2')!.y);
  });

  it('sizes the band from content instead of the legacy 1000px minimum', () => {
    const { laneById } = run(
      [lane('lane-a', 0)],
      [{ id: 'a1', type: 'activity', label: 'A1', position: { x: 10, y: 10 }, parentId: 'lane-a' }],
    );
    const laneNode = laneById.get('lane-a');
    expect(laneNode).toBeDefined();
    expect(laneNode?.height).toBeGreaterThanOrEqual(300);
    expect(laneNode?.height).toBeLessThan(1000);
  });
});
