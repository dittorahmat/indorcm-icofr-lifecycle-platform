/**
 * deficiency-summary — single owner of the ICOFR deficiency tally and the
 * management-assessment effectiveness conclusion.
 *
 * Two adapters share this one rule: the worker summary route
 * (`GET /reports/summary` → `effectiveness`) and the Lampiran 11 client
 * helper (`summarizeEffectiveness`). The regulatory conclusion is expressed
 * once, as `isEffective` ("no Material Weakness"); `effectivenessScore` is
 * the only producer of the legacy `0|100` response encoding.
 */
import type { DeficiencySeverity } from './types/common';
import type { Deficiency } from './types/deficiency';

/** Status union owned by `shared/types/deficiency` (no second taxonomy). */
export type DeficiencyStatus = Deficiency['status'];

/** Canonical label order for `bySeverity`, compile-checked against the union. */
export const DEFICIENCY_SEVERITIES = [
  'Control Deficiency',
  'Significant Deficiency',
  'Material Weakness',
] as const satisfies readonly DeficiencySeverity[];

/** Canonical label order for `byStatus`. */
export const DEFICIENCY_STATUSES = [
  'Open',
  'Remediated',
  'Verified',
  'Closed',
] as const satisfies readonly DeficiencyStatus[];

const CONTROL_DEFICIENCY: DeficiencySeverity = 'Control Deficiency';
const SIGNIFICANT_DEFICIENCY: DeficiencySeverity = 'Significant Deficiency';
const MATERIAL_WEAKNESS: DeficiencySeverity = 'Material Weakness';
const OPEN: DeficiencyStatus = 'Open';

/**
 * Raw column text: drizzle types `severity`/`status` as `string` and the
 * client holds domain rows — both assign here with no cast. Only labels in
 * the canonical tuples are tallied; anything else is ignored, as before.
 */
export interface DeficiencySummaryInput {
  severity: string;
  status: string;
}

export interface DeficiencySeverityCount {
  name: DeficiencySeverity;
  count: number;
}

export interface DeficiencyStatusCount {
  name: DeficiencyStatus;
  count: number;
}

export interface DeficiencySummary {
  total: number;
  openCount: number;
  mwCount: number;
  sdCount: number;
  cdCount: number;
  bySeverity: DeficiencySeverityCount[];
  byStatus: DeficiencyStatusCount[];
  /** Single meaning: the assessment is effective when no Material Weakness exists. */
  isEffective: boolean;
}

/** Register rows that belong in Lampiran 11: everything but a plain CD. */
export function isSignificantDeficiency(severity: string): boolean {
  return severity !== CONTROL_DEFICIENCY;
}

export function summarizeDeficiencies(items: readonly DeficiencySummaryInput[]): DeficiencySummary {
  const severityTally = new Map<string, number>();
  const statusTally = new Map<string, number>();
  for (const item of items) {
    severityTally.set(item.severity, (severityTally.get(item.severity) ?? 0) + 1);
    statusTally.set(item.status, (statusTally.get(item.status) ?? 0) + 1);
  }
  const mwCount = severityTally.get(MATERIAL_WEAKNESS) ?? 0;
  return {
    total: items.length,
    openCount: statusTally.get(OPEN) ?? 0,
    mwCount,
    sdCount: severityTally.get(SIGNIFICANT_DEFICIENCY) ?? 0,
    cdCount: severityTally.get(CONTROL_DEFICIENCY) ?? 0,
    bySeverity: DEFICIENCY_SEVERITIES.map((name) => ({
      name,
      count: severityTally.get(name) ?? 0,
    })),
    byStatus: DEFICIENCY_STATUSES.map((name) => ({
      name,
      count: statusTally.get(name) ?? 0,
    })),
    isEffective: mwCount === 0,
  };
}

/**
 * Legacy `GET /reports/summary` encoding, derived once from the boolean
 * conclusion: 100 when effective, 0 when any Material Weakness exists.
 */
export function effectivenessScore(summary: Pick<DeficiencySummary, 'isEffective'>): 0 | 100 {
  return summary.isEffective ? 100 : 0;
}
