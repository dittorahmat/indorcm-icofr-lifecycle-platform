## ADDED Requirements

### Requirement: Tabular Visualization of Lampiran 8
Sistem WAJIB menampilkan data verifikasi rancangan pengendalian dalam format tabel tabular yang mencakup 35 kolom sesuai mandat Lampiran 8 Regulasi SK-5/DKU.MBU/11/2024.

#### Scenario: Menampilkan tabel verifikasi
- **WHEN** user menavigasi ke menu "Reporting & RCM" > "Verifikasi Rancangan (Lampiran 8)"
- **THEN** sistem menampilkan tabel dengan kolom beku (sticky) untuk No dan Referensi Pengendalian
- **AND** sistem menampilkan data awal yang ditarik dari RCM (Lini 1)

### Requirement: Editor Verifikasi Rancangan (Popup Modal)
Sistem WAJIB menyediakan antarmuka pengeditan berupa popup modal untuk mengisi metadata pengujian TOD (Test of Design).

#### Scenario: Membuka modal edit
- **WHEN** user (Lini 2 atau Admin) mengklik icon pensil pada baris pengendalian
- **THEN** sistem menampilkan modal form yang terbagi menjadi tab/bagian (Informasi Dasar, Asersi, Hasil Pengujian)
- **AND** form terisi otomatis dengan data yang sudah ada

### Requirement: Penyimpanan Data TOD
Sistem WAJIB menyimpan metadata hasil pengujian TOD secara permanen ke dalam database.

#### Scenario: Menyimpan hasil verifikasi
- **WHEN** user mengklik tombol "Simpan" di modal editor setelah melakukan perubahan
- **THEN** sistem melakukan validasi input (Zod)
- **AND** sistem mengirimkan request PATCH ke backend
- **AND** sistem memperbarui tampilan tabel secara real-time (Optimistic Update)

### Requirement: RBAC untuk Pengeditan
Sistem WAJIB membatasi akses pengeditan (icon pensil dan submit) hanya untuk user dengan peran Lini 2 (ICOFR Function) atau Admin.

#### Scenario: User non-Lini 2 mengakses halaman
- **WHEN** user dengan role Lini 1 mengakses halaman Lampiran 8
- **THEN** sistem hanya menampilkan data (Read-only)
- **AND** sistem menyembunyikan icon pensil pengeditan
