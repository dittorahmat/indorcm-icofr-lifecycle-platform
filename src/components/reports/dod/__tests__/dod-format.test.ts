import { describe, expect, it } from 'vitest';
import { SEVERITY_TONE_CLASS } from '@/lib/badge-tone';
import { getSeverityMeta } from '../dod-format';
import { validateI18nKey } from '@/test/mock-i18n';

/**
 * The DoD report's severity cell. The label it hands the table is an i18n KEY
 * (the module used to hardcode `'MW (Kelemahan Material)'`, an order no other
 * surface used), and the class must be the owner's entry — not a copy that can
 * drift from `@/lib/badge-tone`.
 */
const CASES = [
  {
    severity: 'Material Weakness',
    labelKey: 'dodReport.summary.materialWeakness',
    className: SEVERITY_TONE_CLASS.mw,
  },
  {
    severity: 'Significant Deficiency',
    labelKey: 'dodReport.summary.significantDeficiency',
    className: SEVERITY_TONE_CLASS.sd,
  },
  {
    severity: 'Control Deficiency',
    labelKey: 'dodReport.summary.controlDeficiency',
    className: SEVERITY_TONE_CLASS.cd,
  },
] as const;

describe('getSeverityMeta', () => {
  it.each(CASES)('maps $severity to its bundle key and the owner tone class', ({ severity, labelKey, className }) => {
    expect(getSeverityMeta(severity)).toEqual({ labelKey, className });
    validateI18nKey(labelKey);
  });

  it('falls back to the lightest severity for an unknown value rather than leaking it', () => {
    expect(getSeverityMeta('mystery')).toEqual({
      labelKey: 'dodReport.summary.controlDeficiency',
      className: SEVERITY_TONE_CLASS.cd,
    });
  });
});
