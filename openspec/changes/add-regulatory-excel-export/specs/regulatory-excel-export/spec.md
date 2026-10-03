## Purpose

Memberikan kemampuan unduh Save-as-Excel (.xlsx) yang setia pada format lampiran SK-5/DKU.MBU/11/2024 untuk seluruh tabel laporan regulasi, sehingga auditor dan tiga lini dapat memakai file Excel langsung sebagai kertas kerja dan arsip audit.

## ADDED Requirements

### Requirement: Excel tersedia di setiap tabel laporan regulasi

Sistem SHALL menyediakan tombol unduh Excel (.xlsx) pada setiap tabel laporan regulasi: Lampiran 6 (log perubahan regulasi dan master), Lampiran 7a (CSA Detailed dan Summary), Lampiran 8 (verifikasi rancangan), Lampiran 9 (daftar temuan), Lampiran 10 (kertas kerja DoD), Lampiran 11 (asesmen manajemen), rekap WBS, dan kertas kerja TOD/TOE.

#### Scenario: Pengguna mengunduh Lampiran 10 sebagai Excel

- **WHEN** pengguna membuka halaman Lampiran 10 dan mengklik tombol unduh Excel
- **THEN** sistem mengunduh satu file `.xlsx` berisi seluruh 24 kolom kertas kerja DoD (i–xxiv)

#### Scenario: Tabel tanpa data tetap dapat diunduh

- **WHEN** pengguna mengklik tombol unduh Excel pada tabel yang sedang kosong (filter menghasilkan nol baris atau belum ada data)
- **THEN** sistem tetap mengunduh file `.xlsx` yang berisi baris judul, kop, dan baris header kolom tanpa baris data

### Requirement: Layout Excel setia pada format lampiran

File Excel yang diunduh SHALL memuat, berurutan dari atas: baris judul lampiran (mis. "LAMPIRAN 10"), baris subjudul dokumen, baris identitas (nama perusahaan dan periode/tahun fiskal), satu baris kosong pemisah, baris header kolom sesuai urutan kolom di layar, lalu baris data. Header kolom pengelompokan (mis. Temuan i–vi, Agregasi vii–x, Asersi xi–xvii, Decision Tree xviii–xxiv pada Lampiran 10) SHALL dipertahankan sebagai baris grup di atas header kolom.

#### Scenario: Struktur file Lampiran 10

- **WHEN** pengguna membuka file Lampiran 10 yang diunduh
- **THEN** baris-baris teratas memuat judul, subjudul, identitas perusahaan dan periode, diikuti baris grup kolom dan baris header 24 kolom sebelum baris data pertama

#### Scenario: Area kop dapat dilengkapi manual

- **WHEN** pengguna membuka area kop (judul/identitas) di file yang diunduh
- **THEN** area tersebut berupa sel teks biasa yang dapat pengguna timpa atau tempeli logo/gambar secara manual tanpa merusak baris data

### Requirement: Filter aktif terbawa ke file

File Excel yang diunduh SHALL hanya memuat baris data yang sedang tampil setelah seluruh filter, pencarian, dan sortasi di UI diterapkan (mis. filter severity, status remediasi, dan kata kunci pada Lampiran 10).

#### Scenario: Filter severity terbawa

- **WHEN** pengguna memfilter Lampiran 10 ke "Material Weakness" lalu mengunduh Excel
- **THEN** file hanya memuat baris berkesimpulan akhir Material Weakness

#### Scenario: Pencarian terbawa

- **WHEN** pengguna mengetik kata kunci pencarian pada suatu tabel laporan lalu mengunduh Excel
- **THEN** file hanya memuat baris yang cocok dengan kata kunci tersebut

### Requirement: Satu tabel satu sheet satu file

Setiap aksi unduh SHALL menghasilkan satu file `.xlsx` yang memuat tepat satu worksheet berisi satu tabel laporan. Nama file SHALL memuat kode lampiran, nama tabel, dan tahun/periode (mis. `Lampiran_10_Kertas_Kerja_DoD_2025.xlsx`).

#### Scenario: Unduhan tunggal

- **WHEN** pengguna mengunduh Excel dari tabel mana pun
- **THEN** file yang diterima memiliki tepat satu worksheet dan nama file mencantumkan lampiran serta periodenya

### Requirement: Header mengikuti locale aktif

Seluruh teks header kolom, judul, dan label status di dalam file (mis. "Ya"/"Tidak" vs "Yes"/"No") SHALL menggunakan bahasa locale yang aktif di aplikasi pada saat pengguna mengklik unduh.

#### Scenario: Unduh dalam Bahasa Indonesia

- **WHEN** locale aktif adalah Bahasa Indonesia saat pengguna mengunduh Lampiran 10
- **THEN** header memakai istilah Indonesia (mis. "Telah Diremediasi", "Nilai Eksposur Defisiensi") dan nilai status memakai "Ya"/"Tidak"

#### Scenario: Unduh dalam Bahasa Inggris

- **WHEN** locale aktif adalah English saat pengguna mengunduh Lampiran 10
- **THEN** header memakai istilah Inggris dan nilai status memakai "Yes"/"No"

### Requirement: Nilai terformat audit-friendly

Nilai mata uang SHALL ditulis sebagai angka mentah (bukan string berformat) agar dapat dijumlahkan di Excel, tanggal SHALL ditulis dalam format ISO `yyyy-MM-dd` (dengan jam `HH:mm:ss` bila relevan), dan sel kosong SHALL ditulis sebagai strip `-` agar konsisten dengan tampilan layar.

#### Scenario: Kolom eksposur dapat dijumlahkan

- **WHEN** pengguna membuka file Lampiran 10 dan memakai fungsi SUM pada kolom Nilai Eksposur
- **THEN** hasilnya adalah total numerik yang benar dari seluruh baris
