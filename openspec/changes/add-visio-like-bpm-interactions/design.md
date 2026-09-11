## Context

Modul diagram BPM di `src/components/rcm/nodes/BPMCustomNodes.tsx` dan `src/components/rcm/BPMEditor.tsx` saat ini menggunakan React Flow standar dengan hanya 2 titik koneksi (Top & Bottom) pada 31 jenis node proses. Pengguna kesulitan menghubungkan node secara menyamping atau diagonal, dan tidak ada panduan visual untuk meluruskan letak node saat di-drag.

## Goals / Non-Goals

**Goals:**
- Menyediakan komponen reusable `EightConnectionHandles` untuk 31 jenis proses node dengan 8 titik handle dua arah (atas, bawah, kiri, kanan, dan 4 sudut).
- Menyediakan komponen `SmartAlignmentGuides` yang menghitung perataan sumbu horizontal & vertikal secara real-time saat drag node (ambang 5px snap).
- Menyediakan `QuickConnectArrows` (panah hover di 4 sisi) untuk inisiasi koneksi instan.
- Menjaga kompatibilitas dengan routing ortogonal pada `BridgeEdge.tsx`.

**Non-Goals:**
- Mengubah node khusus `DecisionNode` (sudah memiliki 4 cabang spesifik Yes/No/Top/Bottom) atau `SwimlaneNode` (kontainer).
- Mengubah skema database atau backend API.

## Decisions

### Decision 1: Reusable Handle Component `EightConnectionHandles`
- Dibuat komponen pembungkus universal yang me-render 8 handle dengan class Tailwind:
  - Top: center (`left-1/2 -top-1`), left (`left-0 -top-1`), right (`right-0 -top-1`)
  - Bottom: center (`left-1/2 -bottom-1`), left (`left-0 -bottom-1`), right (`right-0 -bottom-1`)
  - Middle: left (`top-1/2 -left-1`), right (`top-1/2 -right-1`)
- Handle memiliki style lingkaran putih dengan ring slate tipis, membesar saat hover pada node.
- Masing-masing titik mendukung ID unik (`t-c`, `t-l`, `t-r`, `b-c`, `b-l`, `b-r`, `m-l`, `m-r`).

### Decision 2: Smart Alignment Guides State & Math Helper
- Menggunakan kalkulator geometri murni di util `src/utils/alignment-guides.ts`.
- Mengaitkan event `onNodeDrag` di `BPMEditor.tsx` untuk membandingkan posisi `[x, x + w/2, x + w]` dan `[y, y + h/2, y + h]` dengan node aktif lain di kanvas.
- Jika delta <= 5px, lakukan snapping dan catat posisi garis panduan ke state `alignmentLines: { horizontal?: number, vertical?: number }`.
- Garis panduan di-render sebagai overlay SVG / absolute dashed lines di atas React Flow viewport.
- Dihapus pada event `onNodeDragStop`.

### Decision 3: Quick Connect Arrows
- Ditampilkan saat mouse hover pada node (`group-hover:opacity-100`), berupa 4 tombol panah kecil melayang berjarak 12px di luar tepi node.
- Saat di-drag/klik, otomatis memicu `onConnectStart` di React Flow.

## Risks / Trade-offs

- **[Risk] Lag performa saat menghitung alignment pada diagram sangat besar (>100 node)** → *Mitigasi*: Filter hanya node yang berada dalam rentang bounding box terdekat (threshold distance) dan gunakan pure math tanpa manipulasi DOM berulang.
- **[Risk] Tabrakan ID handle lama (`top`, `bottom`) pada diagram tersimpan** → *Mitigasi*: Handle tengah tetap mempertahankan alias/fallback ID `top` dan `bottom` agar edge yang sudah tersimpan di database tidak putus.
