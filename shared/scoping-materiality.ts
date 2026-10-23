/**
 * scoping-materiality — pure scoping materiality seam (SK-5/DKU.MBU/11/2024).
 *
 * One owner for: FSLI/TB aggregation, benchmark → OM → PM derivation, the
 * significance classification, and the snapshot readiness rule. The TB/RCM
 * ingestion route, the simulation create/backfill paths and the client editor
 * all cross this interface — no DB, no side effects here.
 */

import type { GLRow, SignificantAccount } from './types';

/** Boundary shape of one TB row as uploaded by the smart-import wizard. */
export interface MaterialityFsliRow {
  suggestedFsli?: string | null;
  accountName?: string | null;
  balance?: string | number | null;
  fsliBalance?: string | number | null;
  fsliCode?: string | null;
}

interface FsliAggregate {
  name: string;
  balance: number;
  fsliBalance: number;
  fsliCode?: string;
}

const absAmount = (value: string | number | null | undefined): number =>
  Math.abs(parseFloat(String(value ?? ''))) || 0;

/**
 * Aggregates TB rows per FSLI and keeps the accounts at or above PM.
 *
 * - Group key is `suggestedFsli || accountName`; a row without either groups
 *   under `''` (legacy grouped under `undefined`).
 * - `balance` sums the absolute account balances; the first non-zero FSLI
 *   summary column wins over that sum (`fsliBalance`).
 * - The threshold is inclusive (`>=`): a balance exactly at PM is significant.
 * - Every kept account carries `isQuantitative: true`; sub-PM accounts are
 *   dropped, matching the pre-extraction ingestion behaviour.
 */
export function aggregateFsliBalances(
  rows: readonly MaterialityFsliRow[],
  pmValue: number,
): SignificantAccount[] {
  const byFsli = new Map<string, FsliAggregate>();

  for (const row of rows) {
    const name = row.suggestedFsli || row.accountName || '';
    const balance = absAmount(row.balance);
    const fsliBalance = absAmount(row.fsliBalance);
    const current = byFsli.get(name);
    if (!current) {
      byFsli.set(name, { name, balance, fsliBalance, fsliCode: row.fsliCode ?? undefined });
      continue;
    }
    current.balance += balance;
    if (current.fsliBalance === 0 && fsliBalance > 0) current.fsliBalance = fsliBalance;
  }

  return Array.from(byFsli.values())
    .map((item) => {
      const finalBalance = item.fsliBalance > 0 ? item.fsliBalance : item.balance;
      return {
        name: item.name,
        balance: finalBalance,
        fsliCode: item.fsliCode,
        isQuantitative: finalBalance >= pmValue,
        assignedDepartmentIds: [],
      };
    })
    .filter((item) => item.isQuantitative);
}

/**
 * Get Multiplier based on Table 25 (Hal 104) of SK-5/2024.
 */
export function getGroupMultiplier(count: number): number {
  if (count <= 1) return 1;
  if (count === 2) return 1.5;
  if (count <= 4) return 2;
  if (count <= 6) return 2.5;
  if (count <= 9) return 3;
  if (count <= 14) return 3.5;
  if (count <= 19) return 4;
  if (count <= 25) return 4.5;
  if (count <= 30) return 5;
  if (count <= 40) return 5.5;
  if (count <= 50) return 6;
  if (count <= 64) return 6.5;
  if (count <= 80) return 7;
  if (count <= 94) return 7.5;
  if (count <= 110) return 8;
  if (count <= 130) return 8.5;
  return 9;
}

/**
 * Calculate benchmark value from GL data based on selected FSLI basis.
 */
export function calculateBenchmarkValue(glData: readonly GLRow[], basis: string): number {
  if (!basis) return 0;

  // Use a map to handle multiple identical FSLIs correctly and pick up fsliBalance
  const fsliTotals = new Map<string, { total: number; explicitlyProvidedTotal: number | null }>();

  glData.forEach((r) => {
    if (r.fsliName) {
      const current = fsliTotals.get(r.fsliName) || { total: 0, explicitlyProvidedTotal: null };
      fsliTotals.set(r.fsliName, {
        total: current.total + Math.abs(r.balance || 0),
        explicitlyProvidedTotal:
          r.fsliBalance !== undefined && r.fsliBalance !== null
            ? r.fsliBalance
            : current.explicitlyProvidedTotal,
      });
    }
  });

  const data = fsliTotals.get(basis);
  if (data) {
    return data.explicitlyProvidedTotal !== null && data.explicitlyProvidedTotal !== 0
      ? data.explicitlyProvidedTotal
      : data.total;
  }

  return 0;
}

