# IndoGRC Pro — End-to-End Demo Playbook & Case Study
**Skenario Mandatori Siklus 5 Tahap ICOFR Berdasarkan Regulasi BUMN SK-5/DKU.MBU/11/2024**

---

## 1. Profil Entitas & Karakteristik Industri Demo
* **Nama Entitas:** PT Batubara Nusantara Sejahtera (PT BNS)
* **Klaster BUMN:** Industri Energi, Minyak, Gas & Pertambangan (Lampiran 2 SK-5)
* **Tahun Buku / Asesmen:** 2026
* **Bisnis Inti:** Penambangan batubara open-pit, pengolahan, dan penjualan batubara (70% Ekspor, 30% Domestik/PLN)
* **Akun Signifikan Utama (FSLI):**
  * `40001-REV-COAL` / `10008-000318`: Pendapatan Usaha Penjualan Batubara (Rp 500 Miliar)
  * `50001-COGS-MINING` / `20001-000500`: Beban Jasa Penambangan & Hauling Kontraktor (Rp 320 Miliar)
  * `11001-AR-COAL` / `10002-000200`: Piutang Usaha PT PLN (Persero) (Rp 120 Miliar)
  * `10001-CASH` / `10001-000100`: Kas dan Bank (Rp 85 Miliar)

---

## 2. Matriks Persona & Kredensial Akses Demo
Seluruh akun menggunakan kata sandi standar: `password`

| Peran (Role) | Nama Persona | Email Login | Cakupan Tanggung Jawab Utama |
| :--- | :--- | :--- | :--- |
| **Lini 1 (Staff Ops)** | Ahmad Fauzi | `staff.ops@bumn.go.id` | Eksekusi kontrol harian, pengisian lembar kerja CSA mandiri, input bukti operasional lapangan |
| **Lini 1 (Manager Ops)** | Bambang Sudarsono | `manager.ops@bumn.go.id` | Review kontrol internal unit kerja operasi, persetujuan draft CSA Lini 1 |
| **Lini 2 (ICOFR Manager)** | Siti Nurhaliza | `line2@bumn.go.id` | Pengelola metodologi ICOFR, scoping materialitas, validasi CSA, evaluasi TOD 6-Pilar |
| **Lini 3 (Internal Auditor)** | Budi Santoso | `line3@bumn.go.id` | Pengujian independen (TOE sampel transaksi), pencatatan tiket defisiensi audit |
| **CFO / Direksi** | Hendro Wijaya | `cfo@bumn.go.id` | Persetujuan scoping materialitas, evaluasi defisiensi agregat, Digital Sign-off Lampiran 11 |
| **External Auditor (KAP)** | Evan Tan | `external@bumn.go.id` | Akses baca independen portal KAP, verifikasi cooling-off Bab II, audit bukti kepatuhan |
| **Administrator** | Diana Wijaya | `admin@bumn.go.id` | Manajemen user/role, konfigurasi sistem, parameter organisasi |

---

## 3. Rantai Skenario End-to-End (5 Tahapan Wajib SK-5)

### Tahap 1: Scoping & Materialitas (SK-5 Hal. 12-25)
* **Aktor:** Lini 2 (`line2@bumn.go.id`) & CFO (`cfo@bumn.go.id`)
* **Halaman Navigasi:** `/scoping/simulations` dan `/scoping/matrix`
* **Alur Skenario:**
  1. Login sebagai `line2@bumn.go.id`.
  2. Buka menu **Scoping & Materiality** > **Simulasi Materialitas**.
  3. Pilih tahun buku **2026**. Tinjau simulasi `Simulasi Materialitas ICOFR 2026 - PT BNS (Approved Final)`.
  4. Periksa parameter kuantitatif:
     * **Basis Benchmark:** Revenue (Pendapatan Usaha) = Rp 500 Miliar.
     * **Overall Materiality (OM):** 5% = Rp 25 Miliar.
     * **Performance Materiality (PM):** Haircut 75% = Rp 18.75 Miliar.
  5. Buka tab **Scoping Matrix**:
     * Verifikasi bahwa akun dengan saldo di atas PM (Rp 18.75 M) otomatis teridentifikasi sebagai *Quantitative In-Scope* (`40001-REV-COAL`, `50001-COGS-MINING`, `11001-AR-COAL`).
     * Verifikasi justifikasi kualitatif (risiko kecurangan/fraud, estimasi akuntansi ARO reklamasi tambang).
  6. Alur approval berjenjang: Lini 2 submit → CFO review & approve → Status terkunci **Approved**.

---

