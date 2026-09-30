## Context

Lihat `proposal.md` (Why). State saat ini: 5 change mobile sebelumnya sudah menutup shell (`MobileBottomNav`, `MainHeader` compact, `FiscalYearSelector` pill), dashboard (KPI 2x2, `ActionCenter` di atas, `LifecycleProgress` stepper adaptif), dan sebagian CSA (`CSAMobileCard`, bottom-sheet TOD). Sisa yang belum: konsistensi dual-render di semua tabel + jobs lapangan Lini 1 end-to-end (kartu + evidence + todo) + keputusan jujur untuk tabel berat. Batasan: tanpa dependensi baru, tanpa perubahan API/DB, Tailwind + Shadcn + Radix Sheet/Dialog yang sudah ada, i18n wajib, anti-AI slop (AGENTS.md).

## Goals / Non-Goals

**Goals:**
- Satu pola dual-render baku (`hidden md:block` tabel + `block md:hidden` kartu) yang dipakai konsisten + aman di test.
- Lini 1 bisa selesaikan CSA + foto evidence + cek todo sepenuhnya dari HP 360–390px.
- Tabel berat tetap bisa dibaca di HP tanpa scroll horizontal paksa, dengan ekspektasi jelas (read-only + ajakan desktop).

**Non-Goals:**
- Editor canvas BPM di HP (tetap desktop-only).
- Perubahan aturan validasi SK-5 / Lini 2 / skema DB / endpoint API.
- Redesign visual besar — ini konsolidasi + jobs, bukan retheme.

## Decisions

1. **Dual-render, bukan satu tabel responsif** — mengikuti pola terbukti `DeficiencyBoard`/`BPMDiagramList`. Alternatif (kolom disembunyikan progresif / scroll horizontal) ditolak: menyembunyikan kolom melanggar integritas data SK-5, scroll horizontal tidak ergonomis di lapangan.
2. **Bottom-sheet (Radix Sheet) untuk dialog mobile, bukan Dialog di-scale-down** — agar `max-h-[90vh]` + sticky action + aman dari keyboard. Alternatif (Dialog `max-w-sm`) ditolak: tombol aksi tenggelam di bawah keyboard.
3. **Read-only + banner untuk tabel berat, bukan card penuh** — `BPMWorksheet` (2500px), Testing, Scoping, Lampiran 6/8 dipaksa jadi card penuh akan menghilangkan konteks kolom dan meledakkan effort. Alternatif (card penuh semua) ditolak karena biaya vs nilai lapangan rendah — Lini 1 jarang edit worksheet dari HP.
4. **Evidence via input file native, bukan kamera custom** — `accept="image/*"` + `capture` opsional memakai kamera bawaan, nol dependensi, izin browser standar. Alternatif (pustaka kamera/PWA) ditolak: overkill + masalah izin.
5. **Todo sebagai daftar vertikal terurut urgensi** — reuse pola `ActionCenter`, bukan replika sidebar. Alternatif (drawer menu hirarkis) ditolak: Lini 1 butuh antrian kerja, bukan peta situs.

## Risks / Trade-offs

- [Duplikasi dengan 5 change mobile] → Mitigasi: change ini eksplisit melanjutkan `make-platform-mobile-friendly`; Fase 1 hanya konsolidasi pola, bukan mengulang RCM/FAB.
- [Dual-render menggandakan DOM + test pecah] → Mitigasi: wajib `getAllByText`/scoping + `closest()` (aturan AGENTS.md 2026-09-30); review tiap tabel baru.
- [Kartu menyembunyikan kolom SK-5] → Mitigasi: kartu memuat identifier kunci + ekspansi/bottom-sheet berisi atribut lengkap; read-only berat tidak menghilangkan baca.
- [Foto lapangan besar → upload lambat] → Mitigasi: pratinjau + kompresi client-side ringan bila perlu (keputusan implementasi, bukan spec); gagal upload memberi pesan + retry, tidak hilangkan data form (`UnSavedChanges`).
- [Banner "buka desktop" dianggap penolakan fitur] → Mitigasi: copy i18n yang jelas + tetap beri ringkasan baca + deep-link ke record yang sama di desktop.

## Migration Plan

- Bertahap per halaman (CSA → Todo → pembungkus read-only), masing-masing di balik breakpoint murni (tanpa flag); rollback = revert file halaman terkait (tanpa migrasi DB).
- Validasi tiap fase: `npm run type-check` (per-tsconfig, redirect ke file — jangan pipe), `npm run lint`, `npm run build`, `npm test` berurutan (jangan paralel, OOM guard Windows).

## Open Questions

- Batas ukuran file foto evidence (mis. 5MB vs 10MB) — bisa diputuskan saat implementasi tanpa mengubah spec.
- Perlu mode offline/antre upload di area tanpa sinyal? Ditunda — di luar scope change ini kecuali diminta.
