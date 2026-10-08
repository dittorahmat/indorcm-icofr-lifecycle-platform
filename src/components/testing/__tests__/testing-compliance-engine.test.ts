import { describe, expect, it } from 'vitest';
import {
  evaluateTestSubmission,
  type TestableControl,
} from '../testing-compliance-engine';
import type { TestFormValues } from '../test-schema';

const mockControl: TestableControl = {
  frequency: 'Monthly',
  riskRating: 'High',
  nature: 'Manual',
};

function baseValues(overrides: Partial<TestFormValues> = {}): TestFormValues {
  return {
    testType: 'TOE',
    method: 'Inspection',
    result: 'Effective',
    comments: 'Walkthrough and sample inspection completed.',
    sampleSize: 5,
    homogeneityJustification: '',
    evaluationAttributes: {
      objectiveAchieved: true,
      timingAccuracy: true,
      authorityCompetence: true,
      infoReliability: true,
      periodCoverage: true,
      evidenceAvailability: true,
    },
    todPilarObjective: true,
    todPilarTiming: true,
    todPilarAuthority: true,
    todPilarReliability: true,
    todPilarCoverage: true,
    todPilarEvidence: true,
    todPilarComments: {},
    samples: [],
    ...overrides,
  };
}

function passSample(ref: string) {
  return {
    sampleRef: ref,
    attrA: true,
    attrB: true,
    attrC: true,
    attrD: true,
    status: 'Pass' as const,
    comments: '',
  };
}

describe('testing-compliance-engine adapter (delegates to testing-decision seam)', () => {
  it('rejects TOE without homogeneity justification when sample size is below minimum', () => {
    // Monthly + High requires min 5 samples (SK-5 Table 22)
    const res = evaluateTestSubmission(
      mockControl,
      baseValues({ sampleSize: 3, homogeneityJustification: '' }),
    );
    expect(res.isValid).toBe(false);
    expect(res.fieldError?.field).toBe('homogeneityJustification');
    expect(res.fieldError?.messageKey).toBe(
      'validation.belowMinJustificationRequired',
    );
  });

  it('accepts TOE below minimum if homogeneity justification is provided', () => {
    const res = evaluateTestSubmission(
      mockControl,
      baseValues({
        sampleSize: 3,
        homogeneityJustification:
          'All transactions use identical automated SAP template',
      }),
    );
    expect(res.isValid).toBe(true);
    expect(res.computedResult).toBe('Effective');
  });

  it('forces Ineffective if any TOE sample failed under zero tolerance', () => {
    const res = evaluateTestSubmission(
      mockControl,
      baseValues({
        sampleSize: 5,
        result: 'Effective',
        samples: [
          passSample('SMP-01'),
          { ...passSample('SMP-02'), status: 'Fail' },
        ],
      }),
    );
    expect(res.isValid).toBe(true);
    expect(res.computedResult).toBe('Ineffective');
  });

  it('forces Ineffective if any TOD 6-pilar attribute is unchecked', () => {
    const res = evaluateTestSubmission(
      mockControl,
      baseValues({
        testType: 'TOD',
        todPilarTiming: false,
        result: 'Effective',
      }),
    );
    expect(res.isValid).toBe(true);
    expect(res.computedResult).toBe('Ineffective');
  });

  it('keeps Effective when TOE sampling passes and no sample fails', () => {
    const res = evaluateTestSubmission(
      mockControl,
      baseValues({
        sampleSize: 5,
        samples: [passSample('SMP-01'), passSample('SMP-02')],
      }),
    );
    expect(res.isValid).toBe(true);
    expect(res.computedResult).toBe('Effective');
  });
});
