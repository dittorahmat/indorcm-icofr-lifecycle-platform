## 1. Database & Skema

- [x] 1.1 Perbarui tabel `applications` di `worker/db/schema.ts` untuk menambahkan kolom `is_significant`.
- [x] 1.2 Buat tabel join `simulation_account_applications` di `worker/db/schema.ts` untuk menghubungkan akun simulasi dengan aplikasi.
- [ ] 1.4 Tambahkan kolom `application_id` pada tabel `rcm_controls` di `worker/db/schema.ts` sebagai Foreign Key ke tabel `applications`.
- [x] 1.3 Jalankan migrasi database (`npx drizzle-kit generate` & `migrate`).

## 2. Pengembangan API

- [x] 2.1 Perbarui rute `GET /api/applications` agar mengembalikan field `linkedControlCount` (jumlah pemakaian di RCM).
- [x] 2.2 Perbarui rute `POST /api/applications` untuk mendukung pembuatan aplikasi cepat ("Add on the fly") dengan flag `isSignificant`.
- [x] 2.3 Implementasi endpoint untuk menyimpan dan mengambil data relasi akun-aplikasi pada simulasi scoping.

## 3. Komponen UI & Lokalisasi

- [x] 3.1 Buat atau perbarui komponen `MultiSelect` yang mendukung pencarian dan opsi "Tambah Baru" di dalam dropdown.
- [x] 3.2 Tambahkan label lokalisasi baru di `src/i18n/locales/` (en & id) untuk kolom "Aplikasi Signifikan" dan pesan peringatan.

## 4. Integrasi Halaman Scoping

- [x] 4.1 Modifikasi `GLDataGrid.tsx` untuk menampilkan kolom baru "Aplikasi Signifikan" hanya pada akun yang *In Scope*.
- [x] 4.2 Implementasi logika styling warna merah pada nama aplikasi jika `linkedControlCount` adalah nol.
- [x] 4.3 Pastikan state pilihan aplikasi terintegrasi dengan hook `useUnsavedChanges` di `ScopingPage.tsx`.

## 5. Integrasi Matriks RCM

- [x] 5.1 Ganti input teks `supportingApp` menjadi dropdown Library pada `RCMTLCPage.tsx`.
- [x] 5.2 Ganti input teks `supportingApp` menjadi dropdown Library pada `RCMITGCPage.tsx`.
