## Why

Implementasi ini bertujuan untuk menyelaraskan platform dengan regulasi **SK-5/DKU.MBU/11/2024** yang mewajibkan pemisahan pengelolaan antara Pengendalian Tingkat Perusahaan (ELC) dan Pengendalian Tingkat Transaksi (TLC). Hal ini penting untuk memberikan fondasi kepatuhan organisasi yang kuat (17 Prinsip COSO) yang memayungi integritas operasional harian.

## What Changes

- Penambahan Tab khusus **ELC** di halaman RCM Manager untuk mengelola 17 Prinsip COSO.
- Pembatasan akses Tab ELC hanya untuk peran **Line 2 (ICOFR)** dan **Admin**.
- Dukungan hubungan **Many-to-Many** antara TLC (operasional) dan ELC (kebijakan).
- Visualisasi icon **"Shield/Umbrella"** pada diagram alir BPM untuk kontrol yang telah terhubung ke kebijakan ELC.
- Penambahan fitur **Upload PDF** untuk dokumen kebijakan di level ELC.
- Sinkronisasi dengan sistem translasi di `src/i18n/` dan pemutakhiran link di Sidebar.
- Aturan penghapusan ketat: ELC tidak dapat dihapus jika masih menaungi TLC aktif.

## Capabilities

### New Capabilities
- `elc-management`: Pengelolaan kebijakan berbasis 17 Prinsip COSO dan penyimpanan dokumen pendukung.
- `control-hierarchy-mapping`: Pemetaan hubungan hierarki antara kebijakan strategis (ELC) dan prosedur teknis (TLC).

### Modified Capabilities
- `rcm-management`: Perubahan UI untuk mendukung navigasi berbasis Tab dan otorisasi akses Line 2.
- `bpm-visualization`: Penambahan metadata dan dekorator visual pada node kontrol di React Flow.

## Impact

- `shared/types.ts`: Penambahan atribut `level`, `relatedControlIds`, dan `attachmentUrl` pada interface Control.
- `src/pages/rcm/`: Refaktor untuk mendukung Tab View.
- `src/pages/bpm/`: Pemutakhiran modal kontrol untuk memilih "Payung ELC" dan pemutakhiran visual diagram.
- `src/components/layout/Sidebar.tsx`: Penambahan navigasi/link baru jika diperlukan.
- `src/i18n/`: Penambahan key baru untuk istilah ELC/TLC.
