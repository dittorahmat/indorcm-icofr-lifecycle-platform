## Purpose

Memungkinkan Lini 1 menyelesaikan pekerjaan lapangan (CSA, evidence foto, todo) dari HP tanpa harus membuka tabel desktop yang lebar, sambil menjaga tabel berat tetap aman dibaca.

## ADDED Requirements

### Requirement: Kartu CSA lapangan
The system SHALL menampilkan assessment CSA Lini 1 sebagai kartu vertikal touch-friendly pada viewport < 768px, memuat Process, Unit, status Lini 2, dan aksi verifikasi — sebagai alternatif tabel desktop, bukan pengganti logika validasi.

#### Scenario: Membuka CSA di HP
- **WHEN** Lini 1 membuka halaman CSA pada viewport < 768px
- **THEN** sistem SHALL menyembunyikan tabel multi-kolom desktop
- **AND** sistem SHALL menampilkan tiap assessment sebagai kartu dengan Process, Unit, status Lini 2, dan tombol aksi >= 44px
- **AND** mengetuk kartu SHALL membuka detail/bottom-sheet berisi atribut kepatuhan lengkap

#### Scenario: Membuka CSA di desktop
- **WHEN** Lini 1 membuka halaman CSA pada viewport >= 768px
- **THEN** sistem SHALL tetap menampilkan tabel desktop penuh

### Requirement: Upload evidence satu tangan
The system SHALL menyediakan trigger upload foto/file evidence pada kartu CSA mobile yang dapat dijangkau jempol, memicu pemilih file/kamera bawaan perangkat.

#### Scenario: Memotret evidence walkthrough
- **WHEN** Lini 1 mengetuk tombol evidence pada kartu CSA di HP
- **THEN** sistem SHALL membuka pemilih file/kamera perangkat
- **AND** file yang dipilih SHALL terpratinjau sebelum disimpan sebagai evidence CSA

### Requirement: Antrian todo mobile Lini 1
The system SHALL menyajikan todo/tugas Lini 1 sebagai daftar vertikal di mobile dengan prioritas mendesak di atas, setara peran ActionCenter di dashboard.

#### Scenario: Cek kerjaan di lapangan
- **WHEN** Lini 1 membuka Todo di HP
- **THEN** sistem SHALL menampilkan tugas belum selesai sebagai kartu vertikal terurut urgensi
- **AND** tiap kartu SHALL memuat aksi lanjutan (buka CSA / unggah evidence) dalam jangkauan jempol

### Requirement: Read-only jujur untuk tabel berat
The system SHALL menampilkan tabel berat (BPMWorksheet, Testing TOD/TOE, Scoping matrix, Lampiran 6/8) di mobile sebagai ringkasan read-only + banner eksplisit "buka di desktop untuk edit", tanpa menghilangkan akses baca data.

#### Scenario: Membuka BPMWorksheet di HP
- **WHEN** pengguna membuka BPMWorksheet pada viewport < 768px
- **THEN** sistem SHALL menampilkan ringkasan baca (kolom kunci saja, tanpa scroll horizontal paksa)
- **AND** sistem SHALL menampilkan banner bahwa editing penuh membutuhkan desktop

### Requirement: Ergonomi institusional mobile
The system SHALL menegakkan target sentuh >= 44px, font >= 12px, radius institusional (`rounded-md/lg`), tanpa italic dekoratif/glassmorphism, dan seluruh string via i18n — mengikuti standar anti-AI slop proyek.

#### Scenario: Audit visual mobile
- **WHEN** halaman lapangan dirender di 360–390px
- **THEN** tidak ada teks terpotong, tidak ada scroll horizontal halaman, dan semua tombol memenuhi 44px
