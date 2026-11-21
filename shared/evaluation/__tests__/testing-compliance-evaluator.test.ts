import { describe, it, expect } from 'vitest';
import { evaluateControlEffectiveness } from '../testing-compliance-evaluator';

describe('evaluateControlEffectiveness', () => {
  it('returns compliant Effective verdict and no deficiency proposal when all criteria pass', () => {
    const result = evaluateControlEffectiveness(
      { frequency: 'Monthly', riskRating: 'Medium', nature: 'Manual' },
      {
        testType: 'TOE',
        sampleSize: 3,
        samples: [
          { id: '1', status: 'Pass' },
          { id: '2', status: 'Pass' },
          { id: '3', status: 'Pass' },
        ],
      }
    );

    expect(result.verdict).toBe('Effective');
    expect(result.isCompliant).toBe(true);
    expect(result.deficiencyProposal.recommended).toBe(false);
  });

  it('proposes deficiency and sets severity based on risk rating when test fails zero tolerance', () => {
    const result = evaluateControlEffectiveness(
      { frequency: 'Monthly', riskRating: 'High', nature: 'Manual' },
      {
        testType: 'TOE',
        sampleSize: 5,
        samples: [
          { id: '1', status: 'Pass' },
          { id: '2', status: 'Fail' },
          { id: '3', status: 'Pass' },
        ],
      }
    );

    expect(result.verdict).toBe('Ineffective');
    expect(result.isCompliant).toBe(false);
    expect(result.deficiencyProposal.recommended).toBe(true);
    expect(result.deficiencyProposal.initialSeverity).toBe('High');
  });

  it('validates TOD pillars and flags Ineffective if any pillar is missing', () => {
    const result = evaluateControlEffectiveness(
      { frequency: 'Annual', riskRating: 'Low', nature: 'Manual' },
      {
        testType: 'TOD',
        todPilarObjective: 'Satisfied',
        todPilarTiming: '', // Empty -> unsatisfied
        todPilarAuthority: 'Satisfied',
        todPilarReliability: 'Satisfied',
        todPilarCoverage: 'Satisfied',
        todPilarEvidence: 'Satisfied',
      }
    );

    expect(result.verdict).toBe('Ineffective');
    expect(result.deficiencyProposal.recommended).toBe(true);
    expect(result.deficiencyProposal.initialSeverity).toBe('Low');
  });
});
