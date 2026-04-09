# Proposal: Overhaul GL Upload & Scoping Logic

## Business Case
Implementasi template upload Laporan Keuangan terbaru dari Pak Dodi yang menyertakan kolom `Kategori` dan `Sub_Kategori`. Kolom-kolom ini memungkinkan perhitungan basis materialitas (Revenue, PBT, dsb) yang lebih akurat dan mempermudah pengelompokan akun sesuai standar pelaporan.

## Goals
-   **Accurate Benchmarking:** Menggunakan kolom `Sub_Kategori` untuk menghitung nilai basis materialitas secara otomatis.
-   **Flexible Parsing:** Mendukung file CSV dan XLSX dengan fitur deteksi kolom otomatis dan pembersihan data (header trimming).
-   **Improved Grouping:** Pengelompokan data pada worksheet berdasarkan `FSLI` (Nama) dan `GL_Desc`.
-   **Standardized Calculation:** Menggunakan `GL_Balance` sebagai sumber data tunggal untuk semua kalkulasi signifikansi.

## Proposed Changes

### 1. Data Model (`shared/types.ts`)
Update `interface GLRow` untuk mendukung kolom baru:
- `kategori: string`
- `subKategori: string`
- `fsliName: string` (dari kolom FSLI)
- `fsliBalance: number` (untuk verifikasi)
- `noUrut: number`

### 2. Logic & Utilities (`src/lib/compliance-utils.ts`)
- **Column Mapping:** Update `GL_COLUMN_MAPPING` untuk menyertakan `kategori` dan `subKategori`.
- **Benchmark Calculation:** Refactor `calculateBenchmarkValue` untuk menggunakan `subKategori` sebagai prioritas utama:
    - Revenue: `Sub_Kategori === "Pendapatan"`
    - PBT: `Sub_Kategori === "Laba/Rugi Sebelum Pajak"`
    - Assets: `Sub_Kategori === "Aset"`
    - (Tambahkan mapping untuk Equity dan Net Current Assets sesuai data template).

### 3. UI Updates
- **ScopingPage.tsx:** 
    - Update `onDrop` untuk menangkap kolom baru.
    - Pastikan header di-trim (menghilangkan spasi pada ` GL_Balance `).
- **GLDataGrid.tsx:**
    - Ganti grouping dari `fsliCode` menjadi `fsliName`.
    - Tampilkan kolom `No_Urut` jika diperlukan untuk kemiripan dengan Excel.

## Compliance Alignment
- **SK-5/2024:** Memastikan pemetaan akun ke proses bisnis signifikan (Step 4) didasarkan pada data yang tervalidasi oleh struktur Kategori/Sub_Kategori.

## Risks & Mitigations
- **Risk:** Nama `Sub_Kategori` di file user sedikit berbeda (typo).
- **Mitigation:** Gunakan fuzzy matching atau penanganan case-insensitive pada logic mapping.
