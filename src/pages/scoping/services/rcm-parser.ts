import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { 
  filterEmptyRows,
} from '@/lib/compliance-utils';
import { z } from 'zod';

export type RCMType = 'ELC' | 'TLC' | 'ITGC';

export interface RCMParseResult {
  success: boolean;
  rows: any[];
  error?: string;
  missingColumns?: string[];
}

/**
 * Boolean Normalizer: Y, Ya, 1, Yes, True -> true
 */
const normalizeBoolean = (val: any): boolean => {
    if (!val) return false;
    const s = String(val).trim().toLowerCase();
    return ['y', 'ya', '1', 'yes', 'true', 'v', '✓'].includes(s);
};

/**
 * COSO Principles Parser: "1, 2, 5" -> [1, 2, 5]
 */
const parseCosoPrinciples = (val: any): number[] => {
    if (!val) return [];
    if (Array.isArray(val)) return val.map(Number);
    return String(val)
        .split(/[,\s]+/)
        .map(s => parseInt(s.trim()))
        .filter(n => !isNaN(n) && n >= 1 && n <= 17);
};

/**
 * Zod Schemas for Row Validation
 */
const TLCSchema = z.object({
    'Informasi_Proses_Bisnis': z.string().min(1),
    'Informasi_Sub_proses_Bisnis': z.string().min(1),
    'Perusahaan_Pelaksana_Proses_Bisnis': z.string().min(1),
    'Risiko_Aktivitas_Pengendalian': z.string().min(1),
    'Referensi_Pengendalian': z.string().min(1),
    'Aplikasi_Pendukung': z.string().optional(),
    'No_GL': z.string().optional(),
});

const ELCSchema = z.object({
    'Referensi_Pengendalian': z.string().min(1),
    'Aktivitas_Pengendalian': z.string().min(1),
});

const ITGCSchema = z.object({
    'Referensi_Pengendalian': z.string().min(1),
    'Nama_Aktivitas_Pengendalian': z.string().min(1),
    'Aplikasi_Pendukung': z.string().min(1), // Mandatory for ITGC
});

/**
 * Service to parse RCM data from CSV or Excel files.
 * Supports ELC, TLC, and ITGC formats as per SK-5/2024.
 */
