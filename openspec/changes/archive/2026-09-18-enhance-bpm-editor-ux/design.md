## Context

BPM Editor mengelola visualisasi alur kerja pengendalian internal (ICOFR) menggunakan React Flow (`reactflow`), node kustom SVG, dan routing ortogonal (`BridgeEdge`). Lihat `proposal.md` untuk rincian latar belakang masalah.

Secara teknis, saat ini:
- Dimensi node terbagi antara inline SVG class (`BPMCustomNodes.tsx`) dan perhitungan layout OCR (`ocr-layout.ts`).
- `NodeResizer` di swimlane belum membedakan handling antara handle sudut dan handle tepi.
- State `nodes` dan `edges` diperbarui secara reaktif tanpa historical stack.
- Kalkulasi ortogonal pada `BridgeEdge.tsx` mengasumsikan tebakan arah jika handle ID tidak eksplisit, yang memicu panah terbalik pada koordinat relatif dalam swimlane.

## Goals / Non-Goals

**Goals:**
- Mengimplementasikan `useCanvasHistory` hook berbasis discrete snapshot (maks 30 langkah) yang mencatat aksi final (drag stop, drop, connect, delete).
- Melakukan isolasi resize tepi pada swimlane agar user bisa melebarkan/memanjangkan swimlane secara terpisah.
- Menambahkan High-Contrast Selection HUD & indicator di kanvas (outline glow, active selection banner, status bar).
- Menyediakan utilitas `bpm-auto-layout.ts` client-side instan menggunakan algoritma layout topologis berlapis (Dagre / hierarkis) tanpa dependensi eksternal berat.
- Memperbaiki `BridgeEdge` dan parser OCR agar menyertakan `sourceHandle` / `targetHandle` serta kalkulasi offset ujung panah.

**Non-Goals:**
- Mengubah skema database di PostgreSQL atau API backend diagram BPM.
- Menggunakan layanan AI berbasis cloud atau LLM berbayar untuk layouting otomatis (tetap 100% lokal, cepat, dan deterministik).

## Decisions

### 1. Discrete Undo/Redo Hook (`useCanvasHistory`)
- **Keputusan**: Mengelola stack history terpisah `{ past: CanvasSnapshot[], future: CanvasSnapshot[] }` dengan kedalaman maksimum 30.
- **Snapshot Trigger**:
  - `onNodeDragStop` (saat mouse dilepas setelah menggeser node ATAU menggeser grip handle swimlane).
  - `onResizeEnd` pada swimlane (saat resize selesai dilepas).
  - `onConnect` (setelah garis selesai ditarik).
  - `onNodesDelete` / `onEdgesDelete` (penghapusan node, swimlane, atau edge).
  - Penambahan node atau swimlane baru.
  - Perubahan data/label swimlane (`department` / `function`) saat input blur.
- **Alternatif dipertimbangkan**:
  - *Zustand Temporal / Zundo*: Menambah overhead dependensi dan hook eksternal. Pendekatan custom hook lokal lebih ringan dan terintegrasi langsung dengan `useNodesState`/`useEdgesState` React Flow.

### 2. Standarisasi Dimensi Tunggal (`BPMConstants`)
- **Keputusan**: Membuat file definisi konstanta dimensi `src/utils/bpm-constants.ts` berisi `DEFAULT_NODE_DIMENSIONS` dan `DEFAULT_SWIMLANE_DIMENSIONS`.
- **Implementasi**: Digunakan oleh `ocr-layout.ts`, `BPMCustomNodes.tsx`, dan `BPMEditor.tsx` sehingga tidak ada lagi selisih 10-20% antara elemen OCR dan drag manual.

### 3. Independent Swimlane Stretch
- **Keputusan**: Mengatur properti `NodeResizer` pada `SwimlaneNode`:
  ```tsx
  <NodeResizer
    isVisible={!!selected && !data.isLocked}
    minWidth={360}
    minHeight={300}
    keepAspectRatio={false}
  />
  ```
  Serta memastikan bahwa saat handle tepi kanan ditarik, hanya `width` yang berubah; saat handle bawah ditarik, hanya `height` yang berubah.

### 4. Selection Awareness HUD & Highlight
- **Keputusan**:
  - Menambahkan floating **Selection HUD** di bagian bawah kanvas: `[Badge Tipe] [Label Elemen] [Tindakan Tersedia: Hapus (Del), Kunci/Buka, Properti]`.
  - Menambahkan styling seleksi tegas:
    - Node terpilih: `ring-2 ring-primary ring-offset-2 ring-offset-background`.
    - Swimlane terpilih: `border-indigo-600 bg-indigo-50/20 shadow-lg`.
    - Edge terpilih: garis berubah warna menjadi `#2563eb` (biru terang) dengan ketebalan 3.5px dan glow filter SVG.

### 5. Deterministic Offline Auto-Arrange (`bpm-auto-layout.ts`)
- **Keputusan**: Mengembangkan fungsi layout deterministik topologis:
  1. Mengelompokkan node berdasarkan `parentId` (swimlane masing-masing).
  2. Menentukan lebar swimlane seragam berbasis `max(400, maxNodeWidth + 160)`.
  3. Mengurutkan node di tiap swimlane secara topologis berdasarkan kedalaman koneksi incoming/outgoing edge.
  4. Menyelaraskan koordinat X di tengah swimlane dan Y dengan jarak vertikal konsisten (gap 80px).
  5. Menetapkan `sourceHandle: 'bottom'` dan `targetHandle: 'top'` secara default pada edge hierarkis menurun.

## Risks / Trade-offs

- **[Risk]** Memory footprint dari snapshot kanvas yang besar jika diagram memiliki ratusan node.
  → **Mitigasi**: Batasi history ke 30 langkah, dan snapshot hanya menyimpan payload esensial: `{ id, type, position, width, height, parentId, data }` untuk nodes, dan `{ id, source, target, sourceHandle, targetHandle, label }` untuk edges.
- **[Risk]** Auto-Arrange merusak penempatan manual yang sengaja dibuat custom oleh user.
  → **Mitigasi**: Auto-Arrange langsung mencatat snapshot sebelum dieksekusi, sehingga user dapat menekan **Undo (Ctrl+Z)** seketika jika tidak puas dengan hasil tata letak otomatis.
