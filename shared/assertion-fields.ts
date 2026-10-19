import type { ControlAssertion, InformationProcessingObjective } from './types/common';

/**
 * The single owner of the IPO / financial-statement-assertion label scheme
 * (SK-5/DKU.MBU/11/2024, Tabel 8 and Tabel 13). Every screen that shows an
 * assertion or an IPO derives its codes, order and i18n keys from here, so the
 * long label stays in `bpm.json` and a new union member becomes a `tsc` error
 * instead of an invisible checkbox.
 */

/** RCM/CSA boolean column (and form field) carrying one financial-statement assertion. */
export type AssertionField =
  | 'assertionC'
  | 'assertionA'
  | 'assertionE'
  | 'assertionCo'
  | 'assertionRo'
  | 'assertionVa'
  | 'assertionPd';

/** RCM/CSA boolean column (and form field) carrying one information-processing objective. */
export type IpoField = 'ipoC' | 'ipoA' | 'ipoV' | 'ipoRa';

/** Lampiran 3 legend order: C, A, E/O, CO, R&O, V/A, PD. */
export const ASSERTION_FIELDS: readonly AssertionField[] = [
  'assertionC',
  'assertionA',
  'assertionE',
  'assertionCo',
  'assertionRo',
  'assertionVa',
  'assertionPd',
];

/** Tabel 13 order: Completeness, Accuracy, Validity, Restricted Access. */
export const IPO_FIELDS: readonly IpoField[] = ['ipoC', 'ipoA', 'ipoV', 'ipoRa'];

/** Short code exactly as printed in Tabel 8. */
export const ASSERTION_CODE: Record<AssertionField, string> = {
  assertionC: 'C',
  assertionA: 'A',
  assertionE: 'E/O',
  assertionCo: 'CO',
  assertionRo: 'R&O',
  assertionVa: 'V/A',
  assertionPd: 'PD',
};

/** Short code exactly as printed in Tabel 13. */
export const IPO_CODE: Record<IpoField, string> = {
  ipoC: 'C',
  ipoA: 'A',
  ipoV: 'V',
  ipoRa: 'RA',
};

/** Key under `bpm:assertions.tooltip.*` holding this assertion's long label and definition. */
export type AssertionTip = 'c' | 'a' | 'eo' | 'co' | 'ro' | 'va' | 'pd';

export const ASSERTION_TIP: Record<AssertionField, AssertionTip> = {
  assertionC: 'c',
  assertionA: 'a',
  assertionE: 'eo',
  assertionCo: 'co',
  assertionRo: 'ro',
  assertionVa: 'va',
  assertionPd: 'pd',
};

/** Key under `bpm:ipo.tooltip.*` holding this IPO's long label and definition. */
export type IpoTip = 'c' | 'a' | 'v' | 'ra';

export const IPO_TIP: Record<IpoField, IpoTip> = {
  ipoC: 'c',
  ipoA: 'a',
  ipoV: 'v',
  ipoRa: 'ra',
};

/** Canonical `ControlAssertion` carried by each column. */
export const ASSERTION_VALUE: Record<AssertionField, ControlAssertion> = {
  assertionC: 'Completeness',
  assertionA: 'Accuracy',
  assertionE: 'Existence/Occurrence',
  assertionCo: 'Cut-Off',
  assertionRo: 'Rights and Obligation',
  assertionVa: 'Valuation and Allocation',
  assertionPd: 'Presentation and Disclosure',
};

/** Canonical `InformationProcessingObjective` carried by each column. */
export const IPO_VALUE: Record<IpoField, InformationProcessingObjective> = {
  ipoC: 'Completeness',
  ipoA: 'Accuracy',
  ipoV: 'Validity',
  ipoRa: 'Restricted Access',
};

