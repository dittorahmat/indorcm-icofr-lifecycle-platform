## Purpose

Menegakkan keterbacaan minimum pada tampilan audit yang dibuka dari ponsel, sehingga teks regulasi tidak pernah mengecil di bawah 12px dan form tidak gepeng di viewport sempit.

## ADDED Requirements

### Requirement: Tipografi tabel minimum 12px di mobile
Sistem SHALL merender seluruh header dan sel tabel audit dengan ukuran font minimal 12px (`text-xs` atau lebih besar) pada semua viewport.

#### Scenario: Header tabel Reports terbaca di HP
- **WHEN** pengguna membuka halaman Reports pada viewport 360px
- **THEN** setiap teks header kolom memiliki tinggi huruf minimal 12px dan tidak ada teks berukuran 10px

### Requirement: Grid form responsif di viewport kecil
Sistem SHALL menumpuk kolom grid form menjadi satu kolom pada viewport di bawah breakpoint `sm`, dan hanya memakai multi-kolom pada `sm` ke atas.

#### Scenario: Form simulasi scoping di HP
- **WHEN** pengguna membuka form simulasi scoping pada viewport 360px
- **THEN** seluruh field tersusun vertikal satu kolom tanpa teks terpotong atau meluap horizontal
