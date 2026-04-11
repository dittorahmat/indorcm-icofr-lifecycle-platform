# Proposal: UI Re-theme & Significant Location Analysis

## Business Case
Pembaruan identitas visual aplikasi untuk memberikan kesan korporat yang lebih profesional (Tuft Blue) dan penambahan fitur kepatuhan regulasi (Scoping Lokasi) berdasarkan prinsip Pareto 80%. Fitur ini memungkinkan user menentukan lokasi mana saja yang wajib masuk dalam cakupan pengujian ICOFR secara matematis dan otomatis.

## Goals
1.  **Corporate Re-theming:** Mengubah skema warna primer dari Lime Green ke Tuft Blue pada Header dan Sidebar.
2.  **Navigation Enhancement:** Mempertegas menu sidebar dengan teks Bold dan kontras warna yang lebih baik.
3.  **Pareto Location Analysis:** Mengimplementasikan modal analisis lokasi yang menghitung kontribusi kumulatif tiap entitas terhadap Nilai Basis Simulasi.
4.  **Dynamic Threshold:** Memberikan fleksibilitas untuk mengubah ambang batas scoping lokasi (default 80%).

## Proposed Changes

### 1. Theme & Sidebar (`src/components/app-sidebar.tsx`, `AppLayout.tsx`)
-   Ubah background Sidebar & Header menjadi Tuft Blue (`#417dc1`).
-   Ubah warna teks menu Sidebar menjadi Putih dan tebal (`font-bold`).
-   Update icon colors agar senada dengan background gelap.

### 2. Data Model (`shared/types.ts`)
-   Update interface `MaterialitySimulation`:
    -   Tambah `locationThreshold: number` (default 80).
    -   Tambah `significantLocationIds: string[]` untuk menyimpan hasil pilihan lokasi.

### 3. UI: Simulation Worksheet (`SimulationListTable.tsx`)
-   Tambah kolom "Significant Location" sebelum/sesudah kolom Status.
-   Render tombol "Open" (hanya jika simulasi memiliki data GL).

### 4. UI: Significant Location Modal
-   Komponen baru untuk menampilkan tabel analisis Pareto.
-   **Logika Perhitungan:**
    -   Sum balances by `entityCode` where FSLI is the Basis (e.g. Pendapatan).
    -   Sort Descending by total balance.
    -   Calculate `% Contribution` and `Cumulative %`.
    -   Flag "Y" if `Cumulative %` <= Threshold.
-   Tombol "Save Selection" untuk menyimpan hasil ke simulasi.

## Compliance Alignment
-   **SK-5/2024 Bab III:** Penentuan cakupan unit/lokasi merupakan langkah awal identifikasi risiko yang wajib didokumentasikan.

## Risks & Mitigations
-   **Risk:** Warna Tuft Blue membuat beberapa elemen UI tidak terlihat (bad contrast).
-   **Mitigation:** Pastikan menggunakan sistem warna Tailwind (slate/white) untuk teks di atas background biru.
