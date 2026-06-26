import { GLRow } from "@shared/types";

/**
 * Get Multiplier based on Table 25 (Hal 104) of SK-5/2024
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
 * Calculate benchmark value from GL data based on selected FSLI basis
 */
export function calculateBenchmarkValue(
  glData: GLRow[], 
  basis: string
): number {
  if (!basis) return 0;
  
  // Use a map to handle multiple identical FSLIs correctly and pick up fsliBalance
  const fsliTotals = new Map<string, { total: number, explicitlyProvidedTotal: number | null }>();
  
  glData.forEach(r => {
    if (r.fsliName) {
      const current = fsliTotals.get(r.fsliName) || { total: 0, explicitlyProvidedTotal: null };
      fsliTotals.set(r.fsliName, {
        total: current.total + Math.abs(r.balance || 0),
        explicitlyProvidedTotal: r.fsliBalance !== undefined && r.fsliBalance !== null ? r.fsliBalance : current.explicitlyProvidedTotal
      });
    }
  });

  if (fsliTotals.has(basis)) {
    const data = fsliTotals.get(basis)!;
    return (data.explicitlyProvidedTotal !== null && data.explicitlyProvidedTotal !== 0) 
      ? data.explicitlyProvidedTotal 
      : data.total;
  }
  
  return 0;
}

/**
 * Calculates Overall Materiality (OM)
 */
export function calculateOM(benchmarkValue: number, omPercentage: number, multiplier: number): number {
  const baseOM = (benchmarkValue * omPercentage) / 100;
  return baseOM * multiplier;
}

/**
 * Calculates Performance Materiality (PM)
 */
export function calculatePM(omValue: number, haircutPercentage: number): number {
  return omValue * (1 - haircutPercentage / 100);
}

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

/**
 * Logic to identify significant accounts based on PM value and Qualitative Assessments.
 * TABLE 8 & TABLE 12 REGULATION SK-5
 */
export function identifySignificantAccounts(params: {
  glData: GLRow[];
  pmValue: number;
  assessmentData?: Record<string, Record<number, string>>;
  mandatoryFslis?: string[];
}) {
  const { glData, pmValue, assessmentData, mandatoryFslis } = params;
  const safeAssessmentData = assessmentData || {};
  const safeMandatoryFslis = mandatoryFslis || ['Kas dan Setara Kas'];

  // 1. Group by FSLI
  const groups = new Map<string, GLRow[]>();
  glData.forEach(row => {
    const fsliName = row.fsliName || "Unmapped FSLI";
    if (!groups.has(fsliName)) groups.set(fsliName, []);
    groups.get(fsliName)!.push(row);
  });

  const result: {
    name: string;
    balance: number;
    isQuantitative: boolean;
    fsliCode: string;
    assignedDepartmentIds: string[];
  }[] = [];

  // 2. Evaluate Significance per FSLI group
  groups.forEach((rows, fsliName) => {
    const assessments = safeAssessmentData[fsliName] || {};
    const isQualSignificant = Object.values(assessments).some(v => v === 'High') || safeMandatoryFslis.includes(fsliName);
    
    const groupExplicitTotal = rows[0]?.fsliBalance || null;
    const isGroupKuanSignificant = groupExplicitTotal !== null 
      ? Math.abs(groupExplicitTotal) >= pmValue 
      : rows.some(r => Math.abs(r.balance) >= pmValue);

    rows.forEach(row => {
      // Individual row might be zero, but we consider the group's FSLI balance if provided
      const effectiveBalance = (groupExplicitTotal !== null && row.balance === 0) ? groupExplicitTotal : Math.abs(row.balance);
      const isKuanSignificant = isGroupKuanSignificant || Math.abs(row.balance) >= pmValue;
      
      // Include if FSLI group is qualitatively significant OR quantitatively significant
      if (isQualSignificant || isKuanSignificant) {
        result.push({
          name: fsliName,
          balance: effectiveBalance,
          isQuantitative: isKuanSignificant,
          fsliCode: row.fsliCode || row.noGL,
          assignedDepartmentIds: row.assignedDepartmentIds || []
        });
      }
    });
  });

  return result;
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
  const { row, pmValue, assessmentData = {}, mandatoryFslis = ['Kas dan Setara Kas'], selectedEntityCodes, allGlRows } = params;
  
  const entityCode = row.entityCode || 'UNKNOWN';
  if (!selectedEntityCodes.includes(entityCode)) {
    return 'out-of-scope';
  }

  const fsliName = row.fsliName || '';
  if (!fsliName) return 'out-of-scope';

  const safeAssessments = assessmentData[fsliName] || {};
  const isQualSignificant = Object.values(safeAssessments).some(v => v === 'High') || mandatoryFslis.includes(fsliName);

  const fsliRows = allGlRows.filter(r => r.fsliName === fsliName);
  const groupExplicitTotal = fsliRows[0]?.fsliBalance || null;
  const isGroupKuanSignificant = groupExplicitTotal !== null
    ? Math.abs(groupExplicitTotal) >= pmValue
    : fsliRows.some(r => Math.abs(r.balance || 0) >= pmValue);

  const isInScope = isQualSignificant || isGroupKuanSignificant;
  if (!isInScope) {
    return 'out-of-scope';
  }

  const isRowKuanSignificant = Math.abs(row.balance || 0) >= pmValue;
  if (isRowKuanSignificant) {
    return 'above-pm';
  }
  
  if (isQualSignificant) {
    return 'qualitative';
  }

  return 'two-thirds';
}


