import { describe, it, expect } from 'vitest';
import { aggregateFsliBalances, type MaterialityFsliRow } from './scoping-materiality';

const row = (over: Partial<MaterialityFsliRow>): MaterialityFsliRow => ({
  suggestedFsli: 'Kas dan Setara Kas',
  accountName: 'Kas',
  balance: 100,
  ...over,
});

/** Contract lock for the PM significance outcome (SK-5/DKU.MBU/11/2024). */
describe('aggregateFsliBalances', () => {
  it('sums account balances per FSLI and drops sub-PM FSLIs', () => {
    const result = aggregateFsliBalances(
      [
        row({ accountName: 'Kas Kecil', balance: 400 }),
        row({ accountName: 'Kas Besar', balance: 200 }),
        row({ suggestedFsli: 'Piutang Usaha', accountName: 'Piutang', balance: 100 }),
      ],
      500,
    );

    expect(result).toEqual([
      {
        name: 'Kas dan Setara Kas',
        balance: 600,
        fsliCode: undefined,
        isQuantitative: true,
        assignedDepartmentIds: [],
      },
    ]);
  });

  it('treats a balance exactly at PM as significant (inclusive threshold)', () => {
    const atPm = aggregateFsliBalances([row({ balance: 500 })], 500);
    const belowPm = aggregateFsliBalances([row({ balance: 500 })], 500.01);

    expect(atPm).toHaveLength(1);
    expect(atPm[0].isQuantitative).toBe(true);
    expect(belowPm).toEqual([]);
  });

  it('prefers the FSLI summary column over the summed account balances', () => {
    const result = aggregateFsliBalances(
      [
        row({ accountName: 'Kas Kecil', balance: 100, fsliBalance: 900 }),
        row({ accountName: 'Kas Besar', balance: 100 }),
      ],
      800,
    );

    expect(result).toEqual([
      {
        name: 'Kas dan Setara Kas',
        balance: 900,
        fsliCode: undefined,
        isQuantitative: true,
        assignedDepartmentIds: [],
      },
    ]);
  });

  it('keeps the first non-zero FSLI summary and ignores later ones', () => {
    const result = aggregateFsliBalances(
      [
        row({ accountName: 'A', balance: 10, fsliBalance: 0 }),
        row({ accountName: 'B', balance: 10, fsliBalance: 300 }),
        row({ accountName: 'C', balance: 10, fsliBalance: 900 }),
      ],
      250,
    );

    expect(result).toHaveLength(1);
    expect(result[0].balance).toBe(300);
  });

  it('falls back to the account name and keeps first-seen order + fsliCode', () => {
    const result = aggregateFsliBalances(
      [
        row({ suggestedFsli: null, accountName: 'Persediaan', balance: 100, fsliCode: 'F-1' }),
        row({ suggestedFsli: 'Aset Tetap', accountName: 'Tanah', balance: 200, fsliCode: 'F-2' }),
        row({ suggestedFsli: null, accountName: 'Persediaan', balance: 50, fsliCode: 'F-9' }),
      ],
      0,
    );

    expect(result.map((a) => a.name)).toEqual(['Persediaan', 'Aset Tetap']);
    expect(result[0]).toEqual({
      name: 'Persediaan',
      balance: 150,
      fsliCode: 'F-1',
      isQuantitative: true,
      assignedDepartmentIds: [],
    });
    expect(result[1].fsliCode).toBe('F-2');
  });

  it('aggregates on absolute values so credit balances still count', () => {
    const result = aggregateFsliBalances([row({ balance: -700, fsliBalance: -700 })], 600);

    expect(result).toEqual([
      {
        name: 'Kas dan Setara Kas',
        balance: 700,
        fsliCode: undefined,
        isQuantitative: true,
        assignedDepartmentIds: [],
      },
    ]);
  });

  it('treats unparseable balances as zero', () => {
    const result = aggregateFsliBalances(
      [
        row({ suggestedFsli: null, accountName: 'Kosong', balance: 'n/a' }),
        row({ suggestedFsli: null, accountName: 'Hilang', balance: null, fsliBalance: null }),
      ],
      0,
    );

    expect(result.map((a) => a.balance)).toEqual([0, 0]);
  });

  it('keeps every FSLI when PM is zero (legacy ingestion behaviour)', () => {
    const result = aggregateFsliBalances([row({ accountName: 'Nol', balance: 0 })], 0);

    expect(result).toHaveLength(1);
    expect(result[0].balance).toBe(0);
  });

  it('returns nothing for an empty TB', () => {
    expect(aggregateFsliBalances([], 100)).toEqual([]);
  });
});
