import { describe, expect, it } from 'vitest';
import {
  decideFromControl,
  decideFromForm,
  decideTest,
  getSuggestedSampleRange,
  hasFailSample,
  isTodPillarFailure,
  normalizeTestingControl,
  requiresHomogeneityJustification,
  type TestingControl,
} from './testing-decision';

const MONTHLY_HIGH: TestingControl = {
  frequency: 'Monthly',
  riskRating: 'High',
  nature: 'Manual',
};

describe('testing-decision seam (SK-5 Table 22/23, Zero-Tolerance, 6-pilar TOD)', () => {
  it('rejects below-minimum TOE samples without homogeneity justification', () => {
    // Monthly + High requires min 5 samples (Table 22)
    expect(getSuggestedSampleRange('Monthly', 'High', 'Manual').min).toBe(5);

    const decision = decideTest(MONTHLY_HIGH, {
      testType: 'TOE',
      claimedResult: 'Effective',
      sampleSize: 3,
      homogeneityJustification: '',
      samples: [],
    });

    expect(decision.isValid).toBe(false);
    expect(decision.field).toBe('homogeneityJustification');
    expect(decision.code).toBe('BELOW_MIN_JUSTIFICATION_REQUIRED');
    expect(decision.verdict).toBeUndefined();
  });

  it('accepts below-minimum TOE samples with homogeneity justification', () => {
    const decision = decideTest(MONTHLY_HIGH, {
      testType: 'TOE',
      claimedResult: 'Effective',
      sampleSize: 3,
      homogeneityJustification: 'All transactions use identical SAP template and SOP',
      samples: [],
    });

    expect(decision.isValid).toBe(true);
    expect(decision.verdict).toBe('Effective');
  });

  it('forces Ineffective when any TOE sample fails (Zero-Tolerance)', () => {
    expect(
      hasFailSample([{ status: 'Pass' }, { status: 'Fail' }]),
    ).toBe(true);

    const decision = decideTest(MONTHLY_HIGH, {
      testType: 'TOE',
      claimedResult: 'Effective',
      sampleSize: 5,
      samples: [{ status: 'Pass' }, { status: 'Fail' }],
    });

    expect(decision.isValid).toBe(true);
    expect(decision.verdict).toBe('Ineffective');
  });

  it('forces Ineffective when any TOD 6-pilar attribute is unchecked', () => {
    expect(
      isTodPillarFailure({
        objective: true,
        timing: false,
        authority: true,
        reliability: true,
        coverage: true,
        evidence: true,
      }),
    ).toBe(true);

    const decision = decideTest(MONTHLY_HIGH, {
      testType: 'TOD',
      claimedResult: 'Effective',
      todPillars: {
        objective: true,
        timing: false,
        authority: true,
        reliability: true,
        coverage: true,
        evidence: true,
      },
    });

    expect(decision.isValid).toBe(true);
    expect(decision.verdict).toBe('Ineffective');
  });

  it('keeps an Effective TOD verdict when all 6 pilars hold', () => {
    const decision = decideTest(MONTHLY_HIGH, {
      testType: 'TOD',
      claimedResult: 'Effective',
      todPillars: {
        objective: true,
        timing: true,
        authority: true,
        reliability: true,
        coverage: true,
        evidence: true,
      },
    });

    expect(decision.isValid).toBe(true);
    expect(decision.verdict).toBe('Effective');
  });

  it('flags missing homogeneity justification through the helper', () => {
    expect(requiresHomogeneityJustification(MONTHLY_HIGH, 3, '')).toBe(true);
    expect(
      requiresHomogeneityJustification(MONTHLY_HIGH, 3, 'homogeneous population'),
    ).toBe(false);
    expect(requiresHomogeneityJustification(MONTHLY_HIGH, 5, '')).toBe(false);
  });

  it('normalizes raw control rows: valid passes, missing or unrecognised yields null', () => {
    expect(
      normalizeTestingControl({ frequency: 'Monthly', riskRating: 'High', nature: 'Manual' }),
    ).toEqual(MONTHLY_HIGH);
    expect(normalizeTestingControl(undefined)).toBeNull();
    expect(normalizeTestingControl(null)).toBeNull();
    expect(
      normalizeTestingControl({ frequency: 'Fortnightly', riskRating: 'High', nature: 'Manual' }),
    ).toBeNull();
    expect(
      normalizeTestingControl({ frequency: 'Monthly', riskRating: 'Critical', nature: 'Manual' }),
    ).toBeNull();
    expect(
      normalizeTestingControl({ frequency: 'Monthly', riskRating: 'High', nature: null }),
    ).toBeNull();
  });

  it('decideFromControl enforces the minimum for valid controls and skips it for missing rows', () => {
    const belowMin = {
      testType: 'TOE',
      claimedResult: 'Effective',
      sampleSize: 3,
      homogeneityJustification: '',
      samples: [],
    } as const;
    expect(
      decideFromControl({ frequency: 'Monthly', riskRating: 'High', nature: 'Manual' }, belowMin).isValid,
    ).toBe(false);
    expect(
      decideFromControl({ frequency: 'Fortnightly', riskRating: 'High', nature: 'Manual' }, belowMin).isValid,
    ).toBe(true);
    expect(decideFromControl(undefined, belowMin).isValid).toBe(true);
    expect(decideFromControl(null, belowMin).isValid).toBe(true);
    const zeroTolerance = {
      testType: 'TOE',
      claimedResult: 'Effective',
      sampleSize: 5,
      samples: [{ status: 'Fail' as const }],
    };
    expect(decideFromControl(undefined, zeroTolerance).verdict).toBe('Ineffective');
  });
  it('decideFromControl accepts caller-shaped controls with extra fields', () => {
    const callerShaped = {
      frequency: 'Monthly',
      riskRating: 'High',
      nature: 'Manual',
      id: 'ctrl-1',
      description: 'Rekonsiliasi harian',
    };
    const decision = decideFromControl(callerShaped, {
      testType: 'TOE',
      claimedResult: 'Effective',
      sampleSize: 5,
      samples: [],
    });
    expect(decision).toEqual({ isValid: true, verdict: 'Effective' });
  });

  it('decideFromForm normalizes a full TOE form in one call', () => {
    const decision = decideFromForm(MONTHLY_HIGH, {
      testType: 'TOE',
      result: 'Effective',
      sampleSize: 5,
      homogeneityJustification: '',
      samples: [{ status: 'Pass' }],
      extraField: 'ignored',
    });
    expect(decision).toEqual({ isValid: true, verdict: 'Effective' });
  });

  it('decideFromForm drops non-numeric sample sizes and non-array samples', () => {
    const decision = decideFromForm(MONTHLY_HIGH, {
      testType: 'TOE',
      result: 'Effective',
      sampleSize: '5',
      samples: 'not-an-array',
    });
    expect(decision.isValid).toBe(false);
    expect(decision.code).toBe('BELOW_MIN_JUSTIFICATION_REQUIRED');
  });

  it('decideFromForm ignores pillars for TOE and enforces them for TOD', () => {
    const toe = decideFromForm(MONTHLY_HIGH, {
      testType: 'TOE',
      result: 'Effective',
      sampleSize: 5,
      samples: [],
      todPilarObjective: false,
    });
    expect(toe).toEqual({ isValid: true, verdict: 'Effective' });

    const tod = decideFromForm(MONTHLY_HIGH, {
      testType: 'TOD',
      result: 'Effective',
      todPilarObjective: false,
    });
    expect(tod).toEqual({ isValid: true, verdict: 'Ineffective' });
  });

  it('decideFromForm treats missing pillars as satisfied (worker body compatible)', () => {
    const decision = decideFromForm(MONTHLY_HIGH, { testType: 'TOD', result: 'Effective' });
    expect(decision).toEqual({ isValid: true, verdict: 'Effective' });
  });
});
