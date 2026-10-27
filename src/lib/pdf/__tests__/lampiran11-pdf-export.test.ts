import { describe, it, expect } from 'vitest';
import { generateLampiran11Pdf } from '../lampiran11-pdf-export';
import type { Deficiency } from '@shared/types';

describe('Lampiran 11 PDF Export (SK-5 Standards)', () => {
  const mockDeficiencies: Deficiency[] = [
    {
      id: 'def-1',
      organizationId: 'org-1',
      controlId: 'ctrl-1',
      source: 'TOD',
      severity: 'Material Weakness',
      status: 'Open',
      exposureValue: 5000000000,
      description: 'Tidak adanya otorisasi penimbangan batubara pada sistem silo.',
      identifiedBy: 'Auditor KAP',
      identifiedDate: '2026-04-10T00:00:00.000Z',
    },
    {
      id: 'def-2',
      organizationId: 'org-1',
      controlId: 'ctrl-2',
      source: 'TOE',
      severity: 'Significant Deficiency',
      status: 'Remediated',
      exposureValue: 1200000000,
      description: 'Keterlambatan rekonsiliasi kas bank operasional.',
      identifiedBy: 'Internal Audit',
      identifiedDate: '2026-05-12T00:00:00.000Z',
    },
  ];

  it('generates Lampiran 11 PDF with effectiveness conclusion and deficiency table', () => {
    const doc = generateLampiran11Pdf({
      deficiencies: mockDeficiencies,
      companyName: 'PT Batubara Nusantara Sejahtera',
      fiscalYear: 2026,
      isSigned: true,
    });

    expect(doc).toBeDefined();
    expect(doc.getNumberOfPages()).toBeGreaterThanOrEqual(1);
  });
});
