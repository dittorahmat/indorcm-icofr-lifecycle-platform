import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

import { layoutOcrDiagram } from '../utils/ocr-layout';
import { auditOcrLayout, auditSourceOrder, auditUpwardDrift } from '../utils/ocr-layout-audit';
import type { OcrRawEdge, OcrRawNode } from '../utils/ocr-validate';

/**
 * Snapshots captured from the real PDFs through the production pipeline
 * (pdfjs → Gemini via the OCR seam → parse). Replayed offline so CI locks the
 * layout of real model responses instead of a hand-written fixture.
 */
interface SnapshotCase {
  name: string;
  file: string;
  /** Expected lane labels, or `null` when the sheet has no real swimlanes. */
  laneLabels: string[] | null;
}

const CASES: SnapshotCase[] = [
  {
    name: 'KUR credit approval (four department columns)',
    file: 'fixtures/ocr/BPM_Persetujuaan_Kredit_KUR.ocr.json',
    laneLabels: ['KOMITE KREDIT', 'MARKETING', 'CALON DEBITUR', 'LEGAL'],
  },
  {
    name: 'cash deposit (flow chart + sign-off table)',
    file: 'fixtures/ocr/BPM_Penerimaan_Setoran_Tunai.ocr.json',
    laneLabels: null,
  },
];

describe.each(CASES)('OCR snapshot — $name', ({ file, laneLabels }) => {
  const snapshot = JSON.parse(readFileSync(resolve(process.cwd(), file), 'utf8')) as {
    nodes: OcrRawNode[];
    edges: OcrRawEdge[];
  };
  const layout = layoutOcrDiagram(snapshot);

  it('lays the captured response out with zero geometry and order violations', () => {
    const audit = auditOcrLayout(layout);

    expect(audit.violations).toEqual([]);
    expect(auditSourceOrder(snapshot.nodes, layout)).toEqual([]);
    // no upward edge that the source did not already have
    expect(auditUpwardDrift(snapshot.nodes, layout)).toEqual([]);
    expect(layout.edges.length).toBeGreaterThan(0);
    expect(audit.stats.shapeCount).toBeGreaterThanOrEqual(3);
    expect(audit.stats.landingZoom).toBeGreaterThanOrEqual(0.7);
  });

  if (laneLabels) {
    it('keeps the lane columns in drawing order', () => {
      const lanes = layout.nodes.filter((node) => node.type === 'swimlane');
      expect(lanes.map((lane) => lane.label)).toEqual(laneLabels);
    });
  }
});
