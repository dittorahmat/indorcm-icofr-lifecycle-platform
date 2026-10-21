import { describe, it, expect } from 'vitest';
import { layoutOcrDiagram, validateOcrResponse, type OcrRawNode, type OcrRawEdge } from '../utils/ocr-layout';

// KUR-like fixture: 4 vertical swimlanes DEBITUR, MARKETING, KREDIT ADMIN, PEJABAT BERWENANG
function buildKurFixture(): { nodes: OcrRawNode[]; edges: OcrRawEdge[] } {
  const lanes: OcrRawNode[] = [
    { id: 'lane-debitur', type: 'swimlane', label: 'DEBITUR', position: { x: 10, y: 0 }, width: 180, height: 600, department: 'DEBITUR', function: 'Nasabah' },
    { id: 'lane-marketing', type: 'swimlane', label: 'MARKETING', position: { x: 350, y: 0 }, department: 'MARKETING', function: 'Sales' },
    { id: 'lane-kredit', type: 'swimlane', label: 'KREDIT ADMIN', position: { x: 700, y: 0 }, width: 500, height: 900, department: 'KREDIT ADMIN', function: 'Admin' },
    { id: 'lane-pejabat', type: 'swimlane', label: 'PEJABAT BERWENANG', position: { x: 1100, y: 0 }, department: 'PEJABAT BERWENANG', function: 'Approval' },
  ];

  // shuffle lanes in input to test ordering by median x
  const shuffledLanes = [lanes[3], lanes[1], lanes[0], lanes[2]];

  const nodes: OcrRawNode[] = [
    // DEBITUR lane: 3 nodes
    { id: 'n1', type: 'start', label: 'Mulai', position: { x: 50, y: 100 }, parentId: 'lane-debitur' },
    { id: 'n2', type: 'activity', label: 'Ajukan Kredit', position: { x: 55, y: 220 }, parentId: 'lane-debitur' },
    { id: 'n3', type: 'document', label: 'Form KUR', position: { x: 60, y: 340 }, parentId: 'lane-debitur' },

    // MARKETING lane: 3 nodes
    { id: 'n4', type: 'activity', label: 'Verifikasi Berkas', position: { x: 380, y: 130 }, parentId: 'lane-marketing' },
    { id: 'n5', type: 'decision', label: 'Lengkap?', position: { x: 390, y: 260 }, parentId: 'lane-marketing' },
    { id: 'n6', type: 'activity', label: 'Survey Lapangan', position: { x: 385, y: 400 }, parentId: 'lane-marketing' },

    // KREDIT ADMIN lane: 4 nodes (includes decision targets)
    { id: 'n7', type: 'activity', label: 'Input Data', position: { x: 750, y: 120 }, parentId: 'lane-kredit' },
    { id: 'n8', type: 'activity', label: 'Analisa Kredit', position: { x: 755, y: 250 }, parentId: 'lane-kredit' },
    { id: 'n9', type: 'document', label: 'Laporan Analisa', position: { x: 760, y: 380 }, parentId: 'lane-kredit' },
    { id: 'n10', type: 'archive', label: 'Arsip', position: { x: 765, y: 520 }, parentId: 'lane-kredit' },

    // PEJABAT lane: 3 nodes
    { id: 'n11', type: 'activity', label: 'Review Komite', position: { x: 1130, y: 150 }, parentId: 'lane-pejabat' },
    { id: 'n12', type: 'decision', label: 'Setuju?', position: { x: 1140, y: 300 }, parentId: 'lane-pejabat' },
    { id: 'n13', type: 'end', label: 'Cair', position: { x: 1135, y: 460 }, parentId: 'lane-pejabat' },
  ];

  const edges: OcrRawEdge[] = [
    { id: 'e1', source: 'n1', target: 'n2' },
    { id: 'e2', source: 'n2', target: 'n3' },
    { id: 'e3', source: 'n3', target: 'n4' }, // cross-lane
    { id: 'e4', source: 'n4', target: 'n5' },
    { id: 'e5', source: 'n5', target: 'n6', label: 'NO' },
    { id: 'e6', source: 'n5', target: 'n7', label: 'YES' }, // cross-lane decision branch
    { id: 'e7', source: 'n6', target: 'n7' }, // cross-lane return?
    { id: 'e8', source: 'n7', target: 'n8' },
    { id: 'e9', source: 'n8', target: 'n9' },
    { id: 'e10', source: 'n9', target: 'n10' },
    { id: 'e11', source: 'n9', target: 'n11' }, // cross-lane to pejabat
    { id: 'e12', source: 'n11', target: 'n12' },
    { id: 'e13', source: 'n12', target: 'n13', label: 'YES' },
    { id: 'e14', source: 'n12', target: 'n6', label: 'NO' }, // cross-lane loop back
  ];

  return { nodes: [...shuffledLanes, ...nodes], edges };
}

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

