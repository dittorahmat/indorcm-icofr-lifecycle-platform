## 1. Shared Export Builder

- [x] 1.1 Generalisasi `src/lib/rcm-excel-export.ts` menjadi builder regulasi bersama (judul + kop + grup kolom + header + data via AoA, lazy-import `xlsx`, filename `Lampiran_<N>_<Tabel>_<Periode>.xlsx`) dan verifikasi dengan unit test baru yang menegaskan struktur baris dan 1-sheet-1-file
- [x] 1.2 Tambahkan kunci i18n `reports` untuk label tombol Excel dan header kolom regulasi (ID + EN beserta `defaultValue` Indonesia) dan verifikasi tidak ada string hardcoded via pencarian `grep` pada file yang diubah

## 2. Lampiran 10 — Kertas Kerja DoD (percontohan)

- [x] 2.1 Ganti `handleExportCsv` di `DoDLampiran10Report.tsx` dengan export Excel 24 kolom (i–xxiv + baris grup Temuan/Agregasi/Asersi/Decision Tree) memakai `filteredRows` dan verifikasi file unduhan hanya memuat baris terfilter (uji manual + test CSV lama yang diperbarui)
- [x] 2.2 Pastikan nilai eksposur tertulis sebagai angka, tanggal ISO, sel kosong `-`, dan Ya/Tidak mengikuti locale aktif, dan verifikasi dengan membuka file (SUM valid, header sesuai locale)

## 3. Lampiran 6 — Log Perubahan

- [x] 3.1 Tambahkan tombol Excel di `ChangeLogReport` (`RegulatoryReportComponents.tsx`) dengan 11 kolom (i–xi) + blok sign-off Lini 1/2 dan verifikasi isi file sama dengan baris tabel di layar
- [x] 3.2 Tambahkan tombol Excel di master `ChangeLogPage.tsx` dan verifikasi unduhan memuat seluruh log yang tampil

## 4. Lampiran 7a — Dokumen CSA

- [x] 4.1 Tambahkan export Excel pada `Appendix7aDetailed.tsx` dan `Appendix7aSummary.tsx` (matriks sampel + kesimpulan) dan verifikasi file mencerminkan record CSA yang dibuka
- [x] 4.2 Tambahkan aksi Excel pada menu histori `CSAList.tsx` (Detailed/Summary per record) dan verifikasi unduhan per record benar

## 5. Lampiran 8 — Verifikasi Rancangan

- [x] 5.1 Tambahkan tombol Excel di `VerificationDesignPage.tsx` (matriks verifikasi + kolom 6 pilar Lini 2) memakai baris terfilter pencarian dan verifikasi file sesuai filter search yang aktif

## 6. Lampiran 9 — Daftar Temuan

- [x] 6.1 Ganti placeholder `FindingsReport` dengan tabel temuan nyata (sumber query deficiencies + controls yang sama dengan board) dan verifikasi tabel me-render data
- [x] 6.2 Tambahkan tombol Excel di `FindingsReport` dan `DeficiencyBoard.tsx` dan verifikasi file memuat daftar temuan yang tampil

## 7. Lampiran 11 — Asesmen Manajemen

- [x] 7.1 Ganti placeholder `Lampiran11Report` dengan tabel ringkasan (kesimpulan efektivitas, agregat defisiensi CD/SD/MW) dan verifikasi tabel me-render data ringkasan
- [x] 7.2 Tambahkan tombol Excel di `Lampiran11Report`/`ManagementAssessment.tsx` dan verifikasi file mencerminkan status sign-off periode aktif (putuskan perilaku unduh pasca-lock sesuai Open Question di design.md sebelum menutup task ini)

## 8. WBS Recap dan TOD/TOE

- [x] 8.1 Tambahkan tombol Excel di `WBSPage.tsx` (matriks indikator fraud + dampak) dan verifikasi file memuat seluruh indikator yang tampil
- [x] 8.2 Tambahkan tombol Excel pada kertas kerja TOD/TOE (`TestWorkbench.tsx` + tabel sampling) dan verifikasi file memuat sampel pengujian yang tampil

## 9. Finalisasi dan QA Mandat

- [x] 9.1 Hapus tombol/penulis CSV lama (Lampiran 10, Lampiran 6) setelah padanan Excel lolos uji dan verifikasi tidak ada referensi `handleExportCsv`/unparse tersisa via pencarian kode
- [x] 9.2 Jalankan `npm run type-check`, `npm run lint`, `npm run build`, `npm test` berurutan (satu per satu, output via file) dan verifikasi semuanya hijau tanpa error
