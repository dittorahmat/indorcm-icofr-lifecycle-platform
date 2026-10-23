/**
 * cooling-off — Bab II independence rule, owned in one tested module.
 *
 * An internal auditor may not test a control whose process they owned as
 * Line 1 or Line 2 within the last 12 months (SK-5/DKU.MBU/11/2024 Bab II).
 * The rule used to be a closure inside `TestWorkbench.tsx`, unreachable
 * without rendering the page and with no boundary test.
 *
 * Owner decision: the window is a rolling 12 months from `now`, matching the
 * behaviour that shipped. It is not derived from the fiscal year.
 */
export interface OwnershipHistoryEntry {
  processId: string;
  role: string;
  endDate: number;
}

export const COOLING_OFF_WINDOW_MS = 365 * 24 * 60 * 60 * 1000;

/** True when testing `processId` would breach the auditor's cooling-off period. */
export function isCoolingOffViolation(
  history: readonly OwnershipHistoryEntry[] | null | undefined,
  processId: string | null | undefined,
  now: number,
): boolean {
  if (!history || history.length === 0 || !processId) return false;
  const windowStart = now - COOLING_OFF_WINDOW_MS;

  return history.some(
    (entry) =>
      entry.processId === processId &&
      (entry.role === 'Line 1' || entry.role === 'Line 2') &&
      entry.endDate > windowStart,
  );
}
