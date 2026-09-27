## 1. Parity Renderer

- [x] 1.1 Tambah prop `edgeTypes` ke `BPMDocumentView` dan teruskan ke `<ReactFlow edgeTypes={...}>` — verifikasi tidak ada error TS (`npm run type-check` lolos).
- [x] 1.2 Teruskan `bpmEdgeTypes` dari `BPMEditor` ke `BPMDocumentView` (dan ke `BPMOcrModal` bila memakai view yang sama) — verifikasi Document View merender path `M ... L ...` + bridge `A ...`, bukan `C ...` (cek via inspect element).
- [x] 1.3 Samakan `markerEnd` (ArrowClosed 20x20), `style`, `Background`, dan `fitViewOptions` antara editor dan Document View — verifikasi tidak ada perbedaan visual kepala panah dan grid.

## 2. Verification

- [ ] 2.1 Verifikasi manual editor-vs-PDF pada diagram dengan crossing + multi-edge: pastikan siku 90°, bridge arc muncul, dan titik koneksi terdistribusi sama — lampirkan perbandingan sebelum/sesudah.
- [x] 2.2 Jalankan mandat penyelesaian tahap: `npm run type-check`, `npm run lint`, `npm run build`, `npm test` — semua harus hijau.
