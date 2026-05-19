import { ControlFrequency, Control, GLRow, BenchmarkBasis } from "@shared/types";
import { 
  getGroupMultiplier, 
  calculateBenchmarkValue, 
  calculateRiskRating 
} from "../pages/scoping/services/materiality-calc";

export { 
  getGroupMultiplier, 
  calculateBenchmarkValue, 
  calculateRiskRating 
};

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
    return { min: 1, max: 1, label: "1 (Test of One)" };
  }

  const isHigh = riskRating === "High";

  switch (frequency) {
    case "Annual":
      return { min: 1, max: 1, label: "1" };
    case "Semi-Annual":
      // SK-5 doesn't explicitly list Semi-Annual in Table 22, mapping to Quarterly or higher based on conservatism
      return isHigh ? { min: 2, max: 3, label: "2 - 3" } : { min: 1, max: 2, label: "1 - 2" };
    case "Quarterly":
      // Table 22: Kuartalan (4 population) -> 2 sampai 3 samples
      return isHigh ? { min: 3, max: 3, label: "3" } : { min: 2, max: 2, label: "2" };
    case "Monthly":
      // Table 22: Bulanan (12 population) -> 2 sampai 5 samples
      return isHigh ? { min: 5, max: 5, label: "5" } : { min: 2, max: 3, label: "2 - 3" };
    case "Weekly":
      // Table 22: Mingguan (52 population) -> 5 sampai 15 samples
      return isHigh ? { min: 15, max: 15, label: "15" } : { min: 5, max: 8, label: "5 - 8" };
    case "Daily":
      // Table 22: Harian (250 population) -> 15 sampai 40 samples
      return isHigh ? { min: 40, max: 40, label: "40" } : { min: 15, max: 20, label: "15 - 20" };
    case "Ad-hoc":
      // Table 22: Lebih dari sekali dalam satu hari (>250 population) -> 30 sampai 60 samples
      return isHigh ? { min: 60, max: 60, label: "60" } : { min: 30, max: 45, label: "30 - 45" };
    default:
      return { min: 1, max: 1, label: "1" };
  }
}

/**
 * Penentuan Jumlah Sampel Remediasi berdasarkan Tabel 23 (Hal 70)
 */
export function getRemediationSampleSize(frequency: ControlFrequency): number {
  switch (frequency) {
    case "Annual": return 1;
    case "Semi-Annual": return 1;
    case "Quarterly": return 2;
    case "Monthly": return 2;
    case "Weekly": return 5;
    case "Daily": return 15;
    case "Ad-hoc": return 25;
    default: return 1;
  }
}

/**
 * Validasi Periode Minimum Pengujian Remediasi berdasarkan Tabel 23 (Hal 60)
 */
