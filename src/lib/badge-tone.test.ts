import { describe, it, expect } from 'vitest';
import {
  RISK_RATING_TONE_CLASS,
  SEVERITY_PANEL_CLASS,
  SEVERITY_SOLID_CLASS,
  SEVERITY_TONE_CLASS,
  riskRatingTone,
  severityLabelKey,
  severityShortLabelKey,
  severityTone,
  type RiskRatingTone,
  type SeverityTone,
} from './badge-tone';
import { validateI18nKey } from '@/test/mock-i18n';

describe('severityTone', () => {
  it('maps the three Lampiran 10 severities to their own tone', () => {
    expect(severityTone('Material Weakness')).toBe('mw');
    expect(severityTone('Significant Deficiency')).toBe('sd');
    expect(severityTone('Control Deficiency')).toBe('cd');
  });

  it('reads missing or unknown severities as the lightest tone', () => {
    expect(severityTone(undefined)).toBe('cd');
    expect(severityTone('')).toBe('cd');
    expect(severityTone('mystery')).toBe('cd');
  });
});

describe('riskRatingTone', () => {
  it('keeps Medium distinct from Low', () => {
    expect(riskRatingTone('High')).toBe('high');
    expect(riskRatingTone('Medium')).toBe('medium');
    expect(riskRatingTone('Low')).toBe('low');
  });

  it('reads missing or unknown ratings as Low', () => {
    expect(riskRatingTone(undefined)).toBe('low');
    expect(riskRatingTone('')).toBe('low');
    expect(riskRatingTone('Critical')).toBe('low');
  });
});

describe('tone class tables', () => {
  it('gives every severity tone a distinct treatment', () => {
    const tones: SeverityTone[] = ['mw', 'sd', 'cd'];
    const classes = tones.map((tone) => SEVERITY_TONE_CLASS[tone]);
    expect(classes.every((cls) => typeof cls === 'string' && cls.length > 0)).toBe(true);
    expect(new Set(classes).size).toBe(tones.length);
  });

  it('gives every risk-rating tone a distinct treatment', () => {
    const tones: RiskRatingTone[] = ['high', 'medium', 'low'];
    const classes = tones.map((tone) => RISK_RATING_TONE_CLASS[tone]);
    expect(classes.every((cls) => typeof cls === 'string' && cls.length > 0)).toBe(true);
    expect(new Set(classes).size).toBe(tones.length);
  });

  it('gives every severity tone a distinct treatment on the solid and panel surfaces too', () => {
    const tones: SeverityTone[] = ['mw', 'sd', 'cd'];
    for (const table of [SEVERITY_SOLID_CLASS, SEVERITY_PANEL_CLASS]) {
      const classes = tones.map((tone) => table[tone]);
      expect(classes.every((cls) => typeof cls === 'string' && cls.length > 0)).toBe(true);
      expect(new Set(classes).size).toBe(tones.length);
    }
  });
});

describe('severity label keys', () => {
  it('maps each severity to its own long-form key', () => {
    expect(severityLabelKey('Material Weakness')).toBe('dodReport.summary.materialWeakness');
    expect(severityLabelKey('Significant Deficiency')).toBe('dodReport.summary.significantDeficiency');
    expect(severityLabelKey('Control Deficiency')).toBe('dodReport.summary.controlDeficiency');
  });

  it('maps each severity to its own short-form key', () => {
    expect(severityShortLabelKey('Material Weakness')).toBe('dodReport.severityShort.mw');
    expect(severityShortLabelKey('Significant Deficiency')).toBe('dodReport.severityShort.sd');
    expect(severityShortLabelKey('Control Deficiency')).toBe('dodReport.severityShort.cd');
  });

  it('names keys that exist in the en bundle, including for unknown severities', () => {
    for (const severity of ['Material Weakness', 'Significant Deficiency', 'Control Deficiency', undefined, '', 'mystery']) {
      validateI18nKey(severityLabelKey(severity));
      validateI18nKey(severityShortLabelKey(severity));
    }
  });

  it('reads missing or unknown severities as the lightest key', () => {
    expect(severityLabelKey(undefined)).toBe('dodReport.summary.controlDeficiency');
    expect(severityLabelKey('mystery')).toBe('dodReport.summary.controlDeficiency');
    expect(severityShortLabelKey('')).toBe('dodReport.severityShort.cd');
  });
});
