import { describe, it, expect } from 'vitest';
import {
  buildCsaRecordSummaryRows,
  buildCsaRecordSampleRows,
} from '../csa-excel-export';

const baseInput = {
  processName: 'Procure to Pay',
  bpmProcessId: 'BPM-01',
  period: '2025',
  assessmentDate: new Date('2025-06-30T10:00:00').getTime(),
  result: 'Effective',
  comments: 'All good',
  samples: [],
};

describe('buildCsaRecordSummaryRows', () => {
  it('includes the Process ID row when bpmProcessId is provided', () => {
    const rows = buildCsaRecordSummaryRows(baseInput);
    expect(rows).toHaveLength(6);
    expect(rows[0]).toEqual({ Field: 'Process Name', Value: 'Procure to Pay' });
    expect(rows[1]).toEqual({ Field: 'Process ID', Value: 'BPM-01' });
    expect(rows[3]).toEqual({ Field: 'Assessment Date', Value: '2025-06-30 10:00' });
  });

  it('skips the Process ID row when bpmProcessId is absent (CSAPage parity)', () => {
    const rows = buildCsaRecordSummaryRows({ ...baseInput, bpmProcessId: undefined });
    expect(rows).toHaveLength(5);
    expect(rows.find((r) => r.Field === 'Process ID')).toBeUndefined();
  });

  it('falls back to N/A process name and empty comments', () => {
    const rows = buildCsaRecordSummaryRows({
      ...baseInput,
      processName: '',
      comments: null,
    });
    expect(rows[0]).toEqual({ Field: 'Process Name', Value: 'N/A' });
    expect(rows[rows.length - 1]).toEqual({ Field: 'Comments', Value: '' });
  });
});

describe('buildCsaRecordSampleRows', () => {
  it('maps samples with Mapped/Empty and Yes/N/A flags', () => {
    const rows = buildCsaRecordSampleRows([
      { sampleRef: 'S-01', controlResults: { c1: {} }, itacMatch: true },
      { sampleRef: 'S-02', controlResults: null, itacMatch: false },
    ]);
    expect(rows).toEqual([
      { No: 1, 'Sample Ref': 'S-01', Result: 'Mapped', 'ITAC Match': 'Yes' },
      { No: 2, 'Sample Ref': 'S-02', Result: 'Empty', 'ITAC Match': 'N/A' },
    ]);
  });

  it('returns an empty array when there are no samples', () => {
    expect(buildCsaRecordSampleRows([])).toEqual([]);
  });
});
