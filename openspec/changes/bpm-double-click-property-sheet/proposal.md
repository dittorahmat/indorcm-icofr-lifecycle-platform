## Why

Single-click pada node BPM saat ini langsung membuka Regulatory Property Worksheet (Dialog modal 1000px) karena satu state `selectedNodeId` dipakai untuk seleksi sekaligus edit. User yang hanya ingin select — untuk geser, multi-select, lock, atau delete via HUD — terhalang dialog yang menutupi canvas. Mengikuti konvensi Visio/Figma/draw.io, select harus ringan dan edit harus eksplisit via double-click.

## What Changes

- Single-click node → hanya seleksi: highlight + `BPMSelectionHUD` muncul, worksheet TERTUTUP.
- Double-click node (atau tombol Edit di HUD / tombol Enter saat node ter-select) → membuka `RegulatoryPropertySheet` (Dialog).
- Pisah state: `selectedNodeId` (seleksi) vs `editingNodeId` (dialog terbuka). Menutup dialog mempertahankan seleksi agar user bisa langsung Delete/geser.
- `risk-control-badge` tetap diabaikan untuk select maupun edit (perilaku existing).
- Swimlane mengikuti aturan yang sama (double-click untuk edit) demi konsistensi.
- Edge tidak berubah: single-click edge tetap membuka editor label inline di HUD.
- Tambah affordance discoverability: tombol Edit/Properties di HUD + tooltip "Double-click untuk edit", plus hint teks bila dibutuhkan, dengan string i18n (namespace `bpm`).

## Capabilities

### New Capabilities
- `bpm-node-interaction`: interaksi select-vs-edit pada node kanvas BPM (single-click seleksi, double-click/HUD/Enter membuka worksheet, perilaku badge/swimlane/edge, pane-click/Esc untuk tutup).

### Modified Capabilities
- (none — belum ada spec existing untuk interaksi node BPM editor)

## Impact

- Affected code: `src/components/rcm/BPMEditor.tsx` (handler `onNodeClick` + `onNodeDoubleClick`, state baru, wiring `isOpen`), `src/components/rcm/editor/BPMSelectionHUD.tsx` (tombol Edit + tooltip), `src/i18n/locales/**` (namespace `bpm`), opsional `RegulatoryPropertySheet` bila perlu prop `openNode` terpisah.
- Tidak ada perubahan API/backend, skema DB, atau alur workflow persetujuan (Lampiran 6) — murni interaksi frontend ReactFlow.
- Risiko rendah: pola ReactFlow idiomatik (`onNodeDoubleClick`), tanpa timer/debounce; perlu verifikasi touch-device fallback via tombol HUD dan keyboard Enter.
