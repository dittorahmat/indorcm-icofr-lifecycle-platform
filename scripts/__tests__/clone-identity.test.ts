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
