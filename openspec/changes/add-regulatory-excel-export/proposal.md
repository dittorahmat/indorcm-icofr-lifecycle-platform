## Why

Tabel-tabel laporan regulasi SK-5/DKU.MBU/11/2024 di platform belum konsisten dalam kemampuan unduh: RCM (TLC/ELC/ITGC), CSA summary, dan Scoping sudah bisa Save-as-Excel, sementara Lampiran 6, 8, 9, 10, 11, WBS recap, dan kertas kerja TOD/TOE hanya tersedia sebagai CSV, print/PDF, atau tanpa export sama sekali. Auditor dan Lini 1–3 membutuhkan format `.xlsx` yang setia pada layout lampiran untuk kertas kerja dan arsip audit.

## What Changes

- Menambahkan kapabilitas export **Save-as-Excel (.xlsx)** yang seragam untuk semua tabel laporan regulasi yang belum memilikinya:
  - Lampiran 6 — Log Perubahan (regulatory `ChangeLogReport` + master `ChangeLogPage`).
  - Lampiran 7a — Dokumen CSA Detailed & Summary (`Appendix7aDetailed`, `Appendix7aSummary`, histori `CSAList`).
  - Lampiran 8 — Verifikasi Rancangan Pengendalian (`VerificationDesignPage`).
  - Lampiran 9 — Daftar Temuan (`FindingsReport`, `DeficiencyBoard`).
  - Lampiran 10 — Kertas Kerja DoD (`DoDLampiran10Report`): migrasi dari CSV-only ke `.xlsx`.
  - Lampiran 11 — Asesmen Manajemen (`ManagementAssessment`, `Lampiran11Report`).
  - Rekap WBS (`WBSPage`) dan kertas kerja TOD/TOE (`TestWorkbench`, sampling tables).
- Menyediakan satu util/hook bersama (Opsi A) sebagai satu-satunya jalur export Excel regulasi, menggantikan pola inline `XLSX` yang tersebar.
- Setiap export mengikuti keputusan desain yang sudah disepakati pengguna:
  - Layout Excel **setia pada format lampiran** (judul, kop perusahaan/periode, pengelompokan kolom seperti i–vi / vii–x / xi–xvii / xviii–xxiv pada Lampiran 10); area kop/logo dikosongkan terstruktur agar pengguna bisa insert manual atau tempel sebagai gambar.
  - **Filter aktif di UI terbawa** ke file (severity, remediation, search query pada Lampiran 10; filter ekuivalen di tabel lain).
  - **1 tabel = 1 sheet = 1 file** (tidak ada multi-sheet generik).
  - **Header kolom mengikuti locale aktif** (`id`/`en`) pada saat download.
- Tidak ada perubahan skema database, API, atau alur approval.

## Capabilities

### New Capabilities

- `regulatory-excel-export`: export Save-as-Excel (.xlsx) yang setia-layout-lampiran untuk tabel laporan regulasi, dengan aturan filter-terbawa, satu-sheet-per-file, dan header ber-locale.

### Modified Capabilities

- (kosong — tidak ada persyaratan perilaku capability yang sudah ada di `openspec/specs/` yang berubah; ini kapabilitas baru murni di sisi presentasi/export.)

## Impact

- Kode terdampak: `src/components/reports/DoDLampiran10Report.tsx` (ganti CSV writer), `src/components/reports/RegulatoryReportComponents.tsx` (`ChangeLogReport`), `src/pages/rcm/ChangeLogPage.tsx`, `src/components/reports/Appendix7aDetailed.tsx`, `src/components/reports/Appendix7aSummary.tsx`, `src/components/bpm/CSAList.tsx`, `src/pages/rcm/VerificationDesignPage.tsx`, `src/pages/testing/TestWorkbench.tsx` + tabel sampling TOD/TOE, `src/components/reports/RegulatoryAppendices.tsx` (placeholder ELC/TLC/ITGC/Findings/Lampiran 11), `src/pages/reports/WBSPage.tsx`, `src/components/reports/ManagementAssessment.tsx`, `src/pages/deficiencies/DeficiencyBoard.tsx`, file locale `src/i18n/locales/**/reports.json` (label tombol/header export).
- Dependensi: `xlsx` (SheetJS) sudah ada di `package.json` + chunk `vendor-xlsx` di `vite.config.ts`; tidak ada dependensi baru. Pola `exportRCMToExcel` di `src/lib/rcm-excel-export.ts` menjadi referensi yang digeneralisasi.
- Sistem lain: tidak ada perubahan worker API, Drizzle schema, atau workflow sign-off/lock Lampiran 11.
