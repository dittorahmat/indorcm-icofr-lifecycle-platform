## Why

Saat ini fitur upload RCM (Risk Control Matrix) hanya mendukung format TLC (Transactional Level Control) yang tidak lengkap dan belum memenuhi mandat regulasi BUMN **SK-5/DKU.MBU/11/2024**. Perubahan ini diperlukan untuk memastikan integritas data kepatuhan serta mendukung efisiensi input data bagi tiga pilar RCM utama: TLC, ELC (Entity Level Control), dan ITGC (IT General Control).

## What Changes

- **Pemisahan Template Upload**: Mengganti template CSV tunggal yang ambigu menjadi tiga template spesifik (ELC, TLC, ITGC).
- **Kepatuhan Kolom Lampiran 5**: Menambahkan kolom-kolom wajib regulasi seperti asersi laporan keuangan (E/O, C, A, dll) dan Prinsip COSO (1-17).
- **Perombakan UI Wizard**: Memperbarui `SmartImportWizard` agar pengguna dapat memilih jenis RCM sebelum melakukan upload.
- **Pembaruan Parser Backend**: Mengimplementasikan logika parsing cerdas untuk menangani data Boolean (Y/T), Array (COSO Principles), dan validasi ketergantungan aplikasi pendukung.
- **Data Sampel Baru**: Menyediakan file referensi CSV baru di folder demo yang akurat secara regulasi.

## Capabilities

### New Capabilities
- `rcm-upload-elc`: Kemampuan mengimpor data Entity Level Control dengan pemetaan 17 Prinsip COSO.
- `rcm-upload-itgc`: Kemampuan mengimpor data IT General Control dengan fokus pada aplikasi pendukung.

### Modified Capabilities
- `rcm-upload-tlc`: Memperbarui kapabilitas upload TLC agar mencakup asersi laporan keuangan dan IPO (Information Processing Objective) secara lengkap sesuai Lampiran 5.b.

## Impact

- **Frontend**: Modifikasi `src/pages/scoping/ScopingPage.tsx` dan `src/components/scoping/SmartImportWizard.tsx`.
- **Backend/Parser**: Modifikasi atau penambahan servis parsing di `src/pages/scoping/services/rcm-parser.ts` (atau file baru).
- **Database**: Memastikan `worker/db/schema.ts` memiliki kolom yang cukup untuk menampung metadata Lampiran 5.
- **Demo Assets**: Penambahan `demo/sample_rcm_tlc.csv`, `demo/sample_rcm_elc.csv`, dan `demo/sample_rcm_itgc.csv`.
