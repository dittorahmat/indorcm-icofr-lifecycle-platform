## ADDED Requirements

### Requirement: Penghubungan Akun dengan Aplikasi Signifikan
Sistem WAJIB memungkinkan pengguna untuk menghubungkan satu atau lebih aplikasi IT yang memproses data pada akun yang masuk dalam ruang lingkup.

#### Scenario: Menambahkan aplikasi ke akun signifikan
- **WHEN** baris akun memiliki status "In Scope"
- **THEN** sistem menampilkan kolom "Aplikasi Signifikan" dengan komponen multi-select dropdown
- **AND** pilihan yang tersimpan akan diasosiasikan dengan simulasi scoping tersebut
