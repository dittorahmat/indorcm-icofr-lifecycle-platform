## Why

Pengguna aplikasi IndoGRC Pro (khususnya pimpinan, auditor, dan penanggung jawab kontrol Lini 1) sering mengakses aplikasi melalui perangkat seluler/smartphone untuk memeriksa status kepatuhan, meninjau agenda, dan melihat ringkasan eksekutif. Saat ini, antarmuka aplikasi masih berorientasi desktop dengan beberapa kendala kritis di mobile:
1. Elemen floating (AI FAB button) menabrak atau menutupi bilah navigasi bawah (`MobileBottomNav`).
2. Bilah header atas (`MainHeader`) terlalu padat di viewport sempit (≤390px) akibat label teks berulang dan pemilih tahun buku yang memakan ruang horizontal.
3. Kartu KPI pada Dashboard berisiko mengalami pemotongan teks (*truncation*) serta tabel realisasi CSA (`CSARealizationTable`) memaksa scroll horizontal lebar yang tidak ergonomis di layar ponsel.

Optimalisasi terpadu pada Shell Navigasi dan Dashboard Eksekutif ini menghadirkan pengalaman mobile yang mulus (*touch-first* & *responsive*) dengan usaha minimal namun berdampak langsung pada seluruh sesi mobile pengguna.

## What Changes

- **Global Shell & Viewport Clearance**:
  - Penambahan clearance safe area vertikal yang presisi pada layout root (`RootLayout`) dan `MobileBottomNav` menggunakan `env(safe-area-inset-bottom)`.
  - Penyesuaian posisi mengambang `AIFabButton` di breakpoint mobile agar berada di atas `MobileBottomNav` secara dinamis tanpa menghalangi navigasi utama.
- **MainHeader & Touch Target Optimization**:
  - Penyederhanaan visual `MainHeader` pada breakpoint mobile (`< md`): memprioritaskan icon berukuran minimal touch target 44px dan menyembunyikan teks redundan.
  - Perancangan tampilan compact untuk `FiscalYearSelector` pada viewport mobile (pill ringkas berukuran sentuhan ergonomis).
- **Executive Dashboard Mobile Refinement**:
  - Penataan tipografi tegas dan grid adaptif pada `DashboardKPIs` agar angka metrik dan label status terbaca utuh tanpa terpotong di layar 360px–420px.
  - Penambahan representasi mobile responsif pada `CSARealizationTable` berupa daftar kartu kemajuan bertingkat (*stacked progress cards*) pada layar mobile (`< md`) sebagai alternatif tabel 5-kolom desktop.
  - Penyesuaian touch targets dan spasi sentuh pada `ActionCenter`.

## Capabilities

### New Capabilities
- `mobile-shell-and-dashboard`: Standar pengalaman pengguna mobile untuk tata letak shell aplikasi (topbar, bottom navigation, floating elements) dan penyajian ringkasan eksekutif Dashboard (KPI cards dan realisasi progres kendali berbasis kartu).

### Modified Capabilities
<!-- Tidak ada perubahan requirement spesifikasi bisnis fungsional sebelumnya -->

## Impact

- **Affected Code**:
  - `src/components/layout/RootLayout.tsx`
  - `src/components/layout/MainHeader.tsx`
  - `src/components/layout/FiscalYearSelector.tsx`
  - `src/components/layout/MobileBottomNav.tsx`
  - `src/components/ai-chatbot/AIFabButton.tsx`
  - `src/components/dashboard/DashboardKPIs.tsx`
  - `src/components/dashboard/CSARealizationTable.tsx`
  - `src/components/dashboard/ActionCenter.tsx`
- **APIs & Dependencies**: Tidak ada penambahan endpoint API baru; menggunakan endpoint dan hook data yang sudah ada.
- **Compliance & Accessibility**: Mengikuti ketentuan anti-AI slop (font ≥ 12px / `text-xs`, tanpa italic dekoratif, border-radius institusional, kontras tinggi).
