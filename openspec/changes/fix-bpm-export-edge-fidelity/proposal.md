## Why

Hasil export PDF/Gambar BPM tidak WYSIWYG: di editor garis siku orthogonal Manhattan dengan bridge arc, tapi di PDF jadi garis melengkung Bezier. Untuk dokumen audit ICOFR (Lampiran 3 SK-5/DKU.MBU/11/2024), fidelity garis = integritas makna alur proses.

## What Changes

- Teruskan `bpmEdgeTypes` (`bridge: BridgeEdge`) ke `BPMDocumentView` agar ReactFlow export memakai renderer yang sama dengan editor.
- Samakan `markerEnd` (ArrowClosed 20x20), `Background`, dan `fitView` padding antara editor dan document view.
- Verifikasi visual editor-vs-PDF: tidak ada lagi garis melengkung, bridge arc muncul saat crossing, distribusi multi-edge konsisten.

## Capabilities

### New Capabilities
- (none — perbaikan parity, bukan kapabilitas baru)

### Modified Capabilities
- `bpm-edge-visuals`: tambah requirement WYSIWYG export — edge yang di-export (PDF/PNG via `BPMDocumentView` + `html-to-image`) WAJIB dirender dengan path, marker, dan gaya yang sama dengan editor.

## Impact

- `src/components/rcm/editor/BPMDocumentView.tsx`: tambah prop `edgeTypes`, samakan `Background`/`markerEnd` handling.
- `src/components/rcm/BPMEditor.tsx`: teruskan `bpmEdgeTypes` ke `BPMDocumentView`.
- `src/components/rcm/editor/utils/export-bpm-pdf.ts`: tidak ada perubahan logika (tetap `toPng` + `jsPDF`), hanya mendapat viewport yang sudah benar.
- `src/i18n/`: tidak ada string baru (tidak ada perubahan UI teks).
