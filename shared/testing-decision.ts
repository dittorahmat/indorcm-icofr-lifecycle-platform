/**
 * testing-decision — single TOD/TOE decision module (SK-5/DKU.MBU/11/2024).
 *
 * One interface (`decideTest`) owns Table 22 sampling-minimum,
 * homogeneity-justification, Zero-Tolerance (any Fail forces Ineffective)
 * and the 6-pilar TOD evaluation. Client pre-flight
 * (ControlTestCard/TOETabContent) and the server insert path
 * (POST /tests) both cross this seam; schema and views are adapters.
 */

export type ControlFrequency =
  | 'Annual'
  | 'Semi-Annual'
  | 'Quarterly'
  | 'Monthly'
  | 'Weekly'
  | 'Daily'
  | 'Ad-hoc';

export type RiskRating = 'High' | 'Medium' | 'Low';

export type TestType = 'TOD' | 'TOE';

export type TestingVerdict = 'Effective' | 'Ineffective';

/** Panduan Penentuan Jumlah Sampel berdasarkan Tabel 22 (Hal 56). */
export interface SampleRange {
  min: number;
  max: number;
  label: string;
}

export function getSuggestedSampleRange(
  frequency: ControlFrequency,
  riskRating: RiskRating,
  nature: string,
): SampleRange {
  if (nature === 'Automated') {
    return { min: 1, max: 1, label: '1 (Test of One)' };
  }

  const isHigh = riskRating === 'High';

  switch (frequency) {
    case 'Annual':
      return { min: 1, max: 1, label: '1' };
    case 'Semi-Annual':
      // SK-5 doesn't explicitly list Semi-Annual in Table 22, mapping to Quarterly or higher based on conservatism
      return isHigh ? { min: 2, max: 3, label: '2 - 3' } : { min: 1, max: 2, label: '1 - 2' };
    case 'Quarterly':
      // Table 22: Kuartalan (4 population) -> 2 sampai 3 samples
      return isHigh ? { min: 3, max: 3, label: '3' } : { min: 2, max: 2, label: '2' };
    case 'Monthly':
      // Table 22: Bulanan (12 population) -> 2 sampai 5 samples
      return isHigh ? { min: 5, max: 5, label: '5' } : { min: 2, max: 3, label: '2 - 3' };
    case 'Weekly':
      // Table 22: Mingguan (52 population) -> 5 sampai 15 samples
      return isHigh ? { min: 15, max: 15, label: '15' } : { min: 5, max: 8, label: '5 - 8' };
    case 'Daily':
      // Table 22: Harian (250 population) -> 15 sampai 40 samples
      return isHigh ? { min: 40, max: 40, label: '40' } : { min: 15, max: 20, label: '15 - 20' };
    case 'Ad-hoc':
      // Table 22: Lebih dari sekali dalam satu hari (>250 population) -> 30 sampai 60 samples
      return isHigh ? { min: 60, max: 60, label: '60' } : { min: 30, max: 45, label: '30 - 45' };
    default:
      return { min: 1, max: 1, label: '1' };
  }
}

/** Penentuan Jumlah Sampel Remediasi berdasarkan Tabel 23 (Hal 70). */
export function getRemediationSampleSize(frequency: ControlFrequency): number {
  switch (frequency) {
    case 'Annual':
      return 1;
    case 'Semi-Annual':
      return 1;
    case 'Quarterly':
      return 2;
    case 'Monthly':
      return 2;
    case 'Weekly':
      return 5;
    case 'Daily':
      return 15;
    case 'Ad-hoc':
      return 25;
    default:
      return 1;
  }
}

/** Validasi Periode Minimum Pengujian Remediasi berdasarkan Tabel 23 (Hal 60). */
export function getMinRemediationPeriod(
  frequency: ControlFrequency,
): { value: number; unit: 'days' | 'weeks' | 'months' | 'quarters' } {
  switch (frequency) {
    case 'Annual':
      return { value: 1, unit: 'quarters' };
    case 'Semi-Annual':
      return { value: 1, unit: 'quarters' };
    case 'Quarterly':
      return { value: 2, unit: 'quarters' };
    case 'Monthly':
      return { value: 3, unit: 'months' };
    case 'Weekly':
      return { value: 5, unit: 'weeks' };
    case 'Daily':
      return { value: 30, unit: 'days' };
    case 'Ad-hoc':
      return { value: 15, unit: 'days' }; // 25 times over multiple days (approx 15 days for testing)
    default:
      return { value: 1, unit: 'days' };
  }
}

const DAY_MS = 86400000;

