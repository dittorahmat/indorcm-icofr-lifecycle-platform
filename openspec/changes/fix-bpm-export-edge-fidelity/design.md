## Context

`BPMEditor.tsx` merender ReactFlow dengan `nodeTypes={bpmNodeTypes}` dan `edgeTypes={bpmEdgeTypes}` (`bridge: BridgeEdge` — orthogonal Manhattan + bridge arc + `ARROW_OFFSET 6px`). `BPMDocumentView.tsx` (yang di-capture `toPng` di `export-bpm-pdf.ts` via `#bpm-document-canvas`) hanya menerima `nodeTypes`, tanpa `edgeTypes`. Edge bertipe `type: 'bridge'` jatuh ke Bezier default. Lihat proposal.md Why untuk motivasi.

## Goals / Non-Goals

**Goals:**
- Document View memakai renderer edge yang identik dengan editor (siku, bridge arc, distribusi multi-edge, ArrowClosed 20x20).
- Tidak mengubah alur export (`toPng` + `jsPDF`) dan tidak menambah dependensi.

**Non-Goals:**
- Pisah render header/footer ke `jsPDF` native (Opsi B) — ditunda kecuali Opsi A terbukti kurang.
- Ganti library snapshot (`html-to-image` tetap).
- Ubah routing `BridgeEdge` itu sendiri.

## Decisions

### 1. Pass-through `edgeTypes` (Opsi A)
- **Pilihan**: tambah prop `edgeTypes` ke `BPMDocumentView`, teruskan `bpmEdgeTypes` dari `BPMEditor` (baik saat `documentView=true` maupun saat OCR modal bila memakai view yang sama).
- **Rasional**: satu baris penyebab, satu baris perbaikan; menyamakan `nodeInternals`-based routing (`normalizeHandlePosition`, `getDistributedPoint`) di kedua viewport.
- **Alternatif ditolak**: export langsung dari viewport editor — presisi lebih tinggi tapi butuh ukur ulang `getViewportForBounds` + render header/footer manual di `jsPDF`.

### 2. Samakan `markerEnd`, `Background`, `fitView`
- **Pilihan**: pastikan `markerEnd: ArrowClosed 20x20 #0f172a`, `style strokeWidth 2`, `Background` dan `fitViewOptions padding 0.15` konsisten di kedua view.
- **Rasional**: `BridgeEdge` menghitung `ARROW_OFFSET` dan `SAFE_HEADER_CEILING` dari koordinat absolut; viewport berbeda (flex-1 vs `h-[800px]` fixed) mengubah zoom hasil `fitView` dan memperbesar perbedaan visual.
- **Alternatif ditolak**: override marker per-edge di Document View saja — rapuh, duplikasi sumber kebenaran.

### 3. Tidak ubah `export-bpm-pdf.ts`
- **Pilihan**: biarkan `toPng(element #bpm-document-canvas, pixelRatio 2)` + `jsPDF landscape A4` apa adanya.
- **Rasional**: bentuk jalur ditentukan ReactFlow sebelum snapshot; snapshot hanya memperbesar perbedaan yang sudah ada.

## Risks / Trade-offs

- **[Risk] SVG `<marker>` di-clone `html-to-image` dengan `pixelRatio: 2` terlihat beda skala** → **Mitigasi**: verifikasi visual dulu; bila masih aneh, spike inline marker ID.
- **[Risk] `EdgeLabelRenderer` portal bergeser 1-2px saat `transform: none` dipaksa `toPng`** → **Mitigasi**: terima sebagai toleransi; label bukan bagian dari keluhan utama (bentuk lengkung vs siku).
- **[Risk] Viewport Document (`h-[800px]`) memotong diagram sangat panjang** → **Mitigasi**: `fitView` sebelum capture tetap dipertahankan; tidak ubah layout dokumen di change ini.
