# Spec: Lini 1 Org Structure

## Purpose
Mengimplementasikan struktur organisasi formal di dalam Lini 1 untuk memfasilitasi pemisahan tugas (Segregation of Duties) sesuai regulasi SK-5/2024.

## Requirements
1.  **Entitas Departemen**:
    - Sistem harus mampu menyimpan daftar departemen (e.g., Keuangan, Operasional, IT).
    - Setiap departemen memiliki ID unik.
2.  **Atribut Pengguna**:
    - Setiap pengguna Lini 1 harus memiliki atribut `departmentId`.
    - Setiap pengguna Lini 1 harus memiliki atribut `level` dengan opsi: `Staff` atau `Manager`.
3.  **Role-Based Access (Lini 1 Internal)**:
    - **Staff**: Memiliki akses untuk membuat draft, mengedit, dan menghapus (soft delete) entitas BPM/Control.
    - **Manager**: Memiliki akses untuk mereview, menyetujui (approve), atau menolak (reject) perubahan yang diajukan oleh Staff dalam departemen yang sama.
4.  **Cooling-off Validation**:
    - Sistem harus mencatat riwayat departemen pengguna untuk memvalidasi periode pendinginan (cooling-off) jika pengguna berpindah ke Lini 3 (Audit).

## UI/UX Standards
- Penambahan filter departemen pada dashboard utama.
- Badge indikator level (Staff/Manager) pada profil pengguna dan log aktivitas.
- Notifikasi (Toast/In-app) bagi Manager ketika ada draft baru yang perlu direview.

## Logic Rules
- Seorang Staff tidak dapat menyetujui drafnya sendiri.
- Seorang Manager dapat melakukan pengeditan langsung, namun setiap pengeditan oleh Manager akan otomatis masuk ke status `Approved`.
- Pengguna hanya dapat ditugaskan ke satu departemen aktif pada satu waktu.
