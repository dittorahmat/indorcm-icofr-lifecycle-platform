import { describe, it, expect } from 'vitest';
import { evaluateTestSubmission, TestableControl } from '../testing-compliance-engine';
import type { TestFormValues } from '../test-schema';

describe('TestingComplianceEngine', () => {
  const mockControl: TestableControl = {
    frequency: 'Monthly',
    riskRating: 'High',
    nature: 'Manual',
  };

  it('rejects TOE without homogeneity justification when sample size is below minimum', () => {
    // Monthly + High requires min 5 samples
    const values: TestFormValues = {
      testType: 'TOE',
      method: 'Inspection',
      sampleSize: 3,
      homogeneityJustification: '',
      result: 'Effective',
      samples: []
    } as any;

    const res = evaluateTestSubmission(mockControl, values);
    expect(res.isValid).toBe(false);
    expect(res.fieldError?.field).toBe('homogeneityJustification');
    expect(res.fieldError?.messageKey).toBe('validation.belowMinJustificationRequired');
  });

  it('accepts TOE below minimum if homogeneity justification is provided', () => {
    const values: TestFormValues = {
      testType: 'TOE',
      method: 'Inspection',
      sampleSize: 3,
      homogeneityJustification: 'All transactions use identical automated SAP template',
      result: 'Effective',
      samples: []
    } as any;

    const res = evaluateTestSubmission(mockControl, values);
    expect(res.isValid).toBe(true);
    expect(res.computedResult).toBe('Effective');
  });

  it('forces Ineffective if any TOE sample failed under zero tolerance', () => {
    const values: TestFormValues = {
      testType: 'TOE',
      method: 'Inspection',
      sampleSize: 5,
      result: 'Effective',
      samples: [
        { sampleNumber: 1, identifier: 'SMP-01', description: 'Test', date: '2024-01-01', status: 'Pass' },
        { sampleNumber: 2, identifier: 'SMP-02', description: 'Test', date: '2024-01-02', status: 'Fail' },
      ]
    } as any;

    const res = evaluateTestSubmission(mockControl, values);
    expect(res.isValid).toBe(true);
    expect(res.computedResult).toBe('Ineffective');
  });

  it('forces Ineffective if any TOD 6-pillar attribute is unchecked', () => {
    const values: TestFormValues = {
      testType: 'TOD',
      method: 'Inspection',
      todPilarObjective: true,
      todPilarTiming: false, // one pillar failed
      todPilarAuthority: true,
      todPilarReliability: true,
      todPilarCoverage: true,
      todPilarEvidence: true,
      result: 'Effective',
      samples: []
    } as any;

    const res = evaluateTestSubmission(mockControl, values);
    expect(res.isValid).toBe(true);
    expect(res.computedResult).toBe('Ineffective');
  });
});
