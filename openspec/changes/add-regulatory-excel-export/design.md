## Context

Lihat `proposal.md` (Why) untuk motivasi. Kondisi saat ini:

- Pustaka `xlsx` (SheetJS) sudah menjadi dependensi (`package.json` via tarball CDN) dan di-chunk tersendiri (`vendor-xlsx` di `vite.config.ts`), jadi tidak ada dependensi baru.
- Satu pola export Excel yang matang sudah ada: `src/lib/rcm-excel-export.ts` (`exportRCMToExcel`, dipakai TLC/ELC/ITGC) dengan pola `json_to_sheet` + `book_new` + `writeFile`, plus test `src/test/rcm-matrix-flat-export.test.ts`.
- Dua tabel regulasi hanya bisa CSV (Lampiran 10 via concat string manual, Lampiran 6 via `Papa.unparse`); sisanya (Lampiran 8/9/11, WBS, TOD/TOE, Appendix 7a, master ChangeLog) nol export.
- Semua kebutuhan header bilingual sudah tersedia di namespace i18n `reports` (dan `rcm`/`scoping` untuk tabel sumber).

## Goals / Non-Goals

**Goals:**

- Satu jalur export Excel regulasi yang dipakai semua tabel (Opsi A).
- File setia-layout-lampiran: judul, kop/identitas, grup kolom, header, data — sebagai baris terstruktur.
- Filter/search/sort UI terbawa; 1 tabel = 1 sheet = 1 file; header ikut locale saat download.

**Non-Goals:**

- Tidak mengubah skema DB, API worker, alur approval/sign-off/lock, atau logika perhitungan (DoD, materialitas).
- Tidak meniru styling piksel-perfect (warna sel, border tebal, logo tertanam) — SheetJS edisi komunitas tidak mendukung styling sel; kop disediakan sebagai teks terstruktur untuk dilengkapi manual.
- Tidak menggabungkan multi-lampiran ke satu workbook (keputusan: 1 file per tabel).

## Decisions

1. **Generalisasi `src/lib/rcm-excel-export.ts` menjadi builder regulasi bersama** (bukan modul baru dari nol). Rasional: pola kolom-bersih, filename, dan test-nya sudah terbukti; Lampiran 10/6/8/9/11/WBS menjadi konfigurasi kolom + baris kop di atas fondasi yang sama. Alternatif (modul baru terpisah) ditolak karena akan menduplikasi 80% logika yang sama.
2. **Gunakan mode array-of-arrays (AoA), bukan `json_to_sheet`, untuk tabel regulasi.** Rasional: `json_to_sheet` hanya bisa menulis satu baris header datar — tidak bisa menampung baris judul/kop + baris grup kolom (mis. i–vi / vii–x / xi–xvii / xviii–xxiv) yang disyaratkan spec layout. AoA (`XLSX.utils.aoa_to_sheet`) menulis baris demi baris sesuai urutan spec. `json_to_sheet` tetap dipakai untuk tabel non-lampiran yang sudah ada (Scoping, CSA summary) agar tidak ada regresi.
3. **Locale di-resolve pada saat klik (bukan saat render).** Rasional: memenuhi "ikut locale aktif ketika download" — builder menerima fungsi penerjemah/masuk locale aktif dan membangun header saat aksi unduh, sehingga ganti bahasa tanpa reload tetap benar. Alternatif (header dihitung saat render komponen) ditolak karena bisa basi.
4. **Filter diteruskan sebagai baris yang sudah terfilter dari komponen.** Rasional: tiap tabel sudah punya `useMemo` baris terfilter (mis. `filteredRows` Lampiran 10); builder menerima array final tersebut sehingga tidak ada duplikasi logika filter di lapisan export. Komponen yang belum punya memo filter membuatnya dulu sebagai prasyarat tombol export-nya.
5. **CSV dipertahankan berdampingan selama transisi, lalu tombol CSV lama diganti.** Rasional: Lampiran 10 dan 6 sudah punya konsumen CSV; mengganti sekaligus berisiko bagi pengguna yang mengandalkan CSV. Setelah Excel stabil + test hijau, tombol CSV dihapus agar tidak ada dua sumber kebenaran.

## Risks / Trade-offs

- [Risk] SheetJS komunitas tidak menulis style sel (bold, warna, border, lebar kolom) → file terlihat polos, bukan replika visual 1:1. → Mitigasi: struktur baris (judul/kop/grup/header) dipertahankan sebagai data; dokumentasikan langkah format manual 1 menit (freeze pane, bold header) di panduan pengguna; kop/logo diisi manual sesuai keputusan pengguna.
- [Risk] Tabel besar (RCM TLC ratusan baris x 30+ kolom) membuat `writeFile` memblokir UI. → Mitigasi: lazy-import `xlsx` saat klik (pola sudah ada di `CSAPage`), tampilkan state loading `isExportingXLS`; evaluasi chunked write bila sheet > 5.000 baris saat implementasi.
- [Risk] Inkonsistensi label header antar lampiran (ID vs EN, istilah "Ya/Tidak"). → Mitigasi: seluruh string header/status wajib lewat kunci i18n `reports` (+ fallback `defaultValue` Indonesia); lint manual saat review tiap tabel.
- [Risk] Placeholder report (`ELCReport`/`FindingsReport`/`Lampiran11Report`) belum punya data nyata. → Mitigasi: export dihubungkan ke query data yang sama dengan halaman sumber (RCM pages, deficiencies, controls); placeholder diganti render tabel nyata dulu sebelum tombol export dipasang.

## Migration Plan

1. Bangun builder bersama + unit test pola (Lampiran 10 sebagai tabel percontohan, karena struktur 24 kolomnya paling kompleks).
2. Rollout per lampiran: 10 → 6 → 7a → 8 → 9 → 11 → WBS → TOD/TOE, masing-masing dengan test export + `type-check` + `lint` + `build` per mandat proyek.
3. Hapus tombol/penulis CSV lama setelah padanan Excel-nya lolos uji.
4. Rollback: tiap tabel bersifat independen — tombol Excel per tabel dapat disembunyikan via flag tanpa memengaruhi tabel lain.

## Open Questions

- Apakah file Lampiran 11 (yang di-lock setelah sign-off) boleh diunduh ulang pasca-lock dengan cap "FINAL", atau unduhan dibekukan bersama data? (Tidak mengubah spec/layout/task — diputuskan saat implementasi Lampiran 11.)
