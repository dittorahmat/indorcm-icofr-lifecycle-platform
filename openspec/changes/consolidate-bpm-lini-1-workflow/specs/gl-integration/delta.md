# Spec: GL Data Integration (Delta)

## Context
Perubahan ini menambahkan dukungan untuk manajemen kepemilikan departemen (Lini 1) pada setiap baris data GL yang diimpor.

## Requirement Changes
1.  **Metadata Penugasan (Assignment Metadata)**:
    - Setiap `GLRow` atau `SignificantAccount` harus mampu menyimpan atribut `assignedDepartmentId`.
    - Atribut ini harus persisten dan tetap tersimpan ketika GL Snapshot diperbarui (sticky assignment).
2.  **Filter Visibilitas Lini 1**:
    - Saat pengguna Lini 1 login, sistem harus memfilter tampilan `GLDataGrid` di halaman Scoping untuk hanya menampilkan akun yang telah ditugaskan ke departemen mereka, atau menampilkan semua namun mematikan aksi link BPM pada akun yang bukan miliknya.

## UI/UX Standards
- Penambahan kolom "Departemen Pemilik" di dalam grid GL.
- Indikator visual (ikon gembok) pada akun yang akses BPM-nya terkunci bagi departemen lain.

## Logic Rules
- Role `Line 1` level `Staff` hanya dapat masuk ke editor BPM jika departemennya cocok dengan penugasan akun.
- Role `Line 1` level `Manager` dapat mengakses editor BPM (untuk approval) jika departemennya cocok.
- Default penugasan untuk akun baru adalah `null` (Unassigned).
