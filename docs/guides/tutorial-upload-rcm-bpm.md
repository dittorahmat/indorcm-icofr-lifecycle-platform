# Panduan Lengkap: Unggah RCM & Rekonsiliasi Diagram BPM (SK-5/DKU.MBU/11/2024)

Dokumen ini menjelaskan alur kerja terpadu untuk mengunggah dokumen **Risk Control Matrix (RCM)** dan menghubungkannya dengan **Diagram Alur Proses Bisnis (BPM)** pada platform IndoGRC Pro, baik untuk **impor terfokus per diagram (Diagram-Scoped)** maupun **impor master spreadsheet lintas proses (Global Multi-Process Ingestion)**.

---

## 💡 Prinsip Fleksibilitas Alur: Bolehkah Unggah OCR Dulu atau RCM Dulu?

> [!NOTE]
> **Platform mendukung dua paradigma impor utama:**
> 
> 1. **Global Multi-Process Ingestion (Satu Spreadsheet untuk Berbagai Proses Bisnis)**:
>    - *Pintu Masuk:* Menu **Pusat Impor Data RCM** (`/import`) atau tombol **Import RCM** di tabel matriks (`/rcm/tlc`, `/rcm/elc`, `/rcm/itgc`).
>    - *Karakteristik:* Pengguna mengunggah satu file master Excel/CSV yang memuat baris dari banyak proses bisnis sekaligus (misal: *Procure-to-Pay*, *Order-to-Cash*, *Hire-to-Retire*, dan *Record-to-Report*).
>    - *Mekanisme:* Sistem otomatis mengelompokkan risiko dan kontrol berdasarkan kolom `Informasi_Proses_Bisnis` dan `Informasi_Sub_proses_Bisnis`. Entitas proses BPM baru dibuat otomatis di basis data jika belum ada.
>    - *Late Reconciliation:* Baris tidak dipaksa dicocokkan ke kanvas saat impor awal. Rekonsiliasi visual dapat dilakukan belakangan ketika pengguna membuka diagram BPM dari masing-masing proses.
>
> 2. **Diagram-Scoped Ingestion (Impor Terfokus per Diagram BPM)**:
>    - *Pintu Masuk:* Toolbar di dalam **BPM Workflow Editor** (`/bpm?year=2027`).
>    - *Karakteristik:* Pengguna berada di dalam satu kanvas diagram proses aktif dan ingin melakukan rekonsiliasi instan (Step 3 Matcher) antara berkas RCM dengan simpul alur yang ada di kanvas tersebut.
> 
> **Pilihan Alur Kerja (Workflows):**
> - **Opsi A (Rekomendasi Diagram-Scoped): Unggah OCR BPM Dahulu $\rightarrow$ Lalu Unggah RCM**
>   - Saat mengimpor RCM di BPM Editor, sistem langsung mencocokkan nomor langkah (`Ref_Langkah_BPM` seperti `1.2`, `1.5`, `1.6`, `1.10`) ke simpul kanvas secara otomatis (**100% Auto-Matched**).
> - **Opsi B (Rekomendasi Multi-Process): Unggah Master RCM Dahulu $\rightarrow$ Lalu Rekonsiliasi / Buat BPM Belakangan**
>   - Risiko dan kontrol langsung masuk dan tersimpan ke database lintas seluruh proses bisnis. Kartu proses BPM langsung terisi hitungan risiko dan kontrol. Diagram BPM digambar atau di-OCR kapan saja secara bertahap.
> - **Opsi C: Input / Edit Manual Keduanya**
>   - Simpul BPM digambar manual dengan simbol SK-5 Lampiran 3, dan kontrol ditautkan manual lewat panel properti simpul (*Regulatory Pairs*).

---

## 1. Persiapan Dokumen & Format File

Platform IndoGRC Pro mendukung dua jenis berkas input:

