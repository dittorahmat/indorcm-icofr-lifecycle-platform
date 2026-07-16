## 1. Core Visual Enhancements (BPM Nodes)

- [x] 1.1 Buat utility helper `getNodeStyles` di `src/components/rcm/nodes/BPMCustomNodes.tsx` untuk menghitung lebar/tinggi dan fontSize secara dinamis berdasarkan prop override.
- [x] 1.2 Perbarui styling CSS/Tailwind pada seluruh custom node di `BPMCustomNodes.tsx` agar mendukung pembungkusan kata (`break-words`) dan tinggi fleksibel.
- [x] 1.3 Perbarui SVG render pada node seperti `ManualInputNode`, `DocumentNode`, `DecisionNode` agar ukurannya proporsional menyesuaikan dynamic height.

## 2. Editor Integration & Toolbar (BPMEditor)

- [x] 2.1 Tambahkan UI dropdown untuk `globalScale` di toolbar atas `src/components/rcm/BPMEditor.tsx`.
- [x] 2.2 Sinkronisasikan state `globalScale` ke dalam diagram metadata payload untuk persistence.
- [x] 2.3 Atur CSS variables atau dynamic class di pembungkus React Flow berdasarkan nilai `globalScale`.

## 3. Node Overrides (Property Sheet)

- [x] 3.1 Tambahkan dropdown control untuk `nodeScaleOverride` dan `fontScaleOverride` di `src/components/rcm/properties/RegulatoryPropertySheet.tsx`.
- [x] 3.2 Implementasikan update callback handler untuk memperbarui properties data node React Flow secara reaktif.

## 4. Verification & Clean-up

- [x] 4.1 Jalankan `npm run type-check` untuk memverifikasi integritas tipe data TypeScript.
- [x] 4.2 Jalankan `npm run lint` untuk memastikan tidak ada warning/error dari linter.
- [x] 4.3 Jalankan `npm run build` untuk menguji build produksi frontend.
- [x] 4.4 Jalankan `npm test` untuk memastikan semua pengujian berjalan tanpa regresi.