export async function parseRCMFile(file: File, type: RCMType = 'TLC'): Promise<RCMParseResult> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    
    reader.onload = async (e) => {
      const bstr = e.target?.result;
      let rawData: any[] = [];

      try {
        if (file.name.endsWith('.csv')) {
          const results = Papa.parse(bstr as string, { 
            header: true, 
            skipEmptyLines: 'greedy', 
            transformHeader: (h) => h.trim(),
            delimitersToGuess: [',', ';', '\t', '|']
          });
          rawData = results.data;
        } else {
          const workbook = XLSX.read(bstr, { type: 'binary' });
          const worksheet = workbook.Sheets[workbook.SheetNames[0]];
          const json = XLSX.utils.sheet_to_json(worksheet);
          rawData = json.map((row: any) => {
            const trimmedRow: any = {};
            Object.keys(row).forEach(key => trimmedRow[key.trim()] = row[key]);
            return trimmedRow;
          });
        }

        const filteredRaw = filterEmptyRows(rawData).map(row => {
            const trimmedRow: any = {};
            Object.keys(row).forEach(key => trimmedRow[key.trim()] = row[key]);
            return trimmedRow;
        });
        
        if (filteredRaw.length === 0) {
            resolve({ success: false, rows: [], error: 'No valid data rows found' });
            return;
        }

        let parsedRows: any[] = [];
        const parseErrors: string[] = [];

        if (type === 'ELC') {
            parsedRows = filteredRaw.map((r, idx) => {
                const result = ELCSchema.safeParse(r);
                if (!result.success) {
                    parseErrors.push(`Row ${idx + 1}: ${result.error.issues.map(i => `${i.path.join('.')}: ${i.message}`).join(', ')}`);
                }
                return {
                    id: crypto.randomUUID(),
                    level: 'ELC',
                    isValid: result.success,
                    error: result.success ? null : result.error.issues[0].message,
                    controlCode: String(r['Referensi_Pengendalian'] || ''),
                    controlName: String(r['Aktivitas_Pengendalian'] || ''), 
                    controlDescription: String(r['Aktivitas_Pengendalian'] || ''),
                    frequency: String(r['Frekuensi_Pengendalian'] || ''),
                    supportingDocs: String(r['Dokumen_Pengendalian'] || ''),
                    executingFunction: String(r['Fungsi_Pelaksana_Aktivitas_Pengendalian'] || ''),
                    executorRole: String(r['Pelaku_Pengendalian'] || ''),
                    effectivePeriod: String(r['Periode_Efektif'] || ''),
                    ...(() => {
                        const initialCoso = parseCosoPrinciples(r['Prinsip_COSO'] || r['COSO_Prinsip']);
                        const combinedCoso = Array.from({length: 17}, (_, i) => i + 1).reduce((acc, n) => {
                            const colName = `Prinsip_${n}`;
                            if (r[colName] !== undefined && normalizeBoolean(r[colName])) {
                                if (!acc.includes(n)) acc.push(n);
                            }
                            return acc;
                        }, initialCoso);
                        return { cosoPrinciples: combinedCoso };
                    })()
                };
            });
        } else if (type === 'ITGC') {
            parsedRows = filteredRaw.map((r, idx) => {
                const result = ITGCSchema.safeParse(r);
                if (!result.success) {
                    parseErrors.push(`Row ${idx + 1}: ${result.error.issues.map(i => `${i.path.join('.')}: ${i.message}`).join(', ')}`);
                }
                return {
                    id: crypto.randomUUID(),
                    level: 'ITGC',
                    isValid: result.success,
                    error: result.success ? null : result.error.issues[0].message,
                    processName: String(r['Informasi_Proses_Bisnis'] || ''),
                    subProcessName: String(r['Informasi_Sub_proses_Bisnis'] || ''),
                    entityCode: String(r['Perusahaan_Pelaksana_Proses_Bisnis'] || ''),
                    riskDescription: String(r['Risiko_Aktivitas_Pengendalian'] || ''),
                    controlCode: String(r['Referensi_Pengendalian'] || ''),
                    controlName: String(r['Nama_Aktivitas_Pengendalian'] || ''),
                    controlDescription: String(r['Deskripsi_Aktivitas_Pengendalian'] || ''),
                    supportingDocs: String(r['Dokumen_Pendukung'] || ''),
                    isKeyControl: normalizeBoolean(r['Pengendalian_Utama']),
                    controlType: String(r['Preventif_Detektif'] || ''),
                    controlNature: String(r['Sifat_Pelaksanaan_Pengendalian'] || ''),
                    automatedSubNature: String(r['Jenis_Pengendalian_Otomatis'] || ''),
                    frequency: String(r['Frekuensi_Pelaksanaan_Aktivitas'] || ''),
                    supportingApp: String(r['Aplikasi_Pendukung'] || ''),
                    executingFunction: String(r['Fungsi_Pelaksana_Aktivitas'] || ''),
                    executorRole: String(r['Pelaku_Pengendalian'] || ''),
                    effectivePeriod: String(r['Periode_Efektif'] || ''),
                };
            });
        } else {
            // Default: TLC
            parsedRows = filteredRaw.map((r, idx) => {
                const result = TLCSchema.safeParse(r);
                if (!result.success) {
                    parseErrors.push(`Row ${idx + 1}: ${result.error.issues.map(i => `${i.path.join('.')}: ${i.message}`).join(', ')}`);
                }
                return {
                    id: crypto.randomUUID(),
                    level: 'TLC',
                    isValid: result.success,
                    error: result.success ? null : result.error.issues[0].message,
                    processName: String(r['Informasi_Proses_Bisnis'] || ''),
                    subProcessName: String(r['Informasi_Sub_proses_Bisnis'] || ''),
                    entityCode: String(r['Perusahaan_Pelaksana_Proses_Bisnis'] || ''),
                    locationCode: String(r['Lokasi_Dilaksanakannya_Proses_Bisnis'] || ''),
                    riskDescription: String(r['Risiko_Aktivitas_Pengendalian'] || ''),
                    isFraudRelated: normalizeBoolean(r['Risiko_Terkait_Fraud']),
                    riskRating: String(r['Penilaian_Risiko'] || 'Low'),
                    controlCode: String(r['Referensi_Pengendalian'] || ''),
                    controlName: String(r['Nama_Aktivitas_Pengendalian'] || ''),
                    controlDescription: String(r['Deskripsi_Aktivitas_Pengendalian'] || ''),
                    supportingDocs: String(r['Dokumen_Pendukung'] || ''),
                    isKeyControl: normalizeBoolean(r['Pengendalian_Utama']),
                    ipoC: normalizeBoolean(r['IPO_C']),
                    ipoA: normalizeBoolean(r['IPO_A']),
                    ipoV: normalizeBoolean(r['IPO_V']),
                    ipoRa: normalizeBoolean(r['IPO_RA']),
                    assertionC: normalizeBoolean(r['Asersi_C']),
                    assertionA: normalizeBoolean(r['Asersi_A']),
                    assertionE: normalizeBoolean(r['Asersi_E_O']),
                    assertionCo: normalizeBoolean(r['Asersi_CO']),
                    assertionRo: normalizeBoolean(r['Asersi_R_O']),
                    assertionVa: normalizeBoolean(r['Asersi_V_A']),
                    assertionPd: normalizeBoolean(r['Asersi_PD']),
                    controlType: String(r['Preventif_Detektif'] || ''),
                    controlNature: String(r['Sifat_Pelaksanaan_Pengendalian'] || ''),
                    automatedSubNature: String(r['Jenis_Pengendalian_Otomatis'] || ''),
                    frequency: String(r['Frekuensi_Pelaksanaan_Aktivitas'] || ''),
                    supportingApp: String(r['Aplikasi_Pendukung'] || ''),
                    executingFunction: String(r['Fungsi_Pelaksana_Aktivitas'] || ''),
                    executorRole: String(r['Pelaku_Pengendalian'] || ''),
                    affectedFsliItem: String(r['Item_Laporan_Keuangan_yang_Terdampak'] || ''),
                    effectivePeriod: String(r['Periode_Efektif'] || ''),
                    accountCode: String(r['No_GL'] || r['noGL'] || r['Kode_GL'] || r['Kode GL'] || r['Account Code'] || r['accountCode'] || ''),
                };
            });
        }

        resolve({ success: true, rows: parsedRows });
      } catch (err: any) {
        console.error("Parse error:", err);
        resolve({ success: false, rows: [], error: err.message });
      }
    };

    if (file.name.endsWith('.csv')) {
      reader.readAsText(file);
    } else {
      reader.readAsBinaryString(file);
    }
  });
}
