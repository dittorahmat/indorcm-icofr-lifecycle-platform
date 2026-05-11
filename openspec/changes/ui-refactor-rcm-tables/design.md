## Context
Modul RCM (TLC, ELC, ITGC) merupakan tulang punggung audit ICOFR BUMN. Saat ini tabel data terlalu padat dan menggunakan *horizontal scroll* yang tidak ergonomis.

## Goals / Non-Goals

**Goals:**
- Meningkatkan keterbacaan data kepatuhan.
- Memberikan visual yang konsisten dan profesional untuk tim auditor.
- Mengimplementasikan *minimalist zebra* dan *header grouping*.

**Non-Goals:**
- Mengurangi kolom (karena terikat regulasi SK-5/DKU.MBU/11/2024).
- Mengubah alur kerja audit secara drastis (hanya refactoring UI).

## Decisions

- **Minimalist Zebra:** Menggunakan `bg-slate-50/50` dan `bg-white` untuk baris data guna menyeimbangkan kepadatan data.
- **Header Grouping:** Menggunakan background header berbeda untuk klaster kolom teknis (IPO, Assertion) guna navigasi auditor yang lebih baik.

## Risks / Trade-offs

- **[Performance] →** Penambahan class CSS mungkin sedikit meningkatkan bundle size (dimitigasi dengan penggunaan tailwind).
- **[Readability] →** Font yang ditingkatkan ke 12px dapat memotong teks di layar sempit (dimitigasi dengan *sticky columns* dan *ellipsis*).
