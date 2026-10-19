import { describe, it, expect } from 'vitest';
import {
  RISK_RATING_TONE_CLASS,
  SEVERITY_TONE_CLASS,
  riskRatingTone,
  severityTone,
  type RiskRatingTone,
  type SeverityTone,
} from './badge-tone';

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
});
