/** Pure RCM verification projection helpers (arch-09 T4).
 *  Allow-lists, FE->BE field map, assertion fallback, noGL filter and the
 *  30-field verification-row projection. No I/O — unit-tested without a DB. */
import type {
  CreateVerificationDesignBody,
  VerificationBatchUpdateItem,
  VerificationDesignPatchBody,
} from '@shared/types';

/** Request-body contracts (source of truth in shared/types). */
export type VerificationPatchBody = VerificationDesignPatchBody;
export type BatchUpdateItem = VerificationBatchUpdateItem;
export type CreateVerificationBody = CreateVerificationDesignBody;

export const LINI1_FIELDS = [
  'controlName', 'controlDescription', 'supportingDocs', 'isKeyControl',
  'ipoC', 'ipoA', 'ipoV', 'ipoRa', 'assertionE', 'assertionC', 'assertionA',
  'assertionCo', 'assertionVa', 'assertionRo', 'assertionPd', 'controlType',
  'controlNature', 'automatedControlType', 'frequency', 'supportingApp',
  'applicationId', 'executingFunction', 'executorRole', 'affectedFsliItem',
  'effectivePeriod',
] as const;

export const LINI2_FIELDS = [
  'pilarObjective', 'pilarTiming', 'pilarAuthority', 'pilarReliability',
  'pilarCoverage', 'pilarEvidence', 'kkReference', 'conclusion', 'comment',
] as const;

export type Lini1Field = (typeof LINI1_FIELDS)[number];
export type Lini2Field = (typeof LINI2_FIELDS)[number];

/** FE -> BE field map. `automatedSubNature` is a FE alias of the BE column
 *  `automatedControlType`; both keys converge so drift is impossible. */
export const CONTROL_FIELDS_MAP: Record<string, string> = {
  controlName: 'controlName', controlDescription: 'controlDescription',
  supportingDocs: 'supportingDocs', isKeyControl: 'isKeyControl',
  controlType: 'controlType', controlNature: 'controlNature',
  frequency: 'frequency', supportingApp: 'supportingApp',
  applicationId: 'applicationId', executingFunction: 'executingFunction',
  executorRole: 'executorRole', affectedFsliItem: 'affectedFsliItem',
  effectivePeriod: 'effectivePeriod', ipoC: 'ipoC', ipoA: 'ipoA',
  ipoV: 'ipoV', ipoRa: 'ipoRa', assertionE: 'assertionE',
  assertionC: 'assertionC', assertionA: 'assertionA',
  assertionCo: 'assertionCo', assertionVa: 'assertionVa',
  assertionRo: 'assertionRo', assertionPd: 'assertionPd',
  itgcDomain: 'itgcDomain', automatedSubNature: 'automatedControlType',
  automatedControlType: 'automatedControlType',
};

export const RISK_FIELDS = ['riskDescription', 'riskRating', 'isFraudRelated'] as const;

export type AssertionRow = Partial<Record<string, string | null>>;

type AssertionPilar = 'E' | 'C' | 'A' | 'Co' | 'Va' | 'Ro' | 'Pd';

/** Minimal read surface: explicit assertion columns + FSLI defaults.
 *  Matrix rows carry additional drizzle scalars that flow through
 *  the spread below untouched. */
export type AssertionFallbackSource = {
  [K in `assertion${AssertionPilar}` | `def${AssertionPilar}`]?: string | null;
};

/** Prefers the explicit assertion over the account (FSLI) default. Empty,
 *  null and undefined all fall back (legacy `||` semantics). */
export function applyAssertionFallback(row: AssertionFallbackSource): AssertionRow {
  const overrides: AssertionRow = {};
  for (const key of ['E', 'C', 'A', 'Co', 'Va', 'Ro', 'Pd'] as const) {
    const explicit = row[`assertion${key}`];
    if (explicit === undefined || explicit === null || explicit === '') {
      const fallback = row[`def${key}`];
      overrides[`assertion${key}`] = typeof fallback === 'string' ? fallback : null;
    }
  }
  return { ...row, ...overrides };
}

