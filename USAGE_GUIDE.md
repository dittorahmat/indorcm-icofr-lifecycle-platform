# Panduan Penggunaan IndoRCM Pro — Platform Siklus ICOFR

Selamat datang di **IndoRCM Pro**, platform digital yang dirancang khusus untuk mengelola siklus *Internal Control over Financial Reporting* (ICOFR) sesuai dengan **Peraturan SK-5/DKU.MBU/11/2024**.

## Daftar Isi
1. [Peran Pengguna (RBAC)](#peran-pengguna-rbac)
2. [Tahap 1: Perancangan (Scoping & RCM)](#tahap-1-perancangan-scoping--rcm)
3. [Tahap 2: Implementasi (CSA)](#tahap-2-implementasi-csa)
4. [Tahap 3: Evaluasi (Testing)](#tahap-3-evaluasi-testing)
5. [Tahap 4: Remediasi (Deficiency Board)](#tahap-4-remediasi-deficiency-board)
6. [Tahap 5: Pelaporan & Atestasi Eksternal](#tahap-5-pelaporan--atestasi-eksternal)

---

## Peran Pengguna (RBAC)
Aplikasi ini menggunakan sistem *Role-Based Access Control* (RBAC) yang ketat:
*   **Line 1 (Process Owner):** Bertanggung jawab mengisi CSA (Control Self-Assessment).
*   **Line 2 (ICOFR Officer):** Melakukan scoping, menyusun RCM, validasi desain, dan inventarisasi aplikasi.
*   **Line 3 (Internal Audit):** Melakukan pengujian independen (TOD & TOE).
*   **Admin/Executive:** Meninjau dashboard COSO dan melakukan Digital Sign-off.
*   **External Auditor (KAP):** Melakukan reviu independen dan memberikan opini atestasi.

---

## Tahap 1: Perancangan (Scoping & RCM)

### 1.1 Penentuan Materialitas & Haircut Wizard
*   Navigasi ke menu **Planning > Scoping & Materiality**.
*   Gunakan tombol **Determine Haircut (Table 4)**. Jawab kuesioner kualitatif (riwayat salah saji, perubahan sistem, dll) untuk mendapatkan saran persentase haircut yang objektif (25% - 55%).

### 1.2 BPM Visualization
*   Pada daftar RCM, klik tombol **BPM Flow** pada kartu proses.
*   Gunakan kanvas visual untuk memetakan alur proses bisnis dengan legenda standar (Aktivitas, Sistem, Dokumen, Keputusan) sesuai **Lampiran 4**.

### 1.3 Risk Library (Standardisasi Klaster)
*   Saat menambah proses baru (**Add Process**), klik tombol **Lookup Risk Library**.
*   Pilih risiko standar berdasarkan klaster BUMN Anda (misal: Industri Energi atau Jasa Keuangan) untuk memastikan keselarasan dengan **Lampiran 2**.

### 1.4 Application Inventory & Precision Detail
*   Navigasi ke tab **Significant Apps** di menu RCM untuk memonitor status **ITGC**.
*   Pada saat membuat kontrol baru, tentukan **Kompleksitas Spreadsheet (Tabel 14)** atau **Tipe Laporan IPE (Tabel 20)** untuk menyesuaikan prosedur pengujian secara otomatis.

---

## Tahap 2: Implementasi (CSA)

### 2.1 Pengisian Self-Assessment
*   Pengguna **Lini 1** masuk ke menu **Implementation > CSA Workspace**.
*   Unggah bukti pelaksanaan kontrol dan berikan komentar untuk setiap periode assessment.

---

## Tahap 3: Evaluasi (Testing)

### 3.1 Workbench Pengujian (Lini 3)
*   **6 Atribut Evaluasi (Tabel 21):** Auditor wajib memvalidasi 6 atribut kepatuhan (Pencapaian Objektif, Ketepatan Waktu, Wewenang, Keandalan Informasi, Cakupan, dan Bukti).
*   **Technical Reperformance:** Jika tipe IPE adalah **Query**, sistem akan mewajibkan reviu teknis atas logika SQL (Tabel 20).

---

## Tahap 4: Remediasi (Deficiency Board)

### 4.1 Aggregate Analysis
*   Gunakan tombol **Aggregate Analysis (Lampiran 10)** untuk memilih beberapa temuan kecil dan mengevaluasi dampak gabungannya terhadap saldo akun atau asersi tertentu.

---

## Tahap 5: Pelaporan & Atestasi Eksternal

### 5.1 Digital Sign-off & Lock
*   Pengguna Admin/Executive melakukan sign-off pada tab **Asesmen Manajemen**. 
*   Laporan akan dicap **SIGNED** dan seluruh data periode tersebut akan dikunci (**Locked**) agar tidak dapat diubah lagi.

---
*Dokumen ini disusun untuk IndoRCM Pro v1.0 — © 2026 IndoRCM Pro Team.*