export function getMinRemediationPeriod(frequency: ControlFrequency): { value: number; unit: 'days' | 'weeks' | 'months' | 'quarters' } {
  switch (frequency) {
    case "Annual": return { value: 1, unit: 'quarters' }; 
    case "Semi-Annual": return { value: 1, unit: 'quarters' };
    case "Quarterly": return { value: 2, unit: 'quarters' };
    case "Monthly": return { value: 3, unit: 'months' };
    case "Weekly": return { value: 5, unit: 'weeks' };
    case "Daily": return { value: 30, unit: 'days' };
    case "Ad-hoc": return { value: 15, unit: 'days' }; // 25 times over multiple days (approx 15 days for testing)
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
 * Pemetaan COBIT 2019 ke Area ITGC berdasarkan Tabel 1 (Hal 16)
 */
export const COBIT_ITGC_MAPPING: Record<string, string[]> = {
  "APO09": ["Program Development", "Program Changes", "Computer Operations", "Access to Program and Data"],
  "APO10": ["Program Development", "Program Changes", "Computer Operations", "Access to Program and Data"],
  "APO13": ["Computer Operations", "Access to Program and Data"],
  "BAI02": ["Program Development", "Program Changes"],
  "BAI03": ["Program Development", "Program Changes"],
  "BAI04": ["Program Development", "Program Changes"],
  "BAI06": ["Program Changes", "Computer Operations", "Access to Program and Data"],
  "BAI07": ["Program Development", "Program Changes", "Computer Operations", "Access to Program and Data"],
  "BAI10": ["Program Changes", "Computer Operations", "Access to Program and Data"],
  "DSS01": ["Program Development", "Computer Operations", "Access to Program and Data"],
  "DSS02": ["Program Development", "Program Changes", "Computer Operations"],
  "DSS03": ["Computer Operations"],
  "DSS04": ["Computer Operations", "Access to Program and Data"],
  "DSS05": ["Computer Operations", "Access to Program and Data"],
  "DSS06": ["Computer Operations", "Access to Program and Data"],
};


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

/**
 * Mendapatkan saran kontrol berdasarkan Prinsip COSO (Lampiran 1)
 */
export function getSuggestedControl(principle: number): { name: string; description: string } {
  switch (principle) {
    case 1: return { name: "Kode Etik & Integritas", description: "Perusahaan memiliki dan mensosialisasikan kode etik serta nilai-integritas kepada seluruh pegawai secara berkala." };
    case 2: return { name: "Pengawasan Dewan Komisaris", description: "Dewan Komisaris melakukan pengawasan independen atas pengembangan dan kinerja pengendalian internal." };
    case 3: return { name: "Struktur Organisasi & Pelaporan", description: "Manajemen menetapkan struktur pelaporan, wewenang, dan tanggung jawab yang memadai dalam pencapaian tujuan." };
    case 4: return { name: "Kompetensi SDM", description: "Perusahaan menetapkan kebijakan untuk menarik, mengembangkan, dan mempertahankan individu yang kompeten." };
    case 5: return { name: "Akuntabilitas Kinerja", description: "Individu dimintai pertanggungjawaban atas tugas pengendalian internal mereka dalam pencapaian tujuan." };
    case 6: return { name: "Identifikasi Risiko Pelaporan", description: "Manajemen mengidentifikasi risiko yang relevan dengan penyusunan laporan keuangan sesuai standar akuntansi." };
    case 7: return { name: "Analisis Dampak Risiko", description: "Risiko diidentifikasi dan dianalisis untuk menentukan dasar pengelolaan risiko." };
    case 8: return { name: "Penilaian Risiko Fraud", description: "Potensi kecurangan (fraud) dipertimbangkan dalam menilai risiko pencapaian tujuan." };
    case 9: return { name: "Identifikasi Perubahan Signifikan", description: "Manajemen mengidentifikasi dan menilai perubahan yang dapat memengaruhi sistem pengendalian internal secara signifikan." };
    case 10: return { name: "Aktivitas Pengendalian Transaksi", description: "Aktivitas pengendalian dipilih dan dikembangkan untuk memitigasi risiko hingga tingkat yang dapat diterima." };
    case 11: return { name: "Pengendalian Umum TI (ITGC)", description: "Pengendalian umum atas teknologi (ITGC) dipilih dan dikembangkan untuk mendukung pencapaian tujuan." };
    case 12: return { name: "Kebijakan & Prosedur", description: "Aktivitas pengendalian diimplementasikan melalui kebijakan dan prosedur yang jelas." };
    case 13: return { name: "Kualitas Informasi", description: "Perusahaan memperoleh atau menghasilkan informasi yang relevan dan berkualitas untuk mendukung fungsi pengendalian." };
    case 14: return { name: "Komunikasi Internal", description: "Informasi dikomunikasikan secara internal untuk mendukung berfungsinya pengendalian internal." };
    case 15: return { name: "Komunikasi Eksternal", description: "Komunikasi dilakukan dengan pihak eksternal mengenai hal-hal yang memengaruhi berfungsinya pengendalian internal." };
    case 16: return { name: "Evaluasi Berkelanjutan", description: "Evaluasi dilakukan untuk memastikan apakah komponen pengendalian internal ada dan berfungsi." };
    case 17: return { name: "Pelaporan Defisiensi", description: "Defisiensi pengendalian internal dievaluasi dan dikomunikasikan kepada pihak yang bertanggung jawab untuk perbaikan." };
    default: return { name: "Otorisasi Transaksi", description: "Setiap transaksi material harus diotorisasi oleh pejabat yang berwenang sesuai dengan limit kewenangan." };
  }
}

export type QualitativeScopingReason = 
  | "Besarnya eksposur risiko kecurangan"
  | "Volume transaksi, kompleksitas, dan homogenitas"
  | "Adanya perubahan signifikan dalam karakteristik akun"
  | "Akun yang memerlukan judgement tinggi"
  | "Akun yang dipengaruhi oleh estimasi"
  | "Kepatuhan terhadap loan covenant"
  | "Aset yang dikelola oleh pihak ketiga"
  | "Lainnya";

/**
 * Benford's Law Analysis
 * Calculates the distribution of first digits in a set of numbers.
 * Standard distribution: [0.301, 0.176, 0.125, 0.097, 0.079, 0.067, 0.058, 0.051, 0.046]
 */
export function calculateBenfordDistribution(data: number[]): number[] {
  const counts = new Array(9).fill(0);
  let total = 0;

  data.forEach(val => {
    const absVal = Math.abs(val);
    if (absVal === 0) return;
    const firstDigit = parseInt(absVal.toString().replace(/[^1-9]/, '')[0]);
    if (firstDigit >= 1 && firstDigit <= 9) {
      counts[firstDigit - 1]++;
      total++;
    }
  });

  return total === 0 ? new Array(9).fill(0) : counts.map(c => (c / total) * 100);
}

export const BENFORD_STANDARD = [30.1, 17.6, 12.5, 9.7, 7.9, 6.7, 5.8, 5.1, 4.6];

/**
 * Parse Indonesian number format for GL balances
 * Handles: spaces, period thousand separator, comma decimal, parentheses for negative
 */
export function parseBalance(value: string | number): { success: boolean; value: number; error?: string } {
  // Handle numeric input
  if (typeof value === 'number') {
    return { success: true, value };
  }

  // Handle empty/null/undefined
  if (!value || value.trim() === '' || value === '-') {
    return { success: true, value: 0 };
  }

  let cleaned = value.trim();

  // Detect and handle parentheses for negative
  const isNegative = cleaned.startsWith('(') && cleaned.endsWith(')');
  if (isNegative) {
    cleaned = cleaned.slice(1, -1);
  }

  // Remove all spaces
  cleaned = cleaned.replace(/\s/g, '');

  // Remove thousand separator (period in Indonesian format)
  cleaned = cleaned.replace(/\./g, '');

  // Convert comma to period for decimal
  cleaned = cleaned.replace(',', '.');

  // Parse as float
  const parsed = parseFloat(cleaned);

  if (isNaN(parsed)) {
    return { 
      success: false, 
      value: 0, 
      error: `Invalid balance format: ${value}` 
    };
  }

  return { 
    success: true, 
    value: isNegative ? -parsed : parsed 
  };
}

/**
 * Column mapping for GL auto-detection
 * Priority order: first match wins
 */
export const GL_COLUMN_MAPPING = {
  accountCode: ['No_GL', 'Kode_GL', 'AccountCode', 'Account Code', 'Code'],
  accountName: ['GL_Desc', 'GLDesc', 'AccountName', 'Account Name', 'Account', 'Description'],
  balance: ['GL_Balance', 'GLBalance', 'Balance', 'Amount', 'EndingBalance', 'Saldo'],
  fsliCode: ['Kode_FSLI', 'FSLICode', 'FSLI_Code'],
  entityCode: ['Kode_Entity', 'EntityCode', 'Entity_Code', 'Kode_Cabang'],
  currency: ['Kode_Valuta', 'Currency', 'Valuta', 'Curr'],
  period: ['YMD', 'Date', 'Period', 'Tanggal'],
  // New Mappings for SK-5/2024 Template
  kategori: ['Kategori', 'Category'],
  subKategori: ['Sub_Kategori', 'SubKategori', 'Sub-Category'],
  fsliName: ['FSLI', 'FSLI_Name', 'FSLIName'],
  fsliBalance: ['FSLI_Balance', 'FSLIBalance'],
  noUrut: ['No_Urut', 'No_U', 'NoUrut', 'SortOrder'],
} as const;

export type GLField = keyof typeof GL_COLUMN_MAPPING;

/**
 * Auto-detect column mapping from CSV headers (Case-Insensitive)
 */
export function detectGLColumns(headers: string[]): Record<string, string> {
  const mapping: Record<string, string> = {};

  headers.forEach(header => {
    const trimmedHeader = header.trim().toLowerCase();
    
    // Check each field type
    (Object.keys(GL_COLUMN_MAPPING) as GLField[]).forEach(field => {
      // If this field already has a mapping, skip
      if (mapping[field]) return;
      
      // Check if header matches any variation (case-insensitive)
      const variations = GL_COLUMN_MAPPING[field] as readonly string[];
      const match = variations.find(v => v.toLowerCase() === trimmedHeader);
      
      if (match) {
        // Store the ORIGINAL header name to use as a key
        mapping[field] = header.trim();
      }
    });
  });

  return mapping;
}

/**
 * Validate GL column mapping has required fields
 */
export function validateGLMapping(mapping: Record<string, string>): { valid: boolean; missing: string[] } {
  const required = ['accountName', 'balance'];
  const missing = required.filter(field => !mapping[field]);
  
  return {
    valid: missing.length === 0,
    missing
  };
}

/**
 * Filter empty rows from GL data
 */
export function filterEmptyRows(rows: any[]): any[] {
  return rows.filter(row => {
    const hasData = Object.values(row).some(val => 
      val !== null && val !== undefined && val.toString().trim() !== ''
    );
    return hasData;
  });
}

/**
 * Sorts GL data hierarchically: 
 * 1. Groups by fsliName
 * 2. Sorts groups by the minimum noUrut found in each group
 * 3. Sorts GL accounts within each group by noUrut
 */
export function sortGLHierarchically(data: GLRow[]): GLRow[] {
  // Group by fsliName
  const groups = new Map<string, GLRow[]>();
  data.forEach(row => {
    const fsliName = row.fsliName || 'Unmapped FSLI';
    if (!groups.has(fsliName)) {
      groups.set(fsliName, []);
    }
    groups.get(fsliName)!.push(row);
  });

  // Sort GL within each group by noUrut ascending
  groups.forEach(rows => {
    rows.sort((a, b) => (a.noUrut || 0) - (b.noUrut || 0));
  });

  // Convert to array and sort groups by min noUrut, then by fsliName alphabetically
  const sortedGroups = Array.from(groups.entries())
    .map(([fsliName, rows]) => {
      const validNoUruts = rows.map(r => r.noUrut).filter((n): n is number => n !== null && n !== undefined);
      const minNoUrut = validNoUruts.length > 0 ? Math.min(...validNoUruts) : 0;
      return { fsliName, minNoUrut, rows };

    })
    .sort((a, b) => {
      if (a.minNoUrut !== b.minNoUrut) {
        return a.minNoUrut - b.minNoUrut;
      }
      return a.fsliName.localeCompare(b.fsliName);
    });

  // Flatten back to single array
  return sortedGroups.flatMap(g => g.rows);
}

/**
 * Calculate data quality confidence score
 */
export function calculateDataQualityScore(glData: any[]): {
  score: number;
  level: 'High' | 'Medium' | 'Low';
  hasFSLI: boolean;
  message: string;
} {
  const hasFSLI = glData.some(row => row.fsliCode);
  const fSLICoverage = hasFSLI 
    ? (glData.filter(row => row.fsliCode).length / glData.length) * 100 
    : 0;
  
  let score = 0;
  let level: 'High' | 'Medium' | 'Low' = 'Low';
  
  if (hasFSLI) {
    score += 50;
    if (fSLICoverage > 80) score += 30;
    else if (fSLICoverage > 50) score += 20;
  }
  
  // Check for complete account info
  const hasCompleteInfo = glData.filter(row => row.accountCode && row.accountName && row.balance).length;
  const completenessScore = (hasCompleteInfo / glData.length) * 100;
  score += (completenessScore / 100) * 20;
  
  if (score >= 80) level = 'High';
  else if (score >= 50) level = 'Medium';
  
  return {
    score,
    level,
    hasFSLI,
    message: hasFSLI 
      ? `High quality data with FSLI codes (${fSLICoverage.toFixed(0)}% coverage)`
      : 'Using account name matching - verify accuracy'
  };
}

/**
 * Menentukan apakah remediasi selesai sebelum akhir tahun fiskal (Lampiran 11)
 */
export function isBeforeYearEnd(completionDate: number, fiscalYear: number): boolean {
  // Akhir tahun fiskal (31 Desember)
  const yearEnd = new Date(fiscalYear, 11, 31, 23, 59, 59).getTime();
  return completionDate <= yearEnd;
}

/**
 * Pemetaan hasil pengujian ke label regulatif (SK-5/2024)
 */
export const TEST_RESULT_MAP = {
  Effective: { label: "Efektif", variant: "success", color: "text-green-600" },
  Ineffective: { label: "Tidak Efektif", variant: "destructive", color: "text-red-600" },
  // Legacy support
  Pass: { label: "Efektif", variant: "success", color: "text-green-600" },
  Fail: { label: "Tidak Efektif", variant: "destructive", color: "text-red-600" }
} as const;

export function getTestResultLabel(result: string): { label: string; variant: string; color: string } {
  return (TEST_RESULT_MAP as any)[result] || { label: result, variant: "outline", color: "text-slate-500" };
}