/**
 * Calculates Overall Materiality (OM).
 */
export function calculateOM(benchmarkValue: number, omPercentage: number, multiplier: number): number {
  const baseOM = (benchmarkValue * omPercentage) / 100;
  return baseOM * multiplier;
}

/**
 * Calculates Performance Materiality (PM).
 */
export function calculatePM(omValue: number, haircutPercentage: number): number {
  return omValue * (1 - haircutPercentage / 100);
}

/**
 * Logic to identify significant accounts based on PM value and Qualitative Assessments.
 * TABLE 8 & TABLE 12 REGULATION SK-5.
 */
export function identifySignificantAccounts(params: {
  glData: readonly GLRow[];
  pmValue: number;
  assessmentData?: Record<string, Record<number, string>>;
  mandatoryFslis?: string[];
}): SignificantAccount[] {
  const { glData, pmValue, assessmentData, mandatoryFslis } = params;
  const safeAssessmentData = assessmentData || {};
  const safeMandatoryFslis = mandatoryFslis || ['Kas dan Setara Kas'];

  // 1. Group by FSLI
  const groups = new Map<string, GLRow[]>();
  glData.forEach((row) => {
    const fsliName = row.fsliName || 'Unmapped FSLI';
    if (!groups.has(fsliName)) groups.set(fsliName, []);
    groups.get(fsliName)?.push(row);
  });

  const result: SignificantAccount[] = [];

  // 2. Evaluate Significance per FSLI group
  groups.forEach((rows, fsliName) => {
    const assessments = safeAssessmentData[fsliName] || {};
    const isQualSignificant =
      Object.values(assessments).some((v) => v === 'High') || safeMandatoryFslis.includes(fsliName);

    const groupExplicitTotal = rows[0]?.fsliBalance || null;
    const isGroupKuanSignificant =
      groupExplicitTotal !== null
        ? Math.abs(groupExplicitTotal) >= pmValue
        : rows.some((r) => Math.abs(r.balance ?? 0) >= pmValue);

    rows.forEach((row) => {
      // Individual row might be zero, but we consider the group's FSLI balance if provided
      const effectiveBalance =
        groupExplicitTotal !== null && row.balance === 0 ? groupExplicitTotal : Math.abs(row.balance ?? 0);
      const isKuanSignificant = isGroupKuanSignificant || Math.abs(row.balance ?? 0) >= pmValue;

      // Include if FSLI group is qualitatively significant OR quantitatively significant
      if (isQualSignificant || isKuanSignificant) {
        result.push({
          name: fsliName,
          balance: effectiveBalance,
          isQuantitative: isKuanSignificant,
          fsliCode: row.fsliCode || row.noGL || undefined,
          assignedDepartmentIds: row.assignedDepartmentIds || [],
        });
      }
    });
  });

  return result;
}

/**
 * The worksheet's single significance answer. A row that carries
 * `scopeClassification` (every row the scoping view emits) is read from that
 * field; the arithmetic fallback exists only for rows that arrive without it.
 *
 * `isAccountInScope` includes qualitative significance; the quantitative form
 * is what the "Quantitative" column and the Excel export mean. Before this
 * pair, `GLDataGrid`, its columns and its export each re-derived one of the
 * two from `|balance| >= PM`, so the export dropped the FSLI-total rule and a
 * row could render in scope while exporting as not significant.
 */
export function isAccountInScope(
  row: Pick<GLRow, 'scopeClassification' | 'balance' | 'fsliBalance'>,
  pmValue: number,
): boolean {
  if (row.scopeClassification) return row.scopeClassification !== 'out-of-scope';
  return isAccountQuantitativelySignificant(row, pmValue);
}

