import { describe, it, expect } from 'vitest';
import { pairOffPageConnectors } from './connector-link-matcher';
import type { BPMDiagramSheet } from '@shared/types';

describe('pairOffPageConnectors', () => {
  it('automatically sets targetSheetId on "Ke hal 2" node to point to Sheet 2', () => {
    const sheets: BPMDiagramSheet[] = [
      {
        id: 's-page1',
        name: 'Fase 1',
        order: 0,
        nodes: [
          {
            id: 'node-c1',
            type: 'off-page-ref',
            position: { x: 500, y: 100 },
            data: { label: 'Ke hal 2' },
          },
        ],
        edges: [],
      },
      {
        id: 's-page2',
        name: 'Fase 2',
        order: 1,
        nodes: [
          {
            id: 'node-c2',
            type: 'off-page-ref',
            position: { x: 50, y: 100 },
            data: { label: 'Dari hal 1' },
          },
        ],
        edges: [],
      },
    ];

    const result = pairOffPageConnectors(sheets);

    // Page 1 connector
    expect(result[0].nodes[0].data.targetSheetId).toBe('s-page2');
    expect(result[0].nodes[0].data.targetSheetName).toBe('Fase 2');
    expect(result[0].nodes[0].data.direction).toBe('out');

    // Page 2 connector
    expect(result[1].nodes[0].data.sourceSheetId).toBe('s-page1');
    expect(result[1].nodes[0].data.sourceSheetName).toBe('Fase 1');
    expect(result[1].nodes[0].data.direction).toBe('in');
  });

  it('handles single sheet or empty collection gracefully without modifications', () => {
    const sheets: BPMDiagramSheet[] = [
      {
        id: 's-only',
        name: 'Solo',
        order: 0,
        nodes: [],
        edges: [],
      },
    ];

    expect(pairOffPageConnectors(sheets)).toEqual(sheets);
  });
});
