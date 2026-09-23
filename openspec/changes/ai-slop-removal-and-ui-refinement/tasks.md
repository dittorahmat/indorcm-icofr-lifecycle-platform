## 1. Pembersihan Kode Residu & AI Slop Visual

- [ ] 1.1 Hapus file artefak starter yang tidak digunakan `src/pages/DemoPage.tsx` dan pastikan tidak ada broken import dengan menjalankan `npm run type-check`.
- [ ] 1.2 Hapus class `bg-gradient-rainbow` dan efek blur pada `src/components/ErrorFallback.tsx` dan verifikasi tampilannya bersih menggunakan border dan background institusional.
- [ ] 1.3 Refactor `src/components/reports/AIAnalyticsMockup.tsx` dengan menghapus `bg-gradient-to-br from-indigo-500/20` dan animasi `animate-ping` radar menjadi panel metrik audit continuous monitoring yang solid.
- [ ] 1.4 Hapus animasi `animate-pulse` permanen pada status badges di `src/pages/deficiencies/DeficiencyBoard.tsx`, `src/pages/testing/TestWorkbench.tsx`, `src/pages/scoping/ScopingPage.tsx`, serta `src/components/rcm/properties/RegulatoryPropertySheet.tsx`.

## 2. Refactoring Komponen Inti RCM Table

- [ ] 2.1 Update `src/components/rcm/RCMTable.tsx`: ganti `bg-slate-100/95 backdrop-blur-md` pada sticky header kolom dengan `bg-slate-100 dark:bg-slate-900 border-b border-slate-300`, dan standarisasi padding/font size cell.
- [ ] 2.2 Update `src/components/rcm/RCMGroupRow.tsx`: sesuaikan warna header level grup agar tidak bertabrakan dengan pola teks baris di bawahnya.
- [ ] 2.3 Update `src/components/rcm/RCMPageHeader.tsx`: hapus `backdrop-blur-md` dan sesuaikan kontras tombol aksi.

## 3. Penyeragaman Tipografi Matriks RCM (TLC, ELC, ITGC)

- [ ] 3.1 Update `src/pages/rcm/RCMTLCPage.tsx`: standarisasi definisi kolom TLC agar menggunakan bobot font yang konsisten (`font-semibold` untuk nama/BPM code, `font-normal` non-italic untuk deskripsi kontrol dan risiko, `font-mono text-xs font-semibold` untuk nomor kontrol).
- [ ] 3.2 Update `src/pages/rcm/RCMELCPage.tsx`: standarisasi definisi kolom ELC dan chip prinsip COSO 1-17 dengan kontras teks yang konsisten.
- [ ] 3.3 Update `src/pages/rcm/RCMITGCPage.tsx`: standarisasi definisi kolom ITGC dengan hierarki tipografi seragam.

## 4. Penyeragaman Tampilan Tab Overview RCM

- [ ] 4.1 Update `src/components/rcm/TLCTabContent.tsx`: ubah container dari `rounded-3xl` ke `rounded-lg`, ganti header tabel `text-[10px]` menjadi `text-xs font-semibold`, dan hilangkan italic pada deskripsi kontrol.
- [ ] 4.2 Update `src/components/rcm/ITGCTabContent.tsx`: selaraskan ukuran corner radius ke `rounded-lg`, perbaiki ukuran font header ke `text-xs`, dan samakan kontras cell.
- [ ] 4.3 Update `src/components/rcm/ELCTabContent.tsx`: kurangi ukuran container `rounded-[2.5rem]` ke `rounded-xl`, standarisasi tipografi kartu COSO dan hilangkan `animate-pulse` pada badge ID gap.

## 5. Verifikasi Kualitas & Mandat Penyelesaian

- [ ] 5.1 Jalankan `npm run type-check` dan verifikasi 0 error TypeScript.
- [ ] 5.2 Jalankan `npm run lint` dan pastikan tidak ada linting warning/error baru.
- [ ] 5.3 Jalankan `npm test` untuk memastikan semua unit test matriks dan komponen lulus tanpa regresi.
- [ ] 5.4 Jalankan `npm run build` untuk memverifikasi kompilasi frontend berhasil optimal.
