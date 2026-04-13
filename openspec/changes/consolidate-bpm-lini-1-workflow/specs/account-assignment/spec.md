# Spec: Account Assignment

## Purpose
Memungkinkan administrator atau Lini 2 menugaskan kepemilikan akun GL ke departemen operasional Lini 1 yang bertanggung jawab atas proses bisnis akun tersebut.

## Requirements
1.  **Mekanisme Penugasan**:
    - Harus tersedia aksi "Assign Department" pada setiap baris di `GLDataGrid` (halaman Scoping).
    - Penugasan dilakukan per akun (noGL) atau per FSLI (mengalir ke semua akun di bawah FSLI tersebut).
2.  **Filter Akses (Visibility)**:
    - Pengguna Lini 1 hanya dapat melihat dan mengakses link BPM untuk akun yang telah ditugaskan ke departemen mereka.
    - Pengguna Lini 2, Lini 3, dan Admin tetap memiliki akses visibilitas penuh ke seluruh akun.
3.  **Audit Trail Penugasan**:
    - Setiap perubahan penugasan departemen (dari Dep A ke Dep B) harus dicatat dalam audit trail sistem.

## UI/UX Standards
- Kolom "Department Owner" baru pada `GLDataGrid`.
- Dropdown pencarian departemen yang responsif di dalam grid.
- Badge warna warni untuk setiap departemen agar mudah dibedakan secara visual.

## Logic Rules
- Jika sebuah FSLI ditugaskan ke sebuah departemen, semua akun di bawahnya akan mewarisi penugasan tersebut secara otomatis kecuali ditentukan lain pada tingkat akun (override).
- Akun yang belum ditugaskan (Unassigned) hanya dapat diakses oleh Admin dan Lini 2.
