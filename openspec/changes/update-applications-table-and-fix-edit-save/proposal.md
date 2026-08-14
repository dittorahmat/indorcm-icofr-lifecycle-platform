# Proposal: Pembaruan Tabel Inventaris Aplikasi & Perbaikan Bug Simpan Data Aplikasi

## Summary
Pengguna meminta penyesuaian pada halaman `/applications` (`SOCMonitoringPage.tsx` dan `AddApplicationDialog.tsx`):
1. **Memperbaiki Bug Edit Aplikasi**: Tombol "Save Changes" di modal edit aplikasi saat ini tidak merespon/macet karena route backend `PATCH /api/applications/:id` belum diimplementasikan di `worker/routes/infrastructure.ts`.
2. **Pembaruan Kolom Tabel Aplikasi Signifikan**:
   - Menghapus badge flagging `SIGNIFICANT` di sebelah nama aplikasi.
   - Menambahkan kolom `ICOFR Scope (Y/N)` yang menampilkan "Yes" jika aplikasi masuk dalam cakupan signifikan (isSignificant = true) dan "No" jika tidak.
   - Menambahkan kolom `Business Owner`: Searchable multi-select dropdown dari daftar departemen terdaftar di aplikasi (`/api/departments`).
   - Menambahkan kolom `Application Owner`: Searchable multi-select dropdown dari daftar departemen terdaftar di aplikasi (`/api/departments`).
   - Menambahkan kolom `Application Architecture`: Upload file PDF/dokumen arsitektur beserta indikator & link unduh/pratinjau.

## User Value
- **Akurasi & Integritas Data**: Pengguna dapat menyimpan dan memperbarui data aplikasi tanpa mengalami error/stuck.
- **Kepatuhan Regulasi SK-5**: Tata kelola IT Asset/ICOFR Scope menjadi lebih jelas dengan pemetaan Business Owner, Application Owner, dan Dokumen Arsitektur Aplikasi sesuai standar ICOFR.
- **Kemudahan Navigasi**: Pengguna dapat mencari dan memilih departemen pemilik dengan mudah melalui searchable dropdown `MultiSelect`.

## Scope of Work
- **Database & Types (`schema.ts` & `types.ts`)**: Update tabel `applications` untuk mendukung field `businessOwners`, `applicationOwners`, `architectureDocUrl`, dan `architectureDocName`.
- **Backend API (`worker/routes/infrastructure.ts`)**: Implementasi `PATCH /api/applications/:id`, pembaruan `POST /api/applications`, dan endpoint upload file dokumen arsitektur.
- **Frontend Dialog (`AddApplicationDialog.tsx`)**: Integrasi toggle ICOFR Scope, `MultiSelect` departemen searchable untuk Business Owner & App Owner, dan File Uploader untuk Dokumen Arsitektur.
- **Frontend Page (`SOCMonitoringPage.tsx`)**: Refactor tabel aplikasi untuk menghapus badge nama, menambah kolom `ICOFR Scope (Y/N)`, `Business Owner`, `Application Owner`, dan `Application Architecture`.
