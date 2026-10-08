import { describe, it, expect } from 'vitest';
import type { Node, Edge } from 'reactflow';
import type { OcrRawNode, OcrRawEdge } from '@/utils/ocr-layout';
import { stageRawDiagram } from '../ocr-node-normalize';
import { applyOcrImport, buildOcrSheets } from '../ocr-import-adapter';

function pageOneRaw(): { nodes: OcrRawNode[]; edges: OcrRawEdge[] } {
  return {
    nodes: [
      { id: 'lane-a', type: 'swimlane', label: 'DEBITUR', position: { x: 0, y: 0 }, department: 'DEBITUR', function: 'Nasabah' },
      { id: 'a-start', type: 'start', label: 'Mulai', position: { x: 50, y: 100 }, parentId: 'lane-a' },
      { id: 'a-act', type: 'activity', label: 'Ajukan Kredit', position: { x: 55, y: 220 }, parentId: 'lane-a' },
      { id: 'a-next', type: 'off-page-ref', label: 'Ke hal 2', position: { x: 60, y: 340 }, parentId: 'lane-a' },
    ],
    edges: [
      { id: 'e1', source: 'a-start', target: 'a-act' },
      { id: 'e2', source: 'a-act', target: 'a-next' },
    ],
  };
}

function pageTwoRaw(): { nodes: OcrRawNode[]; edges: OcrRawEdge[] } {
  return {
    nodes: [
      { id: 'lane-b', type: 'swimlane', label: 'KREDIT ADMIN', position: { x: 700, y: 0 }, department: 'KREDIT ADMIN', function: 'Admin' },
      { id: 'b-back', type: 'off-page-ref', label: 'Dari hal 1', position: { x: 750, y: 120 }, parentId: 'lane-b' },
      { id: 'b-act', type: 'activity', label: 'Analisa Kredit', position: { x: 755, y: 250 }, parentId: 'lane-b' },
      { id: 'b-end', type: 'end', label: 'Cair', position: { x: 760, y: 380 }, parentId: 'lane-b' },
    ],
    edges: [
      { id: 'e3', source: 'b-back', target: 'b-act' },
      { id: 'e4', source: 'b-act', target: 'b-end' },
    ],
  };
}

function staged(raw: { nodes: OcrRawNode[]; edges: OcrRawEdge[] }): { nodes: Node[]; edges: Edge[] } {
  const { nodes, edges } = stageRawDiagram(raw);
  return { nodes, edges };
}

