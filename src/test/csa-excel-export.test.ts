import { describe, it, expect } from 'vitest';
import {
  aggregateCsaControls,
  csaAppendixFilename,
  csaDetailedColumns,
  csaSummaryColumns,
  mapCsaDetailedRows,
  mapCsaSummaryRows,
} from '../lib/csa-excel-export';
import type { CSARecord } from '@shared/types';

function makeRecord(): CSARecord {
  return {
    id: 'csa-1',
    period: '2025-Q1',
    result: 'Ineffective',
    assessmentDate: Date.now(),
    assessedBy: 'Lini 1',
    samples: [
      {
        id: 's-1',
        sampleRef: 'TRX-001',
        controlResults: {
          'CTL-01': { implemented: true, evidenceUrl: 'https://x/e1.pdf', riskId: 'R1', riskName: 'Risiko A', controlName: 'Kontrol A' },
          'CTL-02': { implemented: false, riskId: 'R2', riskName: 'Risiko B', controlName: 'Kontrol B' },
        },
      },
      {
        id: 's-2',
        sampleRef: 'TRX-002',
        controlResults: {
          'CTL-01': { implemented: true, riskId: 'R1', riskName: 'Risiko A', controlName: 'Kontrol A' },
        },
      },
    ],
  } as unknown as CSARecord;
}

describe('CSA Appendix 7a Excel Mapping', () => {
  it('aggregates per-control pass/fail counts', () => {
    const aggs = aggregateCsaControls(makeRecord());
    expect(aggs).toHaveLength(2);
    expect(aggs.find((a) => a.id === 'CTL-01')).toMatchObject({ total: 2, pass: 2, fail: 0 });
    expect(aggs.find((a) => a.id === 'CTL-02')).toMatchObject({ total: 1, pass: 0, fail: 1 });
  });

  it('builds summary rows with localized status and numeric counts', () => {
    const rows = mapCsaSummaryRows(makeRecord(), { effectiveText: 'EFEKTIF', ineffectiveText: 'TIDAK EFEKTIF' });
    expect(rows).toHaveLength(2);
    expect(rows[0]).toMatchObject({ no: 1, total: 2, pass: 2, fail: 0, status: 'EFEKTIF' });
    expect(rows[1]).toMatchObject({ status: 'TIDAK EFEKTIF' });
    expect(csaSummaryColumns({ no: 'No', control: 'Kontrol', totalSamples: 'Total', pass: 'P', fail: 'F', status: 'S', effectiveText: '', ineffectiveText: '' })).toHaveLength(6);
  });

  it('builds detailed rows per sample-control pair with evidence flags', () => {
    const rows = mapCsaDetailedRows(makeRecord(), {
      passText: 'Lolos',
      failText: 'Gagal',
      hasEvidenceText: 'Ada Bukti',
      noEvidenceText: 'Tanpa Bukti',
    });
    expect(rows).toHaveLength(3);
    expect(rows[0]).toMatchObject({ no: 1, sampleRef: 'TRX-001', result: 'Lolos', evidence: 'Ada Bukti' });
    expect(rows[1]).toMatchObject({ result: 'Gagal', evidence: 'Tanpa Bukti' });
    expect(csaDetailedColumns({ no: 'No', sampleRef: 'S', control: 'C', result: 'R', evidence: 'E', passText: '', failText: '', hasEvidenceText: '', noEvidenceText: '' })).toHaveLength(5);
  });

  it('returns empty arrays when the record has no samples', () => {
    const empty = { id: 'x', samples: [] } as unknown as CSARecord;
    expect(mapCsaSummaryRows(empty, { effectiveText: 'E', ineffectiveText: 'I' })).toHaveLength(0);
    expect(mapCsaDetailedRows(empty, { passText: 'P', failText: 'F', hasEvidenceText: 'Y', noEvidenceText: 'N' })).toHaveLength(0);
  });

  it('builds safe xlsx filenames per layout', () => {
    expect(csaAppendixFilename('detailed', 'GL123/2025 Q1', '2025-Q1')).toBe('CSA_Appendix7a_Detailed_GL123-2025-Q1_2025-Q1.xlsx');
    expect(csaAppendixFilename('summary', 'REF', '2025-Q1')).toBe('CSA_Appendix7a_Summary_REF_2025-Q1.xlsx');
  });

  it('builds record summary rows with assessor, reviewer, and verification status', async () => {
    const { buildCsaRecordSummaryRows } = await import('../lib/csa-excel-export');
    const summaryRows = buildCsaRecordSummaryRows({
      processName: 'Pengadaan Batubara',
      bpmProcessId: 'BPM-PROC-01',
      period: '2025-Q1',
      assessmentDate: 1700000000000,
      result: 'Effective',
      samples: [],
    });

    expect(summaryRows).toContainEqual({ Field: 'Assessor (Lini 1)', Value: 'Petugas CSA Lapangan' });
    expect(summaryRows).toContainEqual({ Field: 'Reviewer (Lini 2)', Value: 'Koordinator Pengendalian Internal' });
    expect(summaryRows).toContainEqual({ Field: 'Status Verifikasi', Value: 'TERVERIFIKASI DIGITAL' });
  });
});
