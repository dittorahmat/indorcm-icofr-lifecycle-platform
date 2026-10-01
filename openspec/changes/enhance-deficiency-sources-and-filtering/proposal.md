## Why

Dalam pelaksanaan evaluasi ICOFR BUMN sesuai Peraturan SK-5/DKU.MBU/11/2024, temuan kelemahan pengendalian (*Deficiencies*) bersumber dari berbagai instrumen evaluasi lintas lini (Three Lines Model): evaluasi mandiri Lini 1 (CSA), pengujian desain Lini 2 (TOD), pengujian operasional Lini 2 (TOE/CSA Validation), serta audit independen Lini 3 / KAP eksternal.

Saat ini pada halaman `/deficiencies`, filter sumber temuan masih terbatas dan terlalu kasar (`all`, `lini1`, `lini23`), dan kartu temuan belum menampilkan penanda visual (*source flag & badge*) yang secara eksplisit membedakan asal temuan (misalnya membedakan temuan CSA Inefektif vs. kegagalan 6 Pilar Desain TOD vs. deviasi sampel TOE vs. audit eksternal). Hal ini menyulitkan pengguna (Lini 1, Lini 2, dan Komite Audit) untuk memilah, menelusuri, dan mengevaluasi rencana remediasi berdasarkan asal temuan.

## What Changes

- **Granular Source Filtering**: Memperbarui filter bar pada halaman `/deficiencies` untuk mendukung penyaringan spesifik berdasarkan asal temuan:
  - `Semua (All)`
  - `CSA Inefektif` (Lini 1 - CSA)
  - `TOD Review` (Lini 2 - TOD / Desain Kontrol)
  - `TOE Review` (Lini 2 - TOE / Validasi Sampel Operasional)
  - `Audit Eksternal / SPI` (Lini 3 - Audit)
- **Explicit Deficiency Source Flagging**: Memperbarui komponen `DeficiencyCard` dan tampilan lembar kerja untuk menampilkan badge/flag asal temuan yang kontras dan informatif dengan ikon dan skema warna institusional.
- **Data Normalization & Alignment**: Memastikan pemetaan field `source` pada `Deficiency` konsisten antara backend (`worker/services/deficiency-service.ts`, `worker/routes/csa.ts`, `worker/routes/rcm.ts`) dan frontend.
- **Localization (i18n)**: Menambahkan entri terjemahan untuk label-label sumber defisiensi dalam bahasa Indonesia dan Inggris tanpa teks hardcoded.

## Capabilities

### Modified Capabilities
- `remediation-tracking`: Penambahan persyaratan granular source filtering dan visual deficiency origin tagging pada papan defisiensi dan kartu remediasi.

## Impact

- Frontend: `src/pages/deficiencies/DeficiencyBoard.tsx`, `src/components/deficiencies/DeficiencyCard.tsx`, file i18n di `src/i18n/locales/*/deficiency.json`.
- Types: `shared/types.ts` (`DeficiencySource` types bila diperlukan sinkronisasi).
- Backend: Verifikasi konsistensi pencatatan `source` pada pembuatan temuan otomatis di `worker/services/deficiency-service.ts`.
