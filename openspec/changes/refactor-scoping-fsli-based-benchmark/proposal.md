# Proposal: FSLI-Based Benchmark & UI Refinement for Scoping

## Business Case
Pendekatan 5 kategori benchmark statis (Revenue, PBT, dsb) dirasa kurang fleksibel untuk kebutuhan audit yang beragam. User membutuhkan kemampuan untuk menunjuk akun FSLI spesifik manapun sebagai basis perhitungan materialitas (OM/PM). Selain itu, diperlukan perbaikan identitas visual dan penambahan fitur ekspor data untuk pelaporan eksternal.

## Goals
1.  **Dynamic FSLI Benchmark:** Memungkinkan user memilih FSLI apapun sebagai basis benchmark. FSLI yang terpilih akan muncul di dropdown saat membuat simulasi baru.
2.  **Identity Overhaul:** Mengubah judul dan label kolom sesuai terminologi "Significant Account Identification".
3.  **Excel Export:** Implementasi fitur ekspor data worksheet ke format Excel (.xlsx) dengan tetap mempertahankan struktur pengelompokan FSLI.
4.  **UI Cleanup:** Menyembunyikan kolom sorting (#), menyesuaikan lebar kolom, dan meningkatkan keterbacaan teks "IN SCOPE".

## Proposed Changes

### 1. Data Model (`shared/types.ts`)
-   **`GLSnapshot`**: Ganti `benchmarkMapping` menjadi `benchmarkFsliNames: string[]`.
-   **`MaterialitySimulation`**: Ubah tipe `basis` dari enum statis menjadi `string` (Nama FSLI).

### 2. UI: Set Benchmark Modal
-   Ubah tampilan menjadi satu kolom checkbox "Mark as Benchmark Basis".
-   Simpan daftar Nama FSLI yang dicentang ke dalam array.

### 3. UI: Scoping Worksheet (`GLDataGrid.tsx`)
-   **Labeling:** KUAN -> Kuantitatif, Code -> Entity Code.
-   **Sorting:** Hide kolom `#`, set default sorting by `#` ASC.
-   **Export Button:** Tambahkan tombol "Export as Excel" di toolbar atas tabel.
-   **Styling:** Perbesar `fontSize` dan `padding` pada badge "IN SCOPE" agar terbaca jelas.

### 4. Logic: Excel Export
-   Gunakan `xlsx` library untuk mengubah state data saat ini menjadi workbook Excel. Baris Header FSLI akan di-format tebal (*bold*) untuk membedakannya dengan akun detail.

## Compliance Alignment
-   **SK-5/2024:** Memperkuat fleksibilitas dalam penentuan akun signifikan yang mendasari seluruh siklus ICOFR.

## Risks & Mitigations
-   **Risk:** User salah memilih FSLI yang saldonya tidak merepresentasikan basis materialitas yang benar.
-   **Mitigation:** Angka Total Saldo FSLI terpilih tetap ditampilkan di modal sebagai panduan (sanity check).
