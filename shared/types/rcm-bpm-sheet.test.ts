import { describe, it, expect } from 'vitest';
import type { BPMDiagramSheet, BPMDiagramMetadata } from './rcm-bpm';

describe('BPM Multi-Sheet Types', () => {
  it('creates valid BPMDiagramSheet and BPMDiagramMetadata structures', () => {
    const sheet: BPMDiagramSheet = {
      id: 'sheet-1',
      name: 'Fase 1 - Permintaan',
      order: 0,
      nodes: [
        {
          id: 'node-start',
          type: 'start',
          position: { x: 100, y: 100 },
          data: { label: 'Start' },
        },
      ],
      edges: [],
    };

    const metadata: BPMDiagramMetadata = {
      sheets: [sheet],
      activeSheetId: 'sheet-1',
    };

    expect(sheet.id).toBe('sheet-1');
    expect(metadata.sheets).toHaveLength(1);
    expect(metadata.activeSheetId).toBe('sheet-1');
  });
});
