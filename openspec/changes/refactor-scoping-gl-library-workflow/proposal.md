# Proposal: Unified Scoping Control Center (GL & Simulation Management)

## Business Case
Pemisahan antara data sumber (GL) dan simulasi sangat krusial untuk fleksibilitas audit. Perubahan ini akan memindahkan alur kerja menjadi berbasis "Data Source First", di mana user mengelola gudang data GL terlebih dahulu sebelum membuat berbagai skenario simulasi. Penggunaan tampilan berbasis Tabel (List View) akan memberikan kesan enterprise yang lebih ringkas dan profesional dibandingkan tampilan kartu (Gallery).

## Goals
1.  **Unified List View:** Mengganti seluruh tampilan Gallery/Card (baik untuk GL Snapshot maupun Simulation) menjadi format Tabel yang ringkas.
2.  **GL Control Center:** User dapat mengunggah, menghapus, dan melihat detail snapshot GL dalam satu tabel master data. 
3.  **Active Snapshot Logic:** User dapat menentukan satu GL sebagai "Active Source". Snapshot yang aktif inilah yang akan otomatis digunakan saat membuat simulasi baru. Jika hanya ada 1 snapshot, maka otomatis menjadi aktif.
4.  **Flexible Simulation-to-Snapshot Relation:** Satu snapshot GL dapat digunakan sebagai basis untuk banyak simulasi yang berbeda (misal: simulasi konservatif vs moderat).
5.  **Clean Worksheet UI:** Menghapus kolom OM/PM, ikon petir, dan menyederhanakan label kuantitatif. Penilaian kualitatif dipusatkan di level FSLI (Header) untuk efisiensi.

## Proposed Changes

### 1. Data Model & Backend
-   **`GLSnapshot`:** Menambah field `isActive: boolean` dan `benchmarkMapping`.
-   **`MaterialitySimulation`:** Mencatat `glSnapshotId` untuk memastikan audit trail yang konsisten meskipun snapshot aktif di Gallery berubah.

### 2. UI/UX: Scoping Control Center
Halaman dibagi menjadi dua tab tabel:
-   **Tab "Master Data GL":** Tabel berisi kolom Nama File, Status (Mapped/Draft), Tanggal, dan Aksi (Set Active, Set Benchmark, Delete). GL yang aktif diberi penanda visual (misal baris berwarna hijau lembut).
-   **Tab "Simulation Scenarios":** Tabel berisi daftar simulasi dengan kolom Nama, Status, Basis, PM Value, dan Source GL.

### 3. UI/UX: Worksheet (GLDataGrid)
-   8 Kolom Kualitatif ganti nama sesuai terminologi baru (Kecurangan, Volume, dll).
-   Input kualitatif (L/M/H) hanya muncul di baris Header FSLI. Baris detail akun di bawahnya bersifat read-only dan otomatis mengikuti status "IN SCOPE" jika parent FSLI-nya "High".
-   Teks kolom Kuan: "Signifikan" (Merah) / "Tidak Signifikan" (Outline).

## Compliance Alignment
-   Memperkuat **Audit Trail** dengan memisahkan integritas data GL dari parameter simulasi.
-   Mematuhi pola kerja auditor yang melakukan penilaian risiko di tingkat akun signifikan (FSLI level).

## Risks & Mitigations
-   **Risk:** User bingung kenapa angka simulasi tidak berubah saat upload GL baru.
-   **Mitigation:** Memberikan indikator yang jelas di tab simulasi mengenai "Source GL" yang digunakan oleh skenario tersebut.
