# Design: Garis Siku dan Distribusi Titik Konektor BPM Flowchart

## Architecture & Implementation Overview

### 1. Orthogonal Path Routing (Garis Siku)
- Menggantikan kalkulasi `getBezierPath` pada `BridgeEdge.tsx` dengan `getSmoothStepPath` dari `reactflow`.
- `getSmoothStepPath` akan menghasilkan segmen-segmen garis lurus horizontal dan vertikal berpembelokan siku (90-degree corners).
- Algoritma pemotongan garis (*bridge/hump*) di `BridgeEdge.tsx` disesuaikan untuk memproses segmen garis orthogonal.

### 2. Node-Type Aware Connection Distribution Algorithm
Di dalam `BridgeEdge.tsx` (atau edge utility handler):

1. **Klasifikasi Node**:
   - `FIXED_CENTER_NODES` = `['decision', 'start', 'end', 'reference', 'off-page-ref', 'summing-junction', 'or']`
   - `DISTRIBUTED_NODES` = `['activity', 'manual-input', 'external-process', 'automated-activity', 'document', 'data', ...]`

2. **Kalkulasi Offset Position**:
   - Kelompokkan seluruh edge yang terhubung ke target node & handle position (misal `targetHandle` = top/bottom/left/right).
   - Urutkan edge berdasarkan koordinat X/Y node asal (*source node*) untuk mencegah garis bersilangan (*crossing*).
   - Jika node bertipe `DISTRIBUTED_NODES` dan memiliki lebih dari 1 edge di sisi yang sama:
     - Hitung spacing: `step = width / (count + 1)`
     - Hitung koordinat X/Y terdistribusi: `offsetPos = start + (index + 1) * step`
   - Jika node bertipe `FIXED_CENTER_NODES`:
     - Posisi `sourceX`/`targetX`/`sourceY`/`targetY` tetap berada di titik tengah / sudut lancip persis (center).

```
   Node Rectangular (Terdistribusi)             Node Decision (Fixed Corner Anchor)
   ┌──────────────────────────────┐                         ▲
   │        Activity Node         │                       ╱   ╲
   └────▲─────────▲─────────▲─────┘                      ◄  ◇  ►
        │         │         │                             ╲   ╱
     Edge 1    Edge 2    Edge 3                             ▼
```

### 3. Visual Feedback & Styling
- Tetap mempertahankan panah penutup (`MarkerType.ArrowClosed`) di titik target.
- Tetap mendukung deteksi persimpangan garis siku dengan indikator bridge melengkung kecil jika terjadi perpotongan antar dua garis siku.
