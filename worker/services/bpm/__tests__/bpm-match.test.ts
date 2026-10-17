import { describe, expect, it } from 'vitest';
import { type SQL } from 'drizzle-orm';
import { pgTable, text } from 'drizzle-orm/pg-core';
import { normalizeProcessName, sameSubProcess } from '../bpm-match';

const processes = pgTable('bpm_processes', { name: text('name') });
const diagrams = pgTable('bpm_diagrams', { subProcess: text('sub_process') });

/** Render a drizzle fragment to text: string chunks inline, params inline, columns as ?. */
function sqlText(fragment: SQL<unknown>): string {
  const chunks = fragment.getSQL().queryChunks as unknown[];
  return chunks
    .map((c) => {
      if (typeof c === 'string') return c;
      if (c && typeof c === 'object' && 'value' in c) {
        const v = (c as { value: unknown }).value;
        if (Array.isArray(v)) return v.filter((x) => typeof x === 'string').join('');
        return String(v);
      }
      return '?';
    })
    .join('');
}

describe('normalizeProcessName (single name-match owner)', () => {
  it('trims and lowercases', () => {
    expect(normalizeProcessName('  Vendor Payment  ')).toBe('vendor payment');
    expect(normalizeProcessName('VENDOR PAYMENT')).toBe('vendor payment');
  });

  it('maps case/whitespace aliases of one name to a single key', () => {
    const aliases = ['Vendor Payment', 'vendor payment', '  VENDOR PAYMENT ', '\tVendor Payment\n'];
    const keys = new Set(aliases.map(normalizeProcessName));
    expect([...keys]).toEqual(['vendor payment']);
  });

  it('keeps genuinely different names distinct', () => {
    expect(normalizeProcessName('Vendor Payment')).not.toBe(normalizeProcessName('Vendor Billing'));
  });
});

describe('sameSubProcess (one SQL predicate for every call site)', () => {
  it('trims+lowers the column and binds the normalized value', () => {
    const rendered = sqlText(sameSubProcess(processes.name, 'Vendor Payment'));
    expect(rendered).toBe('TRIM(LOWER(?)) = vendor payment');
  });

  it('builds identical SQL for aliased input', () => {
    const spaced = sqlText(sameSubProcess(diagrams.subProcess, '  Vendor Payment '));
    const canonical = sqlText(sameSubProcess(diagrams.subProcess, 'vendor payment'));
    expect(spaced).toBe(canonical);
    expect(spaced).toContain('vendor payment');
  });

  it('does not collapse punctuation variants (documented boundary)', () => {
    const spaced = sqlText(sameSubProcess(processes.name, 'Vendor Payment'));
    const hyphenated = sqlText(sameSubProcess(processes.name, 'Vendor-Payment'));
    expect(hyphenated).not.toBe(spaced);
  });
});
