## Context

`BPMEditor.tsx` memakai satu state `selectedNodeId` untuk dua makna: seleksi kanvas (HUD, highlight ReactFlow) dan dialog terbuka (`RegulatoryPropertySheet isOpen={!!selectedNode}`). Handler `onNodeClick` mengisi state tersebut untuk semua tipe kecuali `risk-control-badge`, sehingga tiap single-click menutupi canvas dengan Dialog `max-w-[1000px]`. Lihat `proposal.md` untuk motivasi. Spec perilaku ada di `specs/bpm-node-interaction/spec.md`.

## Goals / Non-Goals

**Goals:**
- Pisah seleksi vs edit dengan state terpisah dan handler ReactFlow idiomatik (`onNodeDoubleClick`).
- Sediakan jalur edit non-double-click (HUD Edit + Enter) untuk touch/keyboard.
- Pertahankan seleksi setelah dialog ditutup; pane-click/Esc tetap clear.

**Non-Goals:**
- Ubah isi worksheet, model data regulatory pairs, approval Lampiran 6, atau API/backend.
- Ubah interaksi edge (tetap inline label di HUD).
- Redesign visual HUD/dialog di luar tombol Edit + tooltip.

## Decisions

### 1. Split state `selectedNodeId` vs `editingNodeId`
- Tambah `const [editingNodeId, setEditingNodeId] = useState<string | null>(null)`.
- `selectedNode = nodes.find(n => n.id === selectedNodeId)` tetap untuk HUD/highlight; `editingNode = nodes.find(n => n.id === editingNodeId) ?? selectedNode` (fallback agar double-click yang juga menembak click tetap konsisten) menjadi input `RegulatoryPropertySheet`.
- `isOpen={!!editingNode}`; `onClose={() => setEditingNodeId(null)}` (seleksi dipertahankan).
- Alternatif ditolak: timer 250ms untuk bedakan click/double (lag seleksi, race, rapuh); memakai `selected` bawaan ReactFlow saja tanpa `editingNodeId` (tidak cukup karena dialog butuh identitas terpisah saat seleksi berpindah).

### 2. Handler mapping ReactFlow
- `onNodeClick`: hanya `setSelectedNodeId` (+ clear `selectedEdgeId`); skip `risk-control-badge` seperti existing.
- `onNodeDoubleClick`: `setSelectedNodeId(id); setEditingNodeId(id)`; skip badge.
- `onEdgeClick`: tidak berubah (clear node selection, set edge).
- `onPaneClick`: clear `selectedNodeId`, `selectedEdgeId`, dan `editingNodeId`.
- Alternatif ditolak: membuka sheet dari `onSelectionChange` (terlalu agresif, termasuk seleksi keyboard/box-select).

### 3. HUD sebagai pintu edit + keyboard Enter
- Tambah prop `onEditSelected: (nodeId: string) => void` (atau `onOpenProperties`) ke `BPMSelectionHUD`; tombol memakai icon `Pencil`/`SlidersHorizontal`, label i18n `bpm:editor.selectionHud.editProperties`, tooltip "Double-click juga bisa".
- Tombol hanya tampil saat `selectedNode && selectedNode.type !== 'risk-control-badge'`.
- Shortcut Enter di level `BPMEditor` (guard: abaikan saat target INPUT/TEXTAREA/contentEditable atau dialog worksheet sedang terbuka agar tidak double-trigger; Esc tetap milik Dialog).
- Alternatif ditolak: context-menu klik-kanan saja (tidak discoverable, perlu Radix menu baru).

### 4. Swimlane & badge
- Swimlane ikut aturan sama (click=select, double=edit) demi konsistensi; sheet-nya otomatis tanpa seksi RCM via `canHaveRcm` existing.
- Badge/docked-risk/docked-control: guard di kedua handler (click + double) → no-op.
- Alternatif ditolak: swimlane single-click buka sheet (inkonsisten, melanggar kontrak spec baru).

### 5. i18n & discoverability
- Keys baru di namespace `bpm`: `editor.selectionHud.editProperties`, `editor.selectionHud.editHint` ("Double-click node untuk edit cepat"), dipakai HUD + title attr.
- Tambah ke `src/i18n/locales/en/bpm.json` dan `id/bpm.json` (cek struktur existing sebelum tulis).

## Risks / Trade-offs

- [Risk] ReactFlow menembak `onNodeClick` dua kali sebelum `onNodeDoubleClick` → Mitigasi: click hanya set seleksi (idempotent), tidak buka dialog, jadi urutan aman tanpa debounce.
- [Risk] Double-click tidak ada di touch → Mitigasi: tombol HUD Edit sebagai jalur utama touch; tidak mengandalkan double-tap.
- [Risk] Dialog `RegulatoryPropertySheet` punya guard `isDirty` confirm-discard; mempertahankan seleksi setelah close bisa membingungkan jika canvas juga dirty → Mitigasi: tidak ubah logika dirty; close dialog hanya clear `editingNodeId`, `useUnsavedChanges` canvas tetap independen.
- [Risk] Shortcut Enter bentrok dengan input edge-label di HUD → Mitigasi: guard target element + cek `editingNodeId == null` sebelum open; stopPropagation di input existing sudah ada.
- [Risk] Test existing mengasumsikan single-click membuka dialog → Mitigasi: update test/selectors; acceptance manual: click-tidak-buka, double-buka, HUD-Edit-buka, Esc/pane-tutup.

## Migration Plan

- Perubahan frontend-lokal, tanpa migrasi data. Rollback: revert 2 file + locale (atau feature-flag `editingNodeId` bila ingin bertahap — default direkomendasikan langsung karena kecil).
- Verifikasi: `npm run type-check`, `npm run lint`, `npm run build`, `npm test`; manual QA di canvas: select/drag/Delete tanpa dialog, double/HUD/Enter membuka worksheet, badge diabaikan, pane-click clear.

## Open Questions

- Setelah tutup worksheet, apakah fokus keyboard harus kembali ke node di canvas (untuk Enter ulang)? Bisa diputuskan saat implementasi tanpa mengubah spec.
