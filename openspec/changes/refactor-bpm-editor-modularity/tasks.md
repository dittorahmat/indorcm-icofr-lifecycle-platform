## 1. Persiapan Struktur & Komponen Toolbar & HUD

- [x] 1.1 Buat direktori `src/components/rcm/editor/` dan ekstrak `BPMSelectionHUD.tsx`. Hubungkan ke `BPMEditor.tsx`.
- [x] 1.2 Ekstrak `BPMCanvasToolbar.tsx` yang mencakup Undo, Redo, Auto-Arrange, GL mapping popover, Scale selector, dan Save button. Hubungkan ke `BPMEditor.tsx`.

## 2. Ekstraksi Shape Palette & Document View

- [x] 2.1 Ekstrak `BPMShapePalette.tsx` yang mencakup 30+ node standar Lampiran 3 dan Migration Backlog drag section. Hubungkan ke `BPMEditor.tsx`.
- [x] 2.2 Ekstrak `BPMDocumentView.tsx` yang mencakup mode preview dokumen kanvas dan ekspor cetak/PDF. Hubungkan ke `BPMEditor.tsx`.

## 3. Ekstraksi AI OCR Modal & Perampingan BPMEditor

- [x] 3.1 Ekstrak `BPMOcrModal.tsx` yang mengelola input file, visual preview, staging React Flow canvas, tab elements & connections. Hubungkan ke `BPMEditor.tsx`.
- [x] 3.2 Bersihkan sisa-sisa dead code dan unused imports di `BPMEditor.tsx` sehingga ukuran file berkurang drastis (di bawah ~600 LOC). Berhasil ditekan hingga 483 LOC dengan ekstraksi modul hook dan helper canvas.

## 4. Verifikasi Kualitas & Mandat Penyelesaian Tahap

- [x] 4.1 Jalankan `npm run type-check` dan pastikan 0 error TypeScript.
- [x] 4.2 Jalankan `npm run lint` dan pastikan tidak ada error linter.
- [x] 4.3 Jalankan `npm test` dan pastikan seluruh test suites (termasuk BPM unit tests) tetap passed 100%.
- [x] 4.4 Jalankan `npm run build` dan pastikan proses build produksi sukses.
