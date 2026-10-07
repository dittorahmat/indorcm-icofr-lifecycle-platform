import { Control, ControlFrequency } from '@shared/types';
import { getSuggestedSampleRange, isReadyForRemediationTest } from '@/lib/compliance-utils';
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
 * Evaluates test submission compliance against SK-5 Table 22/23 sampling rules,
 * Zero Tolerance deviation rules, and 6-Pilar TOD sufficiency.
 */
export function evaluateTestSubmission(
  control: TestableControl,
  values: TestFormValues
): EvaluationResult {
  const suggestion = getSuggestedSampleRange(
    control.frequency as ControlFrequency,
    control.riskRating as "High" | "Medium" | "Low",
    control.nature as string
  );

  // 1. TOE validation: Sample size & Homogeneity justification
  if (values.testType === 'TOE') {
    const sampleSize = values.sampleSize ?? 0;
    if (sampleSize < suggestion.min && !values.homogeneityJustification?.trim()) {
      return {
        isValid: false,
        fieldError: {
          field: 'homogeneityJustification',
          messageKey: 'validation.belowMinJustificationRequired'
        }
      };
    }

    // Zero Tolerance: any failed sample forces Ineffective
    if (values.samples?.some(s => s.status === 'Fail')) {
      return {
        isValid: true,
        computedResult: 'Ineffective'
      };
    }
  }

  // 2. TOD validation: 6-Pilar evaluation (all must be satisfied)
  if (values.testType === 'TOD') {
    const pillars = [
      values.todPilarObjective,
      values.todPilarTiming,
      values.todPilarAuthority,
      values.todPilarReliability,
      values.todPilarCoverage,
      values.todPilarEvidence
    ];
    if (pillars.some(p => p === false)) {
      return {
        isValid: true,
        computedResult: 'Ineffective'
      };
    }
  }

  return {
    isValid: true,
    computedResult: values.result
  };
}

/**
 * Pure helper to compute remediation status if an open deficiency exists.
 */
export function getRemediationReadiness(control: Control, openDeficiencyDate?: number) {
  if (!openDeficiencyDate) return null;
  return isReadyForRemediationTest(control.frequency as ControlFrequency, openDeficiencyDate);
}
