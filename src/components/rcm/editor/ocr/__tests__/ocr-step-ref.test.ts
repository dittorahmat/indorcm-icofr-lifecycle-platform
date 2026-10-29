import { describe, it, expect } from 'vitest';
import { normalizeLaidOutNodes } from '../ocr-node-normalize';
import type { OcrLayoutResult } from '@/utils/ocr-layout';

describe('ocr-node-normalize stepRef extraction', () => {
  it('extracts stepRef from bracketed prefix [1.2]', () => {
    const layout: OcrLayoutResult = {
      nodes: [
        {
          id: 'n1',
          type: 'activity',
          label: '[1.2] Verifikasi Kelayakan Tagihan',
          position: { x: 100, y: 100 },
        },
      ],
      edges: [],
    };

    const normalized = normalizeLaidOutNodes(layout);
    expect(normalized[0].data?.stepRef).toBe('1.2');
    expect(normalized[0].data?.label).toBe('[1.2] Verifikasi Kelayakan Tagihan');
  });

  it('extracts stepRef from dotted numeric prefix 1.2.3', () => {
    const layout: OcrLayoutResult = {
      nodes: [
        {
          id: 'n2',
          type: 'activity',
          label: '2.1.4 Review Rekonsiliasi Bank',
          position: { x: 100, y: 150 },
        },
      ],
      edges: [],
    };

    const normalized = normalizeLaidOutNodes(layout);
    expect(normalized[0].data?.stepRef).toBe('2.1.4');
  });

  it('extracts stepRef from alphanumeric code ACT-01', () => {
    const layout: OcrLayoutResult = {
      nodes: [
        {
          id: 'n3',
          type: 'activity',
          label: 'ACT-01: Approval VP Keuangan',
          position: { x: 100, y: 200 },
        },
      ],
      edges: [],
    };

    const normalized = normalizeLaidOutNodes(layout);
    expect(normalized[0].data?.stepRef).toBe('ACT-01');
  });

  it('leaves stepRef undefined when no prefix exists', () => {
    const layout: OcrLayoutResult = {
      nodes: [
        {
          id: 'n4',
          type: 'activity',
          label: 'Verifikasi Tanpa Nomor',
          position: { x: 100, y: 250 },
        },
      ],
      edges: [],
    };

    const normalized = normalizeLaidOutNodes(layout);
    expect(normalized[0].data?.stepRef).toBeUndefined();
  });
});
