import { describe, it, expect } from 'vitest';
import { mapWbsRows, wbsColumns, wbsFilename } from '../lib/wbs-excel-export';
import type { WBSReport } from '@shared/types';

const labels = {
  date: 'Tanggal',
  category: 'Kategori',
  description: 'Deskripsi',
  impact: 'Estimasi Dampak',
  status: 'Status',
  controls: 'Kontrol Terkait',
};

function makeReport(overrides: Partial<WBSReport> = {}): WBSReport {
  return {
    id: 'WBS-2024-001',
    reportDate: new Date('2024-05-01T00:00:00Z').getTime(),
    category: 'Financial Reporting',
    description: 'Uji indikator',
    impactMagnitude: 500000000,
    status: 'Investigating',
    isFinancialImpact: true,
    relatedControlIds: ['CTRL-REV-01'],
    ...overrides,
  } as WBSReport;
}

describe('WBS Recap Excel Mapping', () => {
  it('produces 6 columns with numeric impact', () => {
    const columns = wbsColumns(labels);
    expect(columns.map((c) => c.key)).toEqual(['date', 'category', 'description', 'impact', 'status', 'controls']);
    expect(columns.find((c) => c.key === 'impact')?.numeric).toBe(true);
  });

  it('maps rows with ISO dates and joined control ids', () => {
    const rows = mapWbsRows([makeReport()]);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      category: 'Financial Reporting',
      description: 'Uji indikator [WBS-2024-001]',
      impact: 500000000,
      status: 'Investigating',
      controls: 'CTRL-REV-01',
    });
    expect(rows[0].date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('falls back to dashes for missing fields', () => {
    const rows = mapWbsRows([makeReport({ relatedControlIds: [], impactMagnitude: undefined, reportDate: null as any })]);
    expect(rows[0]).toMatchObject({ controls: '-', impact: '-', date: '-' });
  });

  it('builds a dated xlsx filename', () => {
    expect(wbsFilename(new Date('2025-01-02T00:00:00Z'))).toMatch(/^WBS_Fraud_Indicators_2025010[12]\.xlsx$/);
  });
});
