import {
  decideFromForm,
  RawTestingControl,
  TestSubmissionValues,
  TestingDecision,
  TestingVerdict,
} from '@shared/testing-decision';

export interface EvaluatedControlEffectiveness {
  decision: TestingDecision;
  verdict: TestingVerdict;
  isCompliant: boolean;
  deficiencyProposal: {
    recommended: boolean;
    initialSeverity?: 'Low' | 'Medium' | 'High';
    suggestedNotes?: string;
  };
}

/**
 * Single evaluation seam uniting test validation, deterministic verdict derivation,
 * and automatic deficiency proposal according to SK-5/DKU.MBU/11/2024.
 */
export function evaluateControlEffectiveness(
  control: RawTestingControl | null | undefined,
  values: TestSubmissionValues,
): EvaluatedControlEffectiveness {
  const decision = decideFromForm(control, values);
  const verdict: TestingVerdict = decision.verdict ?? (values.result === 'Ineffective' ? 'Ineffective' : 'Effective');
  const isCompliant = decision.isValid && verdict === 'Effective';

  const shouldProposeDeficiency = verdict === 'Ineffective';

  let initialSeverity: 'Low' | 'Medium' | 'High' | undefined;
  if (shouldProposeDeficiency) {
    if (control?.riskRating === 'High') {
      initialSeverity = 'High';
    } else if (control?.riskRating === 'Medium') {
      initialSeverity = 'Medium';
    } else {
      initialSeverity = 'Low';
    }
  }

  return {
    decision,
    verdict,
    isCompliant,
    deficiencyProposal: {
      recommended: shouldProposeDeficiency,
      initialSeverity,
      suggestedNotes: shouldProposeDeficiency
        ? `Deficiency detected during ${values.testType === 'TOD' ? 'Test of Design' : 'Test of Operating Effectiveness'}.`
        : undefined,
    },
  };
}