### Tahap 2: RCM & BPM Linkage (SK-5 Lampiran 3 & 5)
* **Aktor:** Lini 2 (`line2@bumn.go.id`)
* **Halaman Navigasi:** `/rcm` dan `/bpm`
* **Alur Skenario:**
  1. Buka menu **RCM Manager** (`/rcm`).
  2. Filter berdasarkan proses **Revenue & Receivables** dan subproses **Weighbridge & Quality Measurement**.
  3. Tinjau pemetaan risiko ke kontrol kunci:
     * `LOG-01`: *Weighbridge Calibration* (TLC, Detective, Frekuensi Bulanan, Sertifikasi Tera Metrologi).
     * `QC-01`: *Quality Certificate Approval* (TLC, Preventive, Otorisasi COA Batubara).
     * `BILL-01`: *HBA Price Verification* (TLC, Detective, Verifikasi Penyesuaian Kualitas ESDM).
  4. Klik tombol **Lihat Diagram BPM** (`/bpm`):
     * Amati visual swimlane standar Lampiran 3: Oval (Mulai/Selesai), Persegi (Aktivitas Lapangan), Belah Ketupat (Keputusan), Segitiga Terbalik (Arsip Tiket), Silinder (Sistem Timbangan), dan Hexagon (Simpul Risiko).
     * Pastikan seluruh kontrol kunci tertaut ke simpul aktivitas (*Unmapped Controls = 0*).
     * Tinjau tab **Transaction Details**: 50+ data transaksi pengiriman dan penimbangan batubara riil tahun 2026.

---

### Tahap 3: Control Self-Assessment / CSA (SK-5 Lampiran 7)
* **Aktor:** Lini 1 (`staff.ops@bumn.go.id`) & Lini 2 (`line2@bumn.go.id`)
* **Halaman Navigasi:** `/csa/worklist` dan `/csa`
* **Alur Skenario:**
  1. **Lini 1 Pengisian:**
     * Login sebagai `staff.ops@bumn.go.id`. Buka **CSA Workspace** (`/csa/worklist`).
     * Kontrol 1 (`QC-01`): Nilai *Effective*. Lengkapi kuesioner atribut A, B, C, D (Lampiran 7a). Unggah referensi sertifikat COA Carsurin. Submit ke Lini 2.
     * Kontrol 2 (`LOG-01`): Nilai *Ineffective*. Catat komentar: *"Pelaksanaan kalibrasi tera berkala oleh UPTD Metrologi tertunda 2 bulan karena kendala pengadaan vendor."* Submit ke Lini 2.
  2. **Lini 2 Validasi:**
     * Switch user / Login sebagai `line2@bumn.go.id`.
     * Buka tab **Verifikasi Lini 2**.
     * Tinjau asesmen `QC-01` → Klik **Validate** (Status menjadi *Validated / Effective*).
     * Tinjau asesmen `LOG-01` → Konfirmasi temuan *Ineffective* dan teruskan menjadi usulan defisiensi pengendalian internal.

---

### Tahap 4: Testing TOD & TOE (SK-5 Lampiran 8 & 9)
* **Aktor:** Lini 3 (`line3@bumn.go.id`) & Lini 2 (`line2@bumn.go.id`)
* **Halaman Navigasi:** `/testing`
* **Alur Skenario:**
  1. Buka menu **Testing Workbench** (`/testing`).
  2. **Uji Desain (Test of Design - TOD):**
     * Pilih kontrol `QC-01`.
     * Tinjau lembar kerja evaluasi **6 Pilar Desain Lampiran 8**:
       1. *Objective*: Apakah kontrol relevan memitigasi risiko kualitas batubara? (Ya)
       2. *Timing*: Apakah waktu otorisasi tepat sebelum batubara dimuat ke tongkang? (Ya)
       3. *Authority*: Apakah pejabat penandatangan memiliki delegasi wewenang sah? (Ya)
       4. *Reliability*: Apakah data acuan kalori/ash dapat diandalkan? (Ya)
       5. *Coverage*: Apakah mencakup 100% shipment ekspor dan domestik? (Ya)
       6. *Evidence*: Apakah terdapat jejak audit dokumen fisik & digital? (Ya)
     * Kesimpulan TOD: **Effective**.
  3. **Uji Efektivitas Operasi (Test of Operating Effectiveness - TOE):**
     * Pilih kontrol `LOG-01`.
     * Masukkan ukuran sampel 25 transaksi tiket timbang acak.
     * Catat hasil reperformance: Ditemukan 3 tiket timbang diterbitkan saat stiker tera metrologi telah kadaluarsa.
     * Kesimpulan TOE: **Ineffective** (Pengecualian melebihi toleransi deviasi). Otomatis memicu pembuatan tiket defisiensi.

---

