## Why

Node decision (diamond) di BPM canvas saat ini menampilkan label cabang secara ganda sehingga membingungkan: `DecisionNode` (`src/components/rcm/nodes/ProcessNodes.tsx:106-107`) me-render tempelan paten `NO` (merah, kiri) dan `YES` (hijau, kanan) yang selalu muncul dan tidak bisa diedit user, sementara `BridgeEdge` (`src/components/rcm/edges/BridgeEdge.tsx:617-630`) sudah me-render edge label (`Ya` / `Tidak`) di tengah panah dari `edge.label` yang bersifat free-text dan editable (saat ini hanya via `BPMOcrModal`). Hasilnya diamond `MEMENUHI SYARAT?` / `MEMENUHI SPESIFIKASI?` terlihat memiliki `NO • ... • YES` paten sekaligus kotak `Ya` / `Tidak` di panah (lihat screenshot user). Label paten juga hardcoded Bahasa Inggris, tidak terlokalisasi, dan memakai warna merah/hijau keras yang tidak konsisten dengan gaya institusional.

## What Changes

- Menghapus tempelan paten `NO` / `YES` dari `DecisionNode` sehingga diamond hanya berisi teks pertanyaan (mis. `MEMENUHI SYARAT?`). Handle koneksi dipertahankan (`top` target, `no`=kiri, `yes`=kanan, `bottom`=bawah) — hanya visualnya yang dibuang, logika routing `BridgeEdge` tidak berubah.
- Menjadikan edge label (`edge.label` pada `BridgeEdge`) sebagai satu-satunya sumber kebenaran untuk cabang Ya/Tidak/Yes/No — free-text, diketik user per panah (mendukung `Ya/Tidak` maupun `Yes/No`).
- Menambahkan UI edit edge label di canvas utama (saat ini `BPMSelectionHUD` hanya menampilkan `source ➔ target` + delete, tanpa input). User dapat klik panah → ketik label → tersimpan ke `edges` (dengan `pushState` + `setDirty` agar undo/dirty-tracking tetap jalan).
- Tidak mengubah bentuk diamond, pertanyaan di dalam diamond, routing orthogonal/bridge, maupun struktur data diagram tersimpan (penghapusan bersifat render-only, diagram lama otomatis bersih tanpa migrasi).

## Capabilities

### New Capabilities
- `bpm-decision-labels`: Aturan label cabang decision BPM — diamond polos tanpa NO/YES paten; cabang dinyatakan eksklusif via edge label yang dapat diedit di canvas utama.

### Modified Capabilities
<!-- Tidak ada perubahan requirement pada capability yang sudah ada selain presentasi di atas. -->

## Impact

- Kode terdampak: `src/components/rcm/nodes/ProcessNodes.tsx` (hapus 2 div paten), `src/components/rcm/editor/BPMSelectionHUD.tsx` (input edit label + callback update, atau alternatif `RegulatoryPropertySheet` bila dipilih), `src/components/rcm/BPMEditor.tsx` (wiring `onUpdateEdgeLabel`: `pushState` + `setEdges` + `setDirty`), `src/i18n/locales/en/bpm.json` + `src/i18n/locales/id/bpm.json` (key baru untuk placeholder/label UI editor, tanpa hardcoded string).
- Tidak ada perubahan API, skema DB, atau format simpan diagram (`nodes`/`edges` tetap; `label` edge sudah ada di model React Flow dan sudah dipakai `BPMOcrModal.tsx:555`).
- Risiko rendah: murni presentasi + satu input editor; kriteria kepatuhan (diamond tetap jelas, panah tetap berlabel eksplisit) justru membaik. Perlu verifikasi visual EN + ID dan export PDF tetap menampilkan edge label.
