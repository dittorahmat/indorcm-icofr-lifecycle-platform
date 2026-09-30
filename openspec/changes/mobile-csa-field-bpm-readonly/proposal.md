## Why

Tujuh change mobile sebelumnya menuntaskan shell, dashboard, dan Jalur 1 CSA (monitoring: `CSAPage`/`TodoListPage` sudah dual-render kartu). Namun audit lapangan menemukan Jalur 2 CSA — `CSATabContent`/`CSAForm`/`CSAList` tempat Lini 1 benar-benar mengerjakan assessment — masih desktop murni (tabel multi-kolom `min-w-[200px]`, form 537 baris, file input tersembunyi tanpa akses kamera), padahal CSA diprediksi menjadi aktivitas mobile tersering. Bersamaan dengan itu, BPM editor (React Flow + worksheet `min-w-[2500px]`) tidak dapat dipaksakan menjadi editor jempol, dan `DeficiencyBoard` masih melanggar mandat min-12px (`text-[10px]`) dengan Kanban horizontal yang tidak terpakai di HP.

## What Changes

- **CSA field form mobile (Jalur 2)**: `CSAList` mendapat render kartu mobile (`md:hidden`) mengikuti pola RCM/CSA-hub; `CSAForm` tabel sampel multi-kolom menjadi stepper/wizard satu-fokus per sampel di `<md` dengan aksi sticky (Simpan Draft / Submit) dan tombol upload evidence setara 44px+ dengan akses kamera (`capture="environment"`); tabel desktop tidak berubah.
- **BPM read-only di mobile**: `BPMDiagramList` menjadi kartu daftar + search full-width; canvas viewer full-viewport dengan pan/pinch-zoom, toolbar editor disembunyikan di `<md`, tap node membuka property sheet bottom-sheet read-only dengan penanda "Mode Lihat — edit di desktop"; worksheet 2500px/VerificationDesign 4200px/Lampiran6 1200px tampil sebagai ringkasan kartu + tampilan tabel penuh terkunci dalam container scroll (tidak bocor ke halaman).
- **Executive quick-wins sisa**: badge `DeficiencyBoard` `text-[10px]` → `text-xs`; Kanban multi-kolom menjadi tab vertikal per status di `<md`; tidak ada perubahan logika status.
- Semua perubahan mematuhi mandat anti-AI-slop (min 12px, `rounded-md/lg`, tanpa glassmorphism/animasi dekoratif) dan i18n penuh (tidak ada string hardcode baru).

## Capabilities

### New Capabilities
- `mobile-csa-field-form`: pola mobile untuk alur kerja CSA lapangan (daftar kartu, form stepper per sampel, upload evidence akses kamera, aksi sticky) di bawah breakpoint `md`.
- `mobile-bpm-readonly`: inspeksi BPM read-only di viewport kecil (daftar kartu diagram, viewer pan/zoom, property bottom-sheet read-only, ringkasan worksheet).
- `mobile-deficiency-quickwins`: perbaikan sisa mobile papan defisiensi (tipografi min-12px, Kanban menjadi tab vertikal).

### Modified Capabilities
- `csa-management`: memperluas persyaratan CSA dengan alur pengisian lapangan yang adaptif terhadap viewport kecil (form stepper + upload kamera + draft aman), tanpa mengubah aturan validasi/granular-verification yang sudah ada.

## Impact

- `src/components/bpm/CSATabContent.tsx`: input file + trigger upload (tambah `capture`, tombol kamera 44px+).
- `src/components/bpm/CSAList.tsx`: render ganda tabel desktop + kartu mobile + i18n.
- `src/components/bpm/CSAForm.tsx`: render ganda tabel sampel desktop + stepper mobile + aksi sticky + i18n.
- `src/components/bpm/BPMDiagramList.tsx`: kartu daftar mobile + search responsif.
- `src/components/rcm/BPMEditor.tsx` (atau wrapper viewer): mode read-only + sembunyikan toolbar di `<md` + bottom-sheet property.
- `src/components/bpm/BPMWorksheet.tsx`, `VerificationDesignPage.tsx`, `Lampiran6LogView.tsx`: ringkasan kartu + container scroll terkunci.
- `src/pages/deficiencies/DeficiencyBoard.tsx`: badge tipografi + tab vertikal mobile.
- Tidak ada perubahan skema database/API; murni presentasi client-side dan ergonomi viewport.
