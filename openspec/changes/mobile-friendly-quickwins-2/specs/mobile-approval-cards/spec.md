## Purpose

Memberikan tampilan kartu vertikal yang ramah jempol untuk antrean Simulation Approval di ponsel, sehingga eksekutif dapat meninjau dan membuka dialog review tanpa menggeser tabel horizontal.

## ADDED Requirements

### Requirement: Antrean approval sebagai kartu di viewport kecil
Sistem SHALL menyembunyikan tabel horizontal 8 kolom dan menampilkan setiap simulasi sebagai kartu vertikal terstruktur pada viewport di bawah 768px (`md`), dengan tabel standar tetap dipakai pada `md` ke atas.

#### Scenario: Membuka antrean approval di HP
- **WHEN** pengguna membuka halaman Approval pada viewport 360px
- **THEN** sistem menampilkan tiap simulasi sebagai kartu yang memuat nama simulasi, status, basis, % OM, % haircut, nilai OM/PM, dan tombol Review
- **AND** tombol Review memiliki area sentuh minimal 44x44px

#### Scenario: Membuka antrean approval di desktop
- **WHEN** pengguna membuka halaman Approval pada viewport 1024px
- **THEN** sistem merender tabel 8 kolom standar seperti sebelumnya

### Requirement: Dialog review dapat digulir penuh di mobile
Sistem SHALL memastikan dialog review approval terbatasi dalam viewport (`max-h-[90vh]` dengan area konten bergulir) sehingga catatan dan tombol Approve/Reject selalu terjangkau di layar kecil.

#### Scenario: Review simulasi di HP
- **WHEN** pengguna mengetuk Review pada kartu simulasi di viewport 360px
- **THEN** dialog terbuka dalam batas layar, konten worksheet dapat digulir, dan tombol aksi tidak terpotong
