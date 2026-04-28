# Tasks

- [x] **Database & Shared Types**
  - [x] Update `worker/db/schema.ts` dengan tabel `vendors`, `soc_reports`, dan `soc_evaluations`.
  - [x] Tambahkan tipe data baru di `shared/types.ts`.
  - [x] Jalankan `npx drizzle-kit push` untuk sinkronisasi DB.

- [x] **Backend API**
  - [x] Implementasi CRUD `/api/vendors`.
  - [x] Implementasi CRUD `/api/soc-reports` dengan subquery evaluasi.
  - [x] Tambahkan API untuk menyimpan `soc_evaluations`.

- [x] **Frontend Integration**
  - [x] Ganti mock query di `SOCMonitoringPage.tsx` dengan TanStack Query ke API baru.
  - [x] Implementasi modal "Add Vendor".
  - [x] Implementasi modal "Upload SOC Report".
  - [x] Hubungkan `SOCReviewDialog` ke API evaluasi 7-kriteria.
  - [x] Tukar urutan tab: Significant Applications muncul duluan.
  - [x] Integrasi `useUnsavedChanges` untuk proteksi data modal.

- [x] **Verification**
  - [x] Tes pendaftaran vendor baru.
  - [x] Verifikasi status "Expired" muncul jika tanggal lewat.
  - [x] Verifikasi data tersimpan permanen di Neon DB.
