## Why

Halaman BPM (`src/pages/bpm/BPMPage.tsx`) menampilkan status baseline scoping sebagai empty-state raksasa (`py-12`, `border-dashed`, terpusat) saat tidak ada simulasi berstatus `Approved` untuk tahun berjalan. Tampilannya memakan ruang vertikal besar di antara filter FSLI/GL dan konten utama, padahal state `Approved`-nya sendiri sudah kompak (satu baris `p-4 flex`). Label gabungan `Official Baseline + Rejected` juga menyesatkan karena muncul untuk semua kondisi non-approved (belum ada simulasi, masih Draft/Pending, maupun benar-benar Rejected). Panel workflow per-proses di sisi kanan juga terlalu tinggi karena riwayat selalu terbuka (`ScrollArea h-[300px]`).

## What Changes

- Menyederhanakan `BPMStatusBanner` state empty/missing menjadi strip kompak satu baris (sejajar dengan state `Approved`), berisi ikon 32px, judul singkat, deskripsi satu baris, dan tombol aksi `Buka Scoping`.
- Mengganti wording `Official Baseline Rejected` menjadi judul akurat `No Approved Baseline for {{year}}` / `Baseline Belum Disahkan untuk {{year}}` (key i18n baru, tidak lagi menggabung `common:status.rejected`).
- Melipat bagian `History` pada `WorkflowPanel` menjadi accordion collapsed secara default (`Riwayat (N)`), dengan konten `WorkflowHistoryTimeline` dan compliance note di dalamnya. Bagian `Actions` tetap terlihat.
- Tidak mengubah logika data (`useActiveSimulation`, `useSimulationSnapshot`), alur workflow BPM, maupun API.

## Capabilities

### New Capabilities
- `bpm-status-presentation`: Aturan presentasi status baseline BPM yang kompak (banner strip + wording akurat) dan riwayat workflow yang dilipat secara default.

### Modified Capabilities
<!-- Tidak ada perubahan requirement pada capability yang sudah ada. -->

## Impact

- Kode terdampak: `src/components/bpm/BPMStatusBanner.tsx`, `src/components/workflow/WorkflowPanel.tsx` (accordion history saja), `src/i18n/locales/en/bpm.json`, `src/i18n/locales/id/bpm.json` (key baru `baseline.emptyTitle` + penyesuaian `baseline.empty` bila perlu).
- Tidak ada perubahan API, skema DB, atau alur approval (Scoping `Draft → Pending CFO → Pending Komut → Approved`, BPM `Draft → In Review → In Approval → Resolved` tetap).
- Risiko rendah: murni presentasi; kriteria kepatuhan (banner tetap terlihat, tidak bisa di-dismiss permanen) dipertahankan.
