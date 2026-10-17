import { describe, it, expect } from 'vitest';
import { normalizeYear, planPeriodRollover } from '../scoping-service';

/**
 * Rollover guard outcomes. Reason codes are the contract; the plan is pure so
 * every case is locked with no database (the route reads `targetHasData`).
 */
describe('planPeriodRollover', () => {
  it('accepts a distinct year pair and normalizes both years', () => {
    expect(
      planPeriodRollover({ sourceYear: '2024', targetYear: 2025, force: false, targetHasData: false }),
    ).toEqual({ ok: true, sourceYear: 2024, targetYear: 2025 });
  });

  it('rejects a missing, unparseable or identical year pair with ROLLOVER_BAD_YEAR', () => {
    const badYear = {
      ok: false,
      code: 'ROLLOVER_BAD_YEAR',
      message: 'Invalid source or target year',
      status: 400,
    };

    expect(planPeriodRollover({ sourceYear: undefined, targetYear: 2025, force: false, targetHasData: false })).toEqual(badYear);
    expect(planPeriodRollover({ sourceYear: 'abc', targetYear: 2025, force: false, targetHasData: false })).toEqual(badYear);
    expect(planPeriodRollover({ sourceYear: null, targetYear: null, force: false, targetHasData: false })).toEqual(badYear);
    expect(planPeriodRollover({ sourceYear: 2025, targetYear: 2025, force: false, targetHasData: false })).toEqual(badYear);
  });

  it('rejects a dirty target year with 409 until force is set', () => {
    const dirty = {
      ok: false,
      code: 'ROLLOVER_TARGET_DIRTY',
      message: 'Data already exists in target year. Use force rollover to override.',
      status: 409,
    };

    expect(planPeriodRollover({ sourceYear: 2024, targetYear: 2025, force: false, targetHasData: true })).toEqual(dirty);
    expect(planPeriodRollover({ sourceYear: 2024, targetYear: 2025, force: true, targetHasData: true }))
      .toEqual({ ok: true, sourceYear: 2024, targetYear: 2025 });
  });

  it('checks the year pair before the dirty target', () => {
    const plan = planPeriodRollover({ sourceYear: 2025, targetYear: 2025, force: false, targetHasData: true });

    expect(plan.ok).toBe(false);
    if (!plan.ok) expect(plan.code).toBe('ROLLOVER_BAD_YEAR');
  });
});

describe('normalizeYear', () => {
  it('parses client years and maps blank / zero / garbage to NULL', () => {
    expect(normalizeYear('2024')).toBe(2024);
    expect(normalizeYear(2025)).toBe(2025);
    expect(normalizeYear('')).toBeNull();
    expect(normalizeYear(null)).toBeNull();
    expect(normalizeYear(undefined)).toBeNull();
    expect(normalizeYear(0)).toBeNull();
    expect(normalizeYear('abc')).toBeNull();
  });
});
