## Context

Lihat `proposal.md` (Why). Keadaan kini: pola card-view mobile sudah terbukti di `CSAPage`/`RCM` (< 768px → kartu, `md` ke atas → tabel) dan `DialogContent` global sudah `max-h-[90vh]`; `MobileBottomNav` memakai dua query TanStack dengan `refetchInterval: 30000`; `React.lazy` baru dipakai satu kali (`ComplianceCharts` di `Dashboard.tsx`); `public/` hanya berisi `vite.svg`; tidak ada manifest/SW. `ApprovalPage` memakai tabel 8 kolom + `DialogContent max-w-5xl` berisi `GLDataGrid` read-only dan textarea catatan.

## Goals / Non-Goals

**Goals:**
- Menutup 6 celah mobile dalam satu change kecil tanpa mengubah perilaku desktop.
- Memakai ulang pola yang sudah ada (card-view CSA/RCM, `Suspense`+`Skeleton`, token Shadcn).

**Non-Goals:**
- Service worker / offline queue (risiko caching + konflik sync; change tersendiri).
- Editor BPM sentuh dan kanban vertikal (change tersendiri).
- Perubahan API, skema DB, atau alur approval.

## Decisions

1. **Card-view Approval meniru pola CSA/RCM** (render ganda dengan breakpoint `md:hidden` / `hidden md:block`) alih-alih komponen tabel responsif generik — konsisten dengan kode yang ada, risiko regresi minimal. Alternatif (satu komponen `ResponsiveTable` generik) ditolak: butuh refactor 7+ tabel sekaligus, di luar scope quickwin.
2. **Review dialog: pertahankan `Dialog`, tambah containment mobile** (`max-h-[90vh]`, konten `overflow-y-auto`, footer sticky) alih-alih migrasi ke bottom-sheet — dialog global sudah `max-h-[90vh]`; yang berat (`GLDataGrid` read-only) tetap digulir internal. Bottom-sheet penuh ditunda ke change khusus.
3. **PWA tanpa service worker**: manifest + theme-color + icon saja. Alasan: instalabilitas dan status-bar didapat tanpa risiko stale-cache pada data audit regulasi. Alternatif (Workbox penuh) ditolak untuk change ini.
4. **Polling → `refetchOnWindowFocus` + interval jarang** (mis. 5 menit) alih-alih realtime/push — hemat baterai/kuota dengan perubahan 2 baris; push butuh infra BE, di luar scope.
5. **Route `React.lazy` untuk rute berat** mengikuti pola `ComplianceCharts` yang ada; halaman ringan tetap eager agar navigasi bottom-nav (Dashboard/Agenda/CSA/RCM) tetap instan.
6. **i18n**: label kartu memakai ulang key `approval.*` yang ada; key baru hanya jika teks kartu tidak tercakup — tidak ada hardcode ID/EN.

## Risks / Trade-offs

- [Risk] Kartu Approval menduplikasi markup tabel → divergensi tampilan di masa depan → Mitigasi: ekstraksi komponen kartu kecil satu file, dan change ini hanya satu tabel.
- [Risk] Lazy route menambah delay navigasi pertama ke halaman berat → Mitigasi: fallback `Skeleton` konsisten + bottom-nav utama tetap eager.
- [Risk] Ikon PWA butuh aset maskable multi-ukuran → Mitigasi: generate dari logo yang ada (SVG → PNG 192/512 + maskable); tanpa desainer.
- [Risk] Interval polling jarang membuat badge basi → Mitigasi: `refetchOnWindowFocus` + refetch saat navigasi, sehingga angka segar saat dilihat.
