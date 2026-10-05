## Context

Kelanjutan dari `fix-mobile-dashboard-responsive-clipping`. Audit 4 domain paralel (scoping, RCM/BPM, CSA/testing/deficiencies, reports/audit/admin/shell) menemukan akar masalah yang sama: container clipping bertumpuk, `min-w` tanpa scroll terisolasi, grid fixed di base, header rigid, dan footer dialog yang belum stack.

## Goals / Non-Goals

**Goals:**
- Nol page-level horizontal scroll di 320px/360px untuk semua halaman non-dashboard.
- Setiap tabel lebar / Recharts punya scroll wrapper terisolasi milik sendiri.
- Header/toolbar stack rapi (`flex-col sm:flex-row`), teks `min-w-0 flex-1 truncate`, badge/aksi `shrink-0`.
- Dialog/sheet footer stack dengan target sentuh ≥44px.
- Font ≥12px, radius `rounded-md/lg` saja, tanpa glassmorphism/animasai distraksi.

**Non-Goals:**
- Mengubah logika bisnis ICOFR/SK-5, API, atau schema DB.
- Mengaktifkan kembali toolbar editor desktop di mobile (BPM toolbar tetap `hidden md:block` + mode baca).
- Redesign visual; hanya perbaikan layout responsif.

## Decisions

### 1. Satu scroll owner (Shell)
- `RootLayout` outlet div tetap pemilik scroll vertikal + satu-satunya `pb-[calc(3.5rem...)]`.
- `SidebarInset` → `overflow-visible` (tidak ada `overflow-y-auto/x-hidden` kedua). Alternatif "biarkan dua scroller" ditolak karena menjebak sticky header dan `touch-pan-x` tabel.

### 2. Tabel: isolated scroller + min-w + dual-render
- Pola baku: `hidden md:block overflow-x-auto max-w-full touch-pan-x overscroll-x-contain table-scroll-hint` + `Table min-w-[640/720/880px]` + `block md:hidden` cards. Referensi: `GLDataGrid`, `Lampiran6LogView`, `ReportsPage`.
- Alternatif "kecilkan kolom agar muat" ditolak karena merusak keterbacaan audit.

### 3. Recharts: wrapper + inner min-w + center Pie
- `<div class="overflow-x-auto max-w-full touch-pan-x overscroll-x-contain min-w-0"><div class="min-w-[280px] h-[...]">` + `cx/cy 50%` + font/legend ≥12px. Referensi: `ComplianceCharts` dashboard.

### 4. Header anti-jepit & footer dialog
- Header: `flex flex-col sm:flex-row ... gap-* min-w-0 max-w-full` + `flex-wrap`; varian 2 tombol boleh `min-[420px]:flex-row`.
- Footer: `flex-col-reverse sm:flex-row`, tombol `w-full sm:w-auto h-11 min-h-[44px]`, konten `p-4 sm:p-6`.

## Risks / Trade-offs

- **[Risk] Shell memengaruhi semua halaman** → mitigasi: ubah 2 baris saja, regression check `TodoListPage` calendar shell + tabel sticky + dialog portal.
- **[Risk] `RCMTable` triple-sticky + nested scroller di `BPMModal`** → mitigasi: fase ini hanya rapikan wrapper; ganti magic `top-[36/79px]` ke CSS vars bila sempat, tanpa ubah perilaku desktop.
- **[Risk] jsdom tidak menangkap layout** → mitigasi: verifikasi analitis 320/360 + guard `getAllByText` untuk dual-render.
