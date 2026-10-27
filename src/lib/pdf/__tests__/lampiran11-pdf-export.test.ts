import { describe, it, expect } from 'vitest';
import { generateLampiran11Pdf } from '../lampiran11-pdf-export';
import type { Deficiency } from '@shared/types';

function makeDeficiency(overrides: Partial<Deficiency>): Deficiency {
  return {
    id: 'def-1',
    organizationId: 'org-1',
    controlId: 'ctrl-1',
    bpmProcessId: 'proc-1',
    period: '2026-Q1',
    description: 'Deskripsi defisiensi',
    severity: 'Material Weakness',
    identifiedDate: Date.now(),
    identifiedBy: 'Auditor KAP',
    status: 'Open',
    rootCause: null,
    magnitude: null,
    exposureValue: 5000000000,
    likelihood: null,
    correctiveActionTaken: null,
    remediationEvidence: null,
    source: 'Lini 2 - TOD Review',
    relatedAssertions: [],
    compensatingControlIds: [],
    ...overrides,
  };
}

describe('Lampiran 11 PDF Export (SK-5 Standards)', () => {
  const mockDeficiencies: Deficiency[] = [
    makeDeficiency({
      id: 'def-1',
      severity: 'Material Weakness',
      description: 'Tidak adanya otorisasi penimbangan batubara pada sistem silo.',
    }),
    makeDeficiency({
      id: 'def-2',
      severity: 'Significant Deficiency',
      status: 'Remediated',
      exposureValue: 1200000000,
      description: 'Keterlambatan rekonsiliasi kas bank operasional.',
      source: 'Lini 2 - TOE Review',
    }),
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
