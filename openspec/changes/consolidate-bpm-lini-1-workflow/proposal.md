## Why

Implementasi ICOFR saat ini masih bersifat umum dan belum sepenuhnya selaras dengan struktur "Tiga Lini" yang diamanatkan oleh regulasi **SK-5/DKU.MBU/11/2024**. Saat ini, alur kerja BPM terpisah dari konteks departemen dan tidak memiliki mekanisme formal untuk pemisahan tugas antara pelaksana (Staff) dan pemberi persetujuan (Manager) di Lini 1. Perubahan ini diperlukan untuk meningkatkan akuntabilitas, keamanan data berbasis departemen, dan otomatisasi dokumentasi kepatuhan (Lampiran 4 & 6).

## What Changes

1.  **Struktur Pengguna Lini 1**: Perombakan model data User untuk menyertakan `Department` dan `Level` (Staff, Manager).
2.  **Penugasan Akun di Scoping**: Penambahan fitur di `GLDataGrid` untuk menugaskan akun GL ke departemen tertentu.
3.  **Akses Kontrol Berbasis Departemen**: Membatasi akses edit BPM hanya untuk anggota departemen yang ditugaskan ke akun tersebut.
4.  **Integrated BPM Popup**: Menggantikan halaman `/rcm` yang akan segera obsolete dengan Modal Popup di halaman `/bpm`.
5.  **Alur Kerja Persetujuan (Workflow)**: Mekanisme formal di mana Staff melakukan perubahan (Draft) dan Manager memberikan persetujuan (Approved) dalam departemen yang sama.
6.  **Log Perubahan Otomatis (Lampiran 6)**: Pencatatan setiap perubahan yang disetujui ke dalam log historis yang dapat diaudit.
7.  **Ekspor PDF (Lampiran 4)**: Fitur cetak dokumen proses bisnis yang sesuai dengan format standar regulasi.

## Capabilities

### New Capabilities
- `lini-1-org-structure`: Pengelolaan struktur departemen dan tingkatan jabatan (Staff/Manager) untuk pengguna Lini 1.
- `account-assignment`: Mekanisme penugasan kepemilikan akun GL ke departemen operasional terkait.
- `integrated-bpm-modal`: Interface pengeditan BPM yang terintegrasi langsung dengan konteks akun dan alur persetujuan.
- `bpm-regulatory-reporting`: Dokumentasi kepatuhan otomatis mencakup Cetak Lampiran 4 dan Log Perubahan Lampiran 6.

### Modified Capabilities
- `gl-integration`: Penambahan metadata kepemilikan departemen pada baris data GL untuk mendukung akses kontrol.

## Impact

- **Frontend**: Modifikasi `ScopingPage.tsx`, `GLDataGrid.tsx`, `BPMPage.tsx`, dan penambahan komponen `BPMModal`.
- **Backend/Worker**: Pembaruan entitas `User`, `Control`, dan penambahan logika validasi untuk alur persetujuan.
- **Data Model**: Perubahan pada skema `User` dan `Control` (BPM Worksheet).
- **Navigation**: Halaman `/rcm` akan ditandai sebagai *deprecated* dan fungsinya dipindahkan ke modal `/bpm`.
