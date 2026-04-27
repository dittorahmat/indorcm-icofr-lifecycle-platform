## ADDED Requirements

### Requirement: Registri Pusat Aplikasi
Sistem WAJIB menyediakan registri pusat untuk inventarisasi aplikasi IT yang digunakan dalam proses bisnis.

#### Scenario: Mendaftarkan aplikasi baru
- **WHEN** pengguna memasukkan nama dan deskripsi di Library Aplikasi
- **THEN** entri aplikasi baru dibuat dengan ID unik dan tersimpan di database

### Requirement: Penandaan Signifikansi Otomatis
Sistem WAJIB menandai aplikasi sebagai "Signifikan" jika aplikasi tersebut digunakan untuk memproses akun yang masuk dalam ruang lingkup (*in-scope*).

#### Scenario: Update status signifikan dari scoping
- **WHEN** pengguna memilih sebuah aplikasi untuk akun yang berstatus *In Scope* pada tahap simulasi
- **THEN** sistem WAJIB mengubah flag `isSignificant` aplikasi tersebut menjadi `true` di Library pusat

### Requirement: Penghubungan Akun dengan Aplikasi
Sistem WAJIB mendukung penghubungan satu atau lebih aplikasi signifikan ke setiap Item Laporan Keuangan (FSLI) selama proses scoping.

#### Scenario: Pemilihan multi-value di worksheet scoping
- **WHEN** pengguna mengklik kolom "Aplikasi Signifikan" pada baris akun yang *In Scope*
- **THEN** dropdown multi-select yang dapat dicari akan muncul menampilkan seluruh aplikasi dari Library

### Requirement: Tambah Cepat (Add on the fly)
Sistem WAJIB memungkinkan pengguna menambahkan aplikasi baru ke Library langsung dari lembar kerja scoping.

#### Scenario: Menambah aplikasi baru saat scoping
- **WHEN** pengguna mengetik nama aplikasi yang belum terdaftar di dropdown scoping dan memilih opsi "Tambah Baru"
- **THEN** aplikasi baru dibuat di Library dengan nama tersebut dan langsung terhubung ke akun yang sedang diedit

### Requirement: Validasi Visual Keterkaitan Kontrol
Sistem WAJIB memberikan penanda visual pada aplikasi di lembar kerja scoping yang belum memiliki keterkaitan dengan kontrol di RCM.

#### Scenario: Peringatan celah dokumentasi
- **WHEN** sebuah aplikasi yang dipilih di scoping memiliki jumlah keterkaitan kontrol sebanyak nol di RCM
- **THEN** nama aplikasi tersebut WAJIB ditampilkan dengan font berwarna merah di worksheet scoping
