# Proposal: Overhaul Scoping Workflow - Materiality Simulation & Approval

## Business Case
Sesuai dengan praktik tata kelola ICOFR di BUMN (SK-5/2024) dan kebutuhan operasional PTBA, penentuan materialitas bukan lagi proses satu langkah yang statis. Saat ini, sistem membutuhkan fitur simulasi yang memungkinkan Lini 2 untuk menguji berbagai skenario basis benchmark (PBT, Revenue, dsb) sebelum diajukan dan disetujui oleh Komisaris Utama (Komut).

Fitur ini juga akan memperkenalkan integrasi data GL yang lebih dalam dengan pengelompokan FSLI (Financial Statement Line Items) dan penilaian kualitatif 8-faktor sesuai standar regulasi.

## Goals
-   **Multi-Scenario Simulation:** Lini 2 dapat membuat, menyimpan, dan membandingkan beberapa simulasi materialitas.
-   **Komisaris Approval Workflow:** Menambahkan role Komisaris dengan hak akses khusus untuk meninjau dan menyetujui (approve) baseline materialitas.
-   **Excel-like Worksheet:** Tabel scoping yang mendukung filtering, sorting, dan grouping berdasarkan FSLI.
-   **Regulatory Compliance (Table 5):** Implementasi 8 faktor risiko kualitatif (Low/Medium/High) per akun GL.
-   **Data Integrity via Snapshots:** Setiap simulasi mengunci data GL pada saat pembuatan untuk mencegah inkonsistensi data laporan keuangan.

## Proposed Changes

### 1. Data Model & Roles (`shared/types.ts`)
-   **Roles:** Tambahkan `"Komisaris"` ke `UserRole`.
-   **`MaterialitySimulation` Interface:**
    -   `id: string`, `name: string`, `year: number`.
    -   `status: "Draft" | "Submitted" | "Approved" | "Rejected"`.
    -   `benchmarkBasis`: 5 opsi (Revenue, PBT, Assets, Equity, Net Current Assets).
    -   `omPercentage`, `haircutPercentage`, `omValue`, `pmValue`.
    -   `glSnapshotId`: Referensi ke kumpulan data GL yang digunakan.
-   **`QualitativeAssessment` Interface:**
    -   Penyimpanan nilai R1 s/d R8 (L/M/H) per akun GL per simulasi.

### 2. UI/UX Updates
-   **Scoping Worksheet (`ScopingPage.tsx`):**
    -   **Grouping logic:** Menampilkan header FSLI (total saldo) yang bisa di-*expand* untuk melihat detail akun GL.
    -   **8 Columns UI:** Dropdown L/M/H di setiap baris akun GL.
    -   **Batch Action:** Tombol "Apply to all under this FSLI" untuk penilaian kualitatif cepat.
    -   **Visual Feedback:** Baris otomatis ter-highlight "SIGNIFIKAN" jika `Saldo > PM` atau ada salah satu Rule = `High`.
-   **Simulation Manager:** Dashboard untuk Lini 2 mengelola daftar simulasi (Create, Edit, Delete).
-   **Approval Portal:** Halaman khusus Komisaris untuk meninjau simulasi yang berstatus `Submitted`.

### 3. Logic & Automation
-   **Auto-Defaults:** Mengisi default % OM berdasarkan basis yang dipilih (misal: PBT 5%, Revenue 1%).
-   **Snapshotting:** Saat simulasi dibuat, sistem menyimpan salinan data GL yang diupload agar angka tidak berubah meskipun ada upload GL baru untuk simulasi lain.

## Compliance Alignment
-   **SK-5/2024 Lampiran 5 (Tabel 5):** 8 kriteria penilaian kualitatif.
-   **SK-5/2024 Hal 51:** Standar benchmark basis dan persentase toleransi.
-   **Prinsip GRC:** Pemisahan tugas (Segregation of Duties) antara pembuat simulasi (Lini 2) dan pemberi persetujuan (Komisaris).

## Risks & Mitigations
-   **Risk:** Performa browser melambat karena data GL ribuan baris.
-   **Mitigation:** Menggunakan virtualization (TanStack Virtual) untuk merender tabel besar.
-   **Risk:** Kebingungan versi data GL.
-   **Mitigation:** Labeling yang jelas pada setiap simulasi mengenai waktu snapshot data GL diambil.
