## Why

Berdasarkan Peraturan Menteri BUMN No. SK-5/DKU.MBU/11/2024, evaluasi defisiensi pengendalian (*Degree of Deficiency* / DoD) didokumentasikan secara formal dalam **Lampiran 10 (Ilustrasi Dokumentasi Kertas Kerja Penentuan DoD)** yang memuat matriks komprehensif 24 kolom evaluasi, 7 asersi laporan keuangan, dan alur bertingkat Kotak 1 s.d. Kotak 7 (AS 2201).

Saat ini, tampilan matriks 24 kolom Lampiran 10 hanya dapat diakses melalui tab sekunder di dalam halaman Asesmen Manajemen (`/reports` -> Tab Appendices -> Sub-tab DoD), sehingga menyulitkan Lini 2 (Fungsi ICOFR) dan Lini 3 (SPI/Auditor) untuk langsung mengakses kertas kerja regulasi ini dalam 1 klik. 

Pengguna menghendaki penempatan item navigasi langsung pada Sidebar di antara menu **Rekap WBS** (`/wbs-recap`) dan **Lampiran 11 / Asesmen Manajemen** (`/reports`), dengan nama terstandardisasi dan terlokalisasi ("Lampiran 10" / "Appendix 10") sesuai i18n, serta memastikan tampilan kertas kerja 24 kolom tersebut dapat diakses secara langsung dan selaras 100% dengan regulasi SK-5/2024.

## What Changes

- **Sidebar Navigation Item**: Menambahkan item navigasi baru di grup "Pelaporan & RCM" (`reportingRcm`) di antara Rekap WBS dan Lampiran 11 (Asesmen Manajemen) pada `src/components/app-sidebar.tsx`.
- **Rute Langsung & Deep-linking**: Menyediakan rute langsung `/reports/appendix-10` (atau deep link `/reports?tab=appendices&appendix=dod` / halaman tersendiri `Appendix10Page`) sehingga pengguna langsung diarahkan ke kertas kerja DoD 24 kolom tanpa harus menavigasi tab secara manual.
- **Lokalisasi Lengkap (i18n)**:
  - Bahasa Indonesia (`id/sidebar.json`): `"app10": "Lampiran 10 (Kertas Kerja DoD)"`
  - Bahasa Inggris (`en/sidebar.json`): `"app10": "Appendix 10 (DoD Worksheet)"`
- **Verifikasi Kepatuhan Regulasi SK-5**: Memastikan semua data 24 kolom, status remediasi, periode inefektif, nilai eksposur defisiensi, asersi C-A-E/O-CO-R&O-V/A-PD, dan Kotak 1 s.d. 7 tetap ter-render secara utuh dan responsif.

## Capabilities

### New Capabilities
- `appendix-10-navigation`: Direct sidebar navigation and routing to the Lampiran 10 Degree of Deficiency (DoD) worksheet view.

## Impact

- **Frontend Navigation**: `src/components/app-sidebar.tsx`
- **Routing**: `src/main.tsx` atau `src/pages/reports/ReportsPage.tsx`
- **Localization**: `src/i18n/locales/id/sidebar.json` dan `src/i18n/locales/en/sidebar.json`
- **Tests**: Menambahkan test navigasi dan verifikasi rute Lampiran 10.
