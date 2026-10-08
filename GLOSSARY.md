# Domain Glossary: IndoGRC Pro ICOFR Lifecycle Platform

## Core Domain Terms

### RCM (Risk and Control Matrix)
Matriks formal kepatuhan ICOFR sesuai Regulasi BUMN SK-5/DKU.MBU/11/2024 yang mendokumentasikan pemetaan antara risiko pelaporan keuangan dengan aktivitas pengendalian internal. Terbagi menjadi tiga tingkatan:
- **TLC (Transaction Level Control)**: Matriks pengendalian tingkat proses transaksi bisnis (Lampiran 5 b), terkait langsung dengan akun signifikan (FSLI) dan langkah-langkah alur operasional pada BPM.
- **ELC (Entity Level Control)**: Matriks pengendalian tingkat entitas yang menguji kepatuhan terhadap 17 Prinsip COSO (Lampiran 5 a).
- **ITGC (IT General Control)**: Matriks pengendalian umum teknologi informasi pendukung sistem pelaporan keuangan (Lampiran 5 c) yang mencakup 4 domain: Manage Access, Manage Program Changes, Manage IT Operations, dan Develop Systems.

### BPM (Business Process Mapping)
Diagram visual pemetaan alur proses bisnis sesuai standar simbol Lampiran 3 SK-5/DKU.MBU/11/2024 (Oval untuk Start/End, Persegi untuk Aktivitas, Belah Ketupat untuk Keputusan, Segitiga Terbalik untuk Arsip, Silinder untuk Sistem/Data Media, Trapesium untuk Operasi Manual, dan Lajur Kolom untuk Swimlane).

### Control Linkage (Tautan Pengendalian)
Relasi eksplisit antara entitas kontrol (`controls`), risiko (`rcms`), dan simpul visual pada diagram proses bisnis (`bpm_node_rcms` dan `node.data.regulatoryPairs`). Memungkinkan auditor atau penguji melihat di langkah alur kerja mana suatu kontrol kunci dijalankan.

### Unmapped Controls
Daftar aktivitas pengendalian yang telah dicatat dalam RCM namun belum ditautkan ke simpul alur spesifik pada diagram BPM. Disediakan dalam panel shape palette kanvas BPM untuk penautan interaktif.

### Auto-Reconciliation / Auto-Link
Mekanisme pencocokan baris kontrol dalam berkas impor RCM terhadap simpul diagram BPM yang ada menggunakan referensi kode simpul (`Ref_Langkah_BPM`) dan kemiripan semantik label teks alur, dilengkapi dialog pratinjau konfirmasi sebelum komit ke basis data.
