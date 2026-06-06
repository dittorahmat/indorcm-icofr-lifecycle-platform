## ADDED Requirements

### Requirement: Impor RCM IT General Control (ITGC)
Sistem SHALL memungkinkan pengguna mengimpor data RCM ITGC menggunakan file CSV dengan format 19 kolom sesuai Lampiran 5.c SK-5/2024.

#### Scenario: Berhasil impor ITGC dengan Aplikasi Pendukung
- **WHEN** pengguna mengunggah file CSV ITGC yang mencantumkan nama aplikasi di kolom `Aplikasi_Pendukung`
- **THEN** sistem memvalidasi keberadaan aplikasi tersebut di tabel `applications` dan menyimpan relasinya.
