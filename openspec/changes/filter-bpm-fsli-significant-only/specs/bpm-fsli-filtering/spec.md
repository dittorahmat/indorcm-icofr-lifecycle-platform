## ADDED Requirements

### Requirement: FSLI Dropdown Filtering
Sistem SHALL membatasi opsi FSLI pada halaman BPM hanya untuk FSLI yang telah divalidasi sebagai signifikan dalam modul Scoping.

#### Scenario: Dropdown shows only significant FSLIs
- **WHEN** user membuka halaman BPM dengan simulasi scoping aktif yang memiliki `significantAccounts`.
- **THEN** dropdown FSLI hanya menampilkan nama FSLI yang membawahi setidaknya satu akun dalam daftar `significantAccounts`.

#### Scenario: No bypass for Admin/L2
- **WHEN** user dengan peran Admin atau L2 membuka halaman BPM.
- **THEN** sistem harus menerapkan filter signifikansi yang sama dengan peran lainnya (tidak menampilkan semua FSLI).

#### Scenario: Empty dropdown when no scoping done
- **WHEN** user membuka halaman BPM namun belum ada simulasi scoping atau daftar `significantAccounts` kosong.
- **THEN** dropdown FSLI SHALL kosong dan sistem menampilkan pesan instruksi untuk melakukan scoping terlebih dahulu.

### Requirement: FSLI Name Mapping
Sistem SHALL memetakan nama FSLI dari kode akun signifikan dengan menggunakan data dari GL Snapshot aktif.

#### Scenario: Correct FSLI name lookup
- **WHEN** sistem memproses akun signifikan dari simulasi.
- **THEN** nama FSLI yang ditampilkan harus sesuai dengan `fsliName` yang tertera pada baris akun tersebut di file GL Snapshot aktif.
