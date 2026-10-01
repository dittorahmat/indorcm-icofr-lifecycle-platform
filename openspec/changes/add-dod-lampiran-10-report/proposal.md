## Why

Berdasarkan Peraturan Menteri BUMN No. SK-5/DKU.MBU/11/2024 (Lampiran 10 Hal. 97–99), BUMN diwajibkan mendokumentasikan Kertas Kerja Penentuan Tingkat Defisiensi Pengendalian (*Degree of Deficiency* / DoD) dalam format matriks pelaporan formal 24 kolom (kolom i s.d xxiv).

Meskipun kertas kerja evaluasi DoD individual telah diimplementasikan pada modal dialog di halaman Deficiencies, laporan rekapitulasi tabular resmi Lampiran 10 pada portal Laporan Regulasi (`/reports`) di `RegulatoryAppendices.tsx` masih berstatus *placeholder stub*. Hal ini menghambat Lini 3 (Auditor) dan Komite Audit dalam mengaudit dan mengekspor kompilasi hasil evaluasi defisiensi (baik mandiri maupun agregasi) dalam format standar kepatuhan BUMN.

## What Changes

- **Komponen Laporan Resmi Lampiran 10 (`DoDLampiran10Report`)**: Menggantikan komponen placeholder `DoDReport` di `RegulatoryReportComponents.tsx` dengan tabel tabular berstandar enterprise yang memetakan seluruh 24 kolom regulasi (kolom `i` s/d `xxiv`).
- **Integrasi Data Defisiensi & Evaluasi DoD**: Menghubungkan data hasil pengisian `DoDWorksheetData` dari store/API defisiensi secara dinamis ke dalam baris-baris tabel laporan.
- **Filter & Agregasi Interaktif**: Menyediakan filter tingkat defisiensi (Semua, Defisiensi Kontrol / CD, Defisiensi Signifikan / SD, Kelemahan Material / MW), filter status remediasi, serta rekapitulasi ringkasan jumlah temuan.
- **Format Cetak & Ekspor Sesuai SK-5**: Menyediakan styling cetak institusional (`@media print`), blok tanda tangan digital Lini 3 dan Komite Audit, serta tombol ekspor ke format CSV / Excel.
- **Lokalisasi Lengkap (i18n)**: Menambahkan kamus dwibahasa (ID dan EN) untuk seluruh header kolom i s.d xxiv dan label pendukung di namespace laporan regulasi.

## Capabilities

### New Capabilities
- `dod-lampiran-10-report`: Laporan tabular komprehensif 24 kolom untuk dokumentasi kertas kerja penentuan Degree of Deficiency (DoD) sesuai Lampiran 10 SK-5/DKU.MBU/11/2024, terintegrasi dengan data evaluasi defisiensi dan ramah cetak/ekspor.

## Impact

- **Frontend Components**:
  - `src/components/reports/RegulatoryReportComponents.tsx`: Mengganti `DoDReport` stub dengan `DoDLampiran10Report`.
  - `src/components/reports/DoDLampiran10Table.tsx`: Komponen tabel baru untuk 24 kolom Lampiran 10.
  - `src/components/reports/RegulatoryAppendices.tsx`: Mengoper data defisiensi dan kontrol ke tab Lampiran 10.
- **Localization**:
  - `src/i18n/locales/id/reports.json` & `en/reports.json`: Penambahan string teks untuk 24 kolom Lampiran 10.
- **Dependencies**: Tidak ada dependensi baru; memanfaatkan pustaka yang sudah ada (lucide-react, Shadcn UI table/badge).
