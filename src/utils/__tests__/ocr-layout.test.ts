import { describe, it, expect } from 'vitest';
import { layoutOcrDiagram, validateOcrResponse, type OcrRawNode, type OcrRawEdge } from '../ocr-layout';
import { auditOcrLayout, auditSourceOrder, auditUpwardDrift } from '../ocr-layout-audit';
import { countOverlaps } from '../ocr-layout-deoverlap';
import {
  buildKurSourceFixture,
  KUR_LANE_ORDER,
  KUR_UPWARD_EDGE_IDS,
} from '../../test/fixtures/bpm-kur-source';

function absoluteRect(
  node: { id: string; position: { x: number; y: number }; width: number; height: number; parentId?: string },
  laneMap: Map<string, { x: number; y: number; width: number; height: number }>,
) {
  if (node.parentId && laneMap.has(node.parentId)) {
    const p = laneMap.get(node.parentId)!;
    return { id: node.id, x: p.x + node.position.x, y: p.y + node.position.y, w: node.width, h: node.height };
  }
  return { id: node.id, x: node.position.x, y: node.position.y, w: node.width, h: node.height };
}

function rectsOverlap(a: { x: number; y: number; w: number; h: number }, b: { x: number; y: number; w: number; h: number }): boolean {
  return !(a.x + a.w <= b.x || b.x + b.w <= a.x || a.y + a.h <= b.y || b.y + b.h <= a.y);
}

