import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  ALL_ASSERTIONS,
  ALL_IPOS,
  ASSERTION_CODE,
  ASSERTION_FIELD_OF,
  ASSERTION_FIELDS,
  ASSERTION_TIP,
  ASSERTION_VALUE,
  IPO_CODE,
  IPO_FIELD_OF,
  IPO_FIELDS,
  IPO_TIP,
  IPO_VALUE,
  toControlAssertion,
  toControlAssertions,
  toInformationProcessingObjective,
  toInformationProcessingObjectives,
} from './assertion-fields';

/** The slice of a locale bundle this suite reads: the assertion/IPO label carriers. */
interface LocaleBundle {
  assertions?: { tooltip?: Record<string, { label?: string; desc?: string }> };
  ipo?: { tooltip?: Record<string, { label?: string; desc?: string }> };
  dodReport?: { tooltips?: Record<string, { title?: string }> };
}

/** Reads a locale bundle straight off disk: the labels live in the bundle, not in code. */
function bundle(locale: 'en' | 'id', namespace: string): LocaleBundle {
  const path = join(process.cwd(), 'src', 'i18n', 'locales', locale, `${namespace}.json`);
  // boundary: locale JSON on disk is untyped; the interface above narrows what is read
  return JSON.parse(readFileSync(path, 'utf-8')) as LocaleBundle;
}

describe('assertion-fields', () => {
  it('prints the seven Tabel 8 assertions in Lampiran 3 legend order', () => {
    expect(ASSERTION_FIELDS.map((field) => [ASSERTION_CODE[field], ASSERTION_VALUE[field]])).toEqual([
      ['C', 'Completeness'],
      ['A', 'Accuracy'],
      ['E/O', 'Existence/Occurrence'],
      ['CO', 'Cut-Off'],
      ['R&O', 'Rights and Obligation'],
      ['V/A', 'Valuation and Allocation'],
      ['PD', 'Presentation and Disclosure'],
    ]);
  });

  it('prints the four Tabel 13 IPOs', () => {
    expect(IPO_FIELDS.map((field) => [IPO_CODE[field], IPO_VALUE[field]])).toEqual([
      ['C', 'Completeness'],
      ['A', 'Accuracy'],
      ['V', 'Validity'],
      ['RA', 'Restricted Access'],
    ]);
  });

  it('keeps the field and union indexes in sync', () => {
    for (const field of ASSERTION_FIELDS) {
      expect(ASSERTION_FIELD_OF[ASSERTION_VALUE[field]]).toBe(field);
    }
    for (const field of IPO_FIELDS) {
      expect(IPO_FIELD_OF[IPO_VALUE[field]]).toBe(field);
    }
    expect(ALL_ASSERTIONS).toEqual(ASSERTION_FIELDS.map((field) => ASSERTION_VALUE[field]));
    expect(ALL_IPOS).toEqual(IPO_FIELDS.map((field) => IPO_VALUE[field]));
  });

  it('gives every field a distinct tooltip key', () => {
    expect(new Set(ASSERTION_FIELDS.map((field) => ASSERTION_TIP[field])).size).toBe(7);
    expect(new Set(IPO_FIELDS.map((field) => IPO_TIP[field])).size).toBe(4);
  });

  it('resolves canonical names, legacy names and short codes', () => {
    expect(toControlAssertion('Rights and Obligation')).toBe('Rights and Obligation');
    expect(toControlAssertion('R&O')).toBe('Rights and Obligation');
    expect(toControlAssertion('Validity')).toBe('Existence/Occurrence');
    expect(toControlAssertion('Existence')).toBe('Existence/Occurrence');
    expect(toControlAssertion('Occurrence')).toBe('Existence/Occurrence');
    expect(toControlAssertion('Valuation')).toBe('Valuation and Allocation');
    expect(toControlAssertion('Classification')).toBe('Presentation and Disclosure');
    expect(toControlAssertion('Presentation')).toBe('Presentation and Disclosure');
    expect(toControlAssertion('Availability')).toBeNull();
    expect(toControlAssertion(undefined)).toBeNull();
  });

  it('resolves names and codes case-insensitively, the pre-#105 Cut-off spelling included', () => {
    expect(toControlAssertion('Cut-off')).toBe('Cut-Off');
    expect(toControlAssertion('cut-off')).toBe('Cut-Off');
    expect(toControlAssertion('  completeness ')).toBe('Completeness');
    expect(toControlAssertion('e/o')).toBe('Existence/Occurrence');
    expect(toInformationProcessingObjective('restricted access')).toBe('Restricted Access');
    expect(toInformationProcessingObjective('v')).toBe('Validity');
  });

  it('drops unknown entries when normalising a stored list', () => {
    expect(toControlAssertions(['Validity', 'Accuracy', 'Availability', 7])).toEqual([
      'Existence/Occurrence',
      'Accuracy',
    ]);
    expect(toControlAssertions('Accuracy')).toEqual([]);
  });

  it('resolves IPO names and codes, dropping the removed Availability', () => {
    expect(toInformationProcessingObjective('Restricted Access')).toBe('Restricted Access');
    expect(toInformationProcessingObjective('RA')).toBe('Restricted Access');
    expect(toInformationProcessingObjective('Availability')).toBeNull();
    expect(toInformationProcessingObjectives(['Validity', 'Availability'])).toEqual(['Validity']);
  });

  it('keeps every i18n label byte-identical to its canonical value', () => {
    for (const locale of ['en', 'id']) {
      const bpm = bundle(locale, 'bpm');
      for (const field of ASSERTION_FIELDS) {
        const tip = ASSERTION_TIP[field];
        expect(bpm.assertions?.tooltip?.[tip]?.label, `${locale} assertions.${tip}.label`).toBe(
          ASSERTION_VALUE[field],
        );
        expect(bpm.assertions?.tooltip?.[tip]?.desc, `${locale} assertions.${tip}.desc`).toBeTruthy();
      }
      for (const field of IPO_FIELDS) {
        const tip = IPO_TIP[field];
        expect(bpm.ipo?.tooltip?.[tip]?.label, `${locale} ipo.${tip}.label`).toBe(IPO_VALUE[field]);
        expect(bpm.ipo?.tooltip?.[tip]?.desc, `${locale} ipo.${tip}.desc`).toBeTruthy();
      }
    }
  });

  it('keeps the DoD report tooltip titles on the same scheme', () => {
    for (const locale of ['en', 'id']) {
      const reports = bundle(locale, 'reports');
      for (const field of ASSERTION_FIELDS) {
        const tip = ASSERTION_TIP[field];
        expect(reports.dodReport?.tooltips?.[tip]?.title, `${locale} dodReport.tooltips.${tip}`).toContain(
          ASSERTION_VALUE[field],
        );
      }
    }
  });
});