1. **Diagram Alur BPM:**
   - **Format:** Berkas gambar (`.jpg`, `.jpeg`, `.png`) atau PDF scan diagram alur bisnis.
   - **Standar Bentuk SK-5 Lampiran 3:**
     - ⬡ **Hexagon (Segi Enam):** Simpul Risiko (*Risk Node*).
     - ⬭ **Oval:** Simpul Mulai / Selesai (*Start / End Node*).
     - ▽ **Segitiga Terbalik:** Simpul Arsip / Dokumen Fisik (*Archive Node*).
     - ⛁ **Silinder:** Simpul Sistem / Media Database (*System / Data Media*).
   - **Contoh berkas uji coba:** Diagram vendor onboarding dengan 4 swimlane (`REKANAN / VENDOR`, `TIM PROCUREMENT`, `BAGIAN HUKUM / LEGAL`, `VP PROCUREMENT`).

2. **Spreadsheet RCM:**
   - **Format:** Excel (`.xlsx`, `.xls`) atau CSV delimited (`;` atau `,`).
   - **Struktur Kolom Mandatori (TLC - Transaction Level Control):**
     - `No`
     - `Informasi_Proses_Bisnis`
     - `Informasi_Sub_proses_Bisnis`
     - `Ref_Langkah_BPM` *(misal: 1.2, 1.5, 1.6)*
     - `Nama_Langkah_BPM`
     - `Risiko_Aktivitas_Pengendalian`
     - `Risiko_Terkait_Fraud` *(Ya / Tidak)*
     - `Penilaian_Risiko` *(Tinggi / Sedang / Rendah)*
     - `Referensi_Pengendalian` *(Kode Kontrol, misal: `CTRL-P2P-2027-001`)*
     - `Nama_Aktivitas_Pengendalian`
     - `Deskripsi_Aktivitas_Pengendalian`
     - `Frekuensi_Pengendalian` *(Harian / Triwulanan / Tahunan / dsb.)*
     - `Dokumen_Pendukung`
     - `Fungsi_Pelaksana`
     - `Pelaku_Pengendalian`
     - `Periode_Efektif`

---

## 2. Langkah-demi-Langkah: Opsi A (OCR BPM Dahulu $\rightarrow$ RCM)

### Langkah 1: Buka Modul BPM & Buat / Pilih Proses
1. Navigasi ke menu **BPM** di navigasi bawah atau sidebar: `http://localhost:3000/bpm?year=2027`.
2. Pilih **FSLI** terkait (contoh: `v. Pemeliharaan dan perbaikan`) dan **Akun GL** (contoh: `9401-0001 • Biaya Pemeliharaan`).
3. Buat proses baru atau klik **View Diagram** pada proses yang sudah ada (misal: `Procure-to-Pay` / `P2P-01`).

