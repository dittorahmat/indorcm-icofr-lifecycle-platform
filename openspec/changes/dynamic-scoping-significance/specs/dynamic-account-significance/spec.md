## ADDED Requirements

### Requirement: Reactive Account Significance Calculation
Sistem HARUS menghitung ulang status signifikansi setiap akun GL secara dinamis berdasarkan nilai Performance Materiality (PM) yang sedang aktif.

#### Scenario: Nilai PM berubah karena persentase benchmark berubah
- **WHEN** Pengguna mengubah persentase materialitas dari 5% menjadi 3% (menurunkan ambang batas PM)
- **THEN** Akun yang sebelumnya 'Insignificant' namun saldonya kini berada di atas ambang batas PM yang baru HARUS secara otomatis berubah statusnya menjadi 'Significant' tanpa perlu re-upload data.

### Requirement: Persistent GL Account List
Sistem HARUS menyimpan seluruh daftar akun yang di-upload dari file GL, bukan hanya akun yang dianggap signifikan pada saat upload.

#### Scenario: Menampilkan akun di bawah ambang batas
- **WHEN** Pengguna meng-upload file GL dengan beberapa akun di bawah PM
- **THEN** Sistem HARUS tetap menyimpan akun-akun tersebut di dalam state aplikasi dan menampilkannya di tabel 'Significant Accounts Matrix' dengan status 'Insignificant'.
