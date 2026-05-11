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
  const matchingRows = glData.filter(row => row.fsliName === basis);
  return matchingRows.reduce((sum, row) => sum + Math.abs(row.balance), 0);
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
    
    rows.forEach(row => {
      const isKuanSignificant = Math.abs(row.balance) >= pmValue;
      
      // Include if FSLI group is qualitatively significant OR this specific account is quantitatively significant
      if (isQualSignificant || isKuanSignificant) {
        result.push({
          name: fsliName,
          balance: row.balance,
          isQuantitative: isKuanSignificant,
          fsliCode: row.fsliCode || row.noGL,
          assignedDepartmentIds: row.assignedDepartmentIds || []
        });
      }
    });
  });

  return result;
}

