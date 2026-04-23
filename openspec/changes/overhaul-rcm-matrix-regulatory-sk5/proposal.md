## Why

Implementasi RCM TLC yang ada saat ini tidak akurat karena hanya menampilkan daftar kontrol yang bersifat "flat" tanpa konteks hierarki proses bisnis yang diwajibkan oleh regulasi (FSLI -> Sub Process -> Risk -> Control). Perubahan ini diperlukan untuk menyelaraskan platform dengan standar pelaporan Lampiran 5 b Regulasi **SK-5/DKU.MBU/11/2024** guna memastikan auditabilitas dan integritas data ICOFR.

## What Changes

- **BREAKING**: Perombakan total halaman RCM Manager dari tampilan daftar kontrol sederhana menjadi Matriks Relasi berbasis Proses Bisnis (Hierarchical Matrix).
- **Auto-Generation**: Baris matriks RCM akan dibuat otomatis berdasarkan hubungan (edge) antara node Risiko dan Kontrol di diagram BPM.
- **Inline Editing**: Penambahan fitur pengeditan langsung di tabel (Excel-like experience) untuk mengisi metadata relasi seperti IPO (C, A, V, RA) dan Asersi Laporan Keuangan.
- **ELC Overhaul**: Perubahan tampilan RCM ELC menjadi format matriks 17 Prinsip COSO sesuai Lampiran 5 a.
- **Persistence**: Penyimpanan data metadata relasi secara persisten ke database via Drizzle ORM.
- **Localization**: Implementasi dukungan multibahasa untuk seluruh kolom baru sesuai terminologi resmi SK-5.

## Capabilities

### New Capabilities
- `rcm-matrix-management`: Pengelolaan relasi Risk-Control dalam format matriks hierarkis dengan fitur inline editing metadata.
- `rcm-elc-matrix-view`: Visualisasi dan pengelolaan 17 Prinsip COSO dalam format matriks standar regulasi.

### Modified Capabilities
- `rcm-management`: Perubahan paradigma dari pengelolaan daftar kontrol flat menjadi pengelolaan relasi berbasis proses.
- `bpm-visualization`: Penambahan logika sinkronisasi otomatis antara diagram alir (visual) dengan baris data pada matriks RCM.

## Impact

- **Database**: Update schema `rcm_controls` pada `worker/db/schema.ts` untuk mendukung kolom metadata relasi baru.
- **Frontend**: Refaktor total `src/pages/rcm/RCMList.tsx` (atau migrasi ke `RCMTLCPage.tsx`) menggunakan pola *Excel-like interface*.
- **API**: Penambahan/pemutakhiran endpoint Hono untuk operasi CRUD pada table mapping relasi.
- **I18n**: Penambahan key lokalisasi di `src/i18n/` untuk kolom-kolom teknis SK-5 (IPO, Asersi, dll).
- **Performance**: Optimalisasi query join untuk meminimalkan beban rendering pada table berukuran besar.
