import { parseRCMSpreadsheet } from './rcm-spreadsheet-parser';
import { reconcileRcmWithBpmNodes } from './rcm-reconciliation-matcher';
import type { BPMNodeOption, RCMFlavor, RCMImportParsedRow } from './rcm-import-types';

/** Re-exported so the seam owns the only tunable matching thresholds. */
export {
  RCM_MATCH_AUTO_THRESHOLD,
  RCM_MATCH_SUGGEST_THRESHOLD,
} from './rcm-reconciliation-matcher';

export interface RCMMatchStats {
  matched: number;
  suggested: number;
  unmatched: number;
}

export interface RCMIngestionResult {
  rows: RCMImportParsedRow[];
  errors: string[];
  /** Match outcome counts over the staged rows. */
  matchStats: RCMMatchStats;
  /** Rows failing flavor validation. */
  invalidRowCount: number;
  /** True when there is anything to validate or commit. */
  canProceed: boolean;
}

export interface RCMImportPayload {
  rcmType: RCMFlavor;
  year: string;
  bpmProcessId?: string;
  diagramId?: string;
  rows: RCMImportParsedRow[];
}

/** Adapter-facing rollup of already-staged rows (no parse, no match). */
export interface RCMStagedSummary {
  matchStats: RCMMatchStats;
  invalidRowCount: number;
  canProceed: boolean;
}

/**
 * Per-flavor template contract (SK-5 Lampiran 5a/5b/5c): download headers and
 * the self-consistent sample row. Owned here so the downloader, the parser,
 * and the contract tests all read one source of truth.
 */
export const RCM_TEMPLATES: Record<
  RCMFlavor,
  { filename: string; headers: string[]; sampleRow: string[] }
> = {
  TLC: {
    filename: 'Template_RCM_TLC_Lampiran5b.csv',
    headers: [
      'No',
      'Informasi_Proses_Bisnis',
      'Informasi_Sub_proses_Bisnis',
      'Ref_Langkah_BPM',
      'Nama_Langkah_BPM',
      'Risiko_Aktivitas_Pengendalian',
      'Risiko_Terkait_Fraud',
      'Penilaian_Risiko',
      'Referensi_Pengendalian',
      'Nama_Aktivitas_Pengendalian',
      'Deskripsi_Aktivitas_Pengendalian',
      'Dokumen_Pendukung',
      'Pengendalian_Utama',
      'IPO_C',
      'IPO_A',
      'IPO_V',
      'IPO_RA',
      'Asersi_C',
      'Asersi_E',
      'Asersi_A',
      'Asersi_CO',
      'Asersi_RO',
      'Asersi_VA',
      'Asersi_PD',
      'Tipe_Pengendalian',
      'Sifat_Pengendalian',
      'Frekuensi_Pengendalian',
      'Aplikasi_Pendukung',
      'Fungsi_Pelaksana',
      'Pelaku_Pengendalian',
      'Akun_Signifikan_FSLI',
      'Periode_Efektif',
    ],
    sampleRow: [
      '1',
      'Procure-to-Pay',
      'Pengadaan Barang/Jasa',
      '1.2',
      'Verifikasi Vendor Baru',
      'Risiko vendor fiktif atau tidak tersertifikasi',
      'Ya',
      'High',
      'CTRL-P2P-001',
      'Verifikasi Vendor Due Diligence',
      'Pemeriksaan kelayakan vendor baru oleh tim procurement sebelum pendaftaran master data.',
      'Formulir Uji Tuntas & SIUP',
      'Ya',
      'Y', 'Y', 'Y', 'N',
      'Y', 'Y', 'Y', 'Y', 'N', 'Y', 'N',
      'Preventif',
      'Manual',
      'Setiap Terjadi Transaksi',
      'SAP ERP',
      'Procurement',
      'Staff Pengadaan',
      'Beban Usaha / Utang Usaha',
      '2026-Q1',
    ],
  },
  ELC: {
    filename: 'Template_RCM_ELC_Lampiran5a.csv',
    headers: [
      'No',
      'Prinsip_COSO',
      'Informasi_Proses_Bisnis',
      'Informasi_Sub_proses_Bisnis',
      'Risiko_Aktivitas_Pengendalian',
      'Referensi_Pengendalian',
      'Nama_Aktivitas_Pengendalian',
      'Deskripsi_Aktivitas_Pengendalian',
      'Frekuensi_Pengendalian',
      'Dokumen_Pendukung',
      'Fungsi_Pelaksana',
      'Pelaku_Pengendalian',
      'Periode_Efektif',
    ],
    sampleRow: [
      '1',
      '1',
      'Tata Kelola & Nilai Etika',
      'Integritas & Nilai Etika Perusahaan',
      'Risiko pelanggaran kode etik oleh insan BUMN tanpa sanksi tegas',
      'CTRL-ELC-001',
      'Sosialisasi & Pakta Integritas Tahunan',
      'Penandatanganan pakta integritas dan pelatihan kode etik tahunan seluruh pegawai.',
      'Tahunan',
      'Dokumen Pakta Integritas & Daftar Hadir',
      'Human Capital / GRC',
      'Seluruh Karyawan',
      '2026',
    ],
  },
  ITGC: {
    filename: 'Template_RCM_ITGC_Lampiran5c.csv',
    headers: [
      'No',
      'Domain_ITGC',
      'Informasi_Proses_Bisnis',
      'Informasi_Sub_proses_Bisnis',
      'Risiko_Aktivitas_Pengendalian',
      'Aplikasi_IT',
      'Referensi_Pengendalian',
      'Nama_Aktivitas_Pengendalian',
      'Deskripsi_Aktivitas_Pengendalian',
      'Tipe_Pengendalian',
      'Sifat_Pengendalian',
      'Frekuensi_Pengendalian',
      'Dokumen_Pendukung',
      'Fungsi_Pelaksana',
      'Pelaku_Pengendalian',
      'Periode_Efektif',
    ],
    sampleRow: [
      '1',
      'Manage Access',
      'Manajemen Hak Akses Sistem',
      'User Provisioning & Deprovisioning',
      'Risiko akses pengguna tidak sah pada sistem keuangan inti',
      'SAP ERP',
      'CTRL-ITGC-001',
      'Review Hak Akses Pengguna Triwulanan',
      'Audit berkala hak akses superuser dan pemblokiran akun pegawai yang mutasi/resign.',
      'Detektif',
      'Manual',
      'Triwulanan',
      'Laporan User Access Review',
      'IT Security',
      'IT Security Officer',
      '2026-Q1',
    ],
  },
};

