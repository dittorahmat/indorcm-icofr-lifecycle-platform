# Proposal: Refactor BPMEditor Modularity

## Problem & Motivation
`src/components/rcm/BPMEditor.tsx` saat ini berukuran lebih dari **2.100 baris kode (LOC)**. File ini telah menjadi *"God Component"* yang menanggung terlalu banyak tanggung jawab secara bersamaan:
1. **Penyuntingan & Staging AI OCR (~350 LOC)**: Dialog review, staging kanvas terpisah, form label, dan list edge connections.
2. **Palet Bentuk & Kontrol Alur (~300 LOC)**: 30+ tombol node standar Lampiran 3 dan backlog migrasi kontrol.
3. **Canvas Top Toolbar (~200 LOC)**: Tombol Undo/Redo, Auto-Arrange, GL mapping popover, scale selector, dan Save action.
4. **Floating Selection Awareness HUD (~120 LOC)**: Indikator elemen aktif di bawah kanvas dengan aksi lock/unlock dan delete cepat.
5. **Document Print & PDF Export Canvas (~150 LOC)**: Mode tampilan cetak dokumen, render off-screen/dom capture, dan pembuatan file PDF.
6. **Canvas React Flow State & Orchestration (~1.000 LOC)**: Integrasi React Flow, mutation query, alignment guides, dan keyboard listeners.

Kondisi ini mengakibatkan:
- Tingginya risiko regresi saat memodifikasi salah satu bagian (misal styling toolbar atau penambahan shape baru).
- Beban komputasi re-render kanvas yang berat saat komponen dialog atau palet berinteraksi.
- Kesulitan dalam penulisan unit test terisolasi untuk fitur-fitur pendukung.

## Proposed Solution
Lakukan pemecahan modul arsitektural (*modular refactoring*) tanpa mengubah perilaku maupun fungsionalitas pengguna (*zero behavioral regression*):
- Ekstrak komponen sub-sistem ke dalam direktori `src/components/rcm/editor/`:
  - `BPMCanvasToolbar.tsx`: Toolbar atas kanvas (Undo, Redo, Auto-Arrange, Scale, GL Link, Save, Locked badge).
  - `BPMShapePalette.tsx`: Panel kiri (Flow controls, daftar 30+ shape BPM Lampiran 3, dan Migration Backlog drag items).
  - `BPMSelectionHUD.tsx`: Panel mengambang di bawah kanvas yang menampilkan status elemen aktif terpilih.
  - `BPMOcrModal.tsx`: Dialog modal lengkap untuk AI OCR upload, image preview, staging canvas, dan fine-tuning nodes/edges.
  - `BPMDocumentView.tsx`: Mode kanvas tampilan dokumen untuk ekspor cetak & PDF.
- Rampingkan `BPMEditor.tsx` menjadi murni kanvas orchestrator yang mengelola state data, event handlers, dan rendering hook.

## Impact & Scope
- **File target yang direfaktor**: `src/components/rcm/BPMEditor.tsx`.
- **Komponen baru**:
  - `src/components/rcm/editor/BPMCanvasToolbar.tsx`
  - `src/components/rcm/editor/BPMShapePalette.tsx`
  - `src/components/rcm/editor/BPMSelectionHUD.tsx`
  - `src/components/rcm/editor/BPMOcrModal.tsx`
  - `src/components/rcm/editor/BPMDocumentView.tsx`
- **Zero Breaking Changes**: Seluruh prop interface, API calls, keyboard shortcuts, dan integrasi i18n tetap identik 100%.
