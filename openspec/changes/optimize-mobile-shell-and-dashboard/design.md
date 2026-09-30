## Context

Aplikasi IndoGRC Pro digunakan oleh berbagai tingkatan organisasi BUMN, mulai dari tim pelaksana di lapangan (Lini 1) hingga jajaran eksekutif dan Komite Audit. Saat ini, fondasi tata letak responsif telah memiliki `MobileBottomNav` dan `SidebarTrigger`, namun masih terdapat benturan antarmuka ketika diakses pada perangkat smartphone:
1. Kontainer aplikasi utama dan floating button belum mengantisipasi overlap dinamis antara navigasi bawah dengan konten halaman.
2. Bilah header (`MainHeader`) menampilkan banyak elemen horizontal yang memicu desak-desakan di viewport sempit (< 390px).
3. Halaman Dashboard menyajikan tabel 5-kolom (`CSARealizationTable`) yang memicu scroll horizontal panjang, serta kartu KPI dengan potensi terpotongnya teks pada layar sempit.

## Goals / Non-Goals

**Goals:**
- Menyediakan clearance vertikal dinamis dan penanganan safe-area penuh pada kontainer root dan floating AI button.
- Menghadirkan tampilan `MainHeader` yang bersih dan touch-friendly di mobile tanpa pemotongan elemen penting.
- Mengubah penyajian `CSARealizationTable` menjadi responsif ganda: kartu progres vertikal bertingkat pada mobile (`< md`), dan tabel matriks tabular pada desktop (`>= md`).
- Mengoptimalkan tipografi dan grid `DashboardKPIs` agar tidak ada nilai metrik yang terpotong di resolusi layar kecil.
- Menjamin kepatuhan terhadap aturan anti-AI slop (font ≥ 12px, border radius institusional, tanpa decorative italic).

**Non-Goals:**
- Merombak total editor kanvas BPM (React Flow) menjadi touch-canvas lengkap (tetap menggunakan desktop-first untuk pengeditan grafis alur).
- Mengubah skema database PostgreSQL atau mengubah kontrak endpoint backend `/api/controls`, `/api/rcm`, atau `/api/settings`.

## Decisions

### 1. Pola Dual View untuk CSARealizationTable
- **Keputusan**: Menggunakan conditional rendering Tailwind (`block md:hidden` untuk Card Stack, dan `hidden md:block` untuk Table).
- **Rasional**: Tabel desktop kaya akan kolom komparasi (Target Table 22, Total, Completed, %). Di mobile, pengguna lebih mementingkan pembacaan cepat per frekuensi kendali (nama frekuensi, status selesai/total, dan progress bar visual).
- **Alternatif yang ditolak**: Memaksa horizontal scrollbar pada tabel mobile (buruk untuk navigasi satu tangan).

### 2. Standardisasi Touch Target dan Spasi Header
- **Keputusan**: Mengatur touch target minimal 44x44px pada ikon trigger mobile, menyederhanakan `FiscalYearSelector` menjadi pill minimalis `[ 2026 ▾ ]`, dan menyembunyikan label nama aplikasi yang terlalu panjang jika lebar viewport sangat sempit (< 360px).
- **Rasional**: Mencegah salah tekan (*fat-finger error*) dan layout overflow.

### 3. Floating Action Button (FAB) Dynamic Clearance
- **Keputusan**: Mengatur posisi `AIFabButton` di breakpoint mobile menjadi `bottom-20` (atau `bottom-[calc(4.5rem+env(safe-area-inset-bottom))]`) dan di desktop tetap `bottom-6`.
- **Rasional**: `MobileBottomNav` menempati tinggi `h-14` (3.5rem) ditambah safe area. Jarak `bottom-20` (5rem) memberikan floating buffer yang bersih dan bebas tabrakan.

## Risks / Trade-offs

- **[Tampilan berbeda antara desktop dan mobile]** → Diminimalisir dengan memastikan semua metrik data yang ditampilkan di versi kartu mobile sama persis dengan versi tabel desktop, hanya representasi visualnya yang diadaptasi.
- **[Dukungan browser lawas terhadap env(safe-area-inset)]** → Diberikan fallback padding tetap (`pb-16` / `bottom-20`) sebelum modifier `env()` diterapkan.
