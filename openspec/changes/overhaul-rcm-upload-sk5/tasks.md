## 1. Database & Schema Preparation

- [x] 1.1 Verifikasi `worker/db/schema.ts` untuk kolom-kolom asersi dan Prinsip COSO.
- [x] 1.2 Tambahkan migrasi Drizzle jika ada kolom yang kurang (e.g., IPO metadata, COSO array).

## 2. Parser Service Overhaul

- [x] 2.1 Buat file servis parser baru `src/pages/scoping/services/rcm-parser.ts`.
- [x] 2.2 Implementasi skema Zod untuk validasi CSV TLC (33 kolom).
- [x] 2.3 Implementasi skema Zod untuk validasi CSV ELC (18 kolom + COSO parsing).
- [x] 2.4 Implementasi skema Zod untuk validasi CSV ITGC (19 kolom).
- [x] 2.5 Hubungkan parser ke API endpoint `/api/rcm/import`. (Catatan: Menggunakan endpoint `/api/migration/finalize` yang sudah ada namun diperkuat logikanya).

## 3. Frontend UI Updates

- [x] 3.1 Modifikasi `SmartImportWizard.tsx` untuk menambahkan Radio Group pemilihan tipe RCM.
- [x] 3.2 Tambahkan tombol download untuk masing-masing template (TLC, ELC, ITGC).
- [x] 3.3 Perbarui feedback progres dan error handling per baris di UI.

## 4. Demo Assets & Verification

- [x] 4.1 Buat file `demo/sample_rcm_tlc.csv` sesuai Lampiran 5.b.
- [x] 4.2 Buat file `demo/sample_rcm_elc.csv` sesuai Lampiran 5.a.
- [x] 4.3 Buat file `demo/sample_rcm_itgc.csv` sesuai Lampiran 5.c.
- [x] 4.4 Jalankan integrasi test untuk memastikan data tersimpan dengan benar di database. (Unit test passed: 3/3).
