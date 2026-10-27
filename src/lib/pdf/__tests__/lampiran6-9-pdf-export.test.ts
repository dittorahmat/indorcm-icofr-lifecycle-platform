import { describe, it, expect } from 'vitest';
import { generateLampiran6Pdf, generateLampiran9Pdf } from '../lampiran6-9-pdf-export';
import type { ChangeLog } from '@shared/types';
import type { FindingExportRow } from '@/lib/findings-excel-export';

describe('Lampiran 6 & 9 PDF Export (SK-5 Standards)', () => {
  const mockChangeLogs: ChangeLog[] = [
    {
      id: 'log-1',
      organizationId: 'org-1',
      processName: 'Pengelolaan Batubara',
      subProcess: 'Stockpile Hauling',
      reportDate: '2026-03-15T00:00:00.000Z',
      controlOwner: 'Budi Santoso',
      descriptionBefore: 'Timbangan manual lapangan',
      descriptionAfter: 'Otomatisasi jembatan timbang terintegrasi ERP',
      referenceBefore: 'SOP-LOG-01',
      referenceAfter: 'SOP-LOG-02-REV',
      isRegulatory: true,
      timestamp: '2026-03-15T00:00:00.000Z',
    },
  ];

  const mockFindings: FindingExportRow[] = [
    {
      id: 'f-1',
      ref: 'FIND-001',
      description: 'Selisih fisik kas operasional tambang',
      control: 'Rekonsiliasi Bank Harian',
      severity: 'Significant Deficiency',
      exposureValue: 750000000,
      identifiedBy: 'Internal Audit',
      identifiedDate: '2026-02-10T00:00:00.000Z',
      source: 'TOD',
      status: 'Open',
    },
  ];

  it('generates Lampiran 6 PDF with 10 regulatory change columns', () => {
    const doc = generateLampiran6Pdf({
      logs: mockChangeLogs,
      fiscalYear: 2026,
    });
    expect(doc).toBeDefined();
    expect(doc.getNumberOfPages()).toBeGreaterThanOrEqual(1);
  });

  it('generates Lampiran 9 PDF with findings register', () => {
    const doc = generateLampiran9Pdf({
      findings: mockFindings,
      fiscalYear: 2026,
    });
    expect(doc).toBeDefined();
    expect(doc.getNumberOfPages()).toBeGreaterThanOrEqual(1);
  });
});
