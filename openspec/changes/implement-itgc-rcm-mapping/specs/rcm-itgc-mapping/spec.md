## ADDED Requirements

### Requirement: Visualisasi Matriks ITGC (Lampiran 5.c)
Sistem SHALL menampilkan halaman khusus `RCMITGCPage` yang menyajikan data Risiko dan Kontrol khusus kategori ITGC dalam format tabel horizontal sesuai standar Regulation SK-5/2024 Lampiran 5.c.

#### Scenario: Navigasi ke Matriks ITGC
- **WHEN** user membuka menu RCM dan memilih tab "ITGC"
- **THEN** sistem menampilkan tabel dengan kolom: No, Proses Bisnis, Sub-proses, Perusahaan, Lokasi, Risiko, Ref Kontrol, Nama Kontrol, Deskripsi Kontrol, Dokumen Pendukung, Kontrol Utama, Preventif/Detektif, Sifat Pelaksanaan, Jenis Pengendalian Otomatis, dan Aplikasi Pendukung.

### Requirement: Filter Metadata ITGC
Pada halaman `RCMITGCPage`, sistem SHALL menyembunyikan kolom Asersi Laporan Keuangan dan Information Processing Objective (IPO).

#### Scenario: Verifikasi Kolom ITGC
- **WHEN** user melihat tabel Matriks ITGC
- **THEN** sistem TIDAK menampilkan kolom C, A, V, RA (IPO) maupun Existence, Completeness, Accuracy (Asersi LK) untuk menjaga konsistensi dengan Lampiran 5.c.