/** Template download filename for a flavor (single contract source). */
export function getRcmTemplateFilename(flavor: RCMFlavor): string {
  return RCM_TEMPLATES[flavor].filename;
}

/**
 * Byte contract the downloader ships: semicolon-delimited header line plus
 * the sample row, CRLF-joined. Whatever this builds must parse cleanly
 * through importRcmFileText for the same flavor.
 */
export function buildRcmTemplateCsv(flavor: RCMFlavor): string {
  const config = RCM_TEMPLATES[flavor];
  return [config.headers.join(';'), config.sampleRow.join(';')].join('\r\n');
}

/**
 * Roll staged rows up to the adapter-facing counts. Used by
 * importRcmFileText and by the validation/reconciliation step views so the
 * derivation lives in exactly one place.
 */
export function summarizeRcmRows(rows: RCMImportParsedRow[]): RCMStagedSummary {
  const matchStats: RCMMatchStats = { matched: 0, suggested: 0, unmatched: 0 };
  let invalidRowCount = 0;
  for (const row of rows) {
    if (row.matchStatus === 'matched') matchStats.matched += 1;
    else if (row.matchStatus === 'suggested') matchStats.suggested += 1;
    else matchStats.unmatched += 1;
    if (row.isValid === false) invalidRowCount += 1;
  }
  return { matchStats, invalidRowCount, canProceed: rows.length > 0 };
}

/**
 * rcm-ingestion — single Auto-Reconciliation seam (SK-5 Lampiran 5).
 *
 * One interface owns the template contract, spreadsheet parse, flavor
 * validation, and BPM node reconciliation. Both entry points (BPM toolbar
 * contextual import and TLC page bulk import) cross this seam; the wizard
 * hook, the template downloader, and the step views are adapters over its
 * output. The parser and matcher modules are private implementation details
 * of this seam — product code must not import them directly.
 */
export function importRcmFileText(
  fileText: string,
  flavor: RCMFlavor,
  bpmNodes: BPMNodeOption[],
): RCMIngestionResult {
  const { rows, errors } = parseRCMSpreadsheet(fileText, flavor);
  if (rows.length === 0) {
    return {
      rows,
      errors,
      matchStats: { matched: 0, suggested: 0, unmatched: 0 },
      invalidRowCount: 0,
      canProceed: false,
    };
  }
  const reconciled = reconcileRcmWithBpmNodes(rows, bpmNodes);
  const summary = summarizeRcmRows(reconciled);
  return { rows: reconciled, errors, ...summary };
}

/**
 * Parses binary spreadsheet file (.xlsx / .xls) into CSV text format
 * compatible with importRcmFileText. Takes the first visible sheet and
 * outputs semicolon-delimited text to safely handle commas within cells.
 */
export async function convertRcmSpreadsheetToCsvText(buffer: ArrayBuffer): Promise<string> {
  const XLSX = await import('xlsx');
  const workbook = XLSX.read(buffer, { type: 'array' });
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) return '';
  const worksheet = workbook.Sheets[sheetName];
  if (!worksheet) return '';
  return XLSX.utils.sheet_to_csv(worksheet, { FS: ';' });
}

/** Step-3 gate: only TLC rows reconcile against BPM nodes. */
export function requiresBpmReconciliation(flavor: RCMFlavor): boolean {
  return flavor === 'TLC';
}

/**
 * Manual link transition. The matcher owns the initial status; user
 * re-allocation in the reconciliation step forwards through this helper
 * so the status derivation lives in one place.
 */
export function linkRowToNode(
  rows: RCMImportParsedRow[],
  rowId: string,
  targetNodeId?: string,
): RCMImportParsedRow[] {
  return rows.map((r) =>
    r.id === rowId
      ? {
          ...r,
          targetBpmNodeId: targetNodeId,
          matchStatus: targetNodeId ? ('matched' as const) : ('unmatched' as const),
        }
      : r,
  );
}

/** Commit body shape for POST /api/rcm/import. */
export function buildRcmImportPayload(input: {
  flavor: RCMFlavor;
  workingYear: string;
  bpmProcessId?: string;
  diagramId?: string;
  rows: RCMImportParsedRow[];
}): RCMImportPayload {
  return {
    rcmType: input.flavor,
    year: input.workingYear,
    bpmProcessId: input.bpmProcessId,
    diagramId: input.diagramId,
    rows: input.rows,
  };
}
