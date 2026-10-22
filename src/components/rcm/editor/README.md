# BPM Editor & OCR Layout Architecture

Arsitektur modul BPM Editor terbagi secara tegas antara mesin tata letak deterministik murni, manajemen state kanvas React Flow, dan antarmuka penelaahan (review modal):

## 1. Mesin Tata Letak Deterministik (Pure Layout Engine)
- **`src/utils/ocr-layout.ts`**: Orkestrator utama tata letak OCR deterministik. Menghitung urutan swimlane, batas spasial (*snapping*), resolusi label, dan penempatan node anak per-swimlane.
- **`src/utils/ocr-lane-geometry.ts`**: Utilitas geometri murni:
  - Perhitungan dimensi swimlane (`computeLaneWidths`, `computeUniformHeight`).
  - Penentuan rank topologis lokal vertikal (`buildDepthMap`, `groupNodesByRank`).
  - Staggering sekuensial node dokumen *standalone* (misal: bundle KUR KTP/KK/Surat Usaha) agar tidak bertumpuk pada rank 0.
- **PENTING**: Dilarang menghidupkan kembali auto-layout client-side ad-hoc (`bpm-auto-layout.ts` telah dihapus permanen). Koordinat kanvas yang sudah disimpan oleh pengguna bersifat otoritatif.

## 2. Kanvas & State Management
- **`src/components/rcm/BPMEditor.tsx`**: Komposisi root untuk BPM Studio.
- **`src/components/rcm/editor/BPMCanvasToolbar.tsx`**: Toolbar responsif dengan pemisahan kluster:
  - Kluster Kiri (`flex-1 min-w-0 overflow-x-auto`): Alat bantu (Undo, Redo, Fit, Zoom, Link GLs).
  - Kluster Kanan (`shrink-0 border-l border-slate-200`): Status Locked & Tombol Save Workflow (selalu terlihat).
- **`src/components/rcm/editor/hooks/`**:
  - `useBPMEditor.ts`: Seam orkestrasi tunggal hook editor.
  - `useBPMEditorHistory.ts`: Pengendali Undo, Redo, dan shortcut keyboard (`Ctrl+Z`, `Ctrl+Y`).
  - `useBPMDiagram.ts`: Graph state (nodes & edges) dan mutasi React Flow.

## 3. Penelaahan OCR (Staging & Review)
- **`src/components/rcm/editor/BPMOcrModal.tsx`**: Modal dialog upload dan penelaahan OCR.
- **`src/components/rcm/editor/ocr/OcrReviewView.tsx`**: Tampilan penelaahan berdampingan (*split-view*) yang menyandingkan gambar/PDF sumber asli dengan kanvas staging React Flow sebelum pengguna melakukan *Save & Apply*.
- **`src/components/rcm/editor/ocr/useOcrStaging.ts`**: Pengendali siklus staging OCR (parsing, deduplikasi, validasi peringatan).
