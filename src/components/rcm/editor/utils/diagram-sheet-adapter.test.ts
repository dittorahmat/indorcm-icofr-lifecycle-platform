import { describe, it, expect } from 'vitest';
import {
  normalizeDiagramSheets,
  updateSheetInList,
  createNewSheet,
} from './diagram-sheet-adapter';
import type { BPMNode } from '../../../../../shared/types/rcm-bpm';

describe('diagram-sheet-adapter', () => {
  it('normalizes legacy diagram (no sheets in metadata) into single sheet', () => {
    const legacyNodes: BPMNode[] = [
      { id: '1', type: 'start', position: { x: 0, y: 0 }, data: { label: 'Start' } },
    ];
    const legacyEdges = [{ id: 'e1', source: '1', target: '2' }];

    const result = normalizeDiagramSheets(legacyNodes, legacyEdges, null, 'Alur Utama');
    expect(result.isMultiSheet).toBe(false);
    expect(result.sheets).toHaveLength(1);
    expect(result.sheets[0].name).toBe('Alur Utama');
    expect(result.sheets[0].nodes).toHaveLength(1);
    expect(result.activeSheetId).toBe(result.sheets[0].id);
  });

  it('preserves existing multi-sheet metadata and respects activeSheetId', () => {
    const sheet1 = {
      id: 's-1',
      name: 'Fase 1',
      order: 0,
      nodes: [],
      edges: [],
    };
    const sheet2 = {
      id: 's-2',
      name: 'Fase 2',
      order: 1,
      nodes: [],
      edges: [],
    };

    const metadata = {
      sheets: [sheet2, sheet1],
      activeSheetId: 's-2',
    };

    const result = normalizeDiagramSheets([], [], metadata);
    expect(result.isMultiSheet).toBe(true);
    expect(result.sheets).toHaveLength(2);
    // Should be sorted by order
    expect(result.sheets[0].id).toBe('s-1');
    expect(result.sheets[1].id).toBe('s-2');
    expect(result.activeSheetId).toBe('s-2');
  });

  it('updates a specific sheet in list without mutating others', () => {
    const sheets = [
      { id: 's-1', name: 'Sheet 1', order: 0, nodes: [], edges: [] },
      { id: 's-2', name: 'Sheet 2', order: 1, nodes: [], edges: [] },
    ];

    const updated = updateSheetInList(sheets, 's-2', { name: 'Fase Pengadaan' });
    expect(updated[0].name).toBe('Sheet 1');
    expect(updated[1].name).toBe('Fase Pengadaan');
  });

  it('creates a new sheet with next order and default start node', () => {
    const sheets = [
      { id: 's-1', name: 'Sheet 1', order: 0, nodes: [], edges: [] },
    ];

    const newSheet = createNewSheet(sheets, 'Fase Gudang', 'Mulai Gudang');
    expect(newSheet.name).toBe('Fase Gudang');
    expect(newSheet.order).toBe(1);
    expect(newSheet.nodes).toHaveLength(1);
    expect(newSheet.nodes[0].data.label).toBe('Mulai Gudang');
  });
});
