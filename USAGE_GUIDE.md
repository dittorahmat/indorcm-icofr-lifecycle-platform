# Panduan Penggunaan IndoRCM Pro — Platform Siklus ICOFR

Selamat datang di **IndoRCM Pro**, platform digital yang dirancang khusus untuk mengelola siklus *Internal Control over Financial Reporting* (ICOFR) sesuai dengan **Peraturan SK-5/DKU.MBU/11/2024**.

## Daftar Isi
1. [Peran Pengguna (RBAC)](#peran-pengguna-rbac)
2. [Tahap 1: Perancangan (Planning & Scoping)](#tahap-1-perancangan-planning--scoping)
3. [Tahap 2: Implementasi (CSA & Validation)](#tahap-2-implementasi-csa--validation)
4. [Tahap 3: Evaluasi (Testing Workbench)](#tahap-3-evaluasi-testing-workbench)
5. [Tahap 4: Remediasi (Deficiency Board)](#tahap-4-remediasi-deficiency-board)
6. [Tahap 5: Pelaporan & Atestasi Eksternal](#tahap-5-pelaporan--atestasi-eksternal)

---

## Peran Pengguna (RBAC)
Aplikasi ini menggunakan sistem *Role-Based Access Control* (RBAC) yang ketat:
*   **Line 1 (Process Owner):** Mengisi self-assessment (CSA) dan mengunggah bukti kontrol.
*   **Line 2 (ICOFR Officer):** Mengelola scoping, menyusun RCM, validasi desain, reviu CSA, dan monitoring SOC/WBS.
*   **Line 3 (Internal Audit):** Melakukan pengujian independen (TOD & TOE) secara objektif.
*   **Admin/Executive:** Meninjau dashboard kepatuhan dan melakukan Digital Sign-off (CEO/CFO).
*   **External Auditor (KAP):** Melakukan reviu independen atas kertas kerja Lini 3 dan memberikan opini atestasi.

---

## Tahap 1: Perancangan (Planning & Scoping)

### 1.1 Penentuan Materialitas Grup
*   Navigasi ke menu **Planning > Scoping & Materiality**.
*   Masukkan jumlah entitas anak untuk mengaktifkan **Group Multiplier (Tabel 25)**.
*   Sistem secara otomatis menghitung alokasi materialitas anak perusahaan berdasarkan pangsa aset (**FAQ No. 4**) dengan batasan (*cap*) sesuai regulasi.

### 1.2 RCM & Indirect ELC
*   Buka menu **RCM & BPM**.
*   Gunakan tab **RCM Matrix (TLC)** untuk kontrol transaksi harian.
*   **Change Request:** Jika Anda berperan sebagai Lini 1, klik edit untuk mengajukan perubahan. Perubahan ini akan berstatus **Pending Change Approval** dan wajib disetujui oleh Lini 2 sebelum efektif (Lampiran 6).
*   Gunakan tab **Indirect ELC (Tabel 17)** khusus untuk memetakan prinsip-prinsip COSO tingkat entitas.

### 1.3 Risk Library & Scoping
*   Sistem telah memuat Pustaka Risiko untuk **11 Klaster BUMN** (Lampiran 2). Gunakan tombol **Risk Library Lookup** untuk mencari risiko spesifik industri Anda.
*   **Investee Monitoring:** Navigasi ke tab **Investee Monitoring (FAQ 5)** di halaman Scoping untuk memantau entitas asosiasi (metode ekuitas). Pastikan laporan audit investee telah diterima dan direviu.

### 1.4 Integrasi Whistleblowing (WBS)
*   Buka menu **Whistleblowing Recap** untuk meninjau indikator fraud yang masuk.
*   Gunakan data ini sebagai input kualitatif dalam menentukan akun signifikan di tahap scoping.

### 1.5 Change Management Log
*   Setiap perubahan pada RCM atau BPM didokumentasikan di menu **Change Log (Lampiran 6)**.
*   Laporan ini memuat perbandingan *Before vs After* yang wajib tersedia saat audit.

### 1.5 SOC & ITGC Monitoring
*   Menu **SOC Monitoring** digunakan untuk mendokumentasikan reviu atas laporan asurans vendor.
*   Tab **Significant Applications** menampilkan inventaris aset TI dan memetakan kontrol COBIT 2019 ke area ITGC (**Tabel 1**) secara otomatis.
*   Gunakan checklist evaluasi untuk memvalidasi keselarasan ruang lingkup dan periode laporan SOC dengan siklus ICOFR perusahaan.

---

## Tahap 2: Implementasi (CSA & Validation)

### 2.1 Pengisian CSA (Lini 1)
*   Lini 1 mengisi penilaian di **CSA Workspace**. Kontrol dengan **Fraud Risk** ditandai khusus.

### 2.2 Validasi Lini 2 (ICOFR)
*   Pengguna **Lini 2** wajib meninjau hasil CSA Lini 1 melalui tab **Pending Action**.
*   **Test of One (Walkthrough):** Lini 2 wajib melakukan pengujian desain pada satu transaksi tunggal dan mengunggah dokumen bukti walkthrough (**Bab III 4**).
*   Berikan status **Validated** atau **Rejected** berdasarkan kecukupan bukti pendukung.

---

## Tahap 3: Evaluasi (Testing Workbench)

### 3.1 Kalkulator Sampel & Justifikasi
*   Gunakan fitur **Get Suggested Samples** saat membuat *Test Record*.
*   **Wajib:** Isi kolom **Justifikasi Homogenitas** (Bab V 1.3.a) untuk menjelaskan mengapa populasi dianggap seragam sebelum sampel dipilih.
*   Sistem menghitung jumlah sampel secara presisi mengikuti **Tabel 22**.

### 3.2 6 Pilar Atribut Evaluasi (Lini 3)
*   Saat melakukan pengetesan TOD/TOE, auditor wajib mengisi 6 atribut kepatuhan mandatori (Tabel 21):
    1. Pencapaian Objektif
    2. Ketepatan Waktu
    3. Wewenang & Kompetensi
    4. Keandalan Informasi (IPE/EUC)
    5. Cakupan Periode
    6. Kecukupan Bukti

---

## Tahap 4: Remediasi (Deficiency Board)

### 4.1 Compensating Controls
*   Jika ditemukan defisiensi, tautkan **Compensating Control** untuk memitigasi risiko dan menurunkan tingkat keparahan (*Severity*).

### 4.2 Aggregate Analysis (Lampiran 10)
*   Aktifkan tombol **Aggregate Analysis** pada header board.
*   Pilih beberapa temuan yang berkaitan (misal: pada asersi atau akun yang sama).
*   Klik **Evaluate Aggr. Group** untuk menjalankan Wizard DoD.
*   **Wajib:** Isi kolom **Rationale/Justifikasi** di akhir wizard untuk mendokumentasikan dasar pertimbangan penentuan tingkat defisiensi agregat.

---

## Tahap 5: Pelaporan & Atestasi Eksternal

### 5.1 Digital Sign-off & Verification
*   Setelah siklus selesai, CEO/CFO melakukan sign-off pada tab **Asesmen Manajemen**. 
*   Data akan dikunci (**Locked**) untuk memastikan integritas laporan tahunan.
*   Gunakan tombol **Print Report** untuk menghasilkan dokumen formal ber-watermark "SIGNED" dan **QR Code Verifikasi Digital** (Bab VII 2).

### 5.2 Portal Audit Eksternal (KAP)
*   Partner dari KAP dapat mengakses **Audit Portal**.
*   Pilih jenis opini (WTP, DPP, dsb.) dan isi basis opini.
*   Sistem akan menghasilkan **Preview Laporan Auditor Independen** secara otomatis untuk ditinjau sebelum diserahkan.

---
## Dashboard & Akuntabilitas (Prinsip 5)
Pantau performa siklus ICOFR melalui menu **Dashboard**:
*   **CSA Completion:** Persentase ketepatan waktu Lini 1.
*   **Remediation Velocity:** Rata-rata waktu penyelesaian defisiensi.
*   **Cooling-Off Check:** Sistem secara otomatis memblokir Auditor (Lini 3) yang memiliki riwayat operasional dalam 12 bulan terakhir pada proses terkait (Bab II d.2).

---
*Dokumen ini disusun untuk IndoRCM Pro v1.0 — © 2026 IndoRCM Pro Team.*
