import { describe, it, expect } from 'vitest';
import { getTableName } from 'drizzle-orm';
import * as schema from '../../worker/db/schema';
import {
  IDENTITY_TABLES,
  IDENTITY_TABLE_NAMES,
  toDirectUrl,
  isSameDatabase,
  selectContentTables,
  evaluateClone,
  evaluateTargetContent,
  databaseHost,
  resolveTargetEnv,
  evaluatePublicSchemaTables,
  type CloneVerification,
} from '../lib/clone-identity';

/**
 * The clone script decides whether a tenant bootstrap succeeded. These tests
 * lock the rules that matter operationally: table names cannot drift from the
 * schema, pooled/direct URLs are the same database, every non-identity table is
 * checked for content, and a vacuous hash comparison fails closed.
 */
describe('identity table specs', () => {
  it('derives table names from the schema instead of hardcoded strings', () => {
    expect(IDENTITY_TABLE_NAMES).toEqual([
      getTableName(schema.organization),
      getTableName(schema.businessEntities),
      getTableName(schema.departments),
      getTableName(schema.user),
      getTableName(schema.account),
      getTableName(schema.member),
      getTableName(schema.userPreferences),
    ]);
  });

  it('covers every auth-related table exactly once', () => {
    expect(new Set(IDENTITY_TABLE_NAMES).size).toBe(IDENTITY_TABLES.length);
    expect(IDENTITY_TABLE_NAMES).toContain('user');
    expect(IDENTITY_TABLE_NAMES).toContain('account');
    expect(IDENTITY_TABLE_NAMES).toContain('member');
  });
});

describe('connection string helpers', () => {
  it('strips the Neon pooler host marker', () => {
    expect(toDirectUrl('postgresql://u:p@ep-x-pooler.c-2.us-east-2.aws.neon.tech/db?sslmode=require')).toBe(
      'postgresql://u:p@ep-x.c-2.us-east-2.aws.neon.tech/db?sslmode=require',
    );
  });

  it('treats the pooled and direct URLs of one database as the same', () => {
    const pooled = 'postgresql://u:p@ep-x-pooler.c-2.us-east-2.aws.neon.tech/neondb';
    const direct = 'postgresql://u:p@ep-x.c-2.us-east-2.aws.neon.tech/neondb';
    expect(isSameDatabase(pooled, direct)).toBe(true);
  });

  it('separates different databases on the same host', () => {
    expect(
      isSameDatabase('postgresql://u:p@ep-x.neon.tech/primary', 'postgresql://u:p@ep-x.neon.tech/demo'),
    ).toBe(false);
  });

  it('falls back to string comparison for unparsable URLs', () => {
    expect(isSameDatabase('not-a-url', 'not-a-url')).toBe(true);
    expect(isSameDatabase('not-a-url', 'other')).toBe(false);
  });
});

describe('resolveTargetEnv', () => {
  const env = {
    TEST_DATABASE_URL: 'postgresql://user:secret@ep-test.neon.tech/neondb',
    EMPTY_DATABASE_URL: '',
  };

  it('requires the explicit flag instead of a shared default target', () => {
    const result = resolveTargetEnv(['node', 'clone.ts'], env);
    expect(result.selection).toBeUndefined();
    expect(result.error).toContain('--target-env');
  });

  it('rejects a flag without a variable name', () => {
    const result = resolveTargetEnv(['node', 'clone.ts', '--target-env'], env);
    expect(result.selection).toBeUndefined();
    expect(result.error).toContain('variable name');
  });

  it('fails closed when the named variable is missing or empty', () => {
    expect(resolveTargetEnv(['node', 'clone.ts', '--target-env', 'NOPE_DATABASE_URL'], env).error).toContain(
      'NOPE_DATABASE_URL',
    );
    expect(
      resolveTargetEnv(['node', 'clone.ts', '--target-env', 'EMPTY_DATABASE_URL'], env).error,
    ).toContain('EMPTY_DATABASE_URL');
  });

  it('returns the URL behind the named variable', () => {
    const result = resolveTargetEnv(['node', 'clone.ts', '--target-env', 'TEST_DATABASE_URL'], env);
    expect(result.error).toBeUndefined();
    expect(result.selection).toEqual({
      envName: 'TEST_DATABASE_URL',
      url: env.TEST_DATABASE_URL,
    });
  });
});

