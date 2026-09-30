## Purpose

Memastikan tata letak dasar aplikasi (shell) dan ringkasan eksekutif Dashboard berfungsi optimal, tidak bertabrakan secara visual, serta nyaman dioperasikan menggunakan sentuhan pada perangkat seluler/smartphone.

## ADDED Requirements

### Requirement: Mobile Viewport Clearance and Floating Action Alignment
Sistem HARUS menyediakan pemisahan jarak (*clearance*) vertikal yang cukup pada layout utama di viewport mobile (< 768px) agar bilah navigasi bawah (`MobileBottomNav`) tidak menutupi konten halaman maupun elemen melayang (*floating buttons*).

#### Scenario: Floating action button does not overlap bottom navigation
- **WHEN** pengguna membuka aplikasi pada perangkat mobile (lebar layar < 768px)
- **THEN** tombol melayang AI Assistant (`AIFabButton`) diposisikan dengan offset vertikal di atas `MobileBottomNav` (minimal 5rem / bottom-20) sehingga kedua komponen dapat diakses secara independen tanpa tumpang tindih

#### Scenario: Safe area insets handling
- **WHEN** aplikasi dibuka pada perangkat mobile dengan indikator gesture atau safe-area (misalnya iPhone notch/home bar)
- **THEN** bilah navigasi bawah dan kontainer utama menyertakan padding pengaman sesuai variabel `env(safe-area-inset-bottom)`

### Requirement: Mobile-Optimized MainHeader and Compact Year Selector
Header navigasi utama HARUS menampilkan tata letak yang ringkas pada viewport seluler (< 768px) dengan target sentuhan minimal 44x44px dan menyembunyikan label teks yang tidak esensial.

#### Scenario: Header touch targets and space conservation
- **WHEN** pengguna melihat bilah header atas pada layar mobile
- **THEN** pemilih tahun buku (`FiscalYearSelector`) ditampilkan dalam bentuk pill compact (misalnya `[ 2026 ▾ ]`) yang tidak meluap ke luar layar, dan seluruh ikon tindakan memiliki area sentuh minimum 44px

### Requirement: Responsive Executive Dashboard Presentation
Halaman Dashboard HARUS menyajikan kartu indikator kinerja utama (KPI) dan status realisasi kendali dalam format yang proporsional pada layar seluler tanpa memerlukan scroll horizontal yang memotong informasi.

#### Scenario: KPI card metric presentation on mobile
- **WHEN** pengguna melihat `DashboardKPIs` pada layar smartphone (< 640px)
- **THEN** kartu KPI ditata dalam 2 kolom dengan hierarki visual tegas (angka nilai terlihat penuh tanpa teks terpotong / *no truncate*) dan ukuran font minimal 12px

#### Scenario: CSA Realization mobile stacked view
- **WHEN** pengguna meninjau progres realisasi CSA pada layar mobile (< 768px)
- **THEN** komponen `CSARealizationTable` menyajikan data frekuensi kendali dalam format kartu progres vertikal bertingkat (*stacked cards*) yang menampilkan frekuensi, jumlah selesai, dan bar persentase secara utuh tanpa tabel horizontal lebar
