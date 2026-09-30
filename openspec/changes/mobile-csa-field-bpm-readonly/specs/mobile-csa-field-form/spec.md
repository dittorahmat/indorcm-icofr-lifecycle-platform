## Purpose

Memungkinkan auditor Lini 1 mengerjakan Control Self-Assessment langsung dari ponsel di lokasi lapangan, dengan daftar assessment berbentuk kartu, form sampel satu-fokus per langkah, dan upload evidence lewat kamera yang seluruhnya memenuhi target sentuh 44px dan mandat anti-AI-slop.

## ADDED Requirements

### Requirement: Riwayat assessment sebagai kartu di viewport kecil
Sistem SHALL menyembunyikan tabel riwayat CSA dan menampilkan setiap assessment sebagai kartu vertikal terstruktur pada viewport di bawah 768px (`md`), dengan tabel standar tetap dipakai pada `md` ke atas.

#### Scenario: Membuka riwayat CSA di HP
- **WHEN** pengguna membuka tab CSA pada viewport 360px dalam tampilan daftar
- **THEN** sistem menampilkan tiap assessment sebagai kartu yang memuat referensi & periode, hasil (Efektif/Defisiensi), tanggal assessment, dan aksi Lihat/Detail, Cetak, Hapus (sesuai otorisasi)
- **AND** setiap target sentuh aksi berukuran minimal 44x44px

#### Scenario: Membuka riwayat CSA di desktop
- **WHEN** pengguna membuka tab CSA pada viewport 1024px dalam tampilan daftar
- **THEN** sistem merender tabel riwayat standar seperti sebelumnya

### Requirement: Form sampel satu-fokus di mobile
Sistem SHALL menyajikan sampel CSA sebagai langkah satu-fokus (satu sampel per layar dengan navigasi Sebelumnya/Lanjut + indikator posisi) pada viewport di bawah 768px (`md`), dengan tabel matriks sampel standar tetap dipakai pada `md` ke atas. Seluruh nilai, keputusan, dan lampiran yang diisi di mode mobile SHALL tersimpan identik dengan mode desktop (tidak ada kehilangan data antar mode).

#### Scenario: Mengisi banyak sampel di HP
- **WHEN** pengguna mengerjakan assessment dengan 5 sampel pada viewport 360px
- **THEN** sistem menampilkan satu sampel aktif dengan indikator "Sampel 2 dari 5", tombol Lanjut/Kembali, dan tombol Lompat-ke-sampel untuk navigasi langsung
- **AND** beralih orientasi atau kembali ke daftar lalu masuk lagi tidak menghilangkan isian yang sudah disimpan sebagai draft

#### Scenario: Paritas data antar mode
- **WHEN** pengguna mengisi sebagian sampel di HP lalu membuka assessment yang sama di desktop
- **THEN** sistem menampilkan nilai, keputusan titik verifikasi, dan lampiran yang sama persis

### Requirement: Upload evidence akses kamera di mobile
Sistem SHALL menyediakan tombol ambil-foto langsung (pemilih berkas dengan `capture` kamera) berukuran minimal 44x44px pada tiap baris sampel di viewport kecil, di samping opsi unggah berkas standar (PDF/PNG/JPG/XLSX). Hasil jepretan SHALL melewati alur unggah, penamaan, dan status yang sama dengan berkas pilihan galeri.

#### Scenario: Melampirkan foto evidence di lapangan
- **WHEN** pengguna mengetuk tombol kamera pada baris sampel di HP
- **THEN** sistem membuka kamera perangkat, dan foto yang diambil masuk antrean unggah baris tersebut dengan indikator progres dan status berhasil/gagal yang terbaca (min 12px, tanpa mengandalkan warna saja)
- **AND** kegagalan unggah menampilkan aksi Coba Lagi tanpa menghilangkan foto yang diambil

### Requirement: Aksi form sticky dan aman di viewport kecil
Sistem SHALL menempatkan aksi Simpan Draft, Submit, dan Kembali dalam bar sticky yang selalu terlihat di viewport kecil (di atas `MobileBottomNav` dan tidak tertutup keyboard virtual), dengan aksi destruktif (Hapus) yang memerlukan konfirmasi eksplisit.

#### Scenario: Menyimpan draft saat keyboard terbuka
- **WHEN** pengguna mengetik catatan lalu mengetuk Simpan Draft di HP
- **THEN** tombol aksi tetap terlihat dan terjangkau tanpa menggulir, dan sistem menampilkan status tersimpan dengan waktu simpan
- **AND** menutup tab/menavigasi pergi dengan perubahan belum tersimpan memicu peringatan UnsavedChanges yang sudah ada
