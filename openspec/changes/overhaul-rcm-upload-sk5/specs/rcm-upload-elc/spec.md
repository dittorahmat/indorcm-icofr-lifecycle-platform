## ADDED Requirements

### Requirement: Impor RCM Entity Level Control (ELC)
Sistem SHALL memungkinkan pengguna mengimpor data RCM ELC menggunakan file CSV dengan format 18 kolom sesuai Lampiran 5.a SK-5/2024.

#### Scenario: Berhasil impor ELC dengan Prinsip COSO
- **WHEN** pengguna mengunggah file CSV ELC dengan kolom Prinsip_1 sampai Prinsip_17 berisi "Y" atau "T"
- **THEN** sistem menyimpan data kontrol ke tabel `controls` dengan level "ELC" dan memetakan nilai "Y" ke array `cosoPrinciples` di database.

### Requirement: Impor RCM IT General Control (ITGC)
Sistem SHALL memungkinkan pengguna mengimpor data RCM ITGC menggunakan file CSV dengan format 19 kolom sesuai Lampiran 5.c SK-5/2024.

#### Scenario: Berhasil impor ITGC dengan Aplikasi Pendukung
- **WHEN** pengguna mengunggah file CSV ITGC yang mencantumkan nama aplikasi di kolom `Aplikasi_Pendukung`
- **THEN** sistem memvalidasi keberadaan aplikasi tersebut di tabel `applications` dan menyimpan relasinya.
