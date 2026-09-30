## Purpose

Memberikan inspeksi BPM yang nyaman di ponsel dengan mode lihat-saja (daftar kartu, viewer cubit-zoom, property bottom-sheet), sehingga auditor lapangan dapat memeriksa alur proses tanpa dipaksa memakai editor desktop yang tidak ergonomis untuk jempol.

## ADDED Requirements

### Requirement: Daftar diagram sebagai kartu di viewport kecil
Sistem SHALL menampilkan daftar diagram BPM sebagai kartu vertikal (nama diagram, proses induk, status, jumlah node) dengan kolom pencarian full-width pada viewport di bawah 768px (`md`), menggantikan daftar tabel/scroll horizontal.

#### Scenario: Mencari diagram di HP
- **WHEN** pengguna membuka halaman BPM pada viewport 360px
- **THEN** sistem menampilkan kartu diagram yang dapat digulir vertikal dengan kolom pencarian selebar layar di atasnya
- **AND** mengetuk kartu membuka viewer read-only diagram tersebut

### Requirement: Viewer read-only dengan pan dan zoom
Sistem SHALL membuka diagram dalam viewer full-viewport yang mendukung pan (seret) dan pinch-zoom pada perangkat sentuh, dengan toolbar penyuntingan (tambah node, routing edge, panel properti edit) disembunyikan di bawah 768px (`md`) dan digantikan penanda "Mode Lihat" yang eksplisit beserta petunjuk membuka desktop untuk menyunting.

#### Scenario: Memeriksa alur di lapangan
- **WHEN** pengguna membuka diagram 30 node di HP
- **THEN** sistem merender seluruh node/edge dengan legenda Lampiran 3 yang tetap terbaca (min 12px), mendukung cubit-zoom hingga detail label terbaca, dan tidak ada kontrol edit yang dapat terpicu tidak sengaja
- **AND** penanda "Mode Lihat — sunting di desktop" selalu terlihat selama viewer terbuka

### Requirement: Property node sebagai bottom-sheet read-only
Sistem SHALL menampilkan detail node (risiko, kontrol, asersi, evidence terkait) dalam bottom-sheet read-only saat node diketuk di viewport kecil, dengan tombol aksi yang mengarah ke alur kerja yang didukung mobile (mis. buka CSA terkait) dan tombol "Sunting di Desktop" yang informatif (bukan dead-end).

#### Scenario: Mengetuk node risiko di HP
- **WHEN** pengguna mengetuk node risiko pada viewer mobile
- **THEN** sistem membuka bottom-sheet berisi seluruh atribut regulasi node tersebut dalam format daftar vertikal yang dapat digulir, plus tautan ke CSA/RCM terkait bila ada

### Requirement: Worksheet lebar sebagai ringkasan kartu
Sistem SHALL menyajikan worksheet BPM (2500px), VerificationDesign (4200px), dan Lampiran6 Log (1200px) sebagai ringkasan kartu (kolom kunci + status) pada viewport kecil, dengan tabel penuh yang tetap dapat diakses dalam container scroll horizontal terkunci (tidak melebarkan halaman) dan tombol unduh bila tersedia.

#### Scenario: Membuka worksheet di HP
- **WHEN** pengguna membuka worksheet BPM pada viewport 360px
- **THEN** sistem menampilkan ringkasan kartu per baris terlebih dahulu, dan tabel penuh hanya bergulir di dalam bingkainya sendiri tanpa menyebabkan overflow halaman
- **AND** tidak ada teks di bawah 12px pada tampilan ringkasan
