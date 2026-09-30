## Why

Lini 1 (process owner di lapangan) adalah pengguna mobile prioritas IndoGRC Pro: mereka mengisi CSA, memotret evidence walkthrough, dan menutup todo di lokasi produksi/Unit — bukan di meja desktop. Shell + dashboard sudah banyak diperbaiki oleh 5 change mobile sebelumnya, tetapi alur lapangan Lini 1 masih desktop-sentris (tabel CSA multi-kolom, dialog verifikasi kaku, upload evidence sulit di HP), sementara sisa tabel berat (BPMWorksheet 2500px, Testing, Scoping) tetap memaksa scroll horizontal yang tidak ergonomis di 360–390px.

## What Changes

- **Fase 1 — Polish konsisten (fondasi, risiko rendah)**:
  - Tutup kebocoran horizontal global (`w-full max-w-full overflow-x-hidden` di shell) tanpa mengubah logika bisnis.
  - Konsolidasi pola dual-render yang sudah terbukti (DeficiencyBoard, BPMDiagramList: `hidden md:block` + card `block md:hidden`) sebagai standar untuk sisa tabel.
  - Dialog verifikasi padat dibungkus bottom-sheet mobile (`max-h-[90vh]`, scroll containment, sticky action Batal/Simpan di thumb zone).
- **Fase 2 — Mobile jobs Lini 1 (prioritas)**:
  - Kartu CSA lapangan touch-friendly: Process, Unit, status Lini 2, aksi verifikasi — setara `CSAMobileCard`, bukan tabel.
  - Trigger upload foto/file evidence yang bisa dipakai satu tangan di walkthrough (input file + kamera, target sentuh >=44px).
  - Todo/My Tasks mobile sebagai antrian kerja Lini 1 (pengganti navigasi sidebar dalam).
  - Tabel berat (BPMWorksheet, RCM 2500px, Testing TOD/TOE, Scoping matrix, Lampiran 6/8) di mobile menjadi **read-only ringkas + banner "buka di desktop untuk edit"** — jujur, bukan dipaksa responsif penuh.
- **Non-goal (eksplisit)**: editor canvas BPM (React Flow) tetap desktop-only; tidak ada perubahan skema DB/API backend.

## Capabilities

### New Capabilities
- `mobile-lini1-field-workbench`: Alur kerja lapangan Lini 1 di mobile — kartu CSA, upload evidence foto, antrian todo, dan mode read-only untuk tabel berat dengan ajakan buka desktop.

### Modified Capabilities
- `csa-management`: Perluas persyaratan tampilan CSA ke kartu lapangan mobile + bottom-sheet verifikasi + trigger evidence (tanpa mengubah aturan validasi Lini 2).

## Impact

- **Affected UI**: `src/pages/csa/*`, `src/components/csa/*`, `src/pages/TodoListPage.tsx` (atau modul todo aktif), `src/components/layout/*` (overflow shell), dialog verifikasi (TODVerificationDialog dkk), pembungkus read-only untuk `BPMWorksheet`, Testing workbench, Scoping matrix.
- **Styling**: Tailwind responsive (`md:hidden`, `max-md:`, `env(safe-area-inset-*)`), token Shadcn, anti-AI slop (font ≥12px, `rounded-md/lg`, tanpa italic dekoratif/glassmorphism).
- **Dependencies/APIs**: Tanpa dependensi baru; tanpa perubahan backend/API — murni presentasi + ergonomi viewport, i18n via `src/i18n/locales/**`.
- **Relasi ke change lain**: Melanjutkan `make-platform-mobile-friendly` (table-to-card RCM, FAB offset, touch ergonomics) tanpa duplikasi — change ini fokus ke jobs Lini 1 + konsolidasi polish.
