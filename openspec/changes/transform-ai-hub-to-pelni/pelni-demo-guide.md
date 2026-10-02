# Panduan Presentasi & Narasi Demo AI Hub — PT PELNI (Persero)

Dokumen ini disusun sebagai panduan bagi presenter / solution architect saat mendemonstrasikan halaman **AI Analytics Hub (`/ai-hub`)** di hadapan jajaran manajemen, Komite Audit, SPI (Satuan Pengawasan Intern), atau Tim Pengendalian Internal PT PELNI (Persero).

---

## 1. Konteks Regulasi & Nilai Strategis untuk PT PELNI

Sesuai **Peraturan Menteri BUMN No. SK-5/DKU.MBU/11/2024**, BUMN wajib menyelenggarakan Pengendalian Internal atas Pelaporan Keuangan (ICOFR) yang terstandarisasi, terdokumentasi, dan mampu mendeteksi potensi kecurangan (*fraud*) serta deviasi material.

Bagi PT PELNI, tantangan terbesar ICOFR terletak pada **wilayah operasional armada yang tersebar di laut (off-shore / lintas pulau)**, melibatkan volume transaksi fisik yang sangat tinggi:
1. **Bahan Bakar Minyak (BBM/Bunker)**: Komponen biaya terbesar operasional kapal (HFO/MDO) yang rentan deviasi dan *leakage*.
2. **Subsidi Perintis & PSO (Public Service Obligation)**: Akuntabilitas klaim subsidi pemerintah berdasarkan realisasi tiket dan manifes penumpang.
3. **Kargo Tol Laut & Petikemas**: Penatausahaan kontainer, tarif angkut, dan pencegahan muatan tidak bertiket (*off-manifest*).
4. **Pemeliharaan Armada (Dry-Docking)**: Pengadaan suku cadang dan belanja modal perbaikan kapal di galangan yang bernilai ratusan miliar.

---

## 2. Struktur Alur Demo (Storyline 3 Langkah)

Saat membuka halaman `/ai-hub`, jalankan presentasi dengan alur **Makro (Eksekutif) ➔ Mikro (AI Engines) ➔ Real-time (Continuous Monitoring)**.

```
┌─────────────────────────────────────────────────────────────┐
│ 1. DATA ANALYTICS (Slide 8)                                 │
│    "Helicopter View: Efisiensi Biaya Armada & Kepatuhan PSO"│
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. AI USE CASES (Slide 9)                                   │
│    "Deep-Dive: 6 Mesin AI Spesifik Operasi Maritim"         │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. CCM MONITORING (Slide 10)                                │
│    "Automated Guardrails: Deteksi Anomali Secara Real-time" │
└─────────────────────────────────────────────────────────────┘
```

---

## 3. Script Narasi Per Bagian

### Bagian 1: Tab "Data Analytics" (Slide 8)
*Tujuan: Menunjukkan kepada Direksi/VP Akuntansi bahwa sistem mampu mengintegrasikan data operasional armada kapal langsung ke metrik pengendalian keuangan.*

* **Hero Chart: *Bunker Fuel Consumption vs Nautical Miles Sailed***
  > *"Bapak/Ibu sekalian, grafik ini mengkorelasikan jarak tempuh operasional kapal (dalam Mil Laut) dengan konsumsi bahan bakar kapal MDO/HFO setiap bulannya. Jika garis konsumsi melonjak tanpa kenaikan mil laut yang proporsional, sistem otomatis menandai adanya inefisiensi mesin atau potensi penyimpangan bunker."*
* **KPI Utama: *Bunker Discrepancy Rate (1.82%)***
  > *"Kita dapat memantau deviasi antara volume sounding BBM di tangki kapal dengan bukti serah terima (Bunker Delivery Note). Di angka 1.82%, posisi PELNI saat ini berada dalam batas aman toleransi audit (ambang batas SK-5: 2.00%)."*
* **KPI Operasional: *Unreconciled PSO & Port Clearance (28 Items)***
  > *"Ini adalah 28 transaksi pelayaran perintis yang tiket e-ticketing-nya belum sepenuhnya tervalidasi dengan manifest embarkasi di dermaga. Sistem menyoroti ini secara otomatis agar tidak menjadi temuan BPKP saat verifikasi tagihan subsidi PSO ke Kemenhub."*
* **Mini Chart: *Fleet On-Time Performance (OTP) by Cluster***
  > *"Tingkat kepatuhan jadwal armada: Kapal Penumpang Utama mencapai 94%, Tol Laut Barang 91%, dan Perintis 89%. Keterlambatan jadwal berbanding lurus dengan biaya pelabuhan (port disbursement) tambahan."*
* **Enterprise Risk Indicators (Grid Bawah)**:
  * **Off-manifest Container Alert (3 Unit)**: Muatan terdeteksi fisik di atas kapal tanpa dokumen manifes sah di sistem.
  * **Docking Cost Overrun (2 Kapal)**: Realisasi pekerjaan galangan melebihi RAB awal > 10%.
  * **Bunkering Density Anomaly (4 Kasus)**: Deviasi berat jenis BBM saat pengisian di pelabuhan singgah.

---