describe('ocr-import-adapter seam', () => {
  it('staging preview matches what lands on canvas (single normalization, overwrite)', () => {
    const { nodes, edges } = staged(pageOneRaw());
    const out = applyOcrImport({
      stagedNodes: nodes,
      stagedEdges: edges,
      mode: 'overwrite',
      direction: 'below',
      existingNodes: [],
      existingEdges: [],
    });
    expect(out.kind).toBe('canvas');
    if (out.kind !== 'canvas') throw new Error('expected canvas output');
    // Same normalization: preview staging deep-equals canvas landing.
    expect(out.nodes).toEqual(nodes);
    expect(out.edges).toEqual(edges);
  });

  it('overwrite ignores existing canvas content', () => {
    const { nodes, edges } = staged(pageOneRaw());
    const existing: Node[] = [
      { id: 'old-1', type: 'activity', position: { x: 0, y: 0 }, data: { label: 'Lama' } } as Node,
    ];
    const out = applyOcrImport({
      stagedNodes: nodes,
      stagedEdges: edges,
      mode: 'overwrite',
      direction: 'below',
      existingNodes: existing,
      existingEdges: [],
    });
    if (out.kind !== 'canvas') throw new Error('expected canvas output');
    expect(out.nodes).toEqual(nodes);
    expect(out.nodes.find((n) => n.id === 'old-1')).toBeUndefined();
  });

  it('append offsets below existing canvas with stable remapped ids', () => {
    const { nodes, edges } = staged(pageOneRaw());
    const existing: Node[] = [
      { id: 'old-1', type: 'activity', position: { x: 0, y: 0 }, width: 160, height: 56, data: { label: 'Lama' } } as Node,
    ];
    const first = applyOcrImport({
      stagedNodes: nodes,
      stagedEdges: edges,
      mode: 'append',
      direction: 'below',
      existingNodes: existing,
      existingEdges: [],
      idPrefix: 'ocr_append_7',
    });
    if (first.kind !== 'canvas') throw new Error('expected canvas output');
    expect(first.nodes[0].id).toBe('old-1');
    const incoming = first.nodes.slice(1);
    expect(incoming.length).toBe(nodes.length);
    for (const n of incoming) {
      expect(n.id.startsWith('ocr_append_7_')).toBe(true);
    }
    // No dangling edge endpoints after remap.
    const ids = new Set(first.nodes.map((n) => n.id));
    for (const e of first.edges) {
      expect(ids.has(String(e.source))).toBe(true);
      expect(ids.has(String(e.target))).toBe(true);
    }
    // Same explicit prefix twice is byte-identical (stable, no wall-clock).
    const second = applyOcrImport({
      stagedNodes: nodes,
      stagedEdges: edges,
      mode: 'append',
      direction: 'below',
      existingNodes: existing,
      existingEdges: [],
      idPrefix: 'ocr_append_7',
    });
    expect(second).toEqual(first);
  });

  it('builds stable multi-page sheets, flushes the unsaved review page, pairs off-page links', () => {
    const p1 = staged(pageOneRaw());
    const p2 = staged(pageTwoRaw());
    // Reviewer edited the active page (page 2) label without switching pages.
    const editedP2Nodes = p2.nodes.map((n) =>
      n.id === 'b-act' ? { ...n, data: { ...(n.data as object), label: 'Analisa Kredit (revisi)' } } : n,
    );
    const pages = new Map([
      [1, { nodes: p1.nodes, edges: p1.edges }],
      [2, { nodes: p2.nodes, edges: p2.edges }],
    ]);
    const build = () =>
      buildOcrSheets({
        pages,
        activePage: 2,
        activeNodes: editedP2Nodes,
        activeEdges: p2.edges,
        formatSheetName: (pg) => `Fase ${pg} (Halaman ${pg})`,
      });
    const sheets = build();
    expect(sheets).toHaveLength(2);
    // Stable deterministic ids: identical across calls, no wall-clock randomness.
    expect(sheets[0].id).toBe('ocr-sheet-page-1');
    expect(sheets[1].id).toBe('ocr-sheet-page-2');
    expect(build().map((s) => s.id)).toEqual(['ocr-sheet-page-1', 'ocr-sheet-page-2']);
    expect(sheets[0].order).toBe(0);
    expect(sheets[1].order).toBe(1);
    // Unsaved active-page edits are flushed into the sheet.
    const landed = (sheets[1].nodes as Node[]).find((n) => n.id === 'b-act');
    expect((landed?.data as { label?: string })?.label).toBe('Analisa Kredit (revisi)');
    // Off-page pairing: 1-based page links never dangle.
    const outRef = (sheets[0].nodes as Node[]).find((n) => n.id === 'a-next');
    expect((outRef?.data as { targetSheetId?: string })?.targetSheetId).toBe('ocr-sheet-page-2');
    expect((outRef?.data as { direction?: string })?.direction).toBe('out');
    const inRef = (sheets[1].nodes as Node[]).find((n) => n.id === 'b-back');
    expect((inRef?.data as { sourceSheetId?: string })?.sourceSheetId).toBe('ocr-sheet-page-1');
    expect((inRef?.data as { direction?: string })?.direction).toBe('in');
  });

  it('routes multi-page imports to sheets through the single apply interface', () => {
    const p1 = staged(pageOneRaw());
    const p2 = staged(pageTwoRaw());
    const out = applyOcrImport({
      stagedNodes: p1.nodes,
      stagedEdges: p1.edges,
      mode: 'overwrite',
      direction: 'below',
      existingNodes: [],
      existingEdges: [],
      pages: new Map([
        [1, { nodes: p1.nodes, edges: p1.edges }],
        [2, { nodes: p2.nodes, edges: p2.edges }],
      ]),
      activePage: 1,
      formatSheetName: (pg) => `Fase ${pg} (Halaman ${pg})`,
    });
    expect(out.kind).toBe('sheets');
    if (out.kind !== 'sheets') throw new Error('expected sheets output');
    expect(out.sheets).toHaveLength(2);
    const outRef = (out.sheets[0].nodes as Node[]).find((n) => n.id === 'a-next');
    expect((outRef?.data as { targetSheetId?: string })?.targetSheetId).toBe('ocr-sheet-page-2');
  });

  it('keeps single-page imports on the canvas path (no sheet fan-out)', () => {
    const { nodes, edges } = staged(pageOneRaw());
    const out = applyOcrImport({
      stagedNodes: nodes,
      stagedEdges: edges,
      mode: 'overwrite',
      direction: 'below',
      existingNodes: [],
      existingEdges: [],
      pages: new Map([[1, { nodes, edges }]]),
      activePage: 1,
    });
    expect(out.kind).toBe('canvas');
  });
});
