import { describe, it, expect } from 'vitest';
import {
  findingsColumns,
  findingsFilename,
  mapFindingsRows,
  resolveFindingControlName,
} from '../lib/findings-excel-export';
import type { Deficiency } from '@shared/types';

const labels = {
  no: 'No',
  ref: 'Ref. Temuan',
  description: 'Deskripsi Temuan',
  control: 'Kontrol Terkait',
  severity: 'Tingkat',
  exposure: 'Nilai Eksposur',
  identifiedBy: 'Ditemukan Oleh',
  identifiedDate: 'Tanggal Temuan',
  source: 'Sumber',
  status: 'Status',
};

function makeDeficiency(overrides: Partial<Deficiency> = {}): Deficiency {
  return {
    id: 'DEF-001',
    controlId: 'CTRL-001',
    description: 'Uji temuan',
    severity: 'Significant Deficiency',
    status: 'Open',
    source: 'Lini 3 - Audit',
    exposureValue: 2500000000,
    identifiedBy: 'SPI',
    identifiedDate: new Date('2025-03-15T00:00:00Z').getTime(),
    ...overrides,
  } as Deficiency;
}

const controls = [{ id: 'CTRL-001', code: 'PRC-001', name: 'Rekonsiliasi Bank' }];

describe('Findings (Lampiran 9) Excel Mapping', () => {
  it('produces exactly 10 columns with numeric exposure', () => {
    const columns = findingsColumns(labels);
    expect(columns).toHaveLength(10);
    expect(columns.map((c) => c.key)).toEqual([
      'no', 'ref', 'description', 'control', 'severity',
      'exposure', 'identifiedBy', 'identifiedDate', 'source', 'status',
    ]);
    expect(columns.find((c) => c.key === 'exposure')?.numeric).toBe(true);
  });

  it('maps rows with resolved control names and ISO dates', () => {
    const rows = mapFindingsRows([makeDeficiency()], (d) => resolveFindingControlName(d, controls));
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      no: 1,
      ref: 'DEF-001',
      control: 'PRC-001 - Rekonsiliasi Bank',
      severity: 'Significant Deficiency',
      exposure: 2500000000,
      identifiedBy: 'SPI',
      source: 'Lini 3 - Audit',
      status: 'Open',
    });
    expect(rows[0].identifiedDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('falls back to dashes for missing control, exposure, and dates', () => {
    const rows = mapFindingsRows(
      [makeDeficiency({ controlId: undefined, exposureValue: undefined, identifiedDate: null, identifiedBy: null })],
      (d) => resolveFindingControlName(d, []),
    );
    expect(rows[0]).toMatchObject({ control: '-', exposure: '-', identifiedDate: '-', identifiedBy: '-' });
  });

  it('builds a Lampiran 9 xlsx filename', () => {
    expect(findingsFilename(2025)).toBe('Lampiran_9_Daftar_Temuan_2025.xlsx');
  });
});
