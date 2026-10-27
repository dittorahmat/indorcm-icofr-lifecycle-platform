import { describe, it, expect } from 'vitest';
import { generateCsaLampiran7Pdf } from '../csa-pdf-export';
import type { CSARecord, CSATestSample } from '@shared/types';

function makeSample(overrides: Partial<CSATestSample>): CSATestSample {
  return {
    id: 'samp-1',
    organizationId: 'org-1',
    csaRecordId: 'csa-rec-001',
    sampleRef: 'BA-SO/02/2026',
    glRowId: 'gl-12345678',
    attrA: true,
    attrB: true,
    attrC: true,
    attrD: true,
    itacMatch: true,
    itacExpectedResult: null,
    itacActualResult: null,
    controlResults: {},
    ...overrides,
  };
}

function makeCsaRecord(overrides: Partial<CSARecord>): CSARecord {
  return {
    id: 'csa-rec-001',
    organizationId: 'org-1',
    controlId: 'INV-MIN-005',
    bpmProcessId: 'proc-1',
    period: '2026-Q1',
    scheduleId: null,
    assessmentDate: Date.now(),
    assessedBy: 'Budi Santoso',
    result: 'Effective',
    comments: 'OK',
    isDraft: false,
    isBpmConfirmed: true,
    testProcedure: 'SOP sampling',
    archiveLocation: 'Gudang',
    samplingMethodology: 'Sampling atribut berbasis transaksi bulanan (2 sampel representatif).',
    documentList: 'BA',
    attrA: true,
    attrB: true,
    attrC: true,
    attrD: true,
    gpsVerified: false,
    latitude: null,
    longitude: null,
    timestampVerified: false,
    capturedAt: null,
    hash: 'hash-123',
    biometricVerified: false,
    itacScenario: null,
    itacMethod: null,
    itacSampleInfo: null,
    line2Status: 'Validated',
    line2Comments: null,
    line2ValidatedBy: null,
    line2ValidatedDate: null,
    workflowStatus: 'Approved',
    workflowHistory: [],
    samples: [],
    ...overrides,
  };
}

describe('CSA Lampiran 7 PDF Export (SK-5 Standards)', () => {
  const mockRecord = makeCsaRecord({
    samples: [
      makeSample({
        id: 'samp-1',
        sampleRef: 'BA-SO/02/2026',
        controlResults: {
          'INV-MIN-005': {
            riskId: 'risk-1',
            implemented: true,
            evidenceUrl: 'https://example.com/ba-feb.pdf',
            riskName: 'Risiko Selisih Saldo Batubara',
            controlName: 'Rekonsiliasi Stock Opname Bulanan',
          },
        },
      }),
      makeSample({
        id: 'samp-2',
        sampleRef: 'BA-SO/03/2026',
        controlResults: {
          'INV-MIN-005': {
            riskId: 'risk-1',
            implemented: true,
            evidenceUrl: 'https://example.com/ba-mar.pdf',
            riskName: 'Risiko Selisih Saldo Batubara',
            controlName: 'Rekonsiliasi Stock Opname Bulanan',
          },
        },
      }),
    ],
  });

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
