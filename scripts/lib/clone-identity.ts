import { getTableName } from 'drizzle-orm';
import * as schema from '../../worker/db/schema';

/**
 * Pure planning/verification logic for the identity clone. Kept out of the
 * script (and tested) so the rules that decide "clone succeeded" cannot drift
 * from the rules that perform the copy.
 */

export interface IdentityTable {
  table: string;
  pk: string;
  /** Column holding a self-referencing FK, nulled during insert. */
  selfFkColumn?: string;
}

export const IDENTITY_TABLES: IdentityTable[] = [
  { table: getTableName(schema.organization), pk: 'id' },
  { table: getTableName(schema.businessEntities), pk: 'id', selfFkColumn: 'parent_id' },
  { table: getTableName(schema.departments), pk: 'id' },
  { table: getTableName(schema.user), pk: 'id' },
  { table: getTableName(schema.account), pk: 'id' },
  { table: getTableName(schema.member), pk: 'id' },
  { table: getTableName(schema.userPreferences), pk: 'user_id' },
];

export const IDENTITY_TABLE_NAMES: string[] = IDENTITY_TABLES.map((spec) => spec.table);

/** Neon serves pooled URLs from a `-pooler` host; scripts need the direct one. */
export function toDirectUrl(url: string): string {
  return url.replace('-pooler', '');
}

/** True when two connection strings point at the same database (pooled or not). */
export function isSameDatabase(left: string, right: string): boolean {
  try {
    const a = new URL(toDirectUrl(left));
    const b = new URL(toDirectUrl(right));
    return a.host === b.host && a.pathname === b.pathname;
  } catch {
    return toDirectUrl(left) === toDirectUrl(right);
  }
}

/**
 * Tables that are non-identity but legitimately carry runtime rows and are
 * deliberately excluded from the clone. They are not ICOFR content: sessions and
 * verification tokens appear after the first login, notifications/audit logs
 * after the first request, AI cache after the first suggestion, and the license
 * row is created by the app. Keeping them out of the emptiness gate lets the
 * verification run at any time without false alarms.
 */
export const OPERATIONAL_TABLES: string[] = [
  'session',
  'verification',
  'notifications',
  'audit_logs',
  'ai_cache_entries',
  'system_licenses',
];

/**
 * Every non-identity table in the application schema must stay empty on the
 * target. Derived from the live table list so a newly added content table is
 * covered without editing this module.
 */
export function selectContentTables(allTables: string[]): string[] {
  return allTables
    .filter((table) => !IDENTITY_TABLE_NAMES.includes(table))
    .filter((table) => !OPERATIONAL_TABLES.includes(table))
    .filter((table) => !table.startsWith('_'))
    .sort();
}

export interface CloneVerification {
  sourceCounts: Record<string, number>;
  targetCounts: Record<string, number>;
  contentCounts: Record<string, number>;
  /** Credential (`providerId = 'credential'`) accounts present in the source. */
  credentialRows: number;
  /** Credential accounts found in both databases with a readable hash. */
  comparableHashes: number;
  hashMismatches: number;
}

export interface CloneVerdict {
  ok: boolean;
  countMismatches: { table: string; source: number; target: number }[];
  failures: string[];
}

export function evaluateClone(verification: CloneVerification): CloneVerdict {
  const countMismatches = IDENTITY_TABLE_NAMES.map((table) => ({
    table,
    source: verification.sourceCounts[table] ?? 0,
    target: verification.targetCounts[table] ?? 0,
  })).filter((row) => row.source !== row.target);

  const nonEmptyContent = Object.entries(verification.contentCounts)
    .filter(([, count]) => count > 0)
    .map(([table]) => table);

  const failures: string[] = [];
  if (countMismatches.length > 0) {
    failures.push(
      `identity row counts differ: ${countMismatches.map((row) => `${row.table} ${row.source}->${row.target}`).join(', ')}`,
    );
  }
  if (verification.credentialRows > 0 && verification.comparableHashes === 0) {
    failures.push('credential hash check had no comparable rows (failing closed)');
  } else if (verification.comparableHashes < verification.credentialRows) {
    failures.push(
      `credential hash check compared ${verification.comparableHashes}/${verification.credentialRows} row(s); unverifiable rows are failing closed`,
    );
  }
  if (verification.hashMismatches > 0) {
    failures.push(`${verification.hashMismatches} credential hash(es) differ from the source`);
  }
  if (nonEmptyContent.length > 0) {
    failures.push(`content tables are not empty: ${nonEmptyContent.join(', ')}`);
  }

  return { ok: failures.length === 0, countMismatches, failures };
}
