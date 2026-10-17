import { describe, expect, it, expectTypeOf } from 'vitest';
import {
  USER_LEVEL_OPTIONS,
  USER_ROLE_OPTIONS,
  isUserLevel,
  isUserRole,
} from './role-options';
import type { UserLevel, UserRole } from './types/common';

/**
 * Vetted literal tables — the known-good members of the canonical unions.
 * `expectTypeOf` pins them to `UserRole` / `UserLevel`, so a union change
 * fails `tsc` here before the runtime assertions can pass vacuously.
 */
const ALL_ROLES = ['Line 1', 'Line 2', 'Line 3', 'Admin', 'External Auditor', 'Commissioner', 'CFO'] as const;
const ALL_LEVELS = ['Staff', 'Manager', 'Head', 'Director'] as const;

describe('role-options — the single runtime source for role/level options', () => {
  it('keeps the vetted literals exactly equal to the canonical unions (type level)', () => {
    expectTypeOf<(typeof ALL_ROLES)[number]>().toEqualTypeOf<UserRole>();
    expectTypeOf<(typeof ALL_LEVELS)[number]>().toEqualTypeOf<UserLevel>();
  });

  it('lists every union member exactly once', () => {
    expect([...USER_ROLE_OPTIONS].map((option) => option.value).sort()).toEqual([...ALL_ROLES].sort());
    expect([...USER_LEVEL_OPTIONS].map((option) => option.value).sort()).toEqual([...ALL_LEVELS].sort());
  });

  it('never carries a value outside the union (the historical "Komisaris" drift)', () => {
    const roleValues: readonly string[] = USER_ROLE_OPTIONS.map((option) => option.value);
    const levelValues: readonly string[] = USER_LEVEL_OPTIONS.map((option) => option.value);
    expect(roleValues).not.toContain('Komisaris');
    expect(levelValues).not.toContain('Komisaris');
    expect(new Set(roleValues).size).toBe(roleValues.length);
    expect(new Set(levelValues).size).toBe(levelValues.length);
  });

  it('carries namespace-qualified i18n keys (never inline label text)', () => {
    for (const option of [...USER_ROLE_OPTIONS, ...USER_LEVEL_OPTIONS]) {
      expect(option.labelKey).toContain(':');
      expect(option.fallback.length).toBeGreaterThan(0);
    }
  });

  it('isUserRole accepts every union member and rejects unknown values', () => {
    for (const role of ALL_ROLES) expect(isUserRole(role)).toBe(true);
    expect(isUserRole('Komisaris')).toBe(false);
    expect(isUserRole('')).toBe(false);
    expect(isUserRole(null)).toBe(false);
    expect(isUserRole(undefined)).toBe(false);
    expect(isUserRole(42)).toBe(false);
    expect(isUserRole({})).toBe(false);
  });

  it('isUserLevel accepts Director and rejects unknown values', () => {
    for (const level of ALL_LEVELS) expect(isUserLevel(level)).toBe(true);
    expect(isUserLevel('Director')).toBe(true);
    expect(isUserLevel('Direktur')).toBe(false);
    expect(isUserLevel('Komisaris')).toBe(false);
    expect(isUserLevel(null)).toBe(false);
    expect(isUserLevel(7)).toBe(false);
  });
});
