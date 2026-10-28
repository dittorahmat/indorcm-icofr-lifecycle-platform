# Standardisasi Regulasi Ekspor Excel (Save as Excel) — SK-5/DKU.MBU/11/2024

Panduan teknis bagi implementasi ekspor lembar kerja (*spreadsheet*) format Excel (.xlsx) untuk seluruh lampiran regulasi ICOFR BUMN.

## Sumber Tunggal & Helper Builder
Seluruh modul UI dilarang keras mengimpor `xlsx` secara langsung. Gunakan hook `useExcelExport` dan fungsi pembangun tabular:
- Generator AoA & Table: `buildRegulatoryAoA` dan `exportRegulatoryTableToExcel` di `src/lib/rcm-excel-export.ts`.
- Matriks RCM (Lampiran 5a, 5b, 5c): `exportRCMToExcel` dan `getDefaultRcmSignoffs` di `src/lib/rcm-excel-export.ts`.

## Struktur Layout Baku Excel SK-5
Setiap file Excel laporan regulasi wajib memiliki struktur berurutan:
1. **Title Row**: Kode Lampiran resmi (e.g. `LAMPIRAN 5B - RISK AND CONTROL MATRIX (TLC)`).
2. **Subtitle Row**: Keterangan nama laporan regulasi.
3. **Identity Lines**: Nama BUMN/Perusahaan, Periode Fiskal, Tanggal Ekspor.
4. **Blank Row**: Pemisah header dan data.
5. **Group Header Row** *(opsional)*: Pengelompokan kolom (misal: *IPO*, *Asersi*, *6 Pilar TOD*).
6. **Column Headers**: Nama kolom baku sesuai lampiran SK-5.
7. **Data Rows**: Nilai terformat bersih, nilai kosong dirender sebagai strip (`-`), angka numerik tetap bertipe angka agar dapat dijumlahkan (SUM/Pivot).
8. **Sign-off Footer Blocks**: Dua baris kosong pemisah di bawah data, diikuti:
   - Baris 1: Jabatan/Peran (`Disusun Oleh (Lini 1)`, `Direviu Oleh (Lini 2)`, `Disetujui Oleh (Direksi/CFO)`).
   - Baris 2: Nama Pejabat / PIC.
   - Baris 3: Title / Deskripsi Jabatan Struktural.
   - Baris 4: Tanggal Pengesahan (`Tanggal: YYYY-MM-DD`).
   - Baris 5: Status Verifikasi (`Status: TERVERIFIKASI DIGITAL` atau `MENUNGGU VERIFIKASI`).

## Pemetaan Modul & Lampiran
- **Lampiran 5a (ELC)**: `src/pages/rcm/RCMELCPage.tsx`
- **Lampiran 5b (TLC)**: `src/pages/rcm/RCMTLCPage.tsx`
- **Lampiran 5c (ITGC)**: `src/pages/rcm/RCMITGCPage.tsx`
- **Lampiran 6 (Catatan Perubahan)**: `src/components/reports/regulatory/changelog-report.tsx`
- **Lampiran 7a (Kertas Kerja CSA)**: `src/lib/csa-excel-export.ts`
- **Lampiran 8 (TOD 6-Pilar)**: `src/pages/rcm/VerificationDesignPage.tsx` & `src/pages/testing/TestWorkbench.tsx`
- **Lampiran 9 (Daftar Temuan)**: `src/components/reports/regulatory/findings-report.tsx`
- **Lampiran 10 (Kertas Kerja DoD)**: `src/components/reports/dod/useDoDReport.ts`
- **Lampiran 11 (Asesmen Manajemen)**: `src/components/reports/regulatory/lampiran11-report.tsx`
- **Lampiran 1 (WBS Fraud Indicators)**: `src/pages/reports/WBSPage.tsx`
