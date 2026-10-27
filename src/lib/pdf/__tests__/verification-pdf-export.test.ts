import { describe, it, expect } from 'vitest';
import { generateVerificationDesignPdf } from '../verification-pdf-export';
import type { VerificationMatrixItem } from '@/pages/rcm/verification-design-columns';

describe('Verification Design PDF Export (SK-5 Standards)', () => {
  const mockRows: VerificationMatrixItem[] = [
    {
      id: 'vd-1',
      controlId: 'ctrl-1',
      mappingId: 'map-1',
      controlCode: 'CTL-MIN-001',
      controlName: 'Rekonsiliasi Timbangan Otomatis',
      controlDescription: 'Deskripsi SOP',
      supportingDocs: 'BA.pdf',
      isKeyControl: true,
      ipoC: 'Y',
      ipoA: 'Y',
      ipoV: 'Y',
      ipoRa: 'N',
      assertionE: 'Y',
      assertionC: 'Y',
      assertionA: 'Y',
      assertionCo: 'N',
      assertionVa: 'Y',
      assertionRo: 'N',
      assertionPd: 'N',
      controlType: 'Detective',
      controlNature: 'Manual',
      automatedControlType: 'N/A',
      frequency: 'Monthly',
      supportingApp: 'ERP',
      applicationId: 'app-1',
      executingFunction: 'Finance',
      executorRole: 'Manager',
      affectedFsliItem: 'Kas',
      effectivePeriod: '2026',
      companyName: 'PT Batubara Nusantara Sejahtera',
      locationCode: 'LOC-01',
      conclusion: 'Effective',
      comment: 'Sesuai SOP 6 pilar',
    },
  ];

  it('generates Verification Design PDF document with 6 pillars', () => {
    const doc = generateVerificationDesignPdf({
      items: mockRows,
      fiscalYear: 2026,
    });
    expect(doc).toBeDefined();
    expect(doc.getNumberOfPages()).toBeGreaterThanOrEqual(1);
  });
});
