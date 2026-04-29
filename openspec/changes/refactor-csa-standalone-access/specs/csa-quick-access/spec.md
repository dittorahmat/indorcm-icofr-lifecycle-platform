## ADDED Requirements

### Requirement: Direct CSA Access from BPM
Sistem HARUS memicu pembukaan modal khusus CSA (Control Self Assessment) ketika user mengklik nama Sub-Proses pada tabel daftar di `BPMPage`.

#### Scenario: Membuka CSA Modal dari daftar sub-proses
- **WHEN** User mengklik link nama sub-proses di tabel `BPMPage`
- **THEN** Sistem menampilkan `CSAModal` yang langsung memuat tab assessment untuk control pertama yang terkait dengan sub-proses tersebut.

### Requirement: Standalone CSA Modal Wrapper
Sistem HARUS memiliki komponen `CSAModal` yang membungkus logic `CSATabContent` secara independen, memungkinkan akses cepat ke assessment tanpa harus membuka tab RCM/Worksheet.

#### Scenario: Menutup CSA Modal tanpa kehilangan data
- **WHEN** User mencoba menutup `CSAModal` saat ada perubahan data yang belum disimpan
- **THEN** Sistem menampilkan `UnsavedChangesDialog` untuk konfirmasi.