describe('ocr-layout — KUR drawing (image-derived fixture)', () => {
  it('reproduces the drawing: lane order, per-lane order, exact upward set, zero overlaps', () => {
    const fixture = buildKurSourceFixture();
    const result = layoutOcrDiagram(fixture);

    // lane order comes from the source x coordinates, not the input order
    const lanes = result.nodes.filter((node) => node.type === 'swimlane');
    expect(lanes.map((lane) => lane.id)).toEqual([...KUR_LANE_ORDER]);

    // geometry audit: no overlap/clearance break, children inside lanes,
    // lane height == content + footer
    const audit = auditOcrLayout(result);
    expect(audit.violations).toEqual([]);
    expect(audit.ok).toBe(true);
    expect(audit.stats.laneCount).toBe(4);
    expect(audit.stats.shapeCount).toBe(14);

    // the source's top-to-bottom order survives in every lane
    expect(auditSourceOrder(fixture.nodes, result)).toEqual([]);

    // exactly the two real forward handoffs climb a lane; nothing else is inverted
    expect(audit.stats.upwardEdgeIds.sort()).toEqual([...KUR_UPWARD_EDGE_IDS].sort());
    // the layout may keep a source upward edge, but must never invent one
    expect(auditUpwardDrift(fixture.nodes, result)).toEqual([]);

    // uniform lane height, sized from the deepest content + footer
    const heights = lanes.map((lane) => lane.height);
    expect(new Set(heights).size).toBe(1);
    const deepest = Math.max(
      ...result.nodes.filter((node) => node.type !== 'swimlane').map((node) => node.position.y + node.height),
    );
    expect(heights[0]).toBe(Math.round(deepest + 80));
    for (const lane of lanes) expect(lane.width).toBeGreaterThanOrEqual(400);

    // shapes do not overlap each other (lane containment allowed)
    const laneMap = new Map(lanes.map((l) => [l.id, { x: l.position.x, y: l.position.y, width: l.width, height: l.height }] as const));
    const shapes = result.nodes.filter((node) => node.type !== 'swimlane');
    const rects = shapes.map((shape) => absoluteRect(shape, laneMap));
    for (let i = 0; i < rects.length; i++) {
      for (let j = i + 1; j < rects.length; j++) {
        expect(rectsOverlap(rects[i], rects[j]), `Nodes ${rects[i].id} and ${rects[j].id} overlap`).toBe(false);
      }
    }
    expect(countOverlaps(rects.map((r) => ({ id: r.id, x: r.x, y: r.y, width: r.w, height: r.h })))).toBe(0);

    // the drawing's decision labels survive extraction
    expect(result.edges.filter((edge) => edge.label === 'YES')).toHaveLength(2);
    expect(result.edges.filter((edge) => edge.label === 'NO')).toHaveLength(2);

    // wrapped label reserves its real height
    expect(result.nodes.find((node) => node.id === 'k-deliberate')?.height).toBeGreaterThanOrEqual(90);
  });

  it('lands at a readable zoom instead of fitting the whole sheet', () => {
    const audit = auditOcrLayout(layoutOcrDiagram(buildKurSourceFixture()));

    expect(audit.stats.fitZoom).toBeLessThan(1);
    expect(audit.stats.landingZoom).toBeGreaterThanOrEqual(0.7);
  });

  it('drops orphan edges and returns orphan-edge warnings', () => {
    const raw: { nodes: OcrRawNode[]; edges: OcrRawEdge[] } = {
      nodes: [{ id: 'a', type: 'activity', label: 'A', position: { x: 0, y: 0 } }],
      edges: [
        { id: 'e-ok', source: 'a', target: 'a' },
        { id: 'e-orphan-1', source: 'a', target: 'ghost' },
        { id: 'e-orphan-2', source: 'nope', target: 'a' },
      ],
    };
    const warnings = validateOcrResponse(raw);
    expect(warnings.filter((w) => w.code === 'orphan-edge')).toHaveLength(2);

    const laid = layoutOcrDiagram(raw);
    expect(laid.edges.map((e) => e.id)).toEqual(['e-ok']);
    expect(laid.warnings.some((w) => w.code === 'orphan-edge' && w.edgeId === 'e-orphan-1')).toBe(true);
    expect(laid.warnings.some((w) => w.code === 'orphan-edge' && w.edgeId === 'e-orphan-2')).toBe(true);
  });

  it('keeps one node per id and warns about duplicate ids', () => {
    const raw: { nodes: OcrRawNode[]; edges: OcrRawEdge[] } = {
      nodes: [
        { id: 'lane-a', type: 'swimlane', label: 'A', position: { x: 0, y: 0 }, department: 'A', function: 'F' },
        { id: 'dup', type: 'activity', label: 'First', position: { x: 10, y: 100 }, parentId: 'lane-a' },
        { id: 'dup', type: 'activity', label: 'Second', position: { x: 10, y: 400 }, parentId: 'lane-a' },
      ],
      edges: [],
    };

    expect(validateOcrResponse(raw).filter((w) => w.code === 'duplicate-id')).toHaveLength(1);

    const laid = layoutOcrDiagram(raw);
    expect(laid.nodes.filter((node) => node.id === 'dup')).toHaveLength(1);
    expect(laid.nodes.find((node) => node.id === 'dup')?.label).toBe('First');
    expect(laid.warnings.some((w) => w.code === 'duplicate-id' && w.nodeId === 'dup')).toBe(true);
  });

  it('flags unlabeled nodes', () => {
    const raw: { nodes: OcrRawNode[]; edges: OcrRawEdge[] } = {
      nodes: [
        { id: 'n1', type: 'activity', label: 'OK', position: { x: 0, y: 0 } },
        { id: 'n2', type: 'activity', label: '', position: { x: 10, y: 10 } },
        { id: 'n3', type: 'activity', label: '   ', position: { x: 20, y: 20 } },
      ],
      edges: [],
    };
    const warnings = validateOcrResponse(raw);
    const unlabeled = warnings.filter((w) => w.code === 'unlabeled-node');
    expect(unlabeled.map((w) => w.nodeId).sort()).toEqual(['n2', 'n3']);

    const laid = layoutOcrDiagram(raw);
    expect(laid.warnings.filter((w) => w.code === 'unlabeled-node')).toHaveLength(2);
  });

  it('falls back to the rank layout for degenerate coordinates', () => {
    const raw: { nodes: OcrRawNode[]; edges: OcrRawEdge[] } = {
      nodes: [
        { id: 'lane-a', type: 'swimlane', label: 'A', position: { x: 0, y: 0 } },
        { id: 'lane-b', type: 'swimlane', label: 'B', position: { x: 500, y: 0 } },
        { id: 'n1', type: 'activity', label: 'Satu', position: { x: 10, y: 0 }, parentId: 'lane-a' },
        { id: 'n2', type: 'activity', label: 'Dua', position: { x: 15, y: 0 }, parentId: 'lane-a' },
        { id: 'n3', type: 'activity', label: 'Tiga', position: { x: 510, y: 0 }, parentId: 'lane-b' },
      ],
      edges: [
        { id: 'e1', source: 'n1', target: 'n2' },
        { id: 'e2', source: 'n2', target: 'n3' },
      ],
    };

    const laid = layoutOcrDiagram(raw);
    const lane = laid.nodes.find((n) => n.id === 'lane-a')!;
    // The fallback still sizes the band from its own content: no empty 1000px
    // band below a three-node stack.
    const deepest = Math.max(
      ...laid.nodes.filter((n) => n.parentId === 'lane-a').map((n) => n.position.y + n.height),
    );
    expect(lane.height).toBe(Math.max(300, Math.round(deepest + 80)));
    const childYs = new Set(laid.nodes.filter((n) => n.parentId === 'lane-a').map((n) => n.position.y));
    expect(childYs.size).toBe(2);
  });

  it('clamps lane dims: warns missing-dims and expands to at least 400x300 in rank mode', () => {
    const raw: { nodes: OcrRawNode[]; edges: OcrRawEdge[] } = {
      nodes: [
        { id: 'lane-small', type: 'swimlane', label: 'SMALL', position: { x: 0, y: 0 }, width: 180, height: 400, department: 'D', function: 'F' },
        { id: 'lane-nodims', type: 'swimlane', label: 'NODIMS', position: { x: 500, y: 0 }, department: 'D2', function: 'F2' },
        { id: 'n1', type: 'activity', label: 'A', position: { x: 10, y: 10 }, parentId: 'lane-small' },
      ],
      edges: [],
    };
    const warnings = validateOcrResponse(raw);
    expect(warnings.filter((w) => w.code === 'missing-dims').length).toBe(2);

    const laid = layoutOcrDiagram(raw);
    const lanes = laid.nodes.filter((n) => n.type === 'swimlane');
    expect(lanes).toHaveLength(2);
    for (const l of lanes) {
      expect(l.width).toBeGreaterThanOrEqual(400);
      expect(l.height).toBeGreaterThanOrEqual(300);
    }
    expect(lanes[0].height).toBe(lanes[1].height);
    expect(laid.warnings.some((w) => w.code === 'missing-dims')).toBe(true);
  });

  it('downgrades unknown-parent nodes to top-level and warns', () => {
    const raw: { nodes: OcrRawNode[]; edges: OcrRawEdge[] } = {
      nodes: [
        { id: 'lane-a', type: 'swimlane', label: 'A', position: { x: 0, y: 0 }, department: 'D', function: 'F' },
        { id: 'n1', type: 'activity', label: 'Child', position: { x: 10, y: 10 }, parentId: 'lane-a' },
        { id: 'n2', type: 'activity', label: 'OrphanParent', position: { x: 20, y: 20 }, parentId: 'no-such-lane' },
        { id: 'n3', type: 'activity', label: 'AlsoOrphan', position: { x: 30, y: 30 }, parentId: 'n1' },
      ],
      edges: [],
    };
    const warnings = validateOcrResponse(raw);
    expect(warnings.filter((w) => w.code === 'unknown-parent').length).toBe(2);

    const laid = layoutOcrDiagram(raw);
    expect(laid.warnings.filter((w) => w.code === 'unknown-parent').length).toBe(2);
    const n2 = laid.nodes.find((n) => n.id === 'n2')!;
    const n3 = laid.nodes.find((n) => n.id === 'n3')!;
    expect(n2.parentId).toBeUndefined();
    expect(n3.parentId).toBeUndefined();
    const lane = laid.nodes.find((n) => n.id === 'lane-a')!;
    expect(n2.position.y).toBeGreaterThan(lane.position.y + lane.height - 1);
  });

  it('per-lane BFS depth ignores cross-lane incoming (nodes with only cross-lane incoming are entries)', () => {
    const raw: { nodes: OcrRawNode[]; edges: OcrRawEdge[] } = {
      nodes: [
        { id: 'lane-a', type: 'swimlane', label: 'A', position: { x: 0, y: 0 }, department: 'D', function: 'F' },
        { id: 'lane-b', type: 'swimlane', label: 'B', position: { x: 500, y: 0 }, department: 'D', function: 'F' },
        { id: 'a1', type: 'activity', label: 'A1', position: { x: 10, y: 10 }, parentId: 'lane-a' },
        { id: 'b1', type: 'activity', label: 'B1', position: { x: 510, y: 10 }, parentId: 'lane-b' },
        { id: 'b2', type: 'activity', label: 'B2', position: { x: 515, y: 100 }, parentId: 'lane-b' },
      ],
      edges: [
        { id: 'e1', source: 'a1', target: 'b2' },
        { id: 'e2', source: 'b1', target: 'b2' },
      ],
    };
    const laid = layoutOcrDiagram(raw);
    const b1 = laid.nodes.find((n) => n.id === 'b1')!;
    const b2 = laid.nodes.find((n) => n.id === 'b2')!;
    expect(b1.position.y).toBeLessThan(b2.position.y);
  });

  it('top-level nodes keep the source vertical order below the lanes without overlap', () => {
    const raw: { nodes: OcrRawNode[]; edges: OcrRawEdge[] } = {
      nodes: [
        { id: 'lane-a', type: 'swimlane', label: 'A', position: { x: 0, y: 0 }, department: 'D', function: 'F' },
        { id: 't1', type: 'activity', label: 'T1', position: { x: 50, y: 300 } },
        { id: 't2', type: 'activity', label: 'T2', position: { x: 10, y: 100 } },
        { id: 't3', type: 'activity', label: 'T3', position: { x: 20, y: 100 } },
      ],
      edges: [],
    };
    const laid = layoutOcrDiagram(raw);
    const lane = laid.nodes.find((n) => n.id === 'lane-a')!;
    const t1 = laid.nodes.find((n) => n.id === 't1')!;
    const t2 = laid.nodes.find((n) => n.id === 't2')!;
    const t3 = laid.nodes.find((n) => n.id === 't3')!;
    // Same source row stays a row; the lower shape stays below.
    expect(t2.position.y).toBe(t3.position.y);
    expect(t1.position.y).toBeGreaterThan(t2.position.y);
    // All of them start below the lane block (the lane sits above them in the source).
    for (const node of [t1, t2, t3]) {
      expect(node.position.y).toBeGreaterThan(lane.position.y + lane.height - 1);
    }
    expect(
      countOverlaps(
        [t1, t2, t3].map((node) => ({
          id: node.id,
          x: node.position.x,
          y: node.position.y,
          width: node.width,
          height: node.height,
        })),
      ),
    ).toBe(0);
  });

  it('mirrors BridgeEdge dimensions: decision 110x110, archive 64x64, data-media 100x80, reference 40x40', () => {
    const raw: { nodes: OcrRawNode[]; edges: OcrRawEdge[] } = {
      nodes: [
        { id: 'lane-a', type: 'swimlane', label: 'A', position: { x: 0, y: 0 }, department: 'D', function: 'F' },
        { id: 'd', type: 'decision', label: 'D', position: { x: 10, y: 10 }, parentId: 'lane-a' },
        { id: 'ar', type: 'archive', label: 'Ar', position: { x: 10, y: 200 }, parentId: 'lane-a' },
        { id: 'dm', type: 'data-media', label: 'Dm', position: { x: 10, y: 400 }, parentId: 'lane-a' },
        { id: 'ref', type: 'reference', label: 'R', position: { x: 10, y: 500 }, parentId: 'lane-a' },
      ],
      edges: [],
    };
    const laid = layoutOcrDiagram(raw);
    expect(laid.nodes.find((n) => n.id === 'd')!).toMatchObject({ width: 110, height: 110 });
    expect(laid.nodes.find((n) => n.id === 'ar')!).toMatchObject({ width: 64, height: 64 });
    expect(laid.nodes.find((n) => n.id === 'dm')!).toMatchObject({ width: 100, height: 80 });
    expect(laid.nodes.find((n) => n.id === 'ref')!).toMatchObject({ width: 40, height: 40 });
  });

  it('auto-derives swimlane label from department or id if empty and avoids false unlabeled-node warnings', () => {
    const raw: { nodes: OcrRawNode[]; edges: OcrRawEdge[] } = {
      nodes: [
        { id: 'swimlane_debitur', type: 'swimlane', label: '', position: { x: 0, y: 0 }, department: 'DEBITUR' },
        { id: 'swimlane_kredit_admin', type: 'swimlane', label: '   ', position: { x: 400, y: 0 } },
      ],
      edges: [],
    };
    const warnings = validateOcrResponse(raw);
    expect(warnings.filter((w) => w.code === 'unlabeled-node')).toHaveLength(0);

    const laid = layoutOcrDiagram(raw);
    expect(laid.nodes.find((n) => n.id === 'swimlane_debitur')?.label).toBe('DEBITUR');
    expect(laid.nodes.find((n) => n.id === 'swimlane_debitur')?.department).toBe('DEBITUR');
    expect(laid.nodes.find((n) => n.id === 'swimlane_kredit_admin')?.label).toBe('KREDIT ADMIN');
    expect(laid.nodes.find((n) => n.id === 'swimlane_kredit_admin')?.department).toBe('KREDIT ADMIN');
  });

  it('snaps unparented nodes to closest swimlane column when established lane children exist', () => {
    const raw: { nodes: OcrRawNode[]; edges: OcrRawEdge[] } = {
      nodes: [
        { id: 'lane-nasabah', type: 'swimlane', label: 'NASABAH', position: { x: 50, y: 0 }, department: 'NASABAH' },
        { id: 'lane-penaksir', type: 'swimlane', label: 'PENAKSIR', position: { x: 300, y: 0 }, department: 'PENAKSIR' },
        { id: 'n-explicit', type: 'activity', label: 'Taksir Emas', position: { x: 310, y: 100 }, parentId: 'lane-penaksir' },
        { id: 'n-unparented', type: 'document', label: 'Formulir Rahn', position: { x: 60, y: 120 } },
      ],
      edges: [{ id: 'e1', source: 'n-unparented', target: 'n-explicit' }],
    };
    const laid = layoutOcrDiagram(raw);
    expect(laid.nodes.find((n) => n.id === 'n-unparented')?.parentId).toBe('lane-nasabah');
  });

  it('assigns horizontal right-to-left handles for cross-lane connections', () => {
    const raw: { nodes: OcrRawNode[]; edges: OcrRawEdge[] } = {
      nodes: [
        { id: 'lane-1', type: 'swimlane', label: 'LANE 1', position: { x: 0, y: 0 }, department: 'LANE 1' },
        { id: 'lane-2', type: 'swimlane', label: 'LANE 2', position: { x: 400, y: 0 }, department: 'LANE 2' },
        { id: 'n1', type: 'document', label: 'Berkas', position: { x: 100, y: 100 }, parentId: 'lane-1' },
        { id: 'n2', type: 'activity', label: 'Proses', position: { x: 500, y: 120 }, parentId: 'lane-2' },
      ],
      edges: [{ id: 'e1', source: 'n1', target: 'n2' }],
    };

    const laid = layoutOcrDiagram(raw);
    const edge = laid.edges.find((e) => e.id === 'e1');
    expect(edge?.sourceHandle).toBe('right');
    expect(edge?.targetHandle).toBe('left');
  });

  it('ensures all swimlane child nodes are placed with sufficient header clearance (Y >= 110)', () => {
    const result = layoutOcrDiagram(buildKurSourceFixture());
    const childNodes = result.nodes.filter((n) => n.parentId !== undefined && n.type !== 'swimlane');
    expect(childNodes.length).toBeGreaterThan(0);
    for (const child of childNodes) expect(child.position.y).toBeGreaterThanOrEqual(110);
  });
});

