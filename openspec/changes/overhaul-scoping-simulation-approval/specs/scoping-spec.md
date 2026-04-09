# Spec: Scoping Overhaul - Simulation & Approval

## Functional Requirements

### 1. User Roles & Access Control
- **Lini 2 (Process Owner):** 
  - Upload data GL (CSV/XLSX).
  - Membuat simulasi baru (multiple scenarios).
  - Melakukan penilaian kualitatif (L/M/H) pada worksheet.
  - Submit simulasi ke Komisaris.
- **Komisaris (Approval Authority):**
  - Melihat daftar simulasi yang masuk.
  - Review detail worksheet (read-only).
  - Memberikan kesimpulan: Approve atau Reject.

### 2. Worksheet Logic
- **Data Parsing:** Mendukung format `;` (semicolon) dan pemisah ribuan titik (Indonesian Excel standard).
- **Column Schema:**
  - `No_GL`, `Nama_Akun`, `Saldo`, `Kode_FSLI`.
  - 8 Kolom Kualitatif (R1 - R8).
  - `Quantitative Status` (Signifikan jika Saldo >= PM).
  - `Final Scope Status` (Signifikan jika Kuantitatif ATAU ada kualitatif "High").
- **Virtualization:** Menggunakan `@tanstack/react-virtual` jika data > 1000 baris.

### 3. Simulation Parameters (Tabel 3 & Hal 51)
| Basis Benchmark | Default % OM |
|-----------------|--------------|
| Revenue         | 1%           |
| PBT             | 5%           |
| Total Assets    | 1%           |
| Equity          | 5%           |
| Net Current Assets | 5%        |

## Technical Requirements

### 1. Backend Integration (Worker)
- **`GLSnapshotEntity`**: Menyimpan data array GL mentah.
- **`SimulationEntity`**: Mendukung pencarian berdasarkan tahun dan status.
- **Audit Trail**: Mencatat siapa yang melakukan approval dan kapan.

### 2. Frontend State Management
- Menggunakan `Zustand` untuk mengelola *local assessment state* (perubahan L/M/H yang belum di-save).
- `TanStack Query` untuk fetch data snapshot dan simulasi.

### 3. Excel Integration
- Export hasil worksheet yang sudah diisi kualitatifnya kembali ke format Excel menggunakan library `xlsx`.
