import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it, expectTypeOf } from 'vitest';
import { USER_LEVEL_OPTIONS, USER_ROLE_OPTIONS } from '@shared/role-options';
import type { UserLevel, UserRole } from '@shared/types';
import { strictT, validateI18nKey } from '@/test/mock-i18n';

/**
 * Vetted literal tables (never recomputed from the option module). `expectTypeOf`
 * pins them to the canonical unions, so a union change fails `tsc` here.
 */
const ALL_ROLES = ['Line 1', 'Line 2', 'Line 3', 'Admin', 'External Auditor', 'Commissioner', 'CFO'] as const;
const ALL_LEVELS = ['Staff', 'Manager', 'Head', 'Director'] as const;

const readSource = (relative: string): string =>
  readFileSync(fileURLToPath(new URL(relative, import.meta.url)), 'utf-8');

const PAGE_SOURCE = readSource('../UserManagementPage.tsx');
const SIDEBAR_SOURCE = readSource('../../../components/app-sidebar.tsx');

describe('admin user role/level option lists', () => {
  it('matches the canonical unions exactly (type level)', () => {
    expectTypeOf<(typeof ALL_ROLES)[number]>().toEqualTypeOf<UserRole>();
    expectTypeOf<(typeof ALL_LEVELS)[number]>().toEqualTypeOf<UserLevel>();
  });

  it('offers every union member exactly once (the picker bug surface)', () => {
    expect([...USER_ROLE_OPTIONS].map((option) => option.value).sort()).toEqual([...ALL_ROLES].sort());
    expect([...USER_LEVEL_OPTIONS].map((option) => option.value).sort()).toEqual([...ALL_LEVELS].sort());
  });

  it('makes Director and External Auditor assignable', () => {
    const roleValues: readonly string[] = USER_ROLE_OPTIONS.map((option) => option.value);
    const levelValues: readonly string[] = USER_LEVEL_OPTIONS.map((option) => option.value);
    expect(roleValues).toContain('External Auditor');
    expect(levelValues).toContain('Director');
  });

  it('declares no option value outside the union (locks out "Komisaris")', () => {
    const values: readonly string[] = [
      ...USER_ROLE_OPTIONS.map((option) => option.value),
      ...USER_LEVEL_OPTIONS.map((option) => option.value),
    ];
    expect(values).not.toContain('Komisaris');
    for (const value of values) expect(ALL_ROLES.includes(value as UserRole) || ALL_LEVELS.includes(value as UserLevel)).toBe(true);
  });

  it('renders every label through t() from its key with a fallback (never a raw key)', () => {
    for (const option of [...USER_ROLE_OPTIONS, ...USER_LEVEL_OPTIONS]) {
      expect(option.labelKey).toContain(':');
      expect(strictT(option.labelKey, { defaultValue: option.fallback })).toBe(option.fallback);
    }
  });

  it('resolves every option label key in the en bundle (no silent missing namespace)', () => {
    // `strictT(key, {defaultValue})` short-circuits and never validates, so the
    // key must be checked directly: this is what caught the absent `admin` ns.
    for (const option of [...USER_ROLE_OPTIONS, ...USER_LEVEL_OPTIONS]) {
      validateI18nKey(option.labelKey);
    }
  });

  it('reuses the existing Line 1-3 bundle keys', () => {
    validateI18nKey('auth:lines.l1.title');
    validateI18nKey('auth:lines.l2.title');
    validateI18nKey('auth:lines.l3.title');
  });

  it('wires the page to the shared option module and drops the hand-written literals', () => {
    expect(PAGE_SOURCE).toContain('@shared/role-options');
    expect(PAGE_SOURCE).toContain('USER_ROLE_OPTIONS');
    expect(PAGE_SOURCE).toContain('USER_LEVEL_OPTIONS');
    expect(PAGE_SOURCE).not.toContain('Komisaris');
    expect(PAGE_SOURCE).not.toContain('<SelectItem value="Line 1">');
    expect(PAGE_SOURCE).not.toContain('<SelectItem value="Staff">');
  });

  it('gates the sidebar through the canonical authority table', () => {
    const AUTHORITY_SOURCE = readSource('../../../../shared/entity-authority.ts');
    expect(SIDEBAR_SOURCE).toContain('@/components/layout/sidebar-nav');
    expect(SIDEBAR_SOURCE).not.toContain('Komisaris');
    // The capability module — not the view — names the Commissioner member.
    expect(AUTHORITY_SOURCE).toContain("'Commissioner'");
  });
});
