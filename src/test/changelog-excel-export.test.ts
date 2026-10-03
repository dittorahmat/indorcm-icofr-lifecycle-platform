import { describe, it, expect } from 'vitest';
import { format } from 'date-fns';
import {
  changeLogRegulatoryColumns,
  changeLogRegulatoryFilename,
  extractChangeLogMeta,
  mapChangeLogToRegulatoryRow,
} from '../lib/changelog-excel-export';
import type { ChangeLog } from '@shared/types';

const labels = {
  no: 'No (i)',
  company: 'Perusahaan (ii)',
  process: 'Proses Bisnis (iii)',
  subProcess: 'Sub-Proses (iv)',
  reportDate: 'Tanggal Laporan (v)',
  owner: 'Pemilik Pengendalian (vi)',
  descBefore: 'Deskripsi Sebelum (vii)',
  descAfter: 'Deskripsi Setelah (viii)',
  refBefore: 'Referensi Sebelum (ix)',
  refAfter: 'Referensi Setelah (x)',
  effectiveDate: 'Tanggal Efektif (xi)',
  preparer: 'Penyusun (Lini 1)',
  approver: 'Penyetuju (Lini 2)',
};

function makeLog(overrides: Partial<ChangeLog> = {}): ChangeLog {
  return {
    id: 'log-1',
    organizationId: 'org-1',
    userId: 'user-1',
    action: 'UPDATE',
    entityType: 'Control',
    entityId: 'CTL-01',
    descriptionBefore: 'Deskripsi lama',
    descriptionAfter: 'Deskripsi baru',
    dataBefore: { process: 'Pengadaan', controlId: 'CTL-01' },
    dataAfter: { process: 'Pengadaan', subProcess: 'Seleksi Vendor', controlId: 'CTL-01', executingFunction: 'Procurement' },
    timestamp: new Date('2025-06-01T10:00:00Z').getTime(),
    effectiveDate: new Date('2025-07-01T00:00:00Z').getTime(),
    isRegulatory: true,
    approvedBy: 'user-2',
    changeCategory: 'control',
    ...overrides,
  } as ChangeLog;
}

describe('ChangeLog Excel Export Mapping', () => {
  it('produces exactly 13 regulatory columns (i-xi plus sign-off)', () => {
    const columns = changeLogRegulatoryColumns(labels);
    expect(columns).toHaveLength(13);
    expect(columns[0]).toMatchObject({ key: 'no', header: 'No (i)', numeric: true });
    expect(columns[columns.length - 1]).toMatchObject({ key: 'approver', header: 'Penyetuju (Lini 2)' });
  });

  it('maps a full log row with ISO dates and resolved user names', () => {
    const row = mapChangeLogToRegulatoryRow(makeLog(), 0, 'PT Bukit Asam Tbk', (id) => `User(${id})`);
    expect(row).toMatchObject({
      no: 1,
      company: 'PT Bukit Asam Tbk',
      process: 'Pengadaan',
      subProcess: 'Seleksi Vendor',
      owner: 'Procurement',
      descBefore: 'Deskripsi lama',
      descAfter: 'Deskripsi baru',
      refBefore: 'CTL-01',
      refAfter: 'CTL-01',
      preparer: 'User(user-1)',
      approver: 'User(user-2)',
    });
    expect(row.reportDate).toBe(format(new Date('2025-06-01T10:00:00Z').getTime(), 'yyyy-MM-dd HH:mm:ss'));
    expect(row.effectiveDate).toBe(format(new Date('2025-07-01T00:00:00Z').getTime(), 'yyyy-MM-dd'));
  });

  it('falls back to dashes when metadata is missing', () => {
    const meta = extractChangeLogMeta(
      makeLog({ dataBefore: null, dataAfter: null, descriptionBefore: null, descriptionAfter: null }),
    );
    expect(meta).toMatchObject({
      process: '-',
      subProcess: '-',
      descBefore: '-',
      descAfter: '-',
      owner: '-',
    });
  });

  it('builds a Lampiran 6 xlsx filename', () => {
    const filename = changeLogRegulatoryFilename();
    expect(filename.startsWith('BUMN_ICOFR_ChangeLog_Lampiran6_')).toBe(true);
    expect(filename.endsWith('.xlsx')).toBe(true);
  });
});