describe('ocr-layout - flow chart with a sign-off table (no real swimlanes)', () => {
  // Mirrors the captured response of BPM_Penerimaan_Setoran_Tunai: a vertical
  // flow chart in the upper half and "Disusun/Direview/Disetujui" columns in the
  // lower half, which the model reports as swimlanes without children.
  const raw = {
    nodes: [
      { id: 'node_1', type: 'activity', label: 'STAFF\nMenerima slip setoran tunai & Uang', position: { x: 457, y: 198 }, width: 218 },
      { id: 'node_2', type: 'activity', label: 'STAFF\nMenghitung Uang tunai & verifikasi data transaksi', position: { x: 395, y: 309 }, width: 320 },
      { id: 'node_3', type: 'decision', label: 'SESUAI?', position: { x: 480, y: 422 }, width: 149 },
      { id: 'node_4', type: 'activity', label: 'STAFF\nHitung Ulang', position: { x: 307, y: 529 }, width: 159 },
      { id: 'node_5', type: 'activity', label: 'STAFF\nInput Transaksi', position: { x: 538, y: 535 }, width: 159 },
      { id: 'node_6', type: 'activity', label: 'STAFF\nSimpan Uang Tunai & Cetak Mutasi', position: { x: 437, y: 634 }, width: 239 },
      { id: 'node_7', type: 'swimlane', label: 'Disusun Oleh (Lini 1)', position: { x: 184, y: 834 }, width: 329 },
      { id: 'node_8', type: 'swimlane', label: 'Direview Oleh (Lini 2)', position: { x: 514, y: 834 }, width: 328 },
      { id: 'node_9', type: 'swimlane', label: 'Disetujui Oleh (CFO)', position: { x: 842, y: 834 }, width: 158 },
    ] as OcrRawNode[],
    edges: [
      { id: 'edge_1', source: 'node_1', target: 'node_2', sourceHandle: 'bottom', targetHandle: 'top' },
      { id: 'edge_2', source: 'node_2', target: 'node_3', sourceHandle: 'bottom', targetHandle: 'top' },
    ] as OcrRawEdge[],
  };

  it('keeps the flow above the sign-off columns and does not inflate empty lanes', () => {
    const result = layoutOcrDiagram(raw);
    const lanes = result.nodes.filter((node) => node.type === 'swimlane');
    const shapes = result.nodes.filter((node) => node.type !== 'swimlane');

    expect(lanes).toHaveLength(3);
    for (const lane of lanes) expect(lane.height).toBe(300);

    const flowBottom = Math.max(...shapes.map((shape) => shape.position.y + shape.height));
    const laneTop = Math.min(...lanes.map((lane) => lane.position.y));
    expect(flowBottom).toBeLessThan(laneTop);

    const order = [...shapes].sort((a, b) => a.position.y - b.position.y).map((shape) => shape.id);
    expect(order).toEqual(['node_1', 'node_2', 'node_3', 'node_4', 'node_5', 'node_6']);
    expect(auditSourceOrder(raw.nodes, result)).toEqual([]);
    expect(auditOcrLayout(result).violations).toEqual([]);
  });

  it('keeps the sign-off columns left-to-right in source order', () => {
    const lanes = layoutOcrDiagram(raw).nodes.filter((node) => node.type === 'swimlane');
    expect(lanes.map((lane) => lane.label)).toEqual(['Disusun Oleh (Lini 1)', 'Direview Oleh (Lini 2)', 'Disetujui Oleh (CFO)']);
  });

  it('snaps unparented child nodes below top header swimlanes into their respective lanes', () => {
    // Replicates ocr2.pdf scenario: 4 top header swimlanes ("Konsumen", "Administrasi", "Bank", "Developer")
    // with no explicit parentId on process nodes below them.
    const headerDiagram = {
      nodes: [
        { id: 'lane_konsumen', type: 'swimlane', label: 'Konsumen', department: 'Konsumen', position: { x: 50, y: 30 }, width: 200, height: 50 },
        { id: 'lane_administrasi', type: 'swimlane', label: 'Administrasi', department: 'Administrasi', position: { x: 300, y: 30 }, width: 200, height: 50 },
        { id: 'lane_bank', type: 'swimlane', label: 'Bank', department: 'Bank', position: { x: 550, y: 30 }, width: 200, height: 50 },
        { id: 'lane_developer', type: 'swimlane', label: 'Developer', department: 'Developer', position: { x: 800, y: 30 }, width: 200, height: 50 },
        { id: 'start_node', type: 'start', label: 'start', position: { x: 90, y: 80 } },
        { id: 'booking_fee_1', type: 'activity', label: 'Booking Fee', position: { x: 80, y: 150 } },
        { id: 'booking_fee_2', type: 'activity', label: 'Booking Fee', position: { x: 330, y: 100 } },
        { id: 'wawancara', type: 'activity', label: 'Wawancara', position: { x: 580, y: 100 } },
        { id: 'akad_kredit', type: 'activity', label: 'Akad Kredit', position: { x: 830, y: 100 } },
      ] as OcrRawNode[],
      edges: [
        { id: 'e1', source: 'start_node', target: 'booking_fee_1' },
        { id: 'e2', source: 'booking_fee_1', target: 'booking_fee_2' },
      ] as OcrRawEdge[],
    };

    const result = layoutOcrDiagram(headerDiagram);
    const startNode = result.nodes.find((n) => n.id === 'start_node');
    const booking1 = result.nodes.find((n) => n.id === 'booking_fee_1');
    const booking2 = result.nodes.find((n) => n.id === 'booking_fee_2');
    const wawancara = result.nodes.find((n) => n.id === 'wawancara');
    const akad = result.nodes.find((n) => n.id === 'akad_kredit');

    expect(startNode?.parentId).toBe('lane_konsumen');
    expect(booking1?.parentId).toBe('lane_konsumen');
    expect(booking2?.parentId).toBe('lane_administrasi');
    expect(wawancara?.parentId).toBe('lane_bank');
    expect(akad?.parentId).toBe('lane_developer');
  });
});
