import { describe, it, expect } from 'vitest';
import { generateLampiran10DoDPdf } from '../lampiran10-pdf-export';
import type { FormattedDoDRow } from '@/components/reports/dod/dod-types';

describe('Lampiran 10 DoD PDF Export (SK-5 Standards)', () => {
  const mockRows: FormattedDoDRow[] = [
    {
      ref: 'DOD-2026-001',
      description: 'Selisih pencatatan timbangan batubara pit stockpile.',
      isRemediated: false,
      ineffectivePeriod: 'Q1 2026',
      exposureValue: 3500000000,
      severity: 'Material Weakness',
      impactedAccount: 'Pendapatan Batubara',
      cosoComponent: 'Control Activities',
      businessProcess: 'Mining Operations',
      businessUnit: 'Unit Tambang Ombilin',
      assertions: {
        existence: true,
        completeness: true,
        accuracy: true,
        rightsObligations: false,
        valuation: true,
        presentationDisclosure: false,
      },
      boxes: {
        box1: true,
        box2: false,
        box3: true,
        box4: false,
        box5: true,
        box6: false,
        box7: true,
      },
    },
  ];

  it('generates Lampiran 10 landscape PDF with degree of deficiency columns', () => {
    const doc = generateLampiran10DoDPdf({
      rows: mockRows,
      fiscalYear: 2026,
      companyName: 'PT Batubara Nusantara Sejahtera',
    });

    expect(doc).toBeDefined();
    expect(doc.getNumberOfPages()).toBeGreaterThanOrEqual(1);
  });
});
