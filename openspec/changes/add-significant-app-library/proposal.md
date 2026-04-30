## Why

Saat ini, aplikasi yang digunakan dalam kontrol dicatat sebagai teks manual di Matriks RCM, yang menyebabkan inkonsistensi data (misal: penulisan "SAP" vs "SAP ERP"). Selain itu, belum ada keterhubungan langsung antara akun material di tahap Scoping dengan aplikasi yang memprosesnya, sebagaimana diamanatkan oleh Peraturan SK-5/2024 untuk menentukan ruang lingkup ITGC.

## What Changes

- **Menu Pusat Library Aplikasi**: Penambahan menu "Inventory Aplikasi" di Sidebar (grup MASTER) dan rute `/applications` untuk manajemen pusat aset IT.
- **Kolom Aplikasi Signifikan di Scoping**: Penambahan kolom di worksheet Scoping dengan komponen multi-select yang menyimpan referensi **ID Aplikasi**.
- **Fitur "Add on the fly"**: Modal pop-up untuk menambahkan aplikasi baru langsung dari halaman Scoping jika data belum ada di Library.
- **Integritas Data Berbasis ID**: Migrasi kolom `supportingApp` di Matriks TLC dan ITGC menjadi `applicationId` yang terhubung langsung ke Master Data Aplikasi.
- **Sinkronisasi Otomatis**: Aplikasi yang dipilih di halaman Scoping otomatis mendapatkan flag `isSignificant: true` untuk cakupan audit ITGC.
- **Manajemen Siklus Hidup Aplikasi (CRUD)**: Penambahan fitur untuk menambah, mengubah (Edit), dan menghapus (Delete) aplikasi langsung dari Inventory Aplikasi.
- **Manual ITGC Mapping Terintegrasi**: Pemetaan manual ke 4 area ITGC (Access, Development, Changes, Operations) dilakukan melalui dialog Create/Edit aplikasi, guna memenuhi persyaratan kepatuhan Tabel 1 SK-5/2024.
- **Validasi Visual (Audit Gap)**: Indikator **Font Merah** pada halaman Scoping untuk aplikasi yang belum memiliki keterkaitan kontrol di Matriks RCM (`linkedControlCount === 0`).

- **Lokalisasi Penuh**: Implementasi dukungan bahasa (ID/EN) untuk semua label aplikasi menggunakan `i18next`.

## Capabilities

### New Capabilities
- `significant-app-library`: Kemampuan untuk mengelola registri pusat aplikasi IT berbasis ID, menentukan status signifikansinya, melakukan mapping area ITGC secara manual, dan memantau keterkaitannya dengan kontrol secara visual.

### Modified Capabilities
- `scoping-management`: Penambahan persyaratan untuk menghubungkan Akun signifikan dengan ID Aplikasi dan validasi celah dokumentasi kontrol.
- `rcm-management`: Transformasi kolom aplikasi dari teks bebas menjadi seleksi relasional (Foreign Key) dari Library pusat.

## Impact

- **Database**: Penambahan kolom `is_significant` (boolean) dan `itgc_areas` (jsonb) di tabel `applications`, kolom `application_id` di tabel `rcm_controls`, dan pembuatan tabel join `simulation_account_applications`.
- **API**: Update rute `/api/applications` untuk mendukung CRUD penuh (GET, POST, PATCH, DELETE) dan pengolahan field `itgcAreas`.
- **Frontend**: 
  - Komponen `MultiSelect` baru dengan logika `isWarning`.
  - Integrasi Tooltip pada `Badge` area ITGC untuk kejelasan informasi.
  - Dialog `AddApplicationDialog` yang mendukung mode Create dan Edit dengan checkbox ITGC mapping.
  - Integrasi Sidebar di `src/components/app-sidebar.tsx` dan implementasi rute di `src/main.tsx`.
- **Safety**: Integrasi state pilihan aplikasi dengan `useUnsavedChanges` guard untuk mencegah kehilangan data.