### Bagian 2: Tab "AI Use Cases" (Slide 9)
*Tujuan: Menunjukkan kecanggihan automasi audit ICOFR dengan 6 model AI maritim yang bisa di-drilldown untuk melihat bukti transaksi.*

1. **Bunker & Fuel Anomaly Engine (`bunker-anomaly`)**
   * *Cara Presentasi*: Klik kartu ini untuk membuka drilldown.
   * *Narasi*: *"Mesin ini membaca telemetri kapal, kecepatan (*knots*), dan konsumsi SFOC (Specific Fuel Oil Consumption). Pada grafik scatter, titik-titik merah di pojok kanan atas menunjukkan pengisian BBM berlebih yang tidak lazim pada kapal tertentu saat berlayar di perairan tenang. Auditor internal tidak perlu memeriksa logbook manual ribuan lembar; AI langsung menyajikan temuannya lengkap dengan nomor voyage dan tanggal pengisian."*

2. **Predictive Docking & Spare Part Procurement (`predictive-docking`)**
   * *Narasi*: *"Docking tahunan kapal merupakan belanja capex/opex yang masif. AI mengevaluasi galangan kapal menggunakan Radar Analysis untuk membandingkan biaya riil vs estimasi RAB, kualitas suku cadang OEM, dan ketepatan waktu serah-terima kapal."*

3. **Automated PSO Subsidy & Ticket Recon (`pso-ticket-recon`)**
   * *Narasi*: *"Mengantisipasi selisih klaim subsidi pemerintah. Algoritma melakukan *three-way matching* antara data e-ticketing PELNI, gerbang barcode boarding pass di pelabuhan, dan kuota pagu PSO Kemenhub per trayek pelayaran (misal trayek R-14 Ambon - Saumlaki)."*

4. **Cargo Demurrage & Slot Leakage (`cargo-leakage`)**
   * *Narasi*: *"Memastikan seluruh petikemas berpendingin (reefer) dan kontainer Tol Laut tercatat tagihan slot muatannya serta menghitung denda keterlambatan (demurrage) secara otomatis tanpa celah gratifikasi."*

5. **Port Disbursement & Agency Billing NLP (`port-disbursement-nlp`)**
   * *Narasi*: *"Membaca nota tagihan jasa pandu, tunda, dan labuh dari agen kapal di puluhan pelabuhan menggunakan NLP, lalu mencocokkannya dengan Surat Keputusan tarif resmi Pelindo. Sistem langsung menandai *overbilling* jasa kepelabuhanan."*

6. **Vessel Crew Payroll & Per Diem Validation (`crew-payroll`)**
   * *Narasi*: *"Memvalidasi perhitungan uang layar dan insentif ABK berdasarkan tanggal *crew sign-on/sign-off* di logbook resmi nakhoda, mencegah manipulasi jam layar fiktif."*

---

### Bagian 3: Tab "CCM Monitoring" (Slide 10)
*Tujuan: Memperlihatkan bahwa pengawasan internal PELNI beralih dari 'Audit Pasca-Kejadian' (Post-Audit) menjadi 'Pengawasan Berkelanjutan Real-Time' (Continuous Control Monitoring).*

* **Alert Feed Real-Time**:
  > *"Di layar ini, setiap penyimpangan kontrol di kapal maupun kantor cabang langsung memicu notifikasi peringatan. Contohnya:"*
  * **Alert Merah (High)**: *"Pukul 10:42 WIB tadi terdeteksi variasi densitas BBM pada KM Kelud sebesar -4.2% saat pengisian di Tanjung Priok."*
  * **Alert Merah (High)**: *"Pukul 08:30 WIB terbit Purchase Order perbaikan darurat galangan untuk KM Bukit Siguntang senilai > Rp 500 Juta yang melampaui matriks kewenangan Cabang."*
  * **Alert Kuning (Medium)**: *"Penginputan logbook BBM dilakukan terlambat 8 hari (backdated) pada Trayek R-14."*
* **Skor Efektivitas Pengendalian (98.4%)**:
  > *"Secara keseluruhan, sistem mengkalkulasi skor kesehatan ICOFR armada maritim PELNI secara dinamis, sehingga Direksi dan Komite Audit memiliki kepastian pelaporan keuangan setiap saat, bukan hanya di akhir tahun buku."*

---

## 4. Tips Menjawab Pertanyaan Kritis Manajemen PELNI

* **T: *"Apakah data telemetri kapal dan tiket ini harus terhubung langsung ke mesin kapal?"***
  * **J**: *"Sistem dirancang modular. Pada tahap awal, platform dapat menyerap data melalui integrasi API sistem ERP (misal SAP), sistem e-ticketing PELNI, atau unggah berkas logbook operasional bulanan secara otomatis. Namun, platform juga siap menerima koneksi IoT sensor bahan bakar kapal."*
* **T: *"Bagaimana kesesuaiannya dengan kriteria pemeriksaan BPK / BPKP?"***
  * **J**: *"Seluruh parameter pengujian (reconciliation, voucher threshold, approval matrix) telah dipetakan ke standar uji petik BPK/BPKP dan Lampiran 2 SK-5 BUMN untuk Klaster Logistik & Transportasi."*