export function isReadyForRemediationTest(
  frequency: ControlFrequency,
  remediationDate: number,
): { isReady: boolean; message: string } {
  const min = getMinRemediationPeriod(frequency);
  const now = Date.now();
  const diff = now - remediationDate;

  let requiredMs = 0;
  if (min.unit === 'days') requiredMs = min.value * DAY_MS;
  else if (min.unit === 'weeks') requiredMs = min.value * DAY_MS * 7;
  else if (min.unit === 'months') requiredMs = min.value * DAY_MS * 30;
  else if (min.unit === 'quarters') requiredMs = min.value * DAY_MS * 30 * 3;

  const isReady = diff >= requiredMs;
  const waitText = `${min.value} ${min.unit}`;

  return {
    isReady,
    message: isReady
      ? 'Periode tunggu minimum terpenuhi (Tabel 23).'
      : `Belum memenuhi periode tunggu minimum (${waitText}) sejak perbaikan.`,
  };
}

/** Minimal control surface the decision needs. */
export interface TestingControl {
  frequency: ControlFrequency;
  riskRating: RiskRating;
  nature: string;
}

/** Raw control shape as read from callers or DB rows. */
export interface RawTestingControl {
  frequency: unknown;
  riskRating: unknown;
  nature: unknown;
}

const KNOWN_FREQUENCIES: readonly string[] = [
  'Annual',
  'Semi-Annual',
  'Quarterly',
  'Monthly',
  'Weekly',
  'Daily',
  'Ad-hoc',
];

/**
 * Validates a raw control onto the decision seam. Null when the row is
 * missing or unrecognised — sampling-minimum is then skipped while
 * Zero-Tolerance and 6-pilar TOD are still enforced.
 */
export function normalizeTestingControl(row: RawTestingControl | null | undefined): TestingControl | null {
  if (!row || typeof row !== 'object') return null;
  if (
    typeof row.frequency !== 'string' ||
    !(KNOWN_FREQUENCIES as readonly string[]).includes(row.frequency) ||
    (row.riskRating !== 'High' && row.riskRating !== 'Medium' && row.riskRating !== 'Low') ||
    typeof row.nature !== 'string'
  ) {
    return null;
  }
  return {
    frequency: row.frequency as ControlFrequency,
    riskRating: row.riskRating,
    nature: row.nature,
  };
}

/** Minimal sample surface the decision needs. */
export interface DecisionSample {
  status: 'Pass' | 'Fail';
}

/** 6-pilar TOD (Lampiran 8). All six must hold for an Effective design. */
export interface TodPillars {
  objective: boolean;
  timing: boolean;
  authority: boolean;
  reliability: boolean;
  coverage: boolean;
  evidence: boolean;
}

export interface TestingDecisionInput {
  testType: TestType;
  /** Result claimed by the caller; forcing rules may override it. */
  claimedResult: TestingVerdict;
  sampleSize?: number;
  homogeneityJustification?: string;
  samples?: DecisionSample[];
  todPillars?: TodPillars;
}

export type TestingDecisionCode = 'BELOW_MIN_JUSTIFICATION_REQUIRED';

export interface TestingDecision {
  isValid: boolean;
  verdict?: TestingVerdict;
  field?: 'homogeneityJustification' | 'sampleSize';
  code?: TestingDecisionCode;
}

/** True when the sample count is below the Table 22 minimum without justification. */
export function requiresHomogeneityJustification(
  control: TestingControl,
  sampleSize: number | undefined,
  homogeneityJustification: string | undefined,
): boolean {
  const suggestion = getSuggestedSampleRange(
    control.frequency,
    control.riskRating,
    control.nature,
  );
  return (
    (sampleSize ?? 0) < suggestion.min &&
    !(homogeneityJustification ?? '').trim()
  );
}

/** Zero-Tolerance probe: any failed sample forces Ineffective. */
export function hasFailSample(samples: DecisionSample[] | undefined): boolean {
  return (samples ?? []).some((s) => s.status === 'Fail');
}

/** True when any of the 6 TOD pilars is unchecked. */
export function isTodPillarFailure(pillars: TodPillars | undefined): boolean {
  if (!pillars) return false;
  return (
    !pillars.objective ||
    !pillars.timing ||
    !pillars.authority ||
    !pillars.reliability ||
    !pillars.coverage ||
    !pillars.evidence
  );
}

/**
 * Single decision seam. Validates the submission and computes
 * Effective/Ineffective. A null control skips the Table 22 minimum
 * (server fallback when the control row is missing) but still
 * enforces Zero-Tolerance and the 6-pilar TOD rule.
 */
