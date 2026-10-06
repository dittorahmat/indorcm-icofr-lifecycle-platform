import type { FsliCandidate, ParsedTbRow } from './smart-import-types';

interface FsliAccumulator {
  total: number;
  minNoUrut: number;
  explicitlyProvidedTotal: number | null;
}

export function aggregateFsliCandidates(rows: ParsedTbRow[]): FsliCandidate[] {
  if (!rows || rows.length === 0) return [];

  const fsliMap = new Map<string, FsliAccumulator>();

  rows.forEach((r) => {
    if (r.suggestedFsli) {
      const current = fsliMap.get(r.suggestedFsli) || {
        total: 0,
        minNoUrut: Infinity,
        explicitlyProvidedTotal: null,
      };
      fsliMap.set(r.suggestedFsli, {
        total: current.total + Math.abs(r.balance),
        minNoUrut: Math.min(current.minNoUrut, r.noUrut ?? Infinity),
        explicitlyProvidedTotal:
          r.fsliBalance !== undefined && r.fsliBalance !== null
            ? r.fsliBalance
            : current.explicitlyProvidedTotal,
      });
    }
  });

  return Array.from(fsliMap.entries())
    .map(([name, data]) => ({
      name,
      total:
        data.explicitlyProvidedTotal !== null && data.explicitlyProvidedTotal !== 0
          ? data.explicitlyProvidedTotal
          : data.total,
      minNoUrut: data.minNoUrut === Infinity ? 999999 : data.minNoUrut,
    }))
    .sort((a, b) => {
      if (a.minNoUrut !== b.minNoUrut) {
        return a.minNoUrut - b.minNoUrut;
      }
      return a.name.localeCompare(b.name);
    });
}
