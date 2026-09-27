## Context

`DecisionNode` di `src/components/rcm/nodes/ProcessNodes.tsx:78-116` me-render diamond (`rotate-45`) berisi `data.label` (pertanyaan) plus dua tempelan absolut: `-left-8 ... text-red-600 "NO"` dan `-right-10 ... text-green-600 "YES"` (baris 106-107). Tempelan ini bukan bagian dari edge — selalu tampil untuk setiap node `type: 'decision'` terlepas dari koneksi aktual (termasuk cabang bawah yang tidak punya label paten).

`BridgeEdge` di `src/components/rcm/edges/BridgeEdge.tsx:617-630` me-render `edge.label` sebagai kotak kecil (`px-2 py-0.5 rounded border ... text-[11px] font-semibold`) di titik tengah `sourcePt/targetPt` via `EdgeLabelRenderer`. Inilah kotak `Ya` / `Tidak` yang dilingkari oranye di screenshot user — free-text, tersimpan di `edge.label`, sudah bisa diedit lewat `BPMOcrModal.tsx:555-559` tetapi belum bisa diedit di canvas utama.

`BPMEditor.tsx` mengelola `edges` via `useEdgesState`, koneksi baru via `onConnect` (baris 418-429, `type: 'bridge'`, tanpa `label` awal), seleksi via `selectedEdgeId`/`selectedEdge` (baris 63, 302), dan HUD via `BPMSelectionHUD` (baris 474-497) yang saat ini hanya tampil + delete tanpa edit label. `RegulatoryPropertySheet` hanya menerima `selectedNode`, bukan edge. Lihat `proposal.md` untuk motivasi dan `specs/bpm-decision-labels/spec.md` untuk kontrak perilaku.

Batasan proyek (AGENTS.md): min font 12px (`text-xs`), radius institusional (`rounded-md/lg`), tanpa `backdrop-blur`/glassmorphism, tanpa animasi pada badge statis, seluruh string UI wajib i18n (`useTranslation`, `src/i18n/locales/**`), dan `npm run type-check + lint + build + test` harus hijau.

## Goals / Non-Goals

**Goals:**
- Diamond decision polos: hanya pertanyaan, tanpa `NO`/`YES` paten dalam bahasa/warna apapun.
- Setiap cabang decision dinyatakan via edge label yang terlihat di panah dan dapat diedit user di canvas utama (mendukung `Ya`/`Tidak` maupun `Yes`/`No` sebagai teks bebas).
- Edit label terintegrasi dengan undo (`pushState`), dirty-tracking (`setDirty`), dan i18n.

**Non-Goals:**
- Mengubah bentuk/ukuran diamond, jumlah/posisi handle, atau algoritma routing orthogonal + bridge (`getOrthogonalPath`, `FIXED_CENTER_TYPES` tetap).
- Mengubah model simpan diagram, API BPM, skema DB, atau alur approval.
- Auto-layout / OCR ulang; label edge yang sudah ada dipertahankan apa adanya.
- Menambah bahasa baru di luar EN/ID.

## Decisions

### 1. Hapus 2 div paten di `DecisionNode`, pertahankan handle `no`/`yes`/`bottom`

Hapus baris 106-107 (`NO` merah kiri, `YES` hijau kanan). Handle tetap: `target/top`, `source/left id="no"`, `source/right id="yes"`, `source/bottom id="bottom"` — karena `BridgeEdge.normalizeHandlePosition` (baris 110-111) memetakan `no→left`, `yes→right` untuk routing. Diamond tetap `border-slate-800`, label pertanyaan tetap `uppercase text-slate-700`.

- Alternatif ditolak: mengganti paten menjadi `Ya`/`Tidak` paten (tetap tidak fleksibel, tetap duplikat dengan edge label, tetap butuh i18n ganda).
- Edge case: diagram lama yang mengandalkan paten sebagai satu-satunya penanda cabang akan terlihat "polos" sampai user menambah edge label — dapat diterima karena edge label `Ya/Tidak` mayoritas sudah ada (terlihat di screenshot); verifikasi manual tiap diagram Sampel (Revenue/Procurement) sebagai bagian tasks.

### 2. Edit edge label via `BPMSelectionHUD` + callback `onUpdateEdgeLabel` di `BPMEditor`

Tambah input teks di HUD saat `selectedEdge` aktif: nilai awal `selectedEdge.label ?? ''`, placeholder i18n (`bpm:editor.edge.labelPlaceholder`: `Add label…` / `Tambah label…`, contoh `Ya`, `Tidak`), `maxLength` ~24 agar kotak label tidak melebar merusak canvas. `onChange` → `onUpdateEdgeLabel(edgeId, label)` di `BPMEditor`: `pushState(nodes, edges)` sekali di awal edit (atau saat commit/blur/Enter — pilih commit agar history tidak banjir), lalu `setEdges(eds => eds.map(...))` + `setDirty(true)`. Input disabled saat `isLocked`.

- Alternatif ditolak: menaruh editor di `RegulatoryPropertySheet` (sheet itu node-oriented; membuka sheet untuk edge membingungkan dan butuh refactor props lebih besar). Alternatif double-click-to-edit langsung di canvas (ala React Flow `EdgeLabelRenderer` inline input) ditolak untuk fase ini karena butuh state edit/fokus tambahan di `BridgeEdge` yang berisiko dengan re-render drag (`useStore` Positionen); HUD input lebih sederhana dan konsisten dengan pola seleksi yang ada.
- Edge case: label kosong → `BridgeEdge` (`{label && ...}`) tidak merender kotak (perilaku sekarang) — valid untuk panah non-cabang. Label panjang dipotong via CSS (`max-w`, `truncate`) di renderer bila perlu; validasi awal cukup `maxLength`.

### 3. Edge baru default kosong (tanpa auto-prefill `Ya`/`Tidak`)

`onConnect` tetap membuat edge tanpa `label`; user mengisi manual sesuai makna cabang aktual (kiri belum tentu `Tidak` di semua diagram — mis. cabang bawah juga `Tidak` di screenshot). Ini menghindari asumsi salah dari `sourceHandle`.

- Alternatif ditolak (untuk fase ini): auto-prefill `Ya` untuk `sourceHandle==='yes'` dan `Tidak` untuk `no`/`bottom` —hemat klik tetapi berisiko salah makna dan menambah kompleksitas i18n default; bisa dipertimbangkan sebagai follow-up bila user meminta.
- Edge case `BPMOcrModal` tetap menjadi editor sekunder yang konsisten (tidak diubah selain memastikan tidak menimpa label kanvas secara tak sengaja — perilaku sekarang sudah per-edge id, aman).

## Risks / Trade-offs

- [Risk] User bingung menemukan cara memberi label (sebelumnya otomatis ada paten) → Mitigasi: placeholder jelas + hint satu baris di HUD (`Klik panah → ketik Ya/Tidak`); verifikasi manual EN+ID.
- [Risk] `pushState` tiap keystroke membanjiri history undo (max 30) → Mitigasi: commit on blur/Enter (atau debounce), bukan per-keystroke; verifikasi undo/redo manual.
- [Risk] Label menutupi panah di diagram padat / tidak ikut export PDF → Mitigasi: `BridgeEdge` label memakai `EdgeLabelRenderer` yang sudah dipakai export canvas-to-image saat ini; verifikasi export PDF manual menampilkan `Ya/Tidak`.
- [Trade-off] Satu klik ekstra untuk memberi label vs sebelumnya otomatis — disengaja demi ketepatan makna cabang dan hilangnya duplikasi menyesatkan.
