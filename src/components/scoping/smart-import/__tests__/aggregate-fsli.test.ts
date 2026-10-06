import { describe, it, expect } from 'vitest';
import { aggregateFsliCandidates } from '../aggregate-fsli';
import type { ParsedTbRow } from '../smart-import-types';

function row(overrides: Partial<ParsedTbRow> = {}): ParsedTbRow {
  return {
    accountCode: '1110.01',
    accountName: 'Kas Kecil',
    balance: 1_000_000,
    suggestedFsli: 'Kas & Bank',
    noUrut: 1,
    ...overrides,
  };
}

describe('aggregateFsliCandidates', () => {
  it('returns empty for empty input', () => {
    expect(aggregateFsliCandidates([])).toEqual([]);
  });

  it('sums absolute balances per FSLI', () => {
    const result = aggregateFsliCandidates([
      row({ balance: 1_000_000 }),
      row({ balance: -500_000 }),
    ]);
    expect(result).toHaveLength(1);
    expect(result[0]?.total).toBe(1_500_000);
  });

  it('prefers the explicitly provided FSLI total when non-zero', () => {
    const result = aggregateFsliCandidates([
      row({ balance: 1_000_000, fsliBalance: 9_000_000 }),
      row({ balance: 2_000_000, fsliBalance: null }),
    ]);
    expect(result[0]?.total).toBe(9_000_000);
  });

  it('sorts by sequence number first, then name', () => {
    const result = aggregateFsliCandidates([
      row({ suggestedFsli: 'Zulu', noUrut: 5, balance: 1 }),
      row({ suggestedFsli: 'Alpha', noUrut: 5, balance: 1 }),
      row({ suggestedFsli: 'Mike', noUrut: 2, balance: 1 }),
    ]);
    expect(result.map((r) => r.name)).toEqual(['Mike', 'Alpha', 'Zulu']);
  });

  it('skips rows without a suggested FSLI', () => {
    const result = aggregateFsliCandidates([row({ suggestedFsli: undefined })]);
    expect(result).toEqual([]);
  });
});