export function isAccountQuantitativelySignificant(
  row: Pick<GLRow, 'scopeClassification' | 'balance' | 'fsliBalance'>,
  pmValue: number,
): boolean {
  if (row.scopeClassification) {
    return row.scopeClassification === 'above-pm' || row.scopeClassification === 'two-thirds';
  }
  return Math.abs(row.balance ?? 0) >= pmValue || Math.abs(row.fsliBalance ?? 0) >= pmValue;
}

/** Inputs the create / backfill paths share when deriving a simulation's materiality. */
export interface SimulationMaterialityInput {
  rows: readonly GLRow[];
  basis: string;
  omPercentage: number;
  haircutPercentage: number;
  /** Group size for the Table-25 multiplier (>= 1). */
  locationCount: number;
  assessmentData?: Record<string, Record<number, string>>;
}

export interface SimulationMateriality {
  benchmarkValue: number;
  multiplier: number;
  omValue: number;
  pmValue: number;
  significantAccounts: SignificantAccount[];
}

/** The benchmark → OM → PM chain, before significance is classified. */
export interface DerivedMateriality {
  benchmarkValue: number;
  multiplier: number;
  omValue: number;
  pmValue: number;
}

/**
 * Derives benchmark → OM → PM from one row set. Single owner of the chain: the
 * create/submit/backfill paths reach it through `computeSimulationMateriality`,
 * and the client editor's live view calls it directly over its filtered rows —
 * so the shown PM and the stored PM run the same arithmetic.
 */
export function deriveMateriality(input: SimulationMaterialityInput): DerivedMateriality {
  const { rows, basis, omPercentage, haircutPercentage, locationCount } = input;
  const benchmarkValue = calculateBenchmarkValue(rows, basis);
  const multiplier = getGroupMultiplier(Math.max(1, locationCount));
  const omValue = calculateOM(benchmarkValue, omPercentage, multiplier);
  return { benchmarkValue, multiplier, omValue, pmValue: calculatePM(omValue, haircutPercentage) };
}

/**
 * Derives the persisted materiality of one simulation from its snapshot rows.
 * Significance is classified over the raw snapshot rows here; the client's live
 * view classifies over its department/scope-enriched rows on purpose, so the two
 * sides share the derivation but not the enrichment.
 */
export function computeSimulationMateriality(input: SimulationMaterialityInput): SimulationMateriality {
  const derived = deriveMateriality(input);
  const significantAccounts = identifySignificantAccounts({
    glData: input.rows,
    pmValue: derived.pmValue,
    assessmentData: input.assessmentData,
  });
  return { ...derived, significantAccounts };
}

/** Why a chosen basis cannot produce a materiality from a snapshot. */
export type SnapshotBasisProblem = 'MATERIALITY_BASIS_NOT_IN_SNAPSHOT' | 'MATERIALITY_BASIS_HAS_NO_VALUE';

/**
 * Why `basis` cannot derive a materiality from this snapshot, or null when it
 * can. Membership alone is not enough: a benchmark the snapshot still lists but
 * whose rows are gone derives OM/PM 0 — the stored zero these paths exist to
 * prevent. Single producer of both codes; the create route and the backfill
 * script branch on the value returned here.
 */
export function basisProblemForSnapshot(params: {
  benchmarks: readonly string[];
  rows: readonly GLRow[];
  basis: string;
}): SnapshotBasisProblem | null {
  const { benchmarks, rows, basis } = params;
  if (!basis || (!benchmarks.includes(basis) && !rows.some((r) => r.fsliName === basis))) {
    return 'MATERIALITY_BASIS_NOT_IN_SNAPSHOT';
  }
  return calculateBenchmarkValue(rows, basis) > 0 ? null : 'MATERIALITY_BASIS_HAS_NO_VALUE';
}

/**
 * Readiness rule for a GL snapshot: a snapshot is `Mapped` only once at least
 * one benchmark FSLI has been chosen. Keeps `status` from claiming a benchmark
 * mapping that does not exist (`Mapped` + empty list used to strand the
 * "Create New Simulation" form with no basis to pick).
 */
export function resolveSnapshotStatus(benchmarkFsliNames: readonly string[] | null | undefined): 'Mapped' | 'Draft' {
  return benchmarkFsliNames && benchmarkFsliNames.length > 0 ? 'Mapped' : 'Draft';
}
