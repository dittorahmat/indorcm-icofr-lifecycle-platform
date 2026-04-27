## ADDED Requirements

### Requirement: Library Seleksi Aplikasi di RCM
Sistem WAJIB menggunakan data dari Library Aplikasi pusat untuk mengisi kolom "Aplikasi Pendukung" di Matriks TLC dan ITGC.

#### Scenario: Memilih aplikasi pendukung di RCM
- **WHEN** pengguna mengedit baris kontrol di Matriks TLC atau ITGC
- **THEN** input teks pada kolom "Aplikasi Pendukung" diganti dengan komponen Select yang terhubung ke Library pusat
- **AND** sistem menyimpan referensi ID aplikasi tersebut ke database kontrol
