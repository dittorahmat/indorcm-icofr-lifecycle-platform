import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { formatIDR, formatIDRPlain } from '@/components/reports/dod/dod-format';

const OWNER = 'src/components/reports/dod/dod-format.ts';

/**
 * Roster of the files migrated in the money-format workstream: every IDR in them
 * must go through the owner. Explicit (not a glob) so a new money call site is a
 * deliberate addition to this lock rather than an unnoticed second formatter.
 */
const MONEY_CALL_SITES = [
  OWNER,
  'src/components/reports/regulatory/findings-helpers.ts',
  'src/pages/reports/WBSPage.tsx',
  'src/components/import/CrossCheckPanel.tsx',
  'src/components/deficiencies/DoDHeaderSummary.tsx',
  'src/components/deficiencies/DoDEvidenceContextCard.tsx',
  'src/pages/scoping/ApprovalPage.tsx',
  'src/pages/scoping/components/ScopingEditorHeader.tsx',
  'src/pages/scoping/components/MaterialityParamsCard.tsx',
  'src/components/scoping/GLDataGridColumns.tsx',
  'src/components/scoping/GLDataGrid.tsx',
  'src/components/scoping/SetBenchmarkModal.tsx',
  'src/components/scoping/ScopingHealthDashboard.tsx',
  'src/components/scoping/SimulationListTable.tsx',
  'src/components/scoping/SignificantLocationModal.tsx',
  'src/components/scoping/smart-import/MaterialitySummary.tsx',
  'src/components/scoping/smart-import/BenchmarkSelect.tsx',
  'src/components/bpm/TransactionSamplingTab.tsx',
] as const;

const OWNER_IMPORT = "from '@/components/reports/dod/dod-format'";

const readSourceFile = (relative: string): string =>
  readFileSync(fileURLToPath(new URL(relative, import.meta.url)), 'utf-8');

const sourceOf = (repoRelative: string): string =>
  // src/lib/__tests__ → repo root is three levels up.
  readSourceFile(`../../../${repoRelative}`);

// ICU emits the currency symbol followed by NBSP (U+00A0); vetted literal, not
// recomputed from the implementation (a re-derived expectation is tautological).
const NBSP = '\u00A0';
const rp = (digits: string) => `Rp${NBSP}${digits}`;

describe('formatIDR: one owner for Indonesian rupiah', () => {
  it('groups with the Indonesian dot and prefixes the currency symbol (locale pinned, not ambient)', () => {
    expect(formatIDR(1234567)).toBe(rp('1.234.567'));
    expect(formatIDR(1500)).toBe(rp('1.500'));
    // The locale-less `toLocaleString()` this replaced follows the ambient locale,
    // which renders US grouping in the browsers that exposed the bug.
    expect(formatIDR(1234567)).not.toBe(`Rp ${new Intl.NumberFormat('en-US').format(1234567)}`);
  });

  it('renders zero and keeps negatives in the ICU shape', () => {
    expect(formatIDR(0)).toBe(rp('0'));
    expect(formatIDR(-1234)).toBe(`-Rp${NBSP}1.234`);
  });

  it('drops rupiah sen: maximumFractionDigits 0, half-up rounding', () => {
    expect(formatIDR(1234567.89)).toBe(rp('1.234.568'));
    expect(formatIDR(97944.75)).toBe(rp('97.945'));
    expect(formatIDR(1234567)).not.toContain(',00');
  });

  it('returns "-" for null, undefined and non-finite values (never "Rp NaN")', () => {
    expect(formatIDR(null)).toBe('-');
    expect(formatIDR(undefined)).toBe('-');
    expect(formatIDR(Number.NaN)).toBe('-');
    expect(formatIDR(Number.POSITIVE_INFINITY)).toBe('-');
    expect(formatIDR(Number.NEGATIVE_INFINITY)).toBe('-');
  });

  it('formatIDRPlain is the symbol-less cell shape and keeps ICU id-ID decimals', () => {
    expect(formatIDRPlain(1234567)).toBe('1.234.567');
    expect(formatIDRPlain(0)).toBe('0');
    expect(formatIDRPlain(-1234)).toBe('-1.234');
    expect(formatIDRPlain(1234.5)).toBe('1.234,5');
    expect(formatIDRPlain(1234567)).not.toContain('Rp');
    expect(formatIDRPlain(null)).toBe('-');
    expect(formatIDRPlain(undefined)).toBe('-');
    expect(formatIDRPlain(Number.NaN)).toBe('-');
  });

  it('formatIDR and formatIDRPlain agree on grouping, differ only by symbol', () => {
    expect(formatIDR(9876543210)).toBe(`Rp${NBSP}${formatIDRPlain(9876543210)}`);
  });
});

describe('money is single-sourced (no second Intl/toLocaleString over the owned files)', () => {
  it('only the owner declares an Intl.NumberFormat', () => {
    const withIntl = MONEY_CALL_SITES.filter((file) => /Intl\.NumberFormat/.test(sourceOf(file)));
    expect(withIntl).toEqual([OWNER]);
  });

  it('no owned call site uses toLocaleString or a second currency formatter', () => {
    const offenders = MONEY_CALL_SITES.filter((file) => {
      const source = sourceOf(file);
      return file === OWNER
        ? /toLocaleString\(/.test(source)
        : /toLocaleString\(|new Intl\./.test(source);
    });
    expect(offenders).toEqual([]);
  });

  it('every owned call site imports the owner (including the two former locale-less sites)', () => {
    for (const file of MONEY_CALL_SITES) {
      if (file === OWNER) continue;
      expect(sourceOf(file), file).toContain(OWNER_IMPORT);
    }
    expect(sourceOf('src/components/scoping/smart-import/MaterialitySummary.tsx')).toContain(
      "import { formatIDR } from '@/components/reports/dod/dod-format'",
    );
    expect(sourceOf('src/components/scoping/smart-import/BenchmarkSelect.tsx')).toContain(
      "import { formatIDR } from '@/components/reports/dod/dod-format'",
    );
  });

  it('the owner pins the locale and the currency literally', () => {
    const owner = sourceOf(OWNER);
    expect(owner).toContain("new Intl.NumberFormat('id-ID', {");
    expect(owner).toContain("currency: 'IDR'");
    expect(owner).toContain('maximumFractionDigits: 0');
  });
});
