## Context

Lihat `proposal.md` untuk latar belakang dan motivasi. Saat ini komponen `RCMTable.tsx`, overview tab RCM (`TLCTabContent.tsx`, `ITGCTabContent.tsx`, `ELCTabContent.tsx`), serta halaman matriks (`RCMTLCPage.tsx`, `RCMELCPage.tsx`, `RCMITGCPage.tsx`) memiliki variasi tipografi yang tidak konsisten (font-normal, font-bold, font-black, italic, serta ukuran font hingga 10px). Selain itu, terdapat sisa artefak demo (`DemoPage.tsx`) dan efek CSS over-styled seperti `backdrop-blur` pada sticky header tabel, `bg-gradient-rainbow` pada error fallback, serta `animate-pulse` permanen pada status badge.

## Goals / Non-Goals

**Goals:**
- Mengharmoniskan seluruh tampilan tabel RCM (TLC, ELC, ITGC) dengan hierarki tipografi 2 bobot (`font-semibold` & `font-medium`/`font-normal`), ukuran font minimal 12px (text-xs), dan teks tegak (non-italic).
- Mengganti sticky header berkabut (`backdrop-blur`) dengan solid background token (`bg-slate-100 dark:bg-slate-900 border-b border-border`) untuk visual yang tenang dan rendering performan saat scroll.
- Menstandarisasi radius pembungkus tabel dari `rounded-3xl` / `rounded-[2.5rem]` menjadi `rounded-lg` / `rounded-md`.
- Menghapus `src/pages/DemoPage.tsx` dan efek `bg-gradient-rainbow` di `ErrorFallback.tsx`.
- Merestrukturisasi `AIAnalyticsMockup.tsx` menjadi panel continuous monitoring audit BUMN yang formal tanpa tema cyberpunk sci-fi.
- Menghapus efek `animate-pulse` dan `animate-ping` permanen pada status badges di seluruh modul.

**Non-Goals:**
- Mengubah logika bisnis kalkulasi matriks atau struktur endpoint API backend.
- Mengganti icon library Lucide dengan library lain (fokus pada standardisasi stroke-width dan ukuran tanpa migrasi dependensi besar).

## Decisions

### Decision 1: Tipografi Seragam Tanpa Font Italic pada Deskripsi Kontrol
- **Pilihan:** Gunakan `text-xs leading-relaxed text-slate-800 dark:text-slate-200 font-normal` untuk deskripsi kontrol dan deskripsi risiko. Hilangkan class `italic`.
- **Rasional:** Dalam dokumen kepatuhan dan audit regulasi BUMN, teks deskripsi kontrol adalah substansi utama pengujian pengendalian. Font miring (italic) tipis menyulitkan pembacaan auditor pada resolusi normal.
- **Alternatif yang ditolak:** Mempertahankan italic dengan ukuran font lebih besar (tetap terlihat informal dan tidak konsisten dengan kolom lain).

### Decision 2: Solid Header Tanpa Backdrop Blur
- **Pilihan:** Gunakan `bg-slate-100 dark:bg-slate-900 border-b border-slate-300 dark:border-slate-700` pada baris header kolom `RCMTable`.
- **Rasional:** Menghilangkan efek tembus pandang teks yang bertumpuk saat scroll dan meningkatkan performa FPS rendering browser.
- **Alternatif yang ditolak:** Menambah opasitas blur menjadi `backdrop-blur-xl` (masih membebani GPU dan rentan glitch grafis di Chromium).

### Decision 3: Reduksi Corner Radius Container
- **Pilihan:** Ganti wrapper `rounded-3xl` dan `rounded-[2.5rem]` menjadi `rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm`.
- **Rasional:** Tabel tabular audit memerlukan pemanfaatan ruang sudut yang optimal tanpa batas lengkung yang memotong data (sesuai dial `VISUAL_DENSITY: 8`).

### Decision 4: Penghapusan File Starter Demo
- **Pilihan:** Hapus permanen `src/pages/DemoPage.tsx`.
- **Rasional:** File ini tidak digunakan dalam routing dan hanya memuat pola AI lama (`bg-gradient-rainbow`, `animate-floating`).

## Risks / Trade-offs

- **[Tampilan visual terlihat lebih konservatif]** → *Mitigasi:* Hal ini justru selaras dengan ekspektasi produk enterprise BUMN dan kepatuhan SK-5/DKU.MBU/11/2024 yang mengutamakan kejelasan, kontras, dan otoritas.
- **[Regresi Snapshot Pengujian]** → *Mitigasi:* Jalankan test suite `npm test` setelah pembaruan class untuk memastikan semua assertion rendering lulus.
