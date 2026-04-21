## ADDED Requirements

### Requirement: Tabular CSA Historical List
Sistem SHALL menampilkan daftar riwayat aktivitas CSA untuk kontrol yang dipilih dalam format tabel.
#### Scenario: Viewing CSA list
- **WHEN** user membuka Tab CSA pada Worksheet
- **THEN** sistem menampilkan tabel berisi kolom: Periode, Kode Kontrol, Tanggal Sign-off, Hasil, dan Aksi (View/PDF)

### Requirement: Smart Dynamic Form (Manual vs ITAC)
Sistem SHALL menyediakan form input yang menyesuaikan tampilan kolom secara otomatis berdasarkan sifat (nature) kontrol.
#### Scenario: Manual control form layout
- **WHEN** user membuat CSA untuk kontrol bersifat 'Manual'
- **THEN** sistem menampilkan tabel pengujian dengan kolom atribut A, B, C, dan D
#### Scenario: ITAC control form layout
- **WHEN** user membuat CSA untuk kontrol bersifat 'Automated'
- **THEN** sistem menampilkan tabel pengujian dengan kolom Skenario ITAC, Expected Result, dan Actual Result

### Requirement: Dynamic Sample Management
Sistem SHALL memungkinkan user untuk menambah dan menghapus baris sampel pengujian secara dinamis di dalam satu dokumen CSA.
#### Scenario: Adding test sample
- **WHEN** user mengklik tombol "Tambah Baris Sampel"
- **THEN** sistem menambahkan baris baru di tabel pengujian dengan ID unik

### Requirement: Zero Tolerance Effectiveness Suggestion
Sistem SHALL secara otomatis menyarankan kesimpulan "Ineffective" jika terdapat minimal satu sampel pengujian yang gagal.
#### Scenario: Failed sample validation
- **WHEN** user memberikan nilai 'false' pada salah satu atribut (A/B/C/D) di salah satu sampel
- **THEN** sistem secara otomatis mengubah dropdown kesimpulan akhir menjadi "Ineffective"
