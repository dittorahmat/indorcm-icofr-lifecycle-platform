import { describe, expect, it } from 'vitest';
import { buildGlExportRows, type GlExportLabels } from '../gl-data-grid-export';
import type { GLRow } from '@shared/types';

const labels: GlExportLabels = {
  entityCode: 'entity',
  fsli: 'fsli',
  accountCode: 'code',
  accountDesc: 'desc',
  balance: 'balance',
  quantitative: 'quant',
  owner: 'owner',
  acceptance: 'acceptance',
  scope: 'scope',
  significant: 'SIGNIFICANT',
  notSignificant: 'NOT SIGNIFICANT',
  inScope: 'IN SCOPE',
  outScope: 'OUT SCOPE',
  pending: 'PENDING',
  unassigned: 'UNASSIGNED',
};

const glRow = (over: Partial<GLRow>): GLRow => ({
  id: 'g',
  organizationId: 'o',
  snapshotId: 's',
  ymd: 'y',
  entityCode: 'E1',
  parentEntityCode: null,
  entityId: null,
  noGL: '1',
  glDesc: 'desc',
  currency: 'IDR',
  balance: 0,
  fsliBalance: null,
  fsliCode: 'f',
  fsliName: 'Revenue',
  category: 'Revenue',
  subKategori: 'sk',
  noUrut: 1,
  assignedDepartmentIds: [],
  ownerAcceptance: null,
  mappingConfidence: 1,
  ...over,
});

describe('buildGlExportRows', () => {
  it('emits one FSLI header row followed by its accounts, in input order', () => {
    const rows = buildGlExportRows({
      rows: [
        glRow({ id: '1', noGL: '4001', fsliName: 'Revenue', balance: 2_000 }),
        glRow({ id: '2', noGL: '1001', fsliName: 'Assets', balance: 900 }),
        glRow({ id: '3', noGL: '4002', fsliName: 'Revenue', balance: 1_000 }),
      ],
      pmValue: 1_000,
      departments: [],
      labels,
    });

    expect(rows.map((row) => row[labels.fsli])).toEqual([
      '[FSLI] Revenue',
      'Revenue',
      'Revenue',
      '[FSLI] Assets',
      'Assets',
    ]);
    expect(rows[0][labels.accountCode]).toBe('');
  });

  it('keeps a below-PM leaf significant when its FSLI total clears PM', () => {
    const rows = buildGlExportRows({
      rows: [
        glRow({ id: '1', noGL: '4001', balance: 100, scopeClassification: 'two-thirds', fsliBalance: 5_000 }),
        glRow({ id: '2', noGL: '4002', balance: 4_900, scopeClassification: 'above-pm', fsliBalance: 5_000 }),
      ],
      pmValue: 1_000,
      departments: [],
      labels,
    });

    // The old export compared each leaf alone and printed NOT SIGNIFICANT here.
    expect(rows[1][labels.quantitative]).toBe('SIGNIFICANT');
    expect(rows[1][labels.scope]).toBe('IN SCOPE');
    expect(rows[0][labels.scope]).toBe('IN SCOPE');
  });

  it('keeps a qualitative row in scope while its quantitative column stays negative', () => {
    const rows = buildGlExportRows({
      rows: [glRow({ balance: 10, scopeClassification: 'qualitative' })],
      pmValue: 1_000,
      departments: [],
      labels,
    });

    expect(rows[1][labels.scope]).toBe('IN SCOPE');
    expect(rows[1][labels.quantitative]).toBe('NOT SIGNIFICANT');
  });

  it('prefers an explicit FSLI total and joins department owners', () => {
    const rows = buildGlExportRows({
      rows: [
        glRow({
          noGL: '4001',
          balance: 300,
          fsliBalance: 7_000,
          assignedDepartmentIds: ['d1', 'd2'],
          ownerAcceptance: 'Accepted',
        }),
      ],
      pmValue: 1_000,
      departments: [
        { id: 'd1', name: 'Finance' },
        { id: 'd2', name: 'Procurement' },
      ],
      labels,
    });

    expect(rows[0][labels.balance]).toBe(7_000);
    expect(rows[1][labels.owner]).toBe('Finance, Procurement');
    expect(rows[1][labels.acceptance]).toBe('Accepted');
  });

  it('falls back to summed balances, an unassigned owner and a pending acceptance', () => {
    const rows = buildGlExportRows({
      rows: [
        glRow({ id: '1', balance: 600, scopeClassification: 'above-pm' }),
        glRow({ id: '2', balance: 400, scopeClassification: 'above-pm' }),
      ],
      pmValue: 1_000,
      departments: [],
      labels,
    });

    expect(rows[0][labels.balance]).toBe(1_000);
    expect(rows[1][labels.owner]).toBe('UNASSIGNED');
    expect(rows[1][labels.acceptance]).toBe('PENDING');
  });

  it('marks an out-of-scope FSLI as such in both the header and leaf rows', () => {
    const rows = buildGlExportRows({
      rows: [glRow({ balance: 10, scopeClassification: 'out-of-scope' })],
      pmValue: 1_000,
      departments: [],
      labels,
    });

    expect(rows[0][labels.scope]).toBe('OUT SCOPE');
    expect(rows[1][labels.scope]).toBe('OUT SCOPE');
    expect(rows[1][labels.quantitative]).toBe('NOT SIGNIFICANT');
  });
});
