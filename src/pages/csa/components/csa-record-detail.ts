import type { Control } from '@shared/types';

/** TLC matrix row: Control plus the mapping identifiers the API joins in. */
export type MatrixControl = Control & { controlId: string; mappingId: string };

export interface TodFormValues {
  riskDescription?: string | null;
  isFraudRelated: boolean;
  riskRating?: string | null;
  mappedControlName: string;
  mappedControlDescription?: string | null;
  supportingDocs?: string | null;
  isKeyControl: boolean;
  controlType?: string | null;
  controlNature?: string | null;
  automatedSubNature?: string | null;
  frequency?: string | null;
  supportingApp?: string | null;
  executingFunction?: string | null;
  executorRole?: string | null;
  affectedFsliItem?: string | null;
  effectivePeriod?: string | null;
  ipoC: boolean;
  ipoA: boolean;
  ipoV: boolean;
  ipoRa: boolean;
  assertionE: boolean;
  assertionC: boolean;
  assertionA: boolean;
  assertionCo: boolean;
  assertionVa: boolean;
  assertionRo: boolean;
  assertionPd: boolean;
  pilarObjective: string;
  pilarTiming: string;
  pilarAuthority: string;
  pilarReliability: string;
  pilarCoverage: string;
  pilarEvidence: string;
  kkReference?: string;
  conclusion: string;
  comment?: string;
}

export interface RcmBatchItem {
  mappingId: string;
  riskDescription?: string | null;
  isFraudRelated: boolean;
  riskRating?: string | null;
  controlName: string;
  controlDescription?: string | null;
  supportingDocs?: string | null;
  isKeyControl: boolean;
  controlType?: string | null;
  controlNature?: string | null;
  automatedSubNature?: string | null;
  frequency?: string | null;
  supportingApp?: string | null;
  executingFunction?: string | null;
  executorRole?: string | null;
  affectedFsliItem?: string | null;
  effectivePeriod?: string | null;
  ipoC: boolean;
  ipoA: boolean;
  ipoV: boolean;
  ipoRa: boolean;
  assertionE: boolean;
  assertionC: boolean;
  assertionA: boolean;
  assertionCo: boolean;
  assertionVa: boolean;
  assertionRo: boolean;
  assertionPd: boolean;
}

export interface TodSavePayload {
  controlId: string;
  pilarObjective: string;
  pilarTiming: string;
  pilarAuthority: string;
  pilarReliability: string;
  pilarCoverage: string;
  pilarEvidence: string;
  kkReference?: string;
  conclusion: string;
  comment?: string;
}

/** Dedupe matrix rows on the canonical `controlId || id` key. */
export function dedupeMatrixControls<T extends { controlId?: string; id: string }>(items: T[]): T[] {
  const seen = new Set<string>();
  return items.filter((item) => {
    const id = item.controlId || item.id;
    if (!id || seen.has(id)) return false;
    seen.add(id);
    return true;
  });
}

export function buildRcmPayload(mappingId: string, values: TodFormValues): RcmBatchItem {
  return {
    mappingId,
    riskDescription: values.riskDescription,
    isFraudRelated: values.isFraudRelated,
    riskRating: values.riskRating,
    controlName: values.mappedControlName,
    controlDescription: values.mappedControlDescription,
    supportingDocs: values.supportingDocs,
    isKeyControl: values.isKeyControl,
    controlType: values.controlType,
    controlNature: values.controlNature,
    automatedSubNature: values.automatedSubNature,
    frequency: values.frequency,
    supportingApp: values.supportingApp,
    executingFunction: values.executingFunction,
    executorRole: values.executorRole,
    affectedFsliItem: values.affectedFsliItem,
    effectivePeriod: values.effectivePeriod,
    ipoC: values.ipoC,
    ipoA: values.ipoA,
    ipoV: values.ipoV,
    ipoRa: values.ipoRa,
    assertionE: values.assertionE,
    assertionC: values.assertionC,
    assertionA: values.assertionA,
    assertionCo: values.assertionCo,
    assertionVa: values.assertionVa,
    assertionRo: values.assertionRo,
    assertionPd: values.assertionPd,
  };
}

export function buildTodPayload(controlId: string, values: TodFormValues): TodSavePayload {
  return {
    controlId,
    pilarObjective: values.pilarObjective,
    pilarTiming: values.pilarTiming,
    pilarAuthority: values.pilarAuthority,
    pilarReliability: values.pilarReliability,
    pilarCoverage: values.pilarCoverage,
    pilarEvidence: values.pilarEvidence,
    kkReference: values.kkReference,
    conclusion: values.conclusion,
    comment: values.comment,
  };
}

type Workflowish = {
  workflowStatus?: string | null;
  line2Status?: string | null;
  isDraft?: boolean | null;
};

/** Single place for the Draft → In Review → Validated fallback. */
export function resolveWorkflowStatus(record: Workflowish): string {
  if (record.workflowStatus) return record.workflowStatus;
  if (record.line2Status === 'Validated') return 'Validated';
  if (record.isDraft) return 'Draft';
  return 'In Review';
}

export function csaRecordDetailKey(recordId: string): string[] {
  return ['csa-record-detail', recordId];
}

export function csaMatrixKey(bpmProcessId: string, workingYear: string): string[] {
  return ['rcm-matrix-tlc-process', bpmProcessId, workingYear];
}

export function csaWorklistKey(workingYear: string): string[] {
  return ['csa-worklist', workingYear];
}

export function findTodEvaluation<T extends { controlId: string }>(
  evaluations: T[],
  control: { controlId: string },
): T | undefined {
  return evaluations.find((e) => e.controlId === control.controlId);
}

export function isValidAssessmentDate(value: unknown): boolean {
  if (typeof value === 'object' && value !== null && typeof (value as { getTime?: unknown }).getTime === 'function') {
    return Number.isFinite((value as { getTime: () => number }).getTime());
  }
  const time = new Date(value as string).getTime();
  return Number.isFinite(time);
}

export function formatAssessmentDate(value: string | Date): string {
  const date = value instanceof Date ? value : new Date(value);
  return date.toISOString();
}
