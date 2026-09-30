## Why

Enam change mobile sebelumnya menuntaskan shell, dashboard, CSA, dan RCM — tetapi audit lapangan menemukan sisa celah low-effort yang langsung terasa di HP: header tabel `text-[10px]` yang melanggar mandat min-12px, satu grid tanpa breakpoint yang gepeng di layar kecil, tidak adanya identitas PWA (theme-color/manifest/icon), polling 30 detik yang boros baterai, tabel Approval eksekutif yang masih 8 kolom di HP, dan code-splitting yang baru menyentuh satu komponen.

## What Changes

- **Perbaikan keterbacaan mobile**: naikkan header tabel `ReportsPage` dari `text-[10px]` ke `text-xs`, dan buat `ScopingSimulationForm` responsif (`grid-cols-1 sm:grid-cols-3`).
- **Card-view ApprovalPage**: tabel simulasi 8 kolom berubah menjadi kartu vertikal bertumpuk di viewport < 768px mengikuti pola RCM/CSA yang sudah ada; tabel desktop tidak berubah.
- **Identitas PWA dasar**: tambah `theme-color`, `apple-touch-icon`, `manifest.webmanifest` + icons, tanpa service worker (tanpa risiko caching).
- **Diet performa mobile**: polling `MobileBottomNav` 30s menjadi strategi hemat (interval lebih jarang + refetch on focus), dan route-level `React.lazy` untuk halaman berat.
- Semua perubahan mematuhi mandat anti-AI-slop (min 12px, `rounded-md/lg`, tanpa glassmorphism, tanpa animasi dekoratif).

## Capabilities

### New Capabilities
- `mobile-readability-fixes`: penegakan font minimum 12px dan grid responsif pada tampilan audit yang diakses dari viewport kecil.
- `mobile-approval-cards`: presentasi kartu vertikal untuk tabel Simulation Approval di bawah breakpoint `md`, dengan aksi review yang tetap dapat dijangkau jempol.
- `mobile-app-shell`: identitas PWA dasar (manifest, theme-color, icon sentuh) dan perilaku pemuatan hemat untuk sesi mobile (polling cerdas + code-splitting rute).

### Modified Capabilities
- (kosong — tidak ada perubahan perilaku pada capability yang sudah ada; pola card-view RCM/CSA dipakai ulang tanpa modifikasi)

## Impact

- `src/pages/reports/ReportsPage.tsx`: kelas tipografi header tabel.
- `src/pages/scoping/components/ScopingSimulationForm.tsx`: kelas grid.
- `src/pages/scoping/ApprovalPage.tsx`: render ganda tabel desktop + kartu mobile + i18n bila label baru diperlukan.
- `index.html`: meta `theme-color`, link manifest + apple-touch-icon.
- `public/manifest.webmanifest` + icons (baru).
- `src/components/layout/MobileBottomNav.tsx`: strategi refetch query.
- Router (lazy route) + `src/pages/Dashboard.tsx` (pola Suspense yang sudah ada dipakai ulang).
