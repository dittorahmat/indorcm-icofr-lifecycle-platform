import { describe, expect, it } from 'vitest';
import {
  decideTestSubmission,
  decideTestingRecord,
  decideTodEvaluation,
} from './csa-verdict';

const monthlyHighManual = { frequency: 'Monthly', riskRating: 'High', nature: 'Manual' } as const;

describe('csa-verdict field-forwarding parity', () => {
  it('tod-evaluation forwards short pilar names: empty pilar forces Ineffective', () => {
    const d = decideTodEvaluation(monthlyHighManual, {
      conclusion: 'Effective',
      pilarObjective: 'ok',
      pilarTiming: '',
      pilarAuthority: 'ok',
      pilarReliability: 'ok',
      pilarCoverage: 'ok',
      pilarEvidence: 'ok',
    });
    expect(d.isValid).toBe(true);
    expect(d.verdict).toBe('Ineffective');
  });

  it('tests forwards samples: fail sample forces Ineffective even when claimed Effective', () => {
    const d = decideTestSubmission(monthlyHighManual, {
      testType: 'TOE',
      result: 'Effective',
      sampleSize: 5,
      samples: [{ status: 'Fail' }, { status: 'Pass' }],
    });
    expect(d.verdict).toBe('Ineffective');
  });

  it('testing-records drops pilars and samples: below-min TOE without justification is invalid', () => {
    const d = decideTestingRecord(monthlyHighManual, {
      testType: 'TOE',
      result: 'Effective',
      sampleSize: 1,
    });
    expect(d.isValid).toBe(false);
    expect(d.code).toBe('BELOW_MIN_JUSTIFICATION_REQUIRED');
  });

  it('null control skips Table 22 but keeps Zero-Tolerance', () => {
    const d = decideTestSubmission(null, {
      testType: 'TOE',
      result: 'Effective',
      sampleSize: 0,
      samples: [{ status: 'Fail' }],
    });
    expect(d.isValid).toBe(true);
    expect(d.verdict).toBe('Ineffective');
  });
});