describe('ocr-layout — KUR BPM fidelity', () => {
  it('lays out 4 lanes and ~13 nodes with zero shape overlaps and preserved lane order', () => {
    const fixture = buildKurFixture();
    const result = layoutOcrDiagram(fixture);

    // lanes are present and ordered left-to-right by median AI x (DEBITUR < MARKETING < KREDIT ADMIN < PEJABAT)
    const lanes = result.nodes.filter((n) => n.type === 'swimlane');
    expect(lanes).toHaveLength(4);
    const laneById = new Map(lanes.map((l) => [l.id, l] as const));
    const xDebitur = laneById.get('lane-debitur')!.position.x;
    const xMarketing = laneById.get('lane-marketing')!.position.x;
    const xKredit = laneById.get('lane-kredit')!.position.x;
    const xPejabat = laneById.get('lane-pejabat')!.position.x;
    expect(xDebitur).toBeLessThan(xMarketing);
    expect(xMarketing).toBeLessThan(xKredit);
    expect(xKredit).toBeLessThan(xPejabat);

    // lane dims clamped: min 400 wide, uniform height, at least 1000
    const widths = lanes.map((l) => l.width);
    const heights = lanes.map((l) => l.height);
    for (const w of widths) expect(w).toBeGreaterThanOrEqual(400);
    for (const h of heights) expect(h).toBeGreaterThanOrEqual(1000);
    expect(new Set(heights).size).toBe(1); // uniform height

    // zero overlaps among shape nodes (parent containment allowed, shapes must not overlap each other)
    const laneMap = new Map(lanes.map((l) => [l.id, { x: l.position.x, y: l.position.y, width: l.width, height: l.height }] as const));
    const shapes = result.nodes.filter((n) => n.type !== 'swimlane');
    expect(shapes.length).toBe(13);
    const rects = shapes.map((s) => absoluteRect(s, laneMap));
    for (let i = 0; i < rects.length; i++) {
      for (let j = i + 1; j < rects.length; j++) {
        expect(rectsOverlap(rects[i], rects[j]), `Nodes ${rects[i].id} and ${rects[j].id} overlap`).toBe(false);
      }
    }

    // lanes themselves must not overlap horizontally
    for (let i = 0; i < lanes.length; i++) {
      for (let j = i + 1; j < lanes.length; j++) {
        const a = { x: lanes[i].position.x, y: lanes[i].position.y, w: lanes[i].width, h: lanes[i].height };
        const b = { x: lanes[j].position.x, y: lanes[j].position.y, w: lanes[j].width, h: lanes[j].height };
        expect(rectsOverlap(a, b), `Lanes ${lanes[i].id} and ${lanes[j].id} overlap`).toBe(false);
      }
    }

    // cross-lane edges preserved with YES/NO labels
    const yesEdges = result.edges.filter((e) => e.label === 'YES');
    const noEdges = result.edges.filter((e) => e.label === 'NO');
    expect(yesEdges.length).toBeGreaterThanOrEqual(2);
    expect(noEdges.length).toBeGreaterThanOrEqual(2);
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

  it('clamps lane dims: warns missing-dims and expands to at least 400x1000 uniform', () => {
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
      expect(l.height).toBeGreaterThanOrEqual(1000);
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
    // top-level nodes are placed below lanes, not overlapping them
    const lane = laid.nodes.find((n) => n.id === 'lane-a')!;
    expect(n2.position.y).toBeGreaterThan(lane.position.y + lane.height - 1);
  });

  it('per-lane BFS depth ignores cross-lane incoming (nodes with only cross-lane incoming are entries)', () => {
    // lane-b node b2 has only cross-lane incoming from lane-a, so depth 0 in its lane
    const raw: { nodes: OcrRawNode[]; edges: OcrRawEdge[] } = {
      nodes: [
        { id: 'lane-a', type: 'swimlane', label: 'A', position: { x: 0, y: 0 }, department: 'D', function: 'F' },
        { id: 'lane-b', type: 'swimlane', label: 'B', position: { x: 500, y: 0 }, department: 'D', function: 'F' },
        { id: 'a1', type: 'activity', label: 'A1', position: { x: 10, y: 10 }, parentId: 'lane-a' },
        { id: 'b1', type: 'activity', label: 'B1', position: { x: 510, y: 10 }, parentId: 'lane-b' },
        { id: 'b2', type: 'activity', label: 'B2', position: { x: 515, y: 100 }, parentId: 'lane-b' },
      ],
      edges: [
        { id: 'e1', source: 'a1', target: 'b2' }, // cross-lane
        { id: 'e2', source: 'b1', target: 'b2' }, // intra-lane to b2 as well
      ],
    };
    const laid = layoutOcrDiagram(raw);
    // b1 is entry (no intra incoming), b2 has intra incoming from b1 so depth 1 => b1 above b2
    const b1 = laid.nodes.find((n) => n.id === 'b1')!;
    const b2 = laid.nodes.find((n) => n.id === 'b2')!;
    expect(b1.position.y).toBeLessThan(b2.position.y);
  });

  it('top-level nodes sorted by (y,x) and placed in single row below lanes without overlap', () => {
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
    // all top-level share same Y (single row) below lane
    expect(t1.position.y).toBe(t2.position.y);
    expect(t2.position.y).toBe(t3.position.y);
    expect(t1.position.y).toBeGreaterThan(lane.position.y + lane.height - 1);
    // x order respects (y,x) sort: t2 (y100,x10) < t3 (y100,x20) < t1 (y300,x50)
    expect(t2.position.x).toBeLessThan(t3.position.x);
    expect(t3.position.x).toBeLessThan(t1.position.x);
  });

  it('getNodeDimensions mirror BridgeEdge: decision 110x110, archive 64x64, data-media 100x80, reference 40x40', () => {
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
    const debitur = laid.nodes.find((n) => n.id === 'swimlane_debitur');
    const kreditAdmin = laid.nodes.find((n) => n.id === 'swimlane_kredit_admin');

    expect(debitur?.label).toBe('DEBITUR');
    expect(debitur?.department).toBe('DEBITUR');
    expect(kreditAdmin?.label).toBe('KREDIT ADMIN');
    expect(kreditAdmin?.department).toBe('KREDIT ADMIN');
  });

  it('snaps unparented nodes to closest swimlane column when established lane children exist', () => {
    const raw: { nodes: OcrRawNode[]; edges: OcrRawEdge[] } = {
      nodes: [
        { id: 'lane-nasabah', type: 'swimlane', label: 'NASABAH', position: { x: 50, y: 0 }, department: 'NASABAH' },
        { id: 'lane-penaksir', type: 'swimlane', label: 'PENAKSIR', position: { x: 300, y: 0 }, department: 'PENAKSIR' },
        { id: 'n-explicit', type: 'activity', label: 'Taksir Emas', position: { x: 310, y: 100 }, parentId: 'lane-penaksir' },
        // n-unparented is at x: 60 (close to lane-nasabah at x: 50), with no parentId specified
        { id: 'n-unparented', type: 'document', label: 'Formulir Rahn', position: { x: 60, y: 120 } },
      ],
      edges: [
        { id: 'e1', source: 'n-unparented', target: 'n-explicit' },
      ],
    };
    const laid = layoutOcrDiagram(raw);
    const docNode = laid.nodes.find((n) => n.id === 'n-unparented');
    expect(docNode).toBeDefined();
    expect(docNode?.parentId).toBe('lane-nasabah');
  });

  it('ensures all swimlane child nodes are placed with sufficient header clearance (Y >= 110)', () => {
    const fixture = buildKurFixture();
    const result = layoutOcrDiagram(fixture);

    const childNodes = result.nodes.filter((n) => n.parentId !== undefined && n.type !== 'swimlane');
    expect(childNodes.length).toBeGreaterThan(0);

    for (const child of childNodes) {
      // Child node position.y inside a swimlane must respect HEADER_H + 50 (>= 130px)
      expect(child.position.y).toBeGreaterThanOrEqual(110);
    }
  });

  it('assigns horizontal right-to-left handles for cross-lane connections', () => {
    const raw: { nodes: OcrRawNode[]; edges: OcrRawEdge[] } = {
      nodes: [
        { id: 'lane-1', type: 'swimlane', label: 'LANE 1', position: { x: 0, y: 0 }, department: 'LANE 1' },
        { id: 'lane-2', type: 'swimlane', label: 'LANE 2', position: { x: 400, y: 0 }, department: 'LANE 2' },
        { id: 'n1', type: 'document', label: 'Berkas', position: { x: 100, y: 100 }, parentId: 'lane-1' },
        { id: 'n2', type: 'activity', label: 'Proses', position: { x: 500, y: 120 }, parentId: 'lane-2' },
      ],
      edges: [
        { id: 'e1', source: 'n1', target: 'n2' },
      ],
    };

    const laid = layoutOcrDiagram(raw);
    const edge = laid.edges.find((e) => e.id === 'e1');
    expect(edge).toBeDefined();
    expect(edge?.sourceHandle).toBe('right');
    expect(edge?.targetHandle).toBe('left');
  });

  it('dynamically expands swimlane width and spaces parallel branches without overlapping', () => {
    const raw: { nodes: OcrRawNode[]; edges: OcrRawEdge[] } = {
      nodes: [
        { id: 'lane-main', type: 'swimlane', label: 'OPERASIONAL', position: { x: 0, y: 0 } },
        { id: 'start', type: 'start', label: 'Mulai', position: { x: 50, y: 50 }, parentId: 'lane-main' },
        { id: 'branch-a', type: 'activity', label: 'Cabang A', position: { x: 30, y: 150 }, parentId: 'lane-main' },
        { id: 'branch-b', type: 'activity', label: 'Cabang B', position: { x: 150, y: 150 }, parentId: 'lane-main' },
        { id: 'end', type: 'end', label: 'Selesai', position: { x: 50, y: 250 }, parentId: 'lane-main' },
      ],
      edges: [
        { id: 'e1', source: 'start', target: 'branch-a' },
        { id: 'e2', source: 'start', target: 'branch-b' },
        { id: 'e3', source: 'branch-a', target: 'end' },
        { id: 'e4', source: 'branch-b', target: 'end' },
      ],
    };

    const laid = layoutOcrDiagram(raw);
    const laneNode = laid.nodes.find((n) => n.id === 'lane-main');
    expect(laneNode).toBeDefined();
    // With 2 parallel activities (width 160 each) + margins, width must expand beyond default 400
    expect(laneNode!.width).toBeGreaterThanOrEqual(480);

    const nodeA = laid.nodes.find((n) => n.id === 'branch-a')!;
    const nodeB = laid.nodes.find((n) => n.id === 'branch-b')!;
    expect(nodeA).toBeDefined();
    expect(nodeB).toBeDefined();

    // Check horizontal clearance: node B must not overlap node A
    const leftNode = nodeA.position.x < nodeB.position.x ? nodeA : nodeB;
    const rightNode = leftNode === nodeA ? nodeB : nodeA;
    const horizontalClearance = rightNode.position.x - (leftNode.position.x + leftNode.width);
    expect(horizontalClearance).toBeGreaterThanOrEqual(40);

    // Check vertical clearance between start and branch
    const startNode = laid.nodes.find((n) => n.id === 'start')!;
    const verticalClearanceStartToBranch = nodeA.position.y - (startNode.position.y + startNode.height);
    expect(verticalClearanceStartToBranch).toBeGreaterThanOrEqual(50);
  });
});

