import { getTableName } from 'drizzle-orm';
import * as schema from '../../worker/db/schema';
import { toDirectUrl, databaseHost } from './db-url.mjs';

/**
 * Pure planning/verification logic for the identity clone. Kept out of the
 * script (and tested) so the rules that decide "clone succeeded" cannot drift
 * from the rules that perform the copy.
 */

export { toDirectUrl, databaseHost };

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

export interface TargetEnvSelection {
  envName: string;
  url: string;
}

export interface TargetEnvResult {
  selection?: TargetEnvSelection;
  error?: string;
}

/**
 * Known target environment variable naming pattern. Target names identify an
 * isolated instance database (e.g. `TEST_DATABASE_URL`, `DEMO_DATABASE_URL`).
 */
export const TARGET_ENV_SUFFIX = '_DATABASE_URL';

/**
 * Resolves the clone destination from `--target-env <NAME>` and the process
 * environment (populated by dotenv or current shell process). There is deliberately
 * no default: a shared target variable becomes ambiguous as soon as a third
 * database exists.
 */
export function resolveTargetEnv(
  argv: string[],
  env: Record<string, string | undefined>,
): TargetEnvResult {
  const flagIndex = argv.indexOf('--target-env');
  if (flagIndex === -1) {
    return {
      error:
        'Missing --target-env <NAME>. Pass the environment variable name that holds the destination, ' +
        'for example --target-env TEST_DATABASE_URL (or set it in .env / current environment).',
    };
  }

  const envName = argv[flagIndex + 1];
  if (!envName || envName.startsWith('--')) {
    return { error: '--target-env requires a variable name, for example TEST_DATABASE_URL.' };
  }

  const url = env[envName];
  if (!url || url.trim().length === 0) {
    return {
      error:
        `Environment variable "${envName}" is not set or empty. Add ${envName}=... to .env ` +
        'or export it before running the clone.',
    };
  }

  return { selection: { envName, url } };
}



export interface TargetContentVerdict {
  ok: boolean;
  nonEmptyTables: string[];
}

/**
 * Pre-write guard: the target's content tables must all be empty. Identity and
 * operational tables are excluded by `selectContentTables` before this runs.
 * The same verdict is used in dry-run and --apply, so a mis-targeted dry run
 * fails before anyone can add --apply.
 */
export function evaluateTargetContent(counts: Record<string, number>): TargetContentVerdict {
  const nonEmptyTables = Object.entries(counts)
    .filter(([, count]) => count > 0)
    .map(([table]) => table)
    .sort();

  return { ok: nonEmptyTables.length === 0, nonEmptyTables };
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

export interface PublicSchemaTableVerdict {
  ok: boolean;
  leftoverTables: string[];
}

/**
 * Bootstrap invariant check: no application tables may exist in the public schema.
 * All application tables must reside in the `icofr` schema with search_path pinned.
 */
export function evaluatePublicSchemaTables(tableNames: string[]): PublicSchemaTableVerdict {
  const systemPublicTables = new Set(['spatial_ref_sys']);
  const leftoverTables = tableNames
    .filter((t) => !systemPublicTables.has(t))
    .sort();
  return {
    ok: leftoverTables.length === 0,
    leftoverTables,
  };
}
