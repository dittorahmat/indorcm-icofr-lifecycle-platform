import { Control, ControlFrequency } from '@shared/types';
import { isReadyForRemediationTest } from '@/lib/compliance-utils';
import {
  decideTest,
  type TestingControl,
  type TodPillars,
} from '@shared/testing-decision';
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

function toTestingControl(control: TestableControl): TestingControl {
  return {
    frequency: control.frequency as TestingControl['frequency'],
    riskRating: control.riskRating as TestingControl['riskRating'],
    nature: control.nature as string,
  };
}

function toTodPillars(values: TestFormValues): TodPillars {
  return {
    objective: values.todPilarObjective,
    timing: values.todPilarTiming,
    authority: values.todPilarAuthority,
    reliability: values.todPilarReliability,
    coverage: values.todPilarCoverage,
    evidence: values.todPilarEvidence,
  };
}

/**
 * Client pre-flight adapter over the single testing-decision seam.
 * All Table 22/23, Zero-Tolerance and 6-pilar rules live in
 * `@shared/testing-decision`; this adapter only maps form values
 * to the seam input and seam verdicts to form errors.
 */
export function evaluateTestSubmission(
  control: TestableControl,
  values: TestFormValues,
): EvaluationResult {
  const decision = decideTest(toTestingControl(control), {
    testType: values.testType,
    claimedResult: values.result,
    sampleSize: values.sampleSize,
    homogeneityJustification: values.homogeneityJustification,
    samples: values.samples,
    todPillars: values.testType === 'TOD' ? toTodPillars(values) : undefined,
  });

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