describe('databaseHost', () => {
  it('prints the host without credentials and strips the pooler marker', () => {
    const host = databaseHost('postgresql://user:secret@ep-x-pooler.c-2.neon.tech/neondb');
    expect(host).toBe('ep-x.c-2.neon.tech');
    expect(host).not.toContain('secret');
    expect(host).not.toContain('user');
  });

  it('never echoes an unparsable URL', () => {
    expect(databaseHost('not-a-url')).toBe('invalid-url');
  });
});

describe('evaluateTargetContent', () => {
  it('passes only when every content table is empty', () => {
    expect(evaluateTargetContent({ rcms: 0, documents: 0 })).toEqual({
      ok: true,
      nonEmptyTables: [],
    });
  });

  it('names every non-empty table before a write', () => {
    expect(evaluateTargetContent({ rcms: 2, documents: 0, materiality: 1 })).toEqual({
      ok: false,
      nonEmptyTables: ['materiality', 'rcms'],
    });
  });
});

describe('selectContentTables', () => {
  it('checks every application table except identity and operational tables', () => {
    const all = [
      'organization',
      'business_entities',
      'departments',
      'user',
      'account',
      'member',
      'user_preferences',
      'rcms',
      'documents',
      'materiality',
      'session',
      'notifications',
      'audit_logs',
      '_internal_marker',
    ];
    expect(selectContentTables(all)).toEqual(['documents', 'materiality', 'rcms']);
  });

  it('still blocks a content table that did not exist when the script was written', () => {
    expect(selectContentTables(['organization', 'brand_new_content_table'])).toEqual([
      'brand_new_content_table',
    ]);
  });
});

describe('evaluateClone', () => {
  const passing: CloneVerification = {
    sourceCounts: { organization: 2, user: 36, account: 36 },
    targetCounts: { organization: 2, user: 36, account: 36 },
    contentCounts: { rcms: 0, documents: 0 },
    credentialRows: 36,
    comparableHashes: 36,
    hashMismatches: 0,
  };

  it('passes when counts, hashes, and content all line up', () => {
    const verdict = evaluateClone(passing);
    expect(verdict.ok).toBe(true);
    expect(verdict.failures).toEqual([]);
  });

  it('reports identity count drift per table', () => {
    const verdict = evaluateClone({ ...passing, targetCounts: { ...passing.targetCounts, user: 35 } });
    expect(verdict.ok).toBe(false);
    expect(verdict.countMismatches).toEqual([{ table: 'user', source: 36, target: 35 }]);
  });

  it('fails closed when credentials exist but nothing was compared', () => {
    const verdict = evaluateClone({ ...passing, comparableHashes: 0 });
    expect(verdict.ok).toBe(false);
    expect(verdict.failures.join(' ')).toContain('no comparable rows');
  });

  it('fails closed when some credential rows could not be compared', () => {
    const verdict = evaluateClone({ ...passing, comparableHashes: 35 });
    expect(verdict.ok).toBe(false);
    expect(verdict.failures.join(' ')).toContain('35/36');
  });

  it('fails on a hash mismatch', () => {
    const verdict = evaluateClone({ ...passing, hashMismatches: 1 });
    expect(verdict.ok).toBe(false);
    expect(verdict.failures.join(' ')).toContain('hash(es) differ');
  });

  it('fails when any content table is not empty', () => {
    const verdict = evaluateClone({ ...passing, contentCounts: { rcms: 0, documents: 3 } });
    expect(verdict.ok).toBe(false);
    expect(verdict.failures.join(' ')).toContain('documents');
  });
});

describe('evaluatePublicSchemaTables (Spec L48, L60 bootstrap invariant)', () => {
  it('passes when no non-system tables exist in the public schema', () => {
    expect(evaluatePublicSchemaTables([])).toEqual({ ok: true, leftoverTables: [] });
    expect(evaluatePublicSchemaTables(['spatial_ref_sys'])).toEqual({ ok: true, leftoverTables: [] });
  });

  it('fails closed and flags any application table leftovers found in the public schema', () => {
    const verdict = evaluatePublicSchemaTables(['documents', 'document_embeddings', 'spatial_ref_sys']);
    expect(verdict.ok).toBe(false);
    expect(verdict.leftoverTables).toEqual(['document_embeddings', 'documents']);
  });
});
