import { describe, expect, it } from 'vitest';
import {
  criticalityBadge,
  itgcStatusBadge,
  significanceBadge,
  socStatusBadge,
} from '../soc-monitoring-badges';

// Known-good literals (from the frozen evidence in arch-hotspots-client.md §C7),
// NOT recomputed from the module — a drift between card and row must fail here.
const POSITIVE = 'bg-green-100 text-green-700';
const NEGATIVE = 'bg-red-100 text-red-700';
const NEUTRAL = 'bg-muted text-slate-500';

describe('soc-monitoring-badges', () => {
  describe('itgcStatusBadge', () => {
    it('tones Effective positively and Ineffective negatively', () => {
      expect(itgcStatusBadge('Effective')).toEqual({
        label: 'Effective',
        labelKey: null,
        className: POSITIVE,
        variant: 'default',
      });
      expect(itgcStatusBadge('Ineffective')).toEqual({
        label: 'Ineffective',
        labelKey: null,
        className: NEGATIVE,
        variant: 'default',
      });
    });

    it.each([undefined, null, '', '   '])('falls back to Not Tested for a blank status (%s)', (blank) => {
      expect(itgcStatusBadge(blank)).toEqual({
        label: 'Not Tested',
        labelKey: 'rcm:soc.itgc_not_tested',
        className: NEUTRAL,
        variant: 'default',
      });
    });

    it('keeps an unknown status verbatim but neutral-toned', () => {
      expect(itgcStatusBadge('In Progress')).toEqual({
        label: 'In Progress',
        labelKey: null,
        className: NEUTRAL,
        variant: 'default',
      });
    });
  });

  describe('significanceBadge', () => {
    it('routes Yes/No through the shared common bundle keys', () => {
      expect(significanceBadge(true)).toEqual({
        label: 'Yes',
        labelKey: 'common:yes',
        className: 'bg-emerald-50 text-emerald-700 border-emerald-200 font-bold text-xs',
        variant: 'outline',
      });
      expect(significanceBadge(false)).toEqual({
        label: 'No',
        labelKey: 'common:no',
        className: 'bg-slate-50 text-slate-500 border-slate-200 text-xs',
        variant: 'outline',
      });
    });
  });

  describe('socStatusBadge', () => {
    it('flags Valid as positive and every other status as a finding', () => {
      expect(socStatusBadge('Valid').className).toBe(POSITIVE);
      expect(socStatusBadge('Expired').className).toBe(NEGATIVE);
      expect(socStatusBadge('Unknown').className).toBe(NEGATIVE);
    });

    it('carries the status datum as the label (no bundle key)', () => {
      expect(socStatusBadge('Expired')).toEqual({
        label: 'Expired',
        labelKey: null,
        className: NEGATIVE,
        variant: 'default',
      });
    });
  });

  describe('criticalityBadge', () => {
    it('makes High destructive and everything else default', () => {
      expect(criticalityBadge('High').variant).toBe('destructive');
      expect(criticalityBadge('Medium').variant).toBe('default');
      expect(criticalityBadge(undefined).variant).toBe('default');
    });
  });

  it('keeps layout classes out of the tone strings (the views append shrink-0 etc.)', () => {
    const specs = [
      itgcStatusBadge('Effective'),
      socStatusBadge('Valid'),
      significanceBadge(true),
      criticalityBadge('High'),
    ];
    for (const spec of specs) {
      expect(spec.className).not.toMatch(/shrink-0|hover:/);
    }
  });
});
