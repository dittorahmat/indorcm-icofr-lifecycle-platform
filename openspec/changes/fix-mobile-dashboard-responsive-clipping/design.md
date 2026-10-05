## Context

See proposal.md for motivation. Dashboard saat ini mengalami pemotongan visual horizontal pada viewport sempit (< 640px, khususnya 320px–390px). Penelusuran struktur DOM mengungkap bahwa `SidebarInset` di `AppLayout.tsx` dan wrapper outlet di `RootLayout.tsx` menggunakan kelas kombinasi `overflow-hidden` dan `overflow-x-clip`, yang bersama dengan fixed child widths (terutama Recharts `min-w-[480px]` dan fixed grid cols) menciptakan "clipping trap" di tepi kanan layar.

## Goals / Non-Goals

**Goals:**
- Menghilangkan horizontal clipping di seluruh komponen Dashboard pada viewport 320px–390px.
- Memastikan Recharts Bar Chart dan Donut Chart terisolasi dengan rapi, proporsional, dan dapat diakses di layar sempit.
- Memastikan seluruh teks pada kartu aksi, badge status, dan stepper tahapan memiliki perlindungan overflow (`min-w-0 flex-1 truncate` vs `shrink-0`).
- Menata ulang grid prinsip COSO agar adaptif dan rapi di semua lebar layar mobile.

**Non-Goals:**
- Mengubah logika bisnis atau kalkulasi kepatuhan ICOFR / COSO.
- Mengubah skema database atau endpoint API backend.
- Menghapus fitur chart atau data visualisasi yang ada.

## Decisions

### 1. Perbaikan Layout Shell (`RootLayout.tsx` & `AppLayout.tsx`)
- **Pilihan**: Memastikan container utama halaman memiliki `w-full max-w-full min-w-0` dengan kontrol overflow yang jelas (`overflow-y-auto overflow-x-hidden` pada level scroll container, tanpa `overflow-x-clip` yang memotong layout secara prematur).
- **Alternatif**: Membiarkan container overflow di level root dan hanya mengubah padding child — ditolak karena jika ada elemen anak yang sedikit lebih lebar, seluruh halaman akan tetap terpotong di tepi kanan.

### 2. Penataan Recharts Bar Chart & Donut Chart (`ComplianceCharts.tsx`)
- **Pilihan**:
  - Pada Bar Chart: Membungkus elemen chart dalam container scroll horizontal terisolasi `overflow-x-auto touch-pan-x overscroll-x-contain` dengan indikator scroll visual yang halus, dan membatasi lebar minimum chart hanya di dalam scroll wrapper tersebut sehingga tidak mendorong card keluar batas layar.
  - Pada Donut Chart: Menghapus layout floating atau margin offset yang menggeser lingkaran ke kanan, memastikan `cx="50%"`, `cy="50%"`, dengan outer container `w-full flex justify-center`.
- **Alternatif**: Menyembunyikan chart di mobile dan menggantinya dengan tabel sederhana — ditolak karena eksekutif tetap membutuhkan visualisasi grafik di perangkat bergerak.

### 3. Grid Kolom Prinsip COSO (`COSOCoverageGrid.tsx`)
- **Pilihan**: Mengubah grid per komponen prinsip dari `min-[380px]:grid-cols-3` menjadi layout mobile-first yang adaptif (`grid-cols-2 min-[360px]:grid-cols-3 sm:grid-cols-3`), memberikan ruang yang cukup untuk label P1–P17 dan angka kontrol tanpa berbenturan dengan margin tepi kartu.
- **Alternatif**: Menggunakan slider horizontal untuk setiap komponen — ditolak karena menambah kompleksitas gestur scroll bertumpuk.

### 4. Flex Safety pada Action Center (`ActionCenter.tsx`) & Lifecycle Stepper (`LifecycleProgress.tsx`)
- **Pilihan**: Menerapkan pola `min-w-0 flex-1` pada blok teks kiri dan `shrink-0` pada badge/angka kanan, disertai dengan `truncate` atau `line-clamp-2` pada deskripsi panjang.
- **Alternatif**: Memindahkan badge ke baris baru di bawah teks pada mobile — ditolak karena menambah tinggi kartu secara berlebihan dan mengurangi kepadatan informasi.

## Risks / Trade-offs

- **[Risk] Perubahan scroll wrapper di `AppLayout` mempengaruhi halaman lain yang menggunakan layout sama.**
  → **Mitigasi**: Pastikan perubahan hanya membersihkan clipping trap yang redundan (`overflow-x-clip`) tanpa mengubah `pb` safe area atau kelas kontainer desktop. Lakukan regression check pada halaman lain.
- **[Risk] Recharts gagal render dimensi jika parent flex container memiliki `width: 0`.**
  → **Mitigasi**: Selalu sediakan `minWidth={0} minHeight={0}` pada `<ResponsiveContainer>` dan tetapkan tinggi eksplisit pada wrapper (`h-[220px]` atau `h-[260px]`).
