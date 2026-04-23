## Context

Sistem RCM saat ini hanya menampilkan daftar kontrol teknis (TLC) secara terpisah tanpa menghubungkannya dengan konteks proses bisnis dan risiko yang dimitigasi. Sesuai dengan **Regulation SK-5/DKU.MBU/11/2024 (Lampiran 5 b)**, pelaporan ICOFR harus disajikan dalam format matriks relasi yang utuh: 
`Proses Bisnis` -> `Sub Proses` -> `Risiko` -> `Kontrol` -> `Metadata (IPO, Asersi, dll)`.

## Goals / Non-Goals

**Goals:**
- **Hierarchical Data Joining**: Menggabungkan data dari `BPMProcess`, `BPMDiagram`, `RCM` (Risk), dan `Control` ke dalam satu tampilan matriks terpadu.
- **Persistent Relation Metadata**: Menyimpan isian manual seperti IPO (C, A, V, RA) dan Asersi secara persisten pada level relasi Risk-Control.
- **Excel-like User Experience**: Membangun interface tabel dengan *sticky columns* dan fitur *inline editing* untuk produktivitas tinggi.
- **Auto-Sync Logic**: Sinkronisasi otomatis baris matriks berdasarkan perubahan hubungan (edge) pada diagram alir BPM.

**Non-Goals:**
- Modifikasi alur persetujuan (approval workflow) Lini 1 ke Lini 2 (di luar cakupan perombakan matriks).
- Fitur ekspor ke file fisik (.xlsx atau .pdf) pada tahap ini.

## Decisions

### 1. Metadata Persistence in Junction Table (`rcm_controls`)
Data isian manual seperti IPO dan Asersi tidak akan disimpan di table `controls` (karena bersifat global) maupun `rcms` (karena bersifat risiko), melainkan di junction table `rcm_controls`.
- **Rationale**: Satu Kontrol yang sama dapat memitigasi dua Risiko berbeda dengan tujuan pemrosesan informasi (IPO) atau asersi laporan keuangan yang berbeda pula. Menyimpannya di junction table memungkinkan fleksibilitas penuh.

### 2. Inline Editing Interface
Menggunakan pola pengeditan langsung di sel tabel menggunakan komponen `Input` dan `Select` dari `shadcn/ui`.
- **Rationale**: User ICOFR terbiasa bekerja dengan spreadsheet berukuran besar. Penggunaan modal untuk setiap baris akan menghambat kecepatan kerja.

### 3. Application-Level Auto-Sync
Logika sinkronisasi baris matriks akan diletakkan pada handler API penyimpanan diagram BPM. Setiap kali diagram di-save, sistem akan membandingkan edges (Risk-to-Control) yang ada di diagram dengan baris di `rcm_controls`.
- **Rationale**: Memastikan kebenaran data (Single Source of Truth) berasal dari representasi visual proses bisnis.

### 4. Schema Update (Drizzle Kit)
Penambahan kolom spesifik regulasi pada table `rcm_controls`:
- IPO: `ipo_c`, `ipo_a`, `ipo_v`, `ipo_ra` (Boolean/Text).
- Asersi: `assertion_e`, `assertion_c`, `assertion_a`, `assertion_co`, `assertion_va`, `assertion_ro`, `assertion_pd`.
- Teknis: `control_type`, `control_nature`, `frequency`, `supporting_app`, `executing_function`, `executor_role`.

## Risks / Trade-offs

- **[Risk]** Performa rendering table yang sangat lebar (banyak kolom) dan panjang (banyak baris).
  - **Mitigasi**: Implementasi *memoization* pada komponen baris dan penggunaan *CSS Grid* atau *Sticky positioning* yang efisien.
- **[Risk]** Kompleksitas query join yang dalam (5-level join).
  - **Mitigasi**: Optimalisasi query di level Drizzle ORM dan penambahan indeks pada foreign keys terkait (`diagram_id`, `rcm_id`, `control_id`).
- **[Risk]** Kehilangan data inputan manual saat edge di BPM dihapus lalu dibuat ulang.
  - **Mitigasi**: Implementasi *soft-delete* atau *history tracking* pada baris mapping relasi.
