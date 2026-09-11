## Why

Fitur upload gambar BPM ("OCR") di `BPMEditor` menghasilkan diagram yang berantakan saat di-load: swimlane terlalu kecil dibanding buatan manual, panah tidak beraturan dan sulit dihapus, node saling tumpang tindih, dan hasil OCR tidak bisa diverifikasi terhadap gambar asli. Masukan pengguna (5 poin, terkonfirmasi dengan contoh BPM Pencairan Kredit KUR: 4 swimlane vertikal, ~13 node, edge lintas-lane) meminta hasil OCR yang rapi otomatis dan se-interaktif pembuatan proses manual.

## What Changes

- **Auto-layout deterministik**: koordinat `x,y` dari AI hanya dipakai sebagai hint urutan; posisi akhir dihitung di frontend — lane diurutkan kiri→kanan (median-x AI), node dalam lane disusun top-to-bottom via BFS depth dari entry point, dipetakan ke grid tetap.
- **Swimlane setara manual**: lebar minimum 400px, tinggi seragam mengikuti lane tertinggi, dapat di-resize (`NodeResizer`), menggantikan ukuran mentah AI (yang sering 150–250px atau hilang).
- **Panah rapi & mudah dihapus**: `BridgeEdge` mendapat hit-area tak terlihat untuk seleksi/klik; dialog review menampilkan daftar edge (hapus/rename) sebagai jalur kedua selain klik garis; arah sisi koneksi stabil karena node tidak lagi overlap.
- **Review visual interaktif**: panel kanan dialog bukan lagi daftar teks, melainkan mini-canvas React Flow yang bisa drag, hapus node/edge, dan reconnect sebelum Apply; thumbnail gambar asli + opacity slider sebagai referensi.
- **Apply = overwrite penuh**: hasil OCR mengganti seluruh canvas (menghapus logika merge `existingSwimlanes` yang menimbulkan lane ganda), dijaga konfirmasi bila ada unsaved changes.
- **Node OCR setara manual**: `regulatoryPairs: []`, `role`, lock handler, badge RCM ter-regenerasi, `fitView` setelah Apply; tanpa `extent: 'parent'` yang menjebak node di lane kecil.
- **Prompt AI diperketat**: abaikan kop/header/footer dokumen dan badge RCM kecil; ekstrak `department`/`function` dari header lane; pertahankan label edge (YES/NO); koordinat hanya untuk urutan relatif.
- Definisi fidelity: **isi & alur sama** (lane, node, label, topologi, label edge); **posisi dirapikan otomatis**.

## Capabilities

### New Capabilities

- `image-to-bpm-ocr`: perilaku OCR gambar-ke-diagram — auto-layout deterministik per-swimlane, review visual interaktif sebelum Apply, semantik Apply-overwrite, dan node hasil OCR yang setara dengan node manual.

### Modified Capabilities

- `bpm-edge-visuals`: menambah persyaratan selectability edge — setiap edge (termasuk hasil OCR) wajib memiliki hit-area yang mudah diklik/diseleksi untuk dihapus, bukan hanya garis tipis 2px.

## Impact

- Terpengaruh: `src/components/rcm/BPMEditor.tsx` (dialog review, `handleApplyOcr`), `worker/routes/bpm.ts` (prompt & skema OCR), `src/components/rcm/edges/BridgeEdge.tsx` (hit-area), `src/components/rcm/nodes/BPMCustomNodes.tsx` (`NodeResizer` swimlane), util layout baru untuk auto-layout.
- Tidak ada perubahan skema database; tidak ada API baru (endpoint `/api/bpm-diagrams/ocr` dipakai ulang).
- Perilaku **BREAKING** yang disengaja: Apply OCR kini mengganti seluruh canvas, bukan menambah/menggabungkan.
