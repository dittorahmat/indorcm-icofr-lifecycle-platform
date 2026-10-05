## Why

Pada viewport mobile (320px–390px), pola clipping yang sudah diperbaiki di Dashboard (`fix-mobile-dashboard-responsive-clipping`) terulang di semua modul lain: Scoping, RCM/BPM, CSA/Testing/Deficiencies, Reports/Audit/Admin, ditambah arsitektur shell ganda (`RootLayout` + `AppLayout`) yang menjebak scroll dan menggandakan safe-area padding (~112px dead space).

Audit per-domain (2026-10-05, read-only) menemukan ~30 lokasi: rigid `flex justify-between` tanpa stack, tabel `min-w-[...]` tanpa scroll wrapper terisolasi, Recharts tanpa wrapper + font/legend sub-12px, grid fixed di base, dialog dengan `overflow-hidden` ganda, FAB fixed menutup canvas, dan tombol `h-9` di bawah mandat sentuh 44px.

Perubahan ini diperlukan untuk kepatuhan penuh mandat `better-interface` + `design-taste-frontend` SK-5 BUMN ICOFR di seluruh platform, sehingga Lini 1–3 dapat bekerja dari perangkat seluler tanpa kehilangan informasi akibat terpotong.

## What Changes

- **Shell (P0):** Satu scroll owner vertikal (`RootLayout` keep `overflow-y-auto + pb-[calc(3.5rem...)]`; `SidebarInset` → `overflow-visible`, hapus `overflow-y-auto/x-hidden` kedua + hapus duplikat `pb-[calc]` di `AppLayout`).
- **Scoping:** Stack `ScopingHealthDashboard` chart+panel (`flex-col sm:flex-row`), font axis/tooltip ≥12px, `SmartImportWizard` nilai Rp `text-lg sm:text-2xl break-all`, `rounded-[3rem]` → `rounded-lg`, hapus `overflow-hidden` ganda di `ScopingPage` dialogs, wrapper baku untuk `GLDataIntake` charts/preview + `SetBenchmarkModal` table.
- **RCM/BPM:** `RcmTables` tambah isolated scroller + `min-w-[720px]` + dual-render cards; `BPMCanvasLayout` `grid-cols-1 sm:grid-cols-12` + logo/teks mengecil; `BPMDocumentView` FAB `inset-x-4 flex-col`; `ApplicationControlsTable` tambah `min-w`; `BPMOcrModal` panes scroll; `TransactionSamplingTab` toolbar stack.
- **CSA/Testing/Deficiencies:** `CSAReviewMatrix` grid ke `sm:`; `DeficiencyCard` + `ControlTestCard` header stack; tombol verdict `w-full sm:w-auto`; `DoDWorksheetDialog` tabs `sm:grid-cols-3`.
- **Reports/Admin:** Tombol `DoDLampiran10Report` + `CustomizableDashboard` + Lampiran11 stack + `min-h-[44px]`; `Appendix7aSummary` `min-w-[560px]` + `Appendix7aDetailed` border fix; Recharts wrapper + legend 12px; tabs audit/admin `min-w-0 flex-1`.

## Capabilities

### New Capabilities
- `global-mobile-view`: Standardisasi responsivitas mobile-first 320px–390px di seluruh modul ICOFR tanpa page-level horizontal scroll.

### Modified Capabilities
<!-- Tidak ada perubahan logika bisnis -->

## Impact

- **Affected Components:** `RootLayout`, `AppLayout`, scoping (7 file), RCM/BPM (9 file), CSA/testing/deficiencies (4 file), reports/audit/admin (8 file). Total ~30 file, daftar penuh di `tasks.md`.
- **APIs & Dependencies:** Tidak ada perubahan API backend atau schema database. Tidak ada breaking changes.