### Tahap 5: Deficiency DoD Board, WBS Recap & Appendix 11 Sign-Off (SK-5 Lampiran 10 & 11)
* **Aktor:** Lini 2 (`line2@bumn.go.id`), Lini 3 (`line3@bumn.go.id`), & CFO (`cfo@bumn.go.id`)
* **Halaman Navigasi:** `/deficiencies`, `/reports/wbs`, dan `/reports`
* **Alur Skenario:**
  1. **Manajemen Defisiensi & Rencana Aksi (DoD Wizard):**
     * Buka **Deficiencies Board** (`/deficiencies`).
     * Tinjau tiket defisiensi aktif:
       * `def-001` (**Significant Deficiency**): Jembatan timbang terlambat tera ulang 2 bulan (Nilai eksposur: Rp 5 Miliar).
       * `def-002` (**Material Weakness**): Salah saji cut-off pengakuan pendapatan pengapalan akhir tahun (Nilai eksposur: Rp 12.5 Miliar).
     * Klik tiket `def-001` > Buka **Action Plan** > Tinjau rencana perbaikan UPTD Metrologi Legal oleh Manager Logistik (Status: *In Progress*).
  2. **Integrasi Whistleblowing System (WBS):**
     * Buka menu **WBS Recap** (`/reports/wbs`).
     * Amati integrasi laporan WBS indikator kecurangan penimbangan/hauling kontraktor batubara (Lampiran 1 Prinsip 14 & 15).
  3. **Pelaporan Regulasi Asesmen Manajemen (Lampiran 11):**
     * Login sebagai `cfo@bumn.go.id`. Buka menu **Regulatory Reports** (`/reports`).
     * Sistem secara otomatis menghitung efektivitas pengendalian berdasarkan agregasi temuan:
       * 1 Material Weakness belum selesai remediasi → Kesimpulan Efektivitas: **"Efektif Sebagian dengan Catatan / Mengandung Kelemahan Material (Ineffective)"**.
     * Tinjau rincian pernyataan manajemen dan dokumen kepatuhan BUMN.
     * Klik tombol **Digital Sign-off & Lock**:
       * Sistem menerbitkan stempel digital terenkripsi beserta Hash Verifikasi SHA-256.
       * Dokumen terkunci dari perubahan ad-hoc (*tamper-proof*).
       * QR Code verifikasi dokumen siap dipindai untuk validasi integritas audit.

---

## 4. Validasi Portal KAP (External Assurance & Cooling-Off Bab II)
* **Aktor:** External Auditor (`external@bumn.go.id`)
* **Halaman Navigasi:** `/audit`
* **Alur Skenario:**
  1. Login sebagai `external@bumn.go.id`.
  2. Buka **External Assurance Portal** (`/audit`).
  3. Sistem memvalidasi kepatuhan **Cooling-Off 12 Bulan** (Bab II SK-5) sebelum memberikan akses lembar kerja.
  4. KAP Partner dapat mengunduh seluruh kertas kerja CSA, TOD, TOE, dan Asesmen Manajemen Lampiran 11 yang telah ditandatangani secara digital.

---

## 5. Eksekusi Pengujian Otomatis Demo E2E & Pemulihan Data

### A. Menjalankan Suite Otomatis E2E
Seluruh 5 tahapan skenario end-to-end beserta validasi portal KAP telah diotomatisasi ke dalam test runner suite:
```bash
npm run test:e2e:demo
```
Suite pengujian ini memverifikasi integrasi regulasi secara menyeluruh:
1. **Persona & Authorization Matrix**: Keberadaan seluruh persona demo PT BNS (Staff Ops, Manager Ops, Lini 2, Lini 3, CFO, External Auditor KAP, Administrator) dan kepatuhan kapabilitas wewenang berjenjang (`shared/entity-authority.ts`).
2. **Kalkulasi Scoping Materialitas**: Ambang batas OM (5% = Rp 25 Miliar) dan PM Haircut 75% (Rp 18.75 Miliar), penyaringan akun FSLI kuantitatif in-scope via `shared/scoping-materiality.ts`, serta alur approval berjenjang (`shared/workflow-transitions.ts`).
3. **RCM & BPM Linkage**: Relasi kontrol kunci batubara (`LOG-01`, `QC-01`, `BILL-01`) terhadap langkah proses operasional batubara.
4. **Siklus CSA Lini 1 & Validasi Lini 2**: Pengujian alur pengisian kontrol efektif dan tidak efektif beserta bukti pendukung dan status validasi.
5. **TOD 6-Pilar & TOE Defisiensi**: Evaluasi kepatuhan 6 pilar desain Lampiran 8 dan deteksi deviasi Zero-Tolerance sampel operasional tiket timbang via `shared/testing-decision.ts`.
6. **Agregasi Defisiensi, WBS, & Digital Sign-off**: Penentuan opini efektivitas manajemen (Lampiran 11) via `shared/deficiency-summary.ts`, integrasi indikator fraud WBS, dan proteksi integritas hash SHA-256 dokumen tamper-proof.
7. **Independensi Auditor Eksternal (KAP)**: Kepatuhan aturan Cooling-Off 12 Bulan (Bab II SK-5) via `shared/cooling-off.ts`.

### B. Pemulihan & Pengisian Ulang Data Demo (Idempotent)
Untuk mengisi atau menyinkronkan data demo kapan saja:
```bash
npm run seed
```
Skrip ini memanggil `npx tsx scripts/run-seed.ts` secara non-destruktif dan idempotent (*onConflictDoNothing* / *onConflictDoUpdate*). Data operasional yang ada tidak akan rusak atau terhapus.
