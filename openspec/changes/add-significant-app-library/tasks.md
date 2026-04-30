## 1. Database & Skema

- [x] 1.1 Perbarui tabel `applications` di `worker/db/schema.ts` untuk menambahkan kolom `is_significant`.
- [x] 1.2 Buat tabel join `simulation_account_applications` di `worker/db/schema.ts` untuk menghubungkan akun simulasi dengan aplikasi.
- [x] 1.3 Tambahkan kolom `itgc_areas` (jsonb) pada tabel `applications`.
- [x] 1.4 Tambahkan kolom `application_id` pada tabel `rcm_controls` di `worker/db/schema.ts` sebagai Foreign Key ke tabel `applications`.
- [x] 1.5 Jalankan migrasi database via `fix-db` endpoint atau migration scripts.

## 2. Pengembangan API

- [x] 2.1 Perbarui rute `GET /api/applications` agar mengembalikan field `linkedControlCount` (jumlah pemakaian di RCM).
- [x] 2.2 Implementasi rute `POST /api/applications` untuk pembuatan aplikasi (termasuk "Add on the fly").
- [x] 2.3 Implementasi rute `PATCH /api/applications/:id` untuk pembaruan data aplikasi dan area ITGC.
- [x] 2.4 Implementasi rute `DELETE /api/applications/:id` untuk penghapusan aplikasi.
- [x] 2.5 Implementasi endpoint untuk menyimpan dan mengambil data relasi akun-aplikasi pada simulasi scoping.

## 3. Komponen UI & Lokalisasi

- [x] 3.1 Buat atau perbarui komponen `MultiSelect` yang mendukung pencarian dan opsi "Tambah Baru" di dalam dropdown.
- [x] 3.2 Update `Badge` component untuk mendukung `forwardRef` (keperluan Tooltip).
- [x] 3.3 Tambahkan label lokalisasi baru di `src/i18n/locales/`.

## 4. Integrasi Halaman Scoping & Monitoring

- [x] 4.1 Modifikasi `GLDataGrid.tsx` untuk menampilkan kolom baru "Aplikasi Signifikan" dengan peringatan `linkedControlCount === 0`.
- [x] 4.2 Implementasi CRUD UI pada `SOCMonitoringPage.tsx` (Actions column: Edit, Delete).
- [x] 4.3 Implementasi dialog `AddApplicationDialog` dengan form pemetaan ITGC areas.
- [x] 4.4 Penambahan Tooltip pada inisial area ITGC di tabel aplikasi.

## 5. Integrasi Matriks RCM

- [x] 5.1 Ganti input teks `supportingApp` menjadi dropdown Library pada `RCMTLCPage.tsx`.
- [x] 5.2 Ganti input teks `supportingApp` menjadi dropdown Library pada `RCMITGCPage.tsx`.
