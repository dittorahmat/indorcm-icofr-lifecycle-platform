import type { Deficiency } from '@shared/types';

export interface EffectivenessSummary {
  mwCount: number;
  sdCount: number;
  cdCount: number;
  total: number;
  isEffective: boolean;
  significant: Deficiency[];
  aggregateLine: string;
}

export function summarizeEffectiveness(items: readonly Deficiency[]): EffectivenessSummary {
  const mwCount = items.filter((d) => d.severity === 'Material Weakness').length;
  const sdCount = items.filter((d) => d.severity === 'Significant Deficiency').length;
  const cdCount = items.filter((d) => d.severity === 'Control Deficiency').length;
  const significant = items.filter((d) => d.severity !== 'Control Deficiency');
  return {
    mwCount,
    sdCount,
    cdCount,
    total: items.length,
    isEffective: mwCount === 0,
    significant: [...significant],
    aggregateLine: `CD: ${cdCount} | SD: ${sdCount} | MW: ${mwCount} | Total: ${items.length}`,
  };
}

export function isAssessmentSigned(isPeriodLocked: unknown): boolean {
  return Boolean(isPeriodLocked);
}
