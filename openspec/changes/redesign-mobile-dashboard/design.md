## Context

Platform web IndoGRC Pro digunakan oleh pimpinan dan tim manajemen risiko BUMN melalui beragam perangkat termasuk smartphone dalam mode portrait dan landscape. Berdasarkan pengujian langsung pada resolusi mobile, antarmuka mengalami masalah kepadatan visual: header berjejal, card status raksasa menghabiskan viewport, judul metriks terpotong, dan kontrol tumpang tindih.

Desain ini wajib mematuhi aturan platform:
- Mandat anti-AI slop (font >= 12px, border-radius enterprise rounded-lg/rounded-xl, surface solid kontras tinggi, no backdrop-blur murahan).
- Kepatuhan terminologi regulasi SK-5/DKU.MBU/11/2024.
- Aksesibilitas WCAG touch target (min 44px) dan penanganan dual-render testing di Vitest.

## Goals / Non-Goals

**Goals:**
- Mengoptimalkan `MainHeader` untuk smartphone: layout ramping, padding proporsional, badge role rapi dan tidak tumpang tindih dengan avatar.
- Menghadirkan layout landscape-safe yang mencegah tabrakan sidebar desktop dan header pada perangkat layar pendek (`max-h-[500px]`).
- Menggantikan card "Cycle Readiness" raksasa dengan **Executive Snapshot Card** yang terintegrasi (ringkas, informatif, menyatukan status kesiapan dan indikator kunci).
- Mendesain ulang `DashboardKPIs` di mobile dengan cards yang rapi, teks judul tidak terpotong (e.g. `Control Coverage`, `Open Deficiencies`, `COSO Coverage`), dan kontras jelas.
- Mendesain ulang `LifecycleProgress` di mobile menjadi stepper horizontal (swipeable/scrollable) dengan visual badge 1-6 fase SK-5 yang terbaca jelas.
- Menata ulang posisi dan padding `AIFabButton` agar tidak menutupi isi kartu dashboard paling bawah.

**Non-Goals:**
- Mengubah alur otentikasi atau backend API dashboard.
- Mengubah fungsi inti kalkulasi data agregat ICOFR.

## Decisions

### 1. Header Layout Adaptif
- **Keputusan**: Pada mobile portrait (< 768px), sembunyikan teks panjang brand jika diperlukan atau gunakan nama brand ringkas, perkecil padding horizontal (`px-2.5`), dan tata posisi role badge sebagai pill rapi di samping avatar atau di sudut yang tidak menutupi initial pengguna.
- **Alternatif dipertimbangkan**: Menyembunyikan avatar di mobile. *Ditolak* karena avatar/peran (Lini 1, Lini 2, Auditor) krusial bagi konteks wewenang ICOFR BUMN.

### 2. Executive Snapshot Card (Menggantikan Giant Hero Card)
- **Keputusan**: Mengombinasikan status kesiapan siklus (Cycle Readiness: READY FY 2027) dengan mini progress bar dan 3 indikator ringkas dalam satu panel terkoordinasi berprofil rendah (`rounded-xl` enterprise).
- **Alternatif dipertimbangkan**: Mempertahankan kartu biru tinggi. *Ditolak* karena membuang 35% viewport mobile dan memaksa pengguna scrolling berlebihan.

### 3. Horizontal Stepper untuk 6 Tahapan SK-5
- **Keputusan**: Gunakan kontainer horizontal scrollable (`overflow-x-auto no-scrollbar`) yang menampilkan 6 pil tahapan (1. Perancangan, 2. Implementasi, 3. Evaluasi, 4. Remediasi, 5. Pelaporan, 6. Asurans) dengan state badge (selesai / aktif / mendatang).
- **Alternatif dipertimbangkan**: Stepper vertikal lipat (accordion). *Ditolak* karena memakan tinggi layar berharga.

### 4. Responsiveness Landscape Smartphone
- **Keputusan**: Batasi breakpoint kemunculan sidebar desktop (`md:block`) dengan menambahkan pengaman orientasi atau mengunci `SidebarProvider` agar pada mobile landscape (`@media (max-height: 500px) and (orientation: landscape)`) sidebar tetap default collapsed / drawer.

### 5. Floating Action Button Safe Spacing
- **Keputusan**: Berikan bottom padding tambahan pada kontainer dashboard dan sesuaikan posisi `AIFabButton` di mobile ke `bottom-20` dengan clearance yang aman dari kartu dashboard dan bottom navigation bar.

## Risks / Trade-offs

- [Dual-Render Testing] Tampilan mobile yang berbeda dengan desktop dapat memicu error pada test jsdom jika elemen terduplikasi tanpa scope `hidden md:block`. → Mitigasi: Pastikan query test menggunakan scoped selector atau `getAllByText` sesuai aturan proyek.
- [Touch Target] Stepper horizontal bisa terlewat jika tidak ada visual hint. → Mitigasi: Tampilkan subtle scroll indicator atau biarkan pil tahapan berikutnya mengintip (partial peek) di tepi kanan layar.
