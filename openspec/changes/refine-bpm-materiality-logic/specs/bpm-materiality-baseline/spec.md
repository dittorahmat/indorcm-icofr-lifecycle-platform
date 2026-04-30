## ADDED Requirements

### Requirement: Approved Baseline Enforcement
Sistem HARUS memfilter daftar simulasi materialitas dan hanya mengambil simulasi dengan status `Approved` sebagai kandidat baseline untuk halaman BPM.

#### Scenario: Selecting active simulation
- **WHEN** halaman BPM dimuat
- **THEN** sistem mencari simulasi dengan status `Approved` dan memiliki `createdAt` terbaru untuk tahun fiskal terpilih.

### Requirement: Significant Account Isolation
Daftar FSLI yang muncul di dropdown `BPMPage` HARUS dibatasi hanya pada akun-akun yang terdaftar sebagai `significantAccounts` dalam simulasi baseline yang aktif.

#### Scenario: Populating FSLI dropdown
- **WHEN** user membuka dropdown FSLI di halaman BPM
- **THEN** dropdown hanya menampilkan nama-nama FSLI yang ada di properti `significantAccounts` dari simulasi yang aktif.

### Requirement: Unsaved Changes Guard
Sistem HARUS memperingatkan user jika mereka mencoba menavigasi keluar atau merubah filter saat ada perubahan data asersi akun yang belum disimpan di tabel asersi `BPMPage`.

#### Scenario: Prompting for unsaved changes
- **WHEN** user mengubah nilai asersi (E, C, A, Co, Ro, Va, Pd) dan mencoba mengganti FSLI atau GL Account tanpa klik Simpan
- **THEN** sistem menampilkan dialog `UnsavedChangesDialog` untuk meminta konfirmasi.
