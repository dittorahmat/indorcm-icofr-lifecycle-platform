import { GLRow } from "@shared/types";

// The benchmark → OM → PM derivation and the significance classification live
// in the shared scoping-materiality seam (worker + client share one owner).
export {
  getGroupMultiplier,
  calculateBenchmarkValue,
  calculateOM,
  calculatePM,
  deriveMateriality,
  identifySignificantAccounts,
} from "@shared/scoping-materiality";

/**
 * Combines Quantitative and Qualitative risk factors (3x3 Matrix Table 12)
 */
export function calculateRiskRating(
  quantitative: "High" | "Medium" | "Low",
  qualitative: "High" | "Medium" | "Low"
): "High" | "Medium" | "Low" {
  if (quantitative === "High") {
    return qualitative === "Low" ? "Medium" : "High";
  }
  if (quantitative === "Medium") {
    if (qualitative === "High") return "High";
    if (qualitative === "Medium") return "Medium";
    return "Low";
  }
  if (quantitative === "Low") {
    return qualitative === "High" ? "Medium" : "Low";
  }
  return "Low";
}

export interface FSLICoverageResult {
  fsliName: string;
  consolidatedBalance: number;
  selectedBalance: number;
  coveragePercentage: number;
  isCompliant: boolean;
}

export interface ScopingComplianceResult {
  fsliCoverages: FSLICoverageResult[];
  aggregateCompliance: {
    assets: { consolidated: number; selected: number; percentage: number; isCompliant: boolean };
    liabilities: { consolidated: number; selected: number; percentage: number; isCompliant: boolean };
    revenue: { consolidated: number; selected: number; percentage: number; isCompliant: boolean };
    expenses: { consolidated: number; selected: number; percentage: number; isCompliant: boolean };
  };
  isOverallCompliant: boolean;
}

/**
 * Calculates 2/3 scoping coverage for all FSLIs and overall aggregates
 */
export function calculateScopingCompliance(
  allGlRows: GLRow[],
  selectedEntityCodes: string[]
): ScopingComplianceResult {
  const fsliNames = Array.from(new Set(allGlRows.map(r => r.fsliName).filter(Boolean))) as string[];

  const fsliCoverages = fsliNames.map(name => {
    const rows = allGlRows.filter(r => r.fsliName === name);
    const groupExplicitTotal = rows[0]?.fsliBalance || null;

    const consolidatedBalance = groupExplicitTotal !== null
      ? Math.abs(groupExplicitTotal)
      : rows.reduce((sum, r) => sum + Math.abs(r.balance || 0), 0);

    const selectedRows = rows.filter(r => selectedEntityCodes.includes(r.entityCode || 'UNKNOWN'));
    const selectedBalance = selectedRows.reduce((sum, r) => sum + Math.abs(r.balance || 0), 0);

    const coveragePercentage = consolidatedBalance > 0
      ? (selectedBalance / consolidatedBalance) * 100
      : 100;

    return {
      fsliName: name,
      consolidatedBalance,
      selectedBalance,
      coveragePercentage,
      isCompliant: coveragePercentage >= 66.67
    };
  });

  const sumByCategory = (category: string, entityCodes: string[]): number => {
    return allGlRows
      .filter(r => r.category === category && entityCodes.includes(r.entityCode || 'UNKNOWN'))
      .reduce((sum, r) => sum + Math.abs(r.balance || 0), 0);
  };

  const allEntities = Array.from(new Set(allGlRows.map(r => r.entityCode || 'UNKNOWN')));

  const assetsConsolidated = sumByCategory('Asset', allEntities);
  const assetsSelected = sumByCategory('Asset', selectedEntityCodes);
  const assetsPct = assetsConsolidated > 0 ? (assetsSelected / assetsConsolidated) * 100 : 100;

  const liabConsolidated = sumByCategory('Liability', allEntities);
  const liabSelected = sumByCategory('Liability', selectedEntityCodes);
  const liabPct = liabConsolidated > 0 ? (liabSelected / liabConsolidated) * 100 : 100;

  const revConsolidated = sumByCategory('Revenue', allEntities);
  const revSelected = sumByCategory('Revenue', selectedEntityCodes);
  const revPct = revConsolidated > 0 ? (revSelected / revConsolidated) * 100 : 100;

  const expConsolidated = sumByCategory('Expense', allEntities);
  const expSelected = sumByCategory('Expense', selectedEntityCodes);
  const expPct = expConsolidated > 0 ? (expSelected / expConsolidated) * 100 : 100;

  const isOverallCompliant =
    fsliCoverages.every(c => c.isCompliant) &&
    assetsPct >= 66.67 &&
    liabPct >= 66.67 &&
    revPct >= 66.67 &&
    expPct >= 66.67;

  return {
    fsliCoverages,
    aggregateCompliance: {
      assets: { consolidated: assetsConsolidated, selected: assetsSelected, percentage: assetsPct, isCompliant: assetsPct >= 66.67 },
      liabilities: { consolidated: liabConsolidated, selected: liabSelected, percentage: liabPct, isCompliant: liabPct >= 66.67 },
      revenue: { consolidated: revConsolidated, selected: revSelected, percentage: revPct, isCompliant: revPct >= 66.67 },
      expenses: { consolidated: expConsolidated, selected: expSelected, percentage: expPct, isCompliant: expPct >= 66.67 },
    },
    isOverallCompliant
  };
}

/**
 * Identifies scoping reason/classification for a GLRow based on SK-5 criteria
 */
export function getRowScopeClassification(params: {
  row: GLRow;
  pmValue: number;
  assessmentData?: Record<string, Record<number, string>>;
  mandatoryFslis?: string[];
  selectedEntityCodes: string[];
  allGlRows: GLRow[];
}): 'above-pm' | 'two-thirds' | 'qualitative' | 'out-of-scope' {
  const { row, pmValue, assessmentData, mandatoryFslis = ['Kas dan Setara Kas'], selectedEntityCodes, allGlRows } = params;
  const safeAssessmentData = assessmentData || {};

  const entityCode = row.entityCode || 'UNKNOWN';
  if (!selectedEntityCodes.includes(entityCode)) {
    return 'out-of-scope';
  }

  const fsliName = row.fsliName || '';
  if (!fsliName) return 'out-of-scope';

  const safeAssessments = safeAssessmentData[fsliName] || {};
  const isQualSignificant = Object.values(safeAssessments).some(v => v === 'High') || mandatoryFslis.includes(fsliName);

  const fsliRows = allGlRows.filter(r => r.fsliName === fsliName);
  const groupExplicitTotal = fsliRows[0]?.fsliBalance || null;
  const isGroupKuanSignificant = groupExplicitTotal !== null
    ? Math.abs(groupExplicitTotal) >= pmValue
    : fsliRows.some(r => Math.abs(r.balance || 0) >= pmValue);

  const isRowKuanSignificant = Math.abs(row.balance || 0) >= pmValue;
  const isInScope = isQualSignificant || isGroupKuanSignificant || isRowKuanSignificant;
  if (!isInScope) {
    return 'out-of-scope';
  }

  if (isRowKuanSignificant) {
    return 'above-pm';
  }

  if (isQualSignificant) {
    return 'qualitative';
  }

  return 'two-thirds';
}
