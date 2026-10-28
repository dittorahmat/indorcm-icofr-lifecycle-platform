import { eq, or, sql, type SQL } from 'drizzle-orm';
import type { PgColumn } from 'drizzle-orm/pg-core';

/**
 * Period year matching helper for standardized multi-tenant year queries.
 * Handles exact year ('2025'), prefix ('2025-Q1', '2025-01'), and quarter format ('Q1-2025').
 * Uses index-friendly B-Tree lookups and prevents unindexed full table scans.
 */
export function matchesPeriodYear(periodColumn: PgColumn, year: number | string): SQL<unknown> {
  const yearStr = String(year);
  return or(
    eq(periodColumn, yearStr),
    sql`${periodColumn} LIKE ${yearStr + '-%'}`,
    sql`${periodColumn} LIKE ${'%-Q%'} AND ${periodColumn} LIKE ${'%' + yearStr + '%'}`
  ) as SQL<unknown>;
}
