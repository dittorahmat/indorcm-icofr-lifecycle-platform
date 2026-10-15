import * as z from 'zod';
import type { WorkflowHistoryEntry } from '@shared/types';

export type RcmTFunction = (key: string) => string;

export function createRcmFormSchema(t: RcmTFunction) {
  return z.object({
    id: z.string().optional(),
    mappingId: z.string(),
    processName: z.string().nullable().optional(),
    subProcessName: z.string().nullable().optional(),
    fsliName: z.string().nullable().optional(),
    noGL: z.string().nullable().optional(),
    bpmCode: z.string().nullable().optional(),

    riskDescription: z.string().nullable().optional(),
    isFraudRelated: z.boolean(),
    riskRating: z.string().nullable().optional(),
    controlCode: z.string().nullable().optional(),
    mappedControlName: z.string().min(1, t('matrix.validation.control_name_required')),
    mappedControlDescription: z.string().nullable().optional(),
    supportingDocs: z.string().nullable().optional(),
    isKeyControl: z.boolean(),
    controlType: z.string().nullable().optional(),
    controlNature: z.string().nullable().optional(),
    applicationId: z.string().nullable().optional(),
    automatedSubNature: z.string().nullable().optional(),
    frequency: z.string().nullable().optional(),
    supportingApp: z.string().nullable().optional(),
    executingFunction: z.string().nullable().optional(),
    executorRole: z.string().nullable().optional(),
    affectedFsliItem: z.string().nullable().optional(),
    effectivePeriod: z.string().nullable().optional(),

    ipoC: z.boolean(),
    ipoA: z.boolean(),
    ipoV: z.boolean(),
    ipoRa: z.boolean(),

    assertionE: z.boolean(),
    assertionC: z.boolean(),
    assertionA: z.boolean(),
    assertionCo: z.boolean(),
    assertionVa: z.boolean(),
    assertionRo: z.boolean(),
    assertionPd: z.boolean(),

    itgcDomain: z.string().nullable().optional(),
  });
}

export type RcmFormValues = z.infer<ReturnType<typeof createRcmFormSchema>>;

export type RcmDialogSource = {
  [K in keyof RcmFormValues]?: unknown;
} & {
  controlCode?: string | null;
  rcmId?: string;
  workflowStatus?: string;
  status?: string;
  workflowHistory?: WorkflowHistoryEntry[];
};

const BOOL_FIELDS = [
  'isFraudRelated',
  'isKeyControl',
  'ipoC',
  'ipoA',
  'ipoV',
  'ipoRa',
  'assertionE',
  'assertionC',
  'assertionA',
  'assertionCo',
  'assertionVa',
  'assertionRo',
  'assertionPd',
] as const satisfies readonly (keyof RcmFormValues)[];

export function parseRcmBool(val: unknown): boolean {
  return val === 'Y' || val === true || val === 'true';
}

export const defaultRcmValues: Pick<RcmFormValues, (typeof BOOL_FIELDS)[number]> & { id: string; mappingId: string } = {
  id: '',
  mappingId: '',
  isFraudRelated: false,
  isKeyControl: false,
  ipoC: false,
  ipoA: false,
  ipoV: false,
  ipoRa: false,
  assertionE: false,
  assertionC: false,
  assertionA: false,
  assertionCo: false,
  assertionVa: false,
  assertionRo: false,
  assertionPd: false,
};

export function valuesFromData(data: RcmDialogSource): RcmFormValues {
  const coerced: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(data)) coerced[key] = value;
  for (const field of BOOL_FIELDS) coerced[field] = parseRcmBool(data[field]);
  // boundary: external RCM row (Y/N strings, nullable text) → strict form values
  return coerced as RcmFormValues;
}

export function resolveRcmWorkflowStatus(data: Pick<RcmDialogSource, 'workflowStatus' | 'status'>): string {
  if (data.workflowStatus) return data.workflowStatus;
  if (data.status === 'Pending Change Approval') return 'In Review';
  if (data.status === 'Active') return 'Approved';
  return 'Draft';
}
