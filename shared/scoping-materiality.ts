/**
 * scoping-materiality — pure FSLI aggregation + PM significance seam
 * (SK-5/DKU.MBU/11/2024).
 *
 * The TB/RCM ingestion route crosses this interface: it hands over the parsed
 * TB rows and gets the significant accounts back. Snapshot/row persistence and
 * the RCM fan-out stay in the route adapter — no DB, no side effects here.
 */

import type { SignificantAccount } from './types';

/** Boundary shape of one TB row as uploaded by the smart-import wizard. */
export interface MaterialityFsliRow {
  suggestedFsli?: string | null;
  accountName?: string | null;
  balance?: string | number | null;
  fsliBalance?: string | number | null;
  fsliCode?: string | null;
}

interface FsliAggregate {
  name: string;
  balance: number;
  fsliBalance: number;
  fsliCode?: string;
}

const absAmount = (value: string | number | null | undefined): number =>
  Math.abs(parseFloat(String(value ?? ''))) || 0;

/**
 * Aggregates TB rows per FSLI and keeps the accounts at or above PM.
 *
 * - Group key is `suggestedFsli || accountName`; a row without either groups
 *   under `''` (legacy grouped under `undefined`).
 * - `balance` sums the absolute account balances; the first non-zero FSLI
 *   summary column wins over that sum (`fsliBalance`).
 * - The threshold is inclusive (`>=`): a balance exactly at PM is significant.
 * - Every kept account carries `isQuantitative: true`; sub-PM accounts are
 *   dropped, matching the pre-extraction ingestion behaviour.
 */
export function aggregateFsliBalances(
  rows: readonly MaterialityFsliRow[],
  pmValue: number,
): SignificantAccount[] {
  const byFsli = new Map<string, FsliAggregate>();

  for (const row of rows) {
    const name = row.suggestedFsli || row.accountName || '';
    const balance = absAmount(row.balance);
    const fsliBalance = absAmount(row.fsliBalance);
    const current = byFsli.get(name);
    if (!current) {
      byFsli.set(name, { name, balance, fsliBalance, fsliCode: row.fsliCode ?? undefined });
      continue;
    }
    current.balance += balance;
    if (current.fsliBalance === 0 && fsliBalance > 0) current.fsliBalance = fsliBalance;
  }

  return Array.from(byFsli.values())
    .map((item) => {
      const finalBalance = item.fsliBalance > 0 ? item.fsliBalance : item.balance;
      return {
        name: item.name,
        balance: finalBalance,
        fsliCode: item.fsliCode,
        isQuantitative: finalBalance >= pmValue,
        assignedDepartmentIds: [],
      };
    })
    .filter((item) => item.isQuantitative);
}
