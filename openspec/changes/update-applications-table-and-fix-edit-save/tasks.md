# Tasks: Pembaruan Tabel Inventaris Aplikasi & Perbaikan Bug Simpan Data

- [x] 1. Database & Schema Updates
  - [x] 1.1 Tambahkan kolom `businessOwners`, `applicationOwners`, `architectureDocUrl`, dan `architectureDocName` pada `applications` table di `worker/db/schema.ts`.
  - [x] 1.2 Update tipe TypeScript `Application` di `shared/types.ts`.

- [x] 2. Backend Worker Routes (`worker/routes/infrastructure.ts`)
  - [x] 2.1 Implementasikan endpoint `PATCH /api/applications/:id` untuk menangani update data aplikasi.
  - [x] 2.2 Perbarui endpoint `POST /api/applications` untuk menangani simpan field-field baru.
  - [x] 2.3 Tambahkan endpoint upload file arsitektur aplikasi `POST /api/applications/upload-architecture` (atau utilitas penyimpan file).

- [x] 3. Dialog Modal Input & Edit (`src/components/rcm/AddApplicationDialog.tsx`)
  - [x] 3.2 Tambahkan field toggle/checkbox `ICOFR Scope (Is Significant)`.
  - [x] 3.3 Integrasikan `MultiSelect` searchable dropdown untuk field `Business Owner` (mengambil data dari `/api/departments`).
  - [x] 3.4 Integrasikan `MultiSelect` searchable dropdown untuk field `Application Owner` (mengambil data dari `/api/departments`).
  - [x] 3.5 Menambahkan input upload file `Application Architecture` (PDF).
  - [x] 3.6 Perbaiki submission mutation agar `PATCH` data berhasil dan meng-invalidate query `['applications']`.

- [x] 4. Halaman Tabel Inventaris Aplikasi (`src/pages/rcm/SOCMonitoringPage.tsx`)
  - [x] 4.1 Hapus badge flagging `SIGNIFICANT` pada kolom Nama Aplikasi.
  - [x] 4.2 Tambahkan kolom `ICOFR Scope (Y/N)` yang menampilkan badge Yes / No.
  - [x] 4.3 Tambahkan kolom `Business Owner` yang menampilkan daftar departemen pemilik bisnis.
  - [x] 4.4 Tambahkan kolom `Application Owner` yang menampilkan daftar departemen pemilik aplikasi.
  - [x] 4.5 Tambahkan kolom `Application Architecture` yang menampilkan tautan/ikon file PDF yang diunggah.

- [x] 5. Validasi & Pengujian
  - [x] 5.1 Verifikasi lokalisasi penuh (i18n).
  - [x] 5.2 Jalankan `npm run type-check` untuk memastikan integritas tipe data.
  - [x] 5.3 Jalankan `npm run lint`.
  - [x] 5.4 Jalankan `npm run build` dan `npm test`.