/** Column for each canonical assertion — a new `ControlAssertion` member must declare one here. */
export const ASSERTION_FIELD_OF: Record<ControlAssertion, AssertionField> = {
  Completeness: 'assertionC',
  Accuracy: 'assertionA',
  'Existence/Occurrence': 'assertionE',
  'Cut-Off': 'assertionCo',
  'Rights and Obligation': 'assertionRo',
  'Valuation and Allocation': 'assertionVa',
  'Presentation and Disclosure': 'assertionPd',
};

/** Column for each canonical IPO — a new `InformationProcessingObjective` must declare one here. */
export const IPO_FIELD_OF: Record<InformationProcessingObjective, IpoField> = {
  Completeness: 'ipoC',
  Accuracy: 'ipoA',
  Validity: 'ipoV',
  'Restricted Access': 'ipoRa',
};

/** Every canonical assertion, legend order. */
export const ALL_ASSERTIONS: readonly ControlAssertion[] = ASSERTION_FIELDS.map(
  (field) => ASSERTION_VALUE[field],
);

/** Every canonical IPO, Tabel 13 order. */
export const ALL_IPOS: readonly InformationProcessingObjective[] = IPO_FIELDS.map(
  (field) => IPO_VALUE[field],
);

/**
 * Assertion names stored before the scheme was aligned to Tabel 8 (#105). Keys
 * are matched case-insensitively, which is also what makes the pre-#105
 * `"Cut-off"` spelling resolve.
 */
const LEGACY_ASSERTIONS: Record<string, ControlAssertion> = {
  Validity: 'Existence/Occurrence',
  Existence: 'Existence/Occurrence',
  Occurrence: 'Existence/Occurrence',
  Valuation: 'Valuation and Allocation',
  Presentation: 'Presentation and Disclosure',
  Classification: 'Presentation and Disclosure',
};

/** Case-insensitive lookup of canonical names, legacy names and short codes. */
function byName<T extends string>(
  values: readonly T[],
  codes: ReadonlyArray<{ code: string; value: T }>,
  legacy: Record<string, T> = {},
): Record<string, T> {
  const index: Record<string, T> = {};
  for (const [name, value] of Object.entries(legacy)) index[name.toLowerCase()] = value;
  for (const value of values) index[value.toLowerCase()] = value;
  for (const { code, value } of codes) index[code.toLowerCase()] = value;
  return index;
}

const ASSERTION_INDEX = byName(
  ALL_ASSERTIONS,
  ASSERTION_FIELDS.map((field) => ({ code: ASSERTION_CODE[field], value: ASSERTION_VALUE[field] })),
  LEGACY_ASSERTIONS,
);

const IPO_INDEX = byName(
  ALL_IPOS,
  IPO_FIELDS.map((field) => ({ code: IPO_CODE[field], value: IPO_VALUE[field] })),
);

/**
 * Resolves anything the platform has ever stored for an assertion — canonical
 * name, legacy name or short code — to its canonical value, or `null`.
 */
export function toControlAssertion(raw: unknown): ControlAssertion | null {
  if (typeof raw !== 'string') return null;
  return ASSERTION_INDEX[raw.trim().toLowerCase()] ?? null;
}

/** Same as {@link toControlAssertion}, for an IPO name or short code. */
export function toInformationProcessingObjective(
  raw: unknown,
): InformationProcessingObjective | null {
  if (typeof raw !== 'string') return null;
  return IPO_INDEX[raw.trim().toLowerCase()] ?? null;
}

/** Drops unrecognised entries (e.g. the removed `Availability` IPO) from a stored list. */
export function toControlAssertions(raw: unknown): ControlAssertion[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map(toControlAssertion)
    .filter((value): value is ControlAssertion => value !== null);
}

/** Same as {@link toControlAssertions}, for a stored IPO list. */
export function toInformationProcessingObjectives(
  raw: unknown,
): InformationProcessingObjective[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map(toInformationProcessingObjective)
    .filter((value): value is InformationProcessingObjective => value !== null);
}
