## Why

Penerapan Degree of Deficiency (DoD) Wizard saat ini di `DoDWizard.tsx` belum sepenuhnya selaras dengan alur logika dan terminologi yang diatur dalam **Peraturan SK-5/DKU.MBU/11/2024 Gambar 5: Degree of Deficiency**. Ketidaksesuaian ini berpotensi menyebabkan kesalahan klasifikasi tingkat defisiensi (Control Deficiency, Significant Deficiency, atau Material Weakness) yang dapat berdampak pada kredibilitas asesmen manajemen dan laporan kepatuhan BUMN.

## What Changes

- **Penyelarasan Logika Flowchart**: Memperbaiki transisi antar langkah (Box a s.d. Box g) agar sesuai dengan urutan "Yes/No" pada Gambar 5 regulasi.
- **Koreksi Teks Pertanyaan**: Memperbarui teks pertanyaan pada setiap langkah wizard agar menggunakan istilah resmi dari regulasi (Bahasa Indonesia).
- **Pemicu Otomatis Material Weakness**: Menyesuaikan logika Box **e** di mana jawaban "No" harus langsung mengarah pada kesimpulan **Material Weakness**.
- **Integrasi i18n Komprehensif**: Memastikan seluruh label, pertanyaan, dan hasil evaluasi tersedia dalam Bahasa Indonesia dan Inggris melalui `src/i18n`.
- **Database Consistency**: Menjalankan migrasi Drizzle untuk memastikan field metadata yang mendukung transparansi alur DoD tersimpan dengan benar.

## Capabilities

### New Capabilities
- `regulatory-dod-logic`: Kemampuan untuk melakukan klasifikasi tingkat defisiensi secara akurat mengikuti diagram alur Gambar 5 regulasi SK-5/2024.

### Modified Capabilities
- `deficiency-management`: Memperluas manajemen defisiensi untuk menyimpan langkah-langkah logika yang diambil selama proses wizard untuk keperluan audit Trail.

## Impact

- **Frontend**: `src/components/deficiencies/DoDWizard.tsx` (Perubahan logika state machine dan UI).
- **Localization**: `src/i18n/locales/id/deficiency.json` dan `src/i18n/locales/en/deficiency.json`.
- **Database**: `worker/db/schema.ts` (Update field metadata jika diperlukan) dan migrasi Drizzle.
- **Shared Types**: `shared/types.ts` (Update interface `Deficiency`).