export function matchesNoGL(fsliCodes: string[] | null | undefined, noGL: string | undefined): boolean {
  if (!noGL || noGL === 'undefined') return true;
  return Array.isArray(fsliCodes) && fsliCodes.includes(noGL);
}

export interface VerificationSourceControl {
  code?: string | null;
  fsliCodes?: string[] | null;
  todEvaluations?: Array<{
    id?: string | null;
    pilarObjective?: string | null;
    pilarTiming?: string | null;
    pilarAuthority?: string | null;
    pilarReliability?: string | null;
    pilarCoverage?: string | null;
    pilarEvidence?: string | null;
    kkReference?: string | null;
    conclusion?: string | null;
    comment?: string | null;
  }> | null;
}

export interface VerificationSourceRow {
  id: string;
  controlId: string;
  controlName?: string | null;
  controlDescription?: string | null;
  supportingDocs?: string | null;
  isKeyControl?: boolean | null;
  ipoC?: string | null;
  ipoA?: string | null;
  ipoV?: string | null;
  ipoRa?: string | null;
  assertionE?: string | null;
  assertionC?: string | null;
  assertionA?: string | null;
  assertionCo?: string | null;
  assertionVa?: string | null;
  assertionRo?: string | null;
  assertionPd?: string | null;
  controlType?: string | null;
  controlNature?: string | null;
  automatedControlType?: string | null;
  frequency?: string | null;
  supportingApp?: string | null;
  applicationId?: string | null;
  executingFunction?: string | null;
  executorRole?: string | null;
  affectedFsliItem?: string | null;
  effectivePeriod?: string | null;
  control?: VerificationSourceControl | null;
}

/** 30-field verification-design projection with org enrichment. Pure. */
export function projectVerificationRow(
  m: VerificationSourceRow,
  org: { name?: string | null; entityCode?: string | null } | null,
): Record<string, unknown> {
  const tod = m.control?.todEvaluations?.[0] ?? {};
  return {
    id: m.id, controlId: m.controlId, mappingId: m.id,
    companyName: org?.name ?? 'N/A', locationCode: org?.entityCode ?? 'N/A',
    controlCode: m.control?.code ?? null, controlName: m.controlName ?? null,
    controlDescription: m.controlDescription ?? null, supportingDocs: m.supportingDocs ?? null,
    isKeyControl: m.isKeyControl ?? null, ipoC: m.ipoC ?? null, ipoA: m.ipoA ?? null,
    ipoV: m.ipoV ?? null, ipoRa: m.ipoRa ?? null, assertionE: m.assertionE ?? null,
    assertionC: m.assertionC ?? null, assertionA: m.assertionA ?? null,
    assertionCo: m.assertionCo ?? null, assertionVa: m.assertionVa ?? null,
    assertionRo: m.assertionRo ?? null, assertionPd: m.assertionPd ?? null,
    controlType: m.controlType ?? null, controlNature: m.controlNature ?? null,
    automatedControlType: m.automatedControlType ?? null, frequency: m.frequency ?? null,
    supportingApp: m.supportingApp ?? null, applicationId: m.applicationId ?? null,
    executingFunction: m.executingFunction ?? null, executorRole: m.executorRole ?? null,
    affectedFsliItem: m.affectedFsliItem ?? null, effectivePeriod: m.effectivePeriod ?? null,
    todId: tod.id ?? null, pilarObjective: tod.pilarObjective ?? null,
    pilarTiming: tod.pilarTiming ?? null, pilarAuthority: tod.pilarAuthority ?? null,
    pilarReliability: tod.pilarReliability ?? null, pilarCoverage: tod.pilarCoverage ?? null,
    pilarEvidence: tod.pilarEvidence ?? null, kkReference: tod.kkReference ?? null,
    conclusion: tod.conclusion ?? null, comment: tod.comment ?? null,
  };
}
