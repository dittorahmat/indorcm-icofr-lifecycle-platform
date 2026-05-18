## ADDED Requirements

### Requirement: FSLI-Only Baris Support
Sistem WAJIB mengizinkan baris GL yang hanya memiliki `fsliName` (nama FSLI) tetap masuk ke sistem meskipun `glDesc` (deskripsi akun) kosong. Ini diperlukan untuk mengakomodasi baris subtotal atau header di laporan keuangan yang digunakan sebagai benchmark.

#### Scenario: Baris dengan FSLI tanpa Nama Akun
- **WHEN** Pengguna mengunggah file GL yang berisi baris dengan Nama FSLI "TOTAL ASET" tapi Nama Akun kosong
- **THEN** Sistem tetap mengimpor baris tersebut dan menyimpannya di snapshot GL

### Requirement: Pemetaan Otomatis noUrut
Sistem WAJIB mengekstrak kolom `No_Urut` dari file sumber (Excel/CSV) dan menyimpannya sebagai atribut urutan hierarkis untuk setiap baris GL.

#### Scenario: Ekstraksi kolom noUrut
- **WHEN** Pengguna mengunggah file yang memiliki kolom "No_Urut" atau "NoUrut"
- **THEN** Sistem menyimpan nilai tersebut ke dalam database untuk setiap baris GL yang diimpor
