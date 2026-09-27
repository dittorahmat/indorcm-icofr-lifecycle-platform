## Context

`BPMStatusBanner` (`src/components/bpm/BPMStatusBanner.tsx`) saat ini punya dua gaya berbeda: state `Approved` dan `Source Data Missing` sudah berupa strip kompak (`rounded-xl p-4 flex items-center gap-4`), sedangkan state empty (tidak ada baseline approved) memakai empty-state besar (`py-12 text-center border-2 border-dashed rounded-2xl`, ikon `h-14 w-14`). Judul empty-state digabung dari `bpm:baseline.status + common:status.rejected`, sehingga menyesatkan. Lihat `proposal.md` untuk motivasi dan `specs/bpm-status-presentation/spec.md` untuk kontrak perilaku.

`WorkflowPanel` (`src/components/workflow/WorkflowPanel.tsx`) selalu merender `CardContent` penuh: aksi + `ScrollArea h-[300px]` berisi `WorkflowHistoryTimeline` + `CardFooter` compliance note. Di `BPMPage.tsx:296-324` panel ini duduk di `ResizablePanel` 30% di bawah header `Selected Process` tambahan, sehingga total tinggi kanan jauh melebihi kebutuhan aksi.

Batasan proyek (AGENTS.md): min font 12px (`text-xs`), radius institusional (`rounded-md/lg`), tanpa `backdrop-blur`/glassmorphism, tanpa `animate-pulse/ping/bounce` pada badge statis, seluruh string UI wajib i18n (`useTranslation`, `src/i18n/locales/**`), dan `npm run type-check + lint + build + test` harus hijau.

## Goals / Non-Goals

**Goals:**
- Ketiga state banner punya tinggi dan pola layout yang konsisten (strip satu baris).
- Wording empty-state akurat dan terlokalisasi EN/ID lewat key i18n baru.
- Riwayat workflow terlipat default tanpa menyembunyikan aksi; count terlihat di label toggle.

**Non-Goals:**
- Mengubah query data (`useActiveSimulation`, `useSimulationSnapshot`), status workflow, API, atau skema DB.
- Mendesain ulang `BPMDiagramList`, filter scoping, atau tabel asersi.
- Menambah mode dismiss permanen untuk banner (banner kepatuhan harus selalu terlihat).

## Decisions

### 1. Empty-state banner → strip `amber` sejajar Approved, bukan `slate dashed` besar

Ubah cabang ketiga `BPMStatusBanner` dari blok `py-12 text-center` menjadi `rounded-xl p-3 sm:p-4 flex items-center gap-3` dengan ikon `h-8 w-8` + kolom teks (judul `text-xs font-bold`, deskripsi `text-xs`) + tombol `Buka Scoping / Open Scoping` (link ke `/scoping?year={viewYear}`) di sisi kanan. Warna: `amber-50/border-amber-200` (warning) agar berbeda dari `emerald` (approved) dan `rose` (missing snapshot), konsisten dengan semantik yang sudah ada di `WorkflowPanel.getStatusColor`.

- Alternatif ditolak: dismissible alert (user bisa menutup lalu lupa baseline belum approved) dan badge-di-header saja (risiko user tidak sadar kenapa konten terkunci).
- Perlu prop baru `viewYear` sudah ada; tambah `onOpenScoping` opsional atau `Link` langsung — pilih `Link` langsung agar komponen tetap presentasional dan mudah diuji.

### 2. Wording lewat key baru `bpm:baseline.emptyTitle`, hapus gabungan `status + rejected`

Tambah `emptyTitle` di `en/bpm.json` (`No Approved Baseline for {{year}}`) dan `id/bpm.json` (`Baseline Belum Disahkan untuk {{year}}`). Komponen memakai `t('bpm:baseline.emptyTitle', { year: viewYear })`, bukan `t('bpm:baseline.status') + t('common:status.rejected')`. Key lama `baseline.status`, `baseline.description`, `baseline.empty` dipertahankan (tidak dihapus) agar tidak merusak pemakaian lain; `baseline.empty` dipakai sebagai deskripsi satu baris.

- Alternatif ditolak: mengubah nilai `common:status.rejected` (berdampak global ke semua modul).

### 3. History → `Collapsible` tertutup default, aksi tetap di luar

Bungkus blok history + `CardFooter` compliance note dalam collapsible (komponen `ui/collapsible` bila tersedia, jika tidak memakai state lokal + button toggle). Label toggle menampilkan count: `Riwayat (N)` / `History (N)` memakai `history.length`. Default `open=false`. Blok aksi (`renderButtons`) dan header status/badge tidak berubah. Tinggi `ScrollArea` 300px dipertahankan di dalam area expanded.

- Alternatif ditolak: memindah history ke Sheet/Dialog terpisah (perubahan UX lebih besar, ditolak user di eksplorasi — dipilih Opsi 1 accordion).
- Edge case `history.length === 0`: label tetap `Riwayat (0)`, area expanded menampilkan empty-state kecil dari `WorkflowHistoryTimeline` yang sudah ada.

## Risks / Trade-offs

- [Risk] Penerjemahan judul baru terdengar kaku → Mitigasi: kunci EN/ID sudah disepakati di eksplorasi; verifikasi visual via `npm run build` + cek manual kedua bahasa.
- [Risk] Tombol `Buka Scoping` salah route → Mitigasi: gunakan pola deep-link yang sudah ada (`useBPMPage` membaca `searchParams` fsli/noGL); cukup link `/scoping` dengan query `year`.
- [Risk] Collapsible mengubah tinggi panel saat expand dan menggeser layout resizable → Mitigasi: perilaku default justru lebih pendek; expand bersifat opt-in user, `ResizablePanel` sudah scrollable (`h-full flex flex-col` + `ScrollArea` internal).
- [Trade-off] Banner tetap memakan satu baris meski kompak — disengaja demi visibilitas kepatuhan (non-dismissible).
