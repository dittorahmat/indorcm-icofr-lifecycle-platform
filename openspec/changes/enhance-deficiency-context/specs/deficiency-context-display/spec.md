## ADDED Requirements

### Requirement: Enhanced Deficiency Context in Description and UI

Sistem SHALL menyertakan informasi spesifik pengendalian (Kode Kontrol dan Nama Kontrol) serta menata ulang hirarki visual kartu pada *Deficiency Board* sehingga Kontrol dan Risiko yang bermasalah tampil prominent sebagai fokus utama.

#### Scenario: Displaying Prominent Control and Risk Context on Deficiency Card
- **WHEN** pengguna membuka halaman `/deficiencies` (Deficiency Board)
- **THEN** setiap kartu defisiensi menampilkan Kode Kontrol (`controlCode`) dan Nama Kontrol (`controlName`) sebagai Judul Utama Kartu secara utuh dan menonjol, sementara catatan hasil evaluasi TOD/CSA ditampilkan sebagai subtext/catatan temuan di bagian bawah kartu.

#### Scenario: Cascading Function and Person In Charge Selection
- **WHEN** pengguna membuka form perbaikan remedi (`RemediationForm`) dan memilih nilai `Related Function`
- **THEN** dropdown `Person In Charge (PIC)` secara otomatis melakukan penyaringan (cascading filter) hanya menampilkan daftar personel yang terdaftar pada unit kerja/fungsi tersebut.
