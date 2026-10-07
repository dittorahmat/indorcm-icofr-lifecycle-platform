import { describe, it, expect } from 'vitest';
import { calculatePdfNodeLinks } from './export-bpm-pdf';
import type { BPMDiagramSheet } from '../../../../../shared/types/rcm-bpm';

describe('calculatePdfNodeLinks', () => {
  const sheets: BPMDiagramSheet[] = [
    { id: 's-1', name: 'Sheet 1', order: 0, nodes: [], edges: [] },
    { id: 's-2', name: 'Sheet 2', order: 1, nodes: [], edges: [] },
    { id: 's-3', name: 'Sheet 3', order: 2, nodes: [], edges: [] },
  ];

  it('calculates link annotations for off-page-ref nodes pointing to target page', () => {
    const nodes = [
      {
        id: 'node-offpage-1',
        type: 'off-page-ref',
        position: { x: 500, y: 200 },
        width: 56,
        height: 56,
        data: {
          targetSheetId: 's-2',
          targetSheetName: 'Sheet 2',
        },
      },
      {
        id: 'node-activity-1',
        type: 'activity',
        position: { x: 100, y: 100 },
        data: { label: 'Regular Activity' },
      },
    ];

    const containerWidth = 1000;
    const containerHeight = 500;
    const pdfX = 10;
    const pdfY = 10;
    const pdfWidth = 200;
    const pdfHeight = 100;

    const links = calculatePdfNodeLinks(
      nodes,
      sheets,
      containerWidth,
      containerHeight,
      pdfX,
      pdfY,
      pdfWidth,
      pdfHeight
    );

    expect(links).toHaveLength(1);
    expect(links[0].nodeId).toBe('node-offpage-1');
    expect(links[0].targetPageNumber).toBe(2); // Sheet 2 is page 2
    expect(links[0].x).toBe(10 + 500 * (200 / 1000)); // 10 + 100 = 110
    expect(links[0].y).toBe(10 + 200 * (100 / 500)); // 10 + 40 = 50
  });

  it('ignores nodes with invalid or missing target sheets', () => {
    const nodes = [
      {
        id: 'node-unlinked',
        type: 'off-page-ref',
        position: { x: 100, y: 100 },
        data: {},
      },
    ];

    const links = calculatePdfNodeLinks(nodes, sheets, 1000, 500, 0, 0, 200, 100);
    expect(links).toHaveLength(0);
  });
});
