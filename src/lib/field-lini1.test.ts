import { describe, it, expect } from 'vitest';
import { isFieldLini1 } from '@/lib/field-lini1';

describe('isFieldLini1', () => {
  it('returns true only for explicit Line 1 with schedule context', () => {
    expect(isFieldLini1('Line 1', 'sch-1')).toBe(true);
    expect(isFieldLini1('line 1', 'sch-1')).toBe(true);
    expect(isFieldLini1(' Line 1 ', 'sch-1')).toBe(true);
  });

  it('falls back to full tabs for unknown roles and Line 2', () => {
    expect(isFieldLini1('Line 2', 'sch-1')).toBe(false);
    expect(isFieldLini1('Admin', 'sch-1')).toBe(false);
    expect(isFieldLini1(undefined, 'sch-1')).toBe(false);
    expect(isFieldLini1('', 'sch-1')).toBe(false);
  });

  it('falls back to full tabs without schedule context', () => {
    expect(isFieldLini1('Line 1', undefined)).toBe(false);
    expect(isFieldLini1('Line 1', '')).toBe(false);
    expect(isFieldLini1('Line 1', null)).toBe(false);
  });
});
