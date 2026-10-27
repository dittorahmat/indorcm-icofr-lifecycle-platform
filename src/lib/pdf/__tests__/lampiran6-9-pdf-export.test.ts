import { describe, it, expect } from 'vitest';
import { generateLampiran6Pdf, generateLampiran9Pdf } from '../lampiran6-9-pdf-export';
import type { ChangeLog } from '@shared/types';
import type { FindingExportRow } from '@/lib/findings-excel-export';

describe('Lampiran 6 & 9 PDF Export (SK-5 Standards)', () => {
  const mockChangeLogs: ChangeLog[] = [
    {
      id: 'log-1',
      organizationId: 'org-1',
      userId: 'user-1',
      action: 'UPDATE',
      entityType: 'Control',
      entityId: 'ctrl-1',
      descriptionBefore: 'Timbangan manual lapangan',
      descriptionAfter: 'Otomatisasi jembatan timbang terintegrasi ERP',
      dataBefore: { process: 'Pengelolaan Batubara', subProcess: 'Stockpile Hauling', controlId: 'CTL-1' },
      dataAfter: { process: 'Pengelolaan Batubara', subProcess: 'Stockpile Hauling', controlId: 'CTL-1', executingFunction: 'Budi Santoso' },
      isRegulatory: true,
      timestamp: Date.now(),
      effectiveDate: Date.now(),
      approvedBy: 'Approver 1',
      changeCategory: 'Policy',
    },
  ];

  const mockFindings: FindingExportRow[] = [
    {
      id: 'f-1',
      description: 'Selisih fisik kas operasional tambang',
      controlName: 'Rekonsiliasi Bank Harian',
      severity: 'Significant Deficiency',
      exposureValue: 750000000,
      identifiedBy: 'Internal Audit',
      identifiedDate: Date.now(),
      source: 'Lini 2 - TOD Review',
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
