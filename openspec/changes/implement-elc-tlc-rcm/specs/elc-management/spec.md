## ADDED Requirements

### Requirement: Manajemen Prinsip COSO
Sistem HARUS menyediakan antarmuka untuk mengelola kontrol yang dipetakan ke 17 Prinsip COSO sebagai bagian dari Entity Level Control (ELC).

#### Scenario: User menambah kontrol ELC
- **WHEN** user dengan role "Line 2" atau "Admin" membuka Tab ELC di RCM Manager dan mengklik tombol "Add ELC"
- **THEN** sistem menampilkan form yang mewajibkan pengisian Prinsip COSO (1-17), Deskripsi Aktivitas, dan Pelaksana
- **AND** sistem mengizinkan pengunggahan file PDF sebagai bukti kebijakan

### Requirement: Pembatasan Akses ELC
Sistem HARUS membatasi visibilitas dan kemampuan edit Tab ELC hanya untuk peran yang berwenang.

#### Scenario: Akses oleh Lini 1
- **WHEN** user dengan role "Line 1" membuka halaman RCM Manager
- **THEN** sistem menyembunyikan Tab ELC dan hanya menampilkan Tab TLC (Operasional)

#### Scenario: Akses oleh Lini 2
- **WHEN** user dengan role "Line 2" atau "Admin" membuka halaman RCM Manager
- **THEN** sistem menampilkan Tab TLC dan Tab ELC secara berdampingan
