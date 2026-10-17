import { describe, expect, it } from 'vitest';
import {
  DEFICIENCY_SEVERITIES,
  DEFICIENCY_STATUSES,
  effectivenessScore,
  isSignificantDeficiency,
  summarizeDeficiencies,
} from './deficiency-summary';

/**
 * The seam is the test surface: the effectiveness conclusion and the tallies
 * are asserted here once, with hardcoded literals (never recomputed the way
 * the implementation computes them). Both consumers — the worker summary
 * route and the Lampiran 11 helper — now read this same conclusion.
 */
describe('deficiency-summary seam (single owner of the effectiveness conclusion)', () => {
  it('concludes ineffective (score 0) when any Material Weakness exists', () => {
    const summary = summarizeDeficiencies([
      { severity: 'Material Weakness', status: 'Open' },
      { severity: 'Significant Deficiency', status: 'Open' },
      { severity: 'Control Deficiency', status: 'Remediated' },
    ]);

    expect(summary.isEffective).toBe(false);
    expect(effectivenessScore(summary)).toBe(0);
    expect(summary.mwCount).toBe(1);
    expect(summary.sdCount).toBe(1);
    expect(summary.cdCount).toBe(1);
    expect(summary.total).toBe(3);
    expect(summary.openCount).toBe(2);
  });

  it('concludes effective (score 100) when only SD/CD exist — SD is not a Material Weakness', () => {
    const summary = summarizeDeficiencies([
      { severity: 'Significant Deficiency', status: 'Open' },
      { severity: 'Control Deficiency', status: 'Closed' },
    ]);

    expect(summary.isEffective).toBe(true);
    expect(effectivenessScore(summary)).toBe(100);
    expect(summary.mwCount).toBe(0);
  });

  it('treats an empty register as effective (score 100)', () => {
    const summary = summarizeDeficiencies([]);

    expect(summary.isEffective).toBe(true);
    expect(effectivenessScore(summary)).toBe(100);
    expect(summary.mwCount).toBe(0);
    expect(summary.total).toBe(0);
    expect(summary.openCount).toBe(0);
  });

  it('always reports the canonical label sets, in order, ignoring unknown labels', () => {
    const summary = summarizeDeficiencies([
      { severity: 'Weird Severity', status: 'Weird Status' },
      { severity: 'Material Weakness', status: 'Verified' },
    ]);

    expect(summary.bySeverity).toEqual([
      { name: 'Control Deficiency', count: 0 },
      { name: 'Significant Deficiency', count: 0 },
      { name: 'Material Weakness', count: 1 },
    ]);
    expect(summary.byStatus).toEqual([
      { name: 'Open', count: 0 },
      { name: 'Remediated', count: 0 },
      { name: 'Verified', count: 1 },
      { name: 'Closed', count: 0 },
    ]);
    expect(summary.total).toBe(2);
    expect(DEFICIENCY_SEVERITIES).toHaveLength(3);
    expect(DEFICIENCY_STATUSES).toHaveLength(4);
  });

  it('classifies everything but a plain Control Deficiency as significant', () => {
    expect(isSignificantDeficiency('Control Deficiency')).toBe(false);
    expect(isSignificantDeficiency('Significant Deficiency')).toBe(true);
    expect(isSignificantDeficiency('Material Weakness')).toBe(true);
  });
});
