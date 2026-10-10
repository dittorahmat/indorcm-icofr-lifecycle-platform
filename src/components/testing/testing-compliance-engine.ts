import { Control, ControlFrequency } from '@shared/types';
import { isReadyForRemediationTest } from '@/lib/compliance-utils';
import { decideFromForm } from '@shared/testing-decision';
import { TestFormValues } from './test-schema';

export interface EvaluationResult {
  isValid: boolean;
  computedResult?: 'Effective' | 'Ineffective';
  errorMessageKey?: string;
  fieldError?: {
    field: keyof TestFormValues;
    messageKey: string;
  };
}

export type TestableControl = Pick<Control, 'frequency' | 'riskRating' | 'nature'>;

/**
 * Client pre-flight adapter over the single testing-decision seam.
 * All Table 22/23, Zero-Tolerance and 6-pilar rules live in
 * `@shared/testing-decision`; this adapter only forwards the form to
 * the seam and maps seam verdicts to form errors.
 */
export function evaluateTestSubmission(
  control: TestableControl,
  values: TestFormValues,
): EvaluationResult {
  const decision = decideFromForm(
    { frequency: control.frequency, riskRating: control.riskRating, nature: control.nature },
    values,
  );

  if (!decision.isValid) {
    return {
      isValid: false,
      fieldError: {
        field: decision.field ?? 'homogeneityJustification',
        messageKey: 'validation.belowMinJustificationRequired',
      },
    };
  }

  return {
    isValid: true,
    computedResult: decision.verdict ?? values.result,
  };
}

/**
 * Pure helper to compute remediation status if an open deficiency exists.
 */
export function getRemediationReadiness(control: Control, openDeficiencyDate?: number) {
  if (!openDeficiencyDate) return null;
  return isReadyForRemediationTest(control.frequency as ControlFrequency, openDeficiencyDate);
}
