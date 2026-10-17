import type { Deficiency } from '@shared/types';
import { isSignificantDeficiency, summarizeDeficiencies } from '@shared/deficiency-summary';

export interface EffectivenessSummary {
  mwCount: number;
  sdCount: number;
  cdCount: number;
  total: number;
  isEffective: boolean;
  significant: Deficiency[];
  aggregateLine: string;
}

/**
 * Thin adapter over the shared seam: the counts and the effectiveness
 * conclusion come from `summarizeDeficiencies`; this module only shapes the
 * Lampiran 11 view (register rows + the Excel identity line).
 */
export function summarizeEffectiveness(items: readonly Deficiency[]): EffectivenessSummary {
  const summary = summarizeDeficiencies(items);
  return {
    mwCount: summary.mwCount,
    sdCount: summary.sdCount,
    cdCount: summary.cdCount,
    total: summary.total,
    isEffective: summary.isEffective,
    significant: items.filter((d) => isSignificantDeficiency(d.severity)),
    aggregateLine: `CD: ${summary.cdCount} | SD: ${summary.sdCount} | MW: ${summary.mwCount} | Total: ${summary.total}`,
  };
}

export function isAssessmentSigned(isPeriodLocked: unknown): boolean {
  return Boolean(isPeriodLocked);
}