![BPM Process Card](file:///d:/development/indorcm-icofr-lifecycle-platform/docs/images/rcm-tutorial/04_bpm_process_card.png)
*(Gambar juga dapat diakses langsung di: [04_bpm_process_card.png](file:///d:/development/indorcm-icofr-lifecycle-platform/docs/images/rcm-tutorial/04_bpm_process_card.png))*

---

### Langkah 2: Ekstraksi Diagram Alur dengan AI OCR
1. Di dalam **BPM Workflow Editor**, klik tombol **"Import Flow (OCR)"** pada toolbar kanvas.
2. Unggah gambar diagram alur (misal: `vendor_onboarding_diagram.jpg`).
3. Klik tombol **"Process AI OCR"**. Mesin AI akan memindai swimlane, teks langkah, nomor referensi (`1.1`, `1.2`, dst.), dan bentuk simbol secara otomatis.
4. Klik **"Save & Apply"** untuk menerapkan simpul dan garis konektor ke kanvas BPM.
5. Klik **"Save Flow"** untuk menyimpan diagram ke database.

![BPM Canvas Setelah AI OCR](file:///d:/development/indorcm-icofr-lifecycle-platform/docs/images/rcm-tutorial/01_bpm_canvas_after_ocr.png)
*(Gambar juga dapat diakses langsung di: [01_bpm_canvas_after_ocr.png](file:///d:/development/indorcm-icofr-lifecycle-platform/docs/images/rcm-tutorial/01_bpm_canvas_after_ocr.png))*

> [!TIP]
> Perhatikan bahwa simpul kanvas kini memiliki label langkah seperti:
> - `[ACTIVITY] 1.2 Verifikasi Uji Tuntas Rekanan Baru`
> - `[ACTIVITY] 1.5 Pemeriksaan Blacklist Vendor BUMN`
> - `[ACTIVITY] 1.6 Validasi Pakta Integritas Rekanan`
> - `[ACTIVITY] 1.10 Persetujuan Pendaftaran Vendor`

---

### Langkah 3: Buka RCM Import Wizard
1. Di toolbar BPM Workflow Editor yang sama, klik tombol **"Import RCM"**.
2. Dialog **Import & Rekonsiliasi RCM (SK-5 Lampiran 5)** akan terbuka.
3. Di **Langkah 1 (Pilih Tipe & Berkas)**:
   - Pilih rasa RCM: **TLC (Transaction Level)**, **ELC (Entity Level)**, atau **ITGC (IT General Controls)**.
   - Pilih berkas spreadsheet RCM (`.xlsx` atau `.csv`).

---

### Langkah 4: Tinjau & Validasi Data (Step 2 Preview)
1. Sistem secara instan memvalidasi baris spreadsheet:
   - Menghitung **Total Baris**, **Baris Valid**, dan **Baris Bermasalah** (jika ada kolom wajib yang kosong).
2. Periksa kesesuaian Nama Kontrol, Deskripsi Risiko, dan Klasifikasi Fraud.
3. Klik tombol **"Lanjut ke Pemetaan BPM"**.

---

### Langkah 5: Rekonsiliasi & Pemetaan Simpul BPM (Step 3)
1. Pada tahap ini, platform secara cerdas mencocokkan `Ref_Langkah_BPM` dari file RCM dengan simpul kanvas BPM:
   - Baris dengan nomor ref yang cocok langsung berstatus **Matched (Hijau)**.
   - Baris tanpa nomor ref akan berstatus **Unmapped / Disarankan**. Anda dapat memilih simpul secara manual melalui dropdown atau memilih **"Buat Simpul Otomatis"**.

![RCM Reconciliation Matched](file:///d:/development/indorcm-icofr-lifecycle-platform/docs/images/rcm-tutorial/02_rcm_reconciliation_matched.png)
*(Gambar juga dapat diakses langsung di: [02_rcm_reconciliation_matched.png](file:///d:/development/indorcm-icofr-lifecycle-platform/docs/images/rcm-tutorial/02_rcm_reconciliation_matched.png))*

---

### Langkah 6: Komit & Simpan
1. Klik tombol **"Simpan & Komit ke RCM"**.
2. Sistem akan menjalankan transaksi atomik:
   - Menyimpan seluruh data risiko ke tabel `icofr.rcms`.
   - Menyimpan seluruh data kontrol ke tabel `icofr.controls`.
   - Menghubungkan simpul diagram BPM dengan kontrol terkait di `icofr.bpm_diagram_nodes`.
   - **Secara otomatis memperbarui ringkasan counter** `control_count` dan `risk_count` pada kartu proses BPM.
3. Notifikasi toast sukses akan muncul di layar.

![Final Confirmation Toast](file:///d:/development/indorcm-icofr-lifecycle-platform/docs/images/rcm-tutorial/03_final_confirmation_toast.png)
*(Gambar juga dapat diakses langsung di: [03_final_confirmation_toast.png](file:///d:/development/indorcm-icofr-lifecycle-platform/docs/images/rcm-tutorial/03_final_confirmation_toast.png))*

---

## 3. Langkah-demi-Langkah: Opsi B (Global Multi-Process Master Ingestion)

Skenario ini berlaku ketika organisasi Anda telah memiliki **satu dokumen spreadsheet master RCM terpusat** yang memuat seluruh proses, sub-proses, risiko, dan aktivitas kontrol (seperti contoh berkas uji coba `sample_2027_tlc.csv` / `.xlsx` di `src/components/rcm/editor/fixtures/` yang mencakup P2P, O2C, H2R, dan R2R):

### Langkah 1: Buka Pusat Impor RCM atau Matriks RCM
1. Navigasi ke menu **Pusat Impor Data RCM** di URL: `http://localhost:3000/import` atau buka halaman **RCM TLC** (`http://localhost:3000/rcm/tlc`).
2. Klik tombol **"Buka Import Wizard"** atau **"Import RCM"**.

![Pusat Impor Data RCM](file:///d:/development/indorcm-icofr-lifecycle-platform/docs/images/rcm-tutorial/05_import_center_page.png)
*(Gambar juga dapat diakses langsung di: [05_import_center_page.png](file:///d:/development/indorcm-icofr-lifecycle-platform/docs/images/rcm-tutorial/05_import_center_page.png))*

### Langkah 2: Unggah Spreadsheet Master Multi-Proses
1. Pada **Langkah 1 (Pilih Tipe & Berkas)**:
   - Pilih jenis RCM: **TLC (Transaction Level)**.
   - Unggah berkas spreadsheet master multi-proses (misal: `sample_2027_tlc.xlsx` atau `.csv`).

### Langkah 3: Tinjau Validasi Lintas Proses (Step 2 Preview)
1. Sistem akan membaca seluruh baris dan mengelompokkan metadata:
   - Menampilkan total baris data (13 baris valid).
   - Menampilkan kontrol-kontrol dari berbagai proses bisnis (*Procure-to-Pay*, *Order-to-Cash*, *Hire-to-Retire*, *Record-to-Report*).
   - Memvalidasi seluruh field regulasi (IPO C-A-V-RA, Asersi C-E-A-CO-RO-VA-PD, fraud flag, dsb.).
2. Karena diinisiasi dari luar kanvas diagram, wizard secara cerdas menyederhanakan alur dengan tombol langsung: **"Simpan & Komit ke RCM"** (*Late Reconciliation*).

![Pratinjau Impor Multi-Proses Step 2](file:///d:/development/indorcm-icofr-lifecycle-platform/docs/images/rcm-tutorial/06_rcm_multi_process_preview.png)
*(Gambar juga dapat diakses langsung di: [06_rcm_multi_process_preview.png](file:///d:/development/indorcm-icofr-lifecycle-platform/docs/images/rcm-tutorial/06_rcm_multi_process_preview.png))*

### Langkah 4: Komit Data & Auto-Creation Entitas BPM
1. Klik **"Simpan & Komit ke RCM"**.
2. Backend IndoGRC Pro mengeksekusi transaksi basis data atomik:
   - Mengelompokkan baris berdasarkan pasangan `Informasi_Proses_Bisnis` dan `Informasi_Sub_proses_Bisnis`.
   - Menemukan proses yang ada atau **secara otomatis membuat entitas `bpmProcesses` baru** untuk setiap proses dan sub-proses yang tercantum.
   - Menyimpan seluruh risiko ke tabel `icofr.rcms` dan kontrol ke `icofr.controls` serta `icofr.rcm_controls`.
   - Meng-update counter ringkasan `control_count` dan `risk_count` untuk seluruh proses yang terpengaruh.
3. Notifikasi toast sukses muncul dan halaman otomatis dialihkan ke tabel matriks RCM.

![Matriks RCM TLC Setelah Impor](file:///d:/development/indorcm-icofr-lifecycle-platform/docs/images/rcm-tutorial/07_rcm_tlc_matrix_page.png)
*(Gambar juga dapat diakses langsung di: [07_rcm_tlc_matrix_page.png](file:///d:/development/indorcm-icofr-lifecycle-platform/docs/images/rcm-tutorial/07_rcm_tlc_matrix_page.png))*

### Langkah 5: Hubungkan ke Diagram BPM Belakangan (Late Reconciliation Workflow)

Ketika master data RCM telah diimpor melalui Global Ingestion, risiko dan kontrol sudah tersimpan aman di database namun berstatus *unmapped* terhadap diagram kanvas. Berikut adalah alur visual langkah-demi-langkah untuk menghubungkannya:

1. **Buka Proses & Workflow Editor:**
   - Navigasi ke direktori proses BPM (`/bpm?year=2027`) dan klik **View Diagram** atau buat diagram baru pada proses terkait (misal: *Procure-to-Pay*).
2. **Periksa Panel Shape Palette (Kiri Atas):**
   - Pada panel shape palette sebelah kiri kanvas, perhatikan sub-bagian paling bawah bertajuk **"Backlog Migrasi / Unmapped Controls"**.
   - Seluruh kontrol hasil impor master yang belum memiliki simpul kanvas terdaftar di sini dengan format `[KODE_KONTROL] Nama Kontrol`.

![BPM Shape Palette & Unmapped Control Backlog](file:///d:/development/indorcm-icofr-lifecycle-platform/docs/images/rcm-tutorial/08_bpm_editor_unmapped_palette.png)
*(Gambar juga dapat diakses langsung di: [08_bpm_editor_unmapped_palette.png](file:///d:/development/indorcm-icofr-lifecycle-platform/docs/images/rcm-tutorial/08_bpm_editor_unmapped_palette.png))*
3. **Cara Kerja Penautan (2 Pilihan Interaktif):**
   - **Metode A (Drag & Drop Langsung ke Kanvas):**
     - Klik dan tahan (*drag*) item kontrol dari daftar backlog, lalu lepaskan (*drop*) ke atas swimlane kanvas.
     - Sistem otomatis membuat simpul aktivitas baru yang sudah langsung terikat dengan risiko dan kontrol tersebut.
   - **Metode B (Penautan ke Simpul yang Sudah Ada via Regulatory Property Sheet):**
     - Jika simpul alur sudah digambar di kanvas (misal simpul `1.2 Verifikasi Uji Tuntas`), klik ganda atau klik tombol gear/properti pada simpul tersebut untuk membuka **Regulatory Property Sheet** di panel samping kanan.
     - Pilih tab **"Risiko & Kontrol"** lalu klik tombol **"Tautkan Kontrol dari RCM"** atau pilih kontrol dari dropdown backlog.
     - Anda dapat menambahkan beberapa kontrol sekaligus ke dalam simpul yang sama (mendukung skenario **1 Langkah Memiliki Banyak Kontrol**).
4. **Simpan Perubahan Kanvas:**
   - Klik tombol **"Save Flow"** pada toolbar atas. Status kontrol di backlog seketika berpindah menjadi *mapped*, dan indikator tautan audit pada diagram BPM kini aktif.

---

## 💡 Tanya Jawab Arsitektur: 1 Langkah Proses Memiliki Banyak Risiko & Kontrol (1-to-N Mapping)

> [!IMPORTANT]
> **Pertanyaan Praktisi Audit:**
> *"Jika dalam 1 langkah proses bisnis (misal aktivitas `1.2 Verifikasi Kelayakan Rekanan`) terdapat 2 atau lebih risiko yang berbeda, dan masing-masing risiko dimitigasi oleh kontrol yang berbeda, apakah di spreadsheet RCM baris-baris tersebut memiliki `Ref_Langkah_BPM` dan `Nama_Langkah_BPM` yang sama? Bagaimana platform menanganinya?"*

### 1. Jawaban Singkat: **BENAR 100%**
Dalam metodologi RCM regulasi BUMN (SK-5 Lampiran 5):
- Struktur spreadsheet RCM adalah **berorientasi pada baris kontrol/risiko (Control/Risk-Centric Table)**, bukan per simpul langkah.
- Satu aktivitas langkah proses pada BPM sangat lumrah memiliki **banyak risiko (1-to-N Risks)** dan **banyak kontrol mitigasi (1-to-N Controls)**.
- Oleh karena itu, baris-baris di spreadsheet RCM **memang sengaja mengisi `Ref_Langkah_BPM` dan `Nama_Langkah_BPM` yang SAMA PERSIS** untuk mereferensikan simpul aktivitas yang sama di kanvas BPM.

### 2. Contoh Nyata pada Berkas Spreadsheet RCM

Perhatikan contoh berikut pada langkah `1.2 Verifikasi Kelayakan Rekanan`:
```text
No | Ref_Langkah | Nama_Langkah_BPM               | Risiko                                | Referensi_Kontrol | Nama_Kontrol
---|-------------|--------------------------------|---------------------------------------|-------------------|----------------------------------
1  | 1.2         | Verifikasi Uji Tuntas Rekanan  | Risiko dokumen legalitas vendor fiktif | CTRL-P2P-001      | Verifikasi NIB & Legalitas Notaris
2  | 1.2         | Verifikasi Uji Tuntas Rekanan  | Risiko vendor terafiliasi terorisme   | CTRL-P2P-002      | Pengecekan AML / DTTOT Database
3  | 1.2         | Verifikasi Uji Tuntas Rekanan  | Risiko penyuapan / gratifikasi vendor | CTRL-P2P-003      | Validasi Pakta Integritas ISO 37001
```

### 3. Bagaimana IndoGRC Pro Menanganinya di Kanvas BPM?
Platform IndoGRC Pro telah mengadopsi arsitektur **Universal Regulatory Pairs** (`shared/control-linkage.ts`):
1. **Tidak Ada Simpul Ganda:** Di kanvas BPM, Anda **TIDAK PERLU** membuat 3 kotak langkah yang sama. Cukup **1 simpul aktivitas saja** (`[ACTIVITY] 1.2 Verifikasi Uji Tuntas Rekanan`).
2. **Multiple Regulatory Pairs per Node:**
   - Ketika simpul `1.2` diklik di kanvas, panel **Regulatory Property Sheet** (di sebelah kanan kanvas) mengelompokkan risiko dan kontrol dalam susunan kartu hierarki (*Accordion Risk & Control Cards*).
   - Simpul tunggal tersebut dapat menampung array pasangan:
     ```json
     regulatoryPairs: [
       { "riskId": "R-P2P-001", "riskDescription": "Dokumen fiktif", "controlId": "CTRL-P2P-001", ... },
       { "riskId": "R-P2P-002", "riskDescription": "Afiliasi terorisme", "controlId": "CTRL-P2P-002", ... },
       { "riskId": "R-P2P-003", "riskDescription": "Penyuapan / gratifikasi", "controlId": "CTRL-P2P-003", ... }
     ]
     ```
3. **Pencocokan Otomatis Saat Import Wizard (Auto-Grouping):**
   - Di Wizard Rekonsiliasi, ketiga baris di atas yang memiliki `Ref_Langkah_BPM = 1.2` akan langsung otomatis **Matched** ke simpul `1.2` yang sama di kanvas.
   - Sistem tidak akan menimpa kontrol sebelumnya, melainkan menambahkannya (*append*) ke dalam simpul tersebut sehingga seluruh risiko dan kontrol berkumpul rapi di bawah satu langkah proses.
4. **Pada Late Reconciliation:**
   - Jika Anda mengimpor master RCM terlebih dahulu, ketiga baris kontrol tersebut tersimpan di database dengan relasi proses yang sama.
   - Ketika diagram BPM dibuka belakangan, ketiga kontrol tersebut dapat ditarik (*drag*) dari *Unmapped Control List* atau ditautkan langsung melalui dropdown simpul `1.2`.

---

## 4. Checklist Pemecahan Masalah (Troubleshooting)

| Gejala | Penyebab Umum | Solusi |
| :--- | :--- | :--- |
| **Gagal membaca file spreadsheet RCM** | Berkas Excel menggunakan format biner lama (`.xls`) atau corrupt. | Simpan ulang berkas sebagai `.xlsx` standar atau ekspor ke `.csv` dengan delimiter titik koma (`;`). |
| **0 Risks, 0 Controls pada Kartu Proses** | Belum melakukan commit atau filter tahun berbeda. | Pastikan mengklik *"Simpan & Komit ke RCM"* sampai muncul toast sukses; sistem kini otomatis meng-invalidasi cache dan memperbarui hitungan seketika. |
| **Simpul OCR Tidak Pas di Swimlane** | Gambar diagram buram atau garis batas swimlane terputus. | Gunakan gambar beresolusi tinggi (`.jpg` atau `.png` tajam). Anda dapat menggeser simpul (*drag and drop*) secara bebas di kanvas jika diperlukan. |
| **Simpul Berstatus Unmapped di Step 3** | Kolom `Ref_Langkah_BPM` di Excel tidak sama persis formatnya dengan nomor langkah kanvas. | Pilih simpul target secara manual dari dropdown kolom *"Tautkan ke Simpul BPM"* di Step 3 Wizard. |

---

## 5. Referensi Regulasi
- **SK-5/DKU.MBU/11/2024 Bab II:** Tata Kelola Pengendalian Internal Atas Pelaporan Keuangan BUMN.
- **Lampiran 3:** Standar Simbol dan Legenda Pemetaan Proses Bisnis (BPM).
- **Lampiran 5:** Matriks Pengendalian Risiko Terinci (TLC, ELC, dan ITGC).
