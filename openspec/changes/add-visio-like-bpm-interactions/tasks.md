## 1. Universal 8-Point Connection Handles

- [x] 1.1 Buat komponen `EightConnectionHandles` di `BPMCustomNodes.tsx` (mendukung 8 titik: t-l, t-c/top, t-r, m-l/left, m-r/right, b-l, b-c/bottom, b-r dengan bidirectional source/target) dan pasang ke 31 node proses
- [x] 1.2 Sesuaikan resolusi koordinat anchor di `BridgeEdge.tsx` agar mengenali ID handle sudut (`t-l`, `t-r`, `b-l`, `b-r`) dan sisi samping (`m-l`, `m-r`) secara presisi

## 2. Dynamic Smart Alignment Guides

- [x] 2.1 Buat utility helper `getAlignmentGuides()` di `src/utils/alignment-guides.ts` untuk kalkulasi jarak delta (< 5px threshold) antar node pada sumbu horizontal dan vertikal
- [x] 2.2 Tulis unit test untuk `alignment-guides.ts` untuk memverifikasi kalkulasi snapping center-to-center dan edge-to-edge
- [x] 2.3 Integrasikan listener `onNodeDrag` dan overlay garis putus-putus panduan magnetik di `BPMEditor.tsx`, serta bersihkan garis saat `onNodeDragStop`

## 3. Quick-Connect Hover Arrows

- [x] 3.1 Tambahkan tombol panah mini hover di 4 sisi node (`QuickConnectArrows`) yang memicu pembentukan garis koneksi baru secara instan saat di-drag
- [x] 3.2 Pastikan interaksi drag dari panah terhubung mulus ke event pembuatan edge React Flow

## 4. Verifikasi Akhir & Mandat Penyelesaian Tahap

- [x] 4.1 Jalankan mandat penyelesaian tahap: `npm run type-check`, `npm run lint`, `npm test`, dan `npm run build`
- [x] 4.2 Verifikasi interaksi di kanvas: 8 titik koneksi responsif, garis magnetik muncul saat drag sejajar, dan quick connect arrow bekerja dengan lancar
