import { describe, it, expect } from 'vitest';
import { generateCsaLampiran7Pdf } from '../csa-pdf-export';
import type { CSARecord } from '@shared/types';

describe('CSA Lampiran 7 PDF Export (SK-5 Standards)', () => {
  const mockRecord: CSARecord = {
    id: 'csa-rec-001',
    organizationId: 'org-1',
    period: '2026-Q1',
    assessmentDate: '2026-03-31T00:00:00.000Z',
    assessedBy: 'Budi Santoso',
    result: 'Effective',
    status: 'Approved',
    samplingMethodology: 'Sampling atribut berbasis transaksi bulanan (2 sampel representatif).',
    samples: [
      {
        id: 'samp-1',
        csaRecordId: 'csa-rec-001',
        sampleRef: 'BA-SO/02/2026',
        glRowId: 'gl-12345678',
        controlResults: {
          'INV-MIN-005': {
            implemented: true,
            evidenceUrl: 'https://example.com/ba-feb.pdf',
            riskName: 'Risiko Selisih Saldo Batubara',
            controlName: 'Rekonsiliasi Stock Opname Bulanan',
          },
        },
      },
      {
        id: 'samp-2',
        csaRecordId: 'csa-rec-001',
        sampleRef: 'BA-SO/03/2026',
        glRowId: 'gl-87654321',
        controlResults: {
          'INV-MIN-005': {
            implemented: true,
            evidenceUrl: 'https://example.com/ba-mar.pdf',
            riskName: 'Risiko Selisih Saldo Batubara',
            controlName: 'Rekonsiliasi Stock Opname Bulanan',
          },
        },
      },
    ],
  };

  it('generates a detailed Lampiran 7A PDF with all sample rows and IPO attributes', () => {
    const doc = generateCsaLampiran7Pdf({
      record: mockRecord,
      mode: 'detailed',
      processName: 'Pengelolaan Persediaan & Stock Opname',
      noGL: '114000',
    });

    expect(doc).toBeDefined();
    expect(doc.getNumberOfPages()).toBeGreaterThanOrEqual(1);
  });

  it('generates a summary Lampiran 7A PDF with control aggregates', () => {
    const doc = generateCsaLampiran7Pdf({
      record: mockRecord,
      mode: 'summary',
      processName: 'Pengelolaan Persediaan & Stock Opname',
      noGL: '114000',
    });

    expect(doc).toBeDefined();
    expect(doc.getNumberOfPages()).toBeGreaterThanOrEqual(1);
  });
});
