import { ControlFrequency, Control } from "@shared/types";

/**
 * Logika Matrix Risiko 3x3 berdasarkan Tabel 12 (Hal 37)
 * Mengombinasikan Faktor Kuantitatif dan Kualitatif
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
 * Panduan Penentuan Jumlah Sampel berdasarkan Tabel 22 (Hal 56)
 * Dipengaruhi oleh Frekuensi dan Tingkat Risiko
 */
export interface SampleRange {
  min: number;
  max: number;
  label: string;
}

export function getSuggestedSampleRange(
  frequency: ControlFrequency,
  riskRating: "High" | "Medium" | "Low",
  nature: string
): SampleRange {
  if (nature === "Automated") {
    return { min: 1, max: 1, label: "Test of One (Otomatis)" };
  }

  switch (frequency) {
    case "Annual":
      return { min: 1, max: 1, label: "1 (Tahunan)" };
    case "Semi-Annual":
      // Regulasi Tabel 22 hanya list Quarterly, tapi Semi-annual biasanya mengikuti pola
      return riskRating === "High" ? { min: 3, max: 3, label: "3" } : { min: 2, max: 2, label: "2" };
    case "Quarterly":
      return riskRating === "High" ? { min: 3, max: 3, label: "3" } : { min: 2, max: 2, label: "2" };
    case "Monthly":
      return riskRating === "High" ? { min: 5, max: 5, label: "5" } : { min: 2, max: 2, label: "2" };
    case "Weekly":
      return riskRating === "High" ? { min: 15, max: 15, label: "15" } : { min: 5, max: 5, label: "5" };
    case "Daily":
      return riskRating === "High" ? { min: 40, max: 40, label: "40" } : { min: 15, max: 15, label: "15" };
    case "Ad-hoc":
      return { min: 1, max: 25, label: "Tergantung Populasi (Audit Judgment)" };
    default:
      return { min: 1, max: 1, label: "1" };
  }
}

/**
 * Validasi Periode Minimum Pengujian Remediasi berdasarkan Tabel 23 (Hal 60)
 */
export function getMinRemediationPeriod(frequency: ControlFrequency): { value: number; unit: 'days' | 'weeks' | 'months' | 'quarters' } {
  switch (frequency) {
    case "Annual": return { value: 1, unit: 'quarters' }; // Not specified, but logically needs time
    case "Semi-Annual": return { value: 1, unit: 'quarters' };
    case "Quarterly": return { value: 2, unit: 'quarters' };
    case "Monthly": return { value: 3, unit: 'months' };
    case "Weekly": return { value: 5, unit: 'weeks' };
    case "Daily": return { value: 30, unit: 'days' };
    case "Ad-hoc": return { value: 25, unit: 'days' }; // 25 times over several days
    default: return { value: 1, unit: 'days' };
  }
}

export function isReadyForRemediationTest(
  frequency: ControlFrequency,
  remediationDate: number
): { isReady: boolean; message: string } {
  const min = getMinRemediationPeriod(frequency);
  const now = Date.now();
  const diff = now - remediationDate;
  
  const dayMs = 86400000;
  const weekMs = dayMs * 7;
  const monthMs = dayMs * 30;
  const quarterMs = monthMs * 3;

  let requiredMs = 0;
  if (min.unit === 'days') requiredMs = min.value * dayMs;
  else if (min.unit === 'weeks') requiredMs = min.value * weekMs;
  else if (min.unit === 'months') requiredMs = min.value * monthMs;
  else if (min.unit === 'quarters') requiredMs = min.value * quarterMs;

  const isReady = diff >= requiredMs;
  const waitText = `${min.value} ${min.unit}`;

  return {
    isReady,
    message: isReady 
      ? "Periode tunggu minimum terpenuhi (Tabel 23)." 
      : `Belum memenuhi periode tunggu minimum (${waitText}) sejak perbaikan.`
  };
}

/**
 * Matriks Distribusi Laporan Defisiensi berdasarkan Tabel 24 (Hal 103)
 */
export type DeficiencyStakeholder = "Unit Kerja / Process Owner" | "Manajemen (Lini 2 & Lini 3)" | "Direksi (CEO/CFO)" | "Komite Audit" | "Dewan Komisaris";

export function getDeficiencyDistribution(severity: string): DeficiencyStakeholder[] {
  switch (severity) {
    case "Control Deficiency":
      return ["Unit Kerja / Process Owner"];
    case "Significant Deficiency":
      return ["Unit Kerja / Process Owner", "Manajemen (Lini 2 & Lini 3)", "Komite Audit"];
    case "Material Weakness":
      return ["Unit Kerja / Process Owner", "Manajemen (Lini 2 & Lini 3)", "Direksi (CEO/CFO)", "Komite Audit", "Dewan Komisaris"];
    default:
      return ["Unit Kerja / Process Owner"];
  }
}


