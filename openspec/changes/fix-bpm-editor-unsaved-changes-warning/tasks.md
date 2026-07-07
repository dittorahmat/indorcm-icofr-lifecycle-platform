## 1. Perubahan Halaman BPM Utama (BPMPage & useBPMPage)

- [x] 1.1 Impor `useUnsavedChangesContext` di `src/pages/bpm/hooks/useBPMPage.ts`
- [x] 1.2 Modifikasi fungsi `handleCloseDiagram` di `useBPMPage.ts` untuk memeriksa `isDirty` dan menampilkan konfirmasi `window.confirm` sebelum menghapus parameter pencarian URL
- [x] 1.3 Periksa pemanggilan `handleCloseDiagram` pada tombol close ("X") di `src/pages/bpm/BPMPage.tsx` dan `onOpenChange` pada `<Dialog>` untuk memastikan konfirmasi dipatuhi

## 2. Perubahan Komponen BPM Worksheet

- [x] 2.1 Impor `useUnsavedChangesContext` di `src/components/bpm/BPMWorksheet.tsx`
- [x] 2.2 Modifikasi fungsi `handleCloseDiagram` di `BPMWorksheet.tsx` untuk menggunakan context dan memeriksa `isDirty` sebelum menghapus parameter
- [x] 2.3 Periksa pemanggilan `handleCloseDiagram` di `onOpenChange` pada `<Dialog>` di `BPMWorksheet.tsx`

## 3. Validasi & Pengujian

- [x] 3.1 Verifikasi bahwa diagram yang bersih dapat ditutup secara instan tanpa dialog konfirmasi
- [x] 3.2 Verifikasi bahwa setelah menambahkan node/shape baru di editor BPM, penutupan dialog memicu konfirmasi peringatan perubahan belum disimpan
- [x] 3.3 Verifikasi bahwa memilih "Batal" (Cancel) pada dialog konfirmasi menjaga modal editor BPM tetap terbuka dan perubahan tidak hilang
- [x] 3.4 Jalankan integrasi validasi mandat penyelesaian (typecheck, lint, build, dan test)

## 4. Refaktor UnsavedChangesProvider (Key-Based Tracking)

- [x] 4.1 Perbarui `UnsavedChangesContext.tsx` untuk melacak dirty status berdasarkan map of keys
- [x] 4.2 Perbarui hook `use-unsaved-changes.ts` untuk mendaftarkan state menggunakan ID unik `useId`
- [x] 4.3 Gunakan hook `useUnsavedChanges` di `src/components/rcm/BPMEditor.tsx` alih-alih setDirty manual


