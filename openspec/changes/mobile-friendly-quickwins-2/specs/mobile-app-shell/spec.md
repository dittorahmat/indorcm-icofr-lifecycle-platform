## Purpose

Membuat aplikasi terasa seperti aplikasi asli saat dibuka dari ponsel (identitas PWA dasar) sekaligus hemat baterai, kuota, dan waktu muat melalui perilaku pemuatan yang sadar-mobile.

## ADDED Requirements

### Requirement: Identitas aplikasi mobile dasar
Sistem SHALL menyajikan `theme-color`, ikon sentuh Apple, dan `manifest.webmanifest` yang valid sehingga browser mobile menampilkan warna status bar yang benar dan pengguna dapat menambahkan aplikasi ke layar utama.

#### Scenario: Membuka aplikasi dari Chrome Android
- **WHEN** pengguna membuka aplikasi di Chrome Android
- **THEN** warna status bar mengikuti warna tema aplikasi dan menu browser menawarkan "Add to Home screen" dengan ikon yang benar

### Requirement: Polling hemat di sesi mobile
Sistem SHALL menghindari polling agresif pada interval tetap untuk data badge navigasi; pembaruan badge dilakukan saat fokus kembali ke aplikasi atau pada interval yang jauh lebih jarang, tanpa menghilangkan informasi antrean.

#### Scenario: Aplikasi diam di saku
- **WHEN** aplikasi terbuka tetapi tidak aktif selama 10 menit di HP
- **THEN** sistem tidak membanjiri jaringan dengan permintaan badge berulang, dan angka badge diperbarui saat pengguna kembali fokus ke aplikasi

### Requirement: Code-splitting halaman berat
Sistem SHALL memuat halaman berat (rute dengan bundle besar) secara malas (lazy) dengan fallback skeleton, sehingga waktu muat pertama di jaringan seluler berkurang.

#### Scenario: Muat pertama di jaringan seluler
- **WHEN** pengguna pertama kali membuka aplikasi di koneksi 4G
- **THEN** hanya bundle rute awal yang diunduh, dan navigasi ke halaman berat menampilkan skeleton selagi chunk diunduh
