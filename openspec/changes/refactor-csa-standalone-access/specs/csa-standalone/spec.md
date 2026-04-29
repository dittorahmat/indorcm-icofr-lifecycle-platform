## ADDED Requirements

### Requirement: Standalone CSA Listing
Sistem HARUS menyediakan halaman khusus (`/csa`) yang menampilkan daftar seluruh Control Activity yang memerlukan penilaian (assessment), lengkap dengan status assessment terakhirnya.

#### Scenario: Menampilkan list control pada halaman CSA
- **WHEN** User menavigasi ke halaman `/csa`
- **THEN** Sistem menampilkan tabel berisi daftar control, kolom FSLI, frekuensi, status terakhir, dan tombol aksi untuk memulai assessment.

### Requirement: Assessment Form for Standalone Page
Sistem HARUS memungkinkan user untuk melakukan assessment penuh pada halaman `/csa` dengan fungsionalitas yang identik dengan form assessment yang ada di dalam modal.

#### Scenario: Memilih control untuk di-assess di halaman CSA
- **WHEN** User mengklik tombol "Assess" pada salah satu baris di tabel listing CSA
- **THEN** Sistem menampilkan form assessment lengkap (sampling, evidence, biometrik) untuk control yang dipilih.

### Requirement: Universal Control Selection in CSA Workspace
Dalam workspace CSA (baik di Page maupun Modal), sistem HARUS menyediakan mekanisme untuk berpindah antar control yang terkait dengan proses yang sama dengan cepat.

#### Scenario: Berpindah antar control dalam workspace
- **WHEN** User mengklik salah satu badge control code di bagian header workspace
- **THEN** Sistem memperbarui form assessment untuk menampilkan data control yang baru dipilih tanpa melakukan reload halaman penuh.
