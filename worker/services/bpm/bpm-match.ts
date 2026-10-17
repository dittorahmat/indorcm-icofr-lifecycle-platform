import { sql, type SQL } from 'drizzle-orm';
import type { PgColumn } from 'drizzle-orm/pg-core';

/**
 * Single owner of the process/sub-process name-match key: trim + lowercase.
 *
 * Four inline `TRIM(LOWER(...))` SQL copies lived in `bpm-service.ts`; every
 * name lookup now goes through here so the aliases can never drift
 * (CODING_STANDARDS §"Normalizers and cache keys are single-sourced").
 */
export function normalizeProcessName(value: string): string {
  return value.trim().toLowerCase();
}

/**
 * The one sub-process name-match predicate:
 * `TRIM(LOWER(column)) = normalizeProcessName(value)`.
 *
 * The value side is normalized in-process, so aliased input (case/whitespace
 * variants of the same name) builds byte-identical SQL and binds the same param.
 */
export function sameSubProcess(column: PgColumn, value: string): SQL<unknown> {
  return sql`TRIM(LOWER(${column})) = ${normalizeProcessName(value)}`;
}
