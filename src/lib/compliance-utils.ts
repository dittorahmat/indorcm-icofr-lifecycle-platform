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
    return { min: 1, max: 1, label: "1 (Test of One)" };
  }

  switch (frequency) {
    case "Annual":
      return { min: 1, max: 1, label: "1 (Tahunan)" };
    case "Semi-Annual":
      // Regulasi tidak eksplisit untuk Semi-Annual, mengikuti pola antara Annual & Quarterly
      return riskRating === "High" ? { min: 2, max: 2, label: "2 (High Risk)" } : { min: 1, max: 1, label: "1 (Low Risk)" };
    case "Quarterly":
      return riskRating === "High" ? { min: 3, max: 3, label: "3 (High Risk)" } : { min: 2, max: 2, label: "2 (Low Risk)" };
    case "Monthly":
      return riskRating === "High" ? { min: 5, max: 5, label: "5 (High Risk)" } : { min: 2, max: 2, label: "2 (Low Risk)" };
    case "Weekly":
      return riskRating === "High" ? { min: 15, max: 15, label: "15 (High Risk)" } : { min: 5, max: 5, label: "5 (Low Risk)" };
    case "Daily":
      return riskRating === "High" ? { min: 40, max: 40, label: "40 (High Risk)" } : { min: 15, max: 15, label: "15 (Low Risk)" };
    case "Ad-hoc":
      // "Lebih dari sekali dalam sehari" di Tabel 22 (30-60 sampel)
      return riskRating === "High" ? { min: 60, max: 60, label: "60 (High Risk)" } : { min: 30, max: 30, label: "30 (Low Risk)" };
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
    case "Quarterly": return 2; // Min 2 kuartal
    case "Monthly": return 2; // Min 3 bulan, tapi sampel 2
    case "Weekly": return 5; // Min 5 minggu
    case "Daily": return 15; // Min 30 hari
    case "Ad-hoc": return 30; // Min 25 kali selama periode beberapa hari
    default: return 1;
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
 * Get Multiplier based on Table 25 (Hal 104)
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
 * Saran Pengendalian Utama berdasarkan Prinsip COSO (Lampiran 1)
 * Memetakan seluruh 17 Prinsip sesuai SK-5/2024
 */
export function getSuggestedControl(principle: number): { name: string; description: string } {
  switch (principle) {
    case 1: return { name: "Penetapan Kode Etik", description: "Perusahaan memiliki pedoman perilaku (code of conduct) tertulis yang diperbarui berkala dan diakses seluruh personil." };
    case 2: return { name: "Piagam Komite Audit", description: "Terdapat pengaturan independensi Dewan Komisaris dan Komite Audit dalam pengawasan pelaporan keuangan." };
    case 3: return { name: "Struktur Organisasi & DoA", description: "Manajemen menetapkan struktur alur pelaporan dan matriks Delegation of Authority (DoA) yang jelas." };
    case 4: return { name: "Kebijakan Rekrutmen & Kompetensi", description: "Proses rekrutmen mencakup verifikasi referensi dan program pelatihan berkala sesuai kebutuhan fungsi." };
    case 5: return { name: "Penetapan KPI ICOFR", description: "Evaluasi kinerja (KPI) mencakup akuntabilitas personil terhadap tanggung jawab pengendalian internal." };
    case 6: return { name: "Dokumentasi Scoping", description: "Manajemen mendokumentasikan hasil kajian ruang lingkup ICOFR berdasarkan faktor kuantitatif dan kualitatif." };
    case 7: return { name: "Identifikasi Risiko Signifikan", description: "Koordinasi antar lini untuk mengidentifikasi risiko yang memengaruhi pencapaian tujuan pelaporan keuangan." };
    case 8: return { name: "Asesmen Risiko Kecurangan (Fraud)", description: "Perancangan RCM secara spesifik mempertimbangkan potensi penyalahgunaan aset dan korupsi." };
    case 9: return { name: "Monitoring Perubahan Bisnis", description: "Mekanisme identifikasi perubahan organisasi atau teknologi yang berdampak pada sistem pengendalian." };
    case 10: return { name: "Pemisahan Tugas (SoD)", description: "Terdapat pemisahan tugas yang memadai antara fungsi otorisasi, pencatatan, dan penyimpanan aset." };
    case 11: return { name: "Kontrol Umum TI (ITGC)", description: "Aktivitas pengendalian atas infrastruktur teknologi (akses, perubahan, operasi) ditetapkan secara menyeluruh." };
    case 12: return { name: "Kebijakan & SOP", description: "Penyusunan dan reviu berkala atas SOP kegiatan operasional dan pelaporan keuangan." };
    case 13: return { name: "Validasi IPE/EUC", description: "Pengendalian untuk memastikan akurasi dan kelengkapan informasi yang dihasilkan sistem atau spreadsheet." };
    case 14: return { name: "Whistleblowing System (WBS)", description: "Tersedianya kanal pengaduan internal untuk melaporkan kecurangan dengan mekanisme investigasi formal." };
    case 15: return { name: "Komunikasi Eksternal & SOC", description: "Prosedur pemeriksaan informasi sebelum disampaikan ke pihak eksternal dan reviu laporan SOC pihak ketiga." };
    case 16: return { name: "Monitoring Berkala (CSA/Audit)", description: "Pelaksanaan evaluasi berkelanjutan melalui sertifikasi mandiri (CSA) dan audit internal independen." };
    case 17: return { name: "Remediasi Defisiensi", description: "Evaluasi dan komunikasi defisiensi secara tepat waktu serta pelaksanaan aktivitas perbaikan (remediasi)." };
    default: return { name: "Otorisasi Transaksi", description: "Setiap transaksi material harus diotorisasi oleh pejabat yang berwenang sesuai dengan limit kewenangan." };
  }
}