export function decideTest(
  control: TestingControl | null,
  input: TestingDecisionInput,
): TestingDecision {
  if (input.testType === 'TOE') {
    if (
      control &&
      requiresHomogeneityJustification(
        control,
        input.sampleSize,
        input.homogeneityJustification,
      )
    ) {
      return {
        isValid: false,
        field: 'homogeneityJustification',
        code: 'BELOW_MIN_JUSTIFICATION_REQUIRED',
      };
    }

    if (hasFailSample(input.samples)) {
      return { isValid: true, verdict: 'Ineffective' };
    }

    return { isValid: true, verdict: input.claimedResult };
  }

  if (isTodPillarFailure(input.todPillars)) {
    return { isValid: true, verdict: 'Ineffective' };
  }

  return { isValid: true, verdict: input.claimedResult };
}

/**
 * Control adapter: normalizes a caller-shaped control or DB row (extra
 * fields ignored; missing or unrecognised rows fall back to the
 * null-control path), then decides. Single one-line forward for every
 * client pre-flight and worker seam.
 */
export function decideFromControl(
  control: RawTestingControl | null | undefined,
  input: TestingDecisionInput,
): TestingDecision {
  return decideTest(normalizeTestingControl(control), input);
}

/**
 * Explicit no-sampling entry for rows without a control (RCM verification
 * patch, TOD matrix write). Table 22 minimum is skipped by construction;
 * Zero-Tolerance and the 6-pilar TOD rule are still enforced. Prefer this
 * over `decideTest(null, …)` so the skip is visible at the call site.
 */
export function decideWithoutControlSampling(input: TestingDecisionInput): TestingDecision {
  return decideTest(null, input);
}

/** Raw form/body surface for a test submission. Unknowns are normalized;
 *  anything unrecognised falls back to the seam defaults. */
export interface TestSubmissionValues {
  testType: unknown;
  result?: unknown;
  claimedResult?: unknown;
  sampleSize?: unknown;
  homogeneityJustification?: unknown;
  samples?: unknown;
  todPilarObjective?: unknown;
  todPilarTiming?: unknown;
  todPilarAuthority?: unknown;
  todPilarReliability?: unknown;
  todPilarCoverage?: unknown;
  todPilarEvidence?: unknown;
}

/**
 * Single free-text pilar normalizer (Lampiran 8): pillars are free-text
 * justification — a non-empty string counts as satisfied. Boolean true is
 * accepted for forward-compat with boolean form fields. Anything else
 * (missing, empty, non-string) counts as unsatisfied: there is no silent
 * default to satisfied.
 */
export function isPilarSatisfied(value: unknown): boolean {
  if (typeof value === 'string') return value.trim() !== '';
  return value === true;
}

function cleanSamples(value: unknown): DecisionSample[] {
  if (!Array.isArray(value)) return [];
  return value.filter(
    (s): s is DecisionSample =>
      typeof s === 'object' && s !== null && ((s as { status?: unknown }).status === 'Pass' || (s as { status?: unknown }).status === 'Fail'),
  );
}

/**
 * Form constructor: normalizes caller-shaped submission values (client
 * form or worker body) and decides in one call. TOD pillars attach only
 * for TOD; TOE carries samples and the Table 22 minimum. Adapters forward
 * the verdict without re-branching on test type.
 */
export function decideFromForm(
  control: RawTestingControl | null | undefined,
  values: TestSubmissionValues,
): TestingDecision {
  const testType: TestType = values.testType === 'TOD' ? 'TOD' : 'TOE';
  const claimed: TestingVerdict =
    values.result === 'Ineffective' || values.claimedResult === 'Ineffective' ? 'Ineffective' : 'Effective';
  const sampleSize = typeof values.sampleSize === 'number' ? values.sampleSize : undefined;
  const homogeneityJustification =
    typeof values.homogeneityJustification === 'string' ? values.homogeneityJustification : undefined;
  const samples = cleanSamples(values.samples);
  const todPillars: TodPillars | undefined =
    testType === 'TOD'
      ? {
          objective: isPilarSatisfied(values.todPilarObjective),
          timing: isPilarSatisfied(values.todPilarTiming),
          authority: isPilarSatisfied(values.todPilarAuthority),
          reliability: isPilarSatisfied(values.todPilarReliability),
          coverage: isPilarSatisfied(values.todPilarCoverage),
          evidence: isPilarSatisfied(values.todPilarEvidence),
        }
      : undefined;
  return decideFromControl(control, {
    testType,
    claimedResult: claimed,
    sampleSize,
    homogeneityJustification,
    samples,
    todPillars,
  });
}
