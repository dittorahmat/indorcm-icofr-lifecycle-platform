## 1. Standarisasi Dimensi & Persiapan Konstanta

- [x] 1.1 Buat file konstanta bersama `src/utils/bpm-constants.ts` yang mendefinisikan `DEFAULT_NODE_DIMENSIONS` dan `DEFAULT_SWIMLANE_DIMENSIONS`. Verifikasi file terdefinisi dengan tipe TypeScript lengkap.
- [x] 1.2 Refaktor `src/utils/ocr-layout.ts` untuk mengimpor dan menggunakan dimensi dari `bpm-constants.ts` dan implementasikan penyamaan lebar swimlane (`equalizeLaneWidths`). Verifikasi lewat unit test OCR layout.
- [x] 1.3 Refaktor `BPMEditor.tsx` untuk pembuatan node manual dan swimlane manual menggunakan ukuran standar yang sama dari `bpm-constants.ts`. Verifikasi ukuran elemen drag manual sama persis dengan hasil OCR.

## 2. Independent Swimlane Resizing & Perbaikan Panah (BridgeEdge)

- [x] 2.1 Perbarui konfigurasi `NodeResizer` pada `SwimlaneNode` di `src/components/rcm/nodes/BPMCustomNodes.tsx` dengan `keepAspectRatio={false}` dan pemisahan perlakuan handle tepi agar bisa memanjang saja atau melebar saja. Verifikasi dengan menarik sisi tepi secara independen.
- [x] 2.2 Perbaiki kalkulasi titik hubung dan penentuan handle pada `src/components/rcm/edges/BridgeEdge.tsx` untuk memperhitungkan koordinat node di dalam swimlane (`parentId`) serta menambahkan offset batas node agar ujung panah (`markerEnd`) tidak tertutup latar node. Verifikasi panah mengarah tepat dan kepala panah tampak jelas.
- [x] 2.3 Pastikan parsing edge pada OCR layout menyertakan `sourceHandle: 'bottom'` dan `targetHandle: 'top'` (atau handle terdekat yang valid). Verifikasi edge OCR tidak lagi terbalik orientasinya.

## 3. History Stack (Undo / Redo Diskrit)

- [x] 3.1 Buat custom hook `useCanvasHistory` (atau helper history state) di `src/hooks/use-canvas-history.ts` dengan limit 30 snapshot diskrit yang mendukung `pushState`, `undo`, `redo`, `canUndo`, dan `canRedo`.
- [x] 3.2 Hubungkan `useCanvasHistory` ke `BPMEditor.tsx` pada event diskrit: `onNodeDragStop`, swimlane `onResizeEnd`, edit teks swimlane (department/function saat blur), `onConnect`, penambahan elemen baru, dan penghapusan (`onNodesDelete` / `onEdgesDelete`).
- [x] 3.3 Tambahkan tombol Undo (`Ctrl+Z`) dan Redo (`Ctrl+Y`) pada toolbar atas BPM Editor beserta keyboard listener. Verifikasi bahwa aksi memindahkan node maupun swimlane dapat di-undo dalam 1 kali tekan.

## 4. High-Contrast Selection Awareness HUD

- [x] 4.1 Tambahkan komponen floating `SelectionHUD` di kanvas `BPMEditor.tsx` yang menampilkan badge tipe elemen yang aktif terpilih (Swimlane, Node tipe tertentu, atau Panah/Edge), nama label, serta ringkasan tombol aksi cepat (Hapus / Edit).
- [x] 4.2 Berikan styling visual yang sangat kontras saat elemen terpilih:
  - Node: outline ring biru terang (`ring-2 ring-primary ring-offset-2`).
  - Swimlane: border warna kontras (`border-indigo-600`) dan background tint penanda aktif.
  - Edge: warna highlight kontras (`#2563eb`), ketebalan meningkat (strokeWidth 3.5), dan drop shadow.
  Verifikasi user dapat langsung membedakan elemen mana yang aktif terpilih sebelum menekan tombol hapus.

## 5. Algoritma Offline Auto-Arrange

- [x] 5.1 Buat utilitas layout topologis hierarkis di `src/utils/bpm-auto-layout.ts` yang menata posisi swimlane, meratakan jarak vertikal node, dan menyelaraskan koneksi panah tanpa dependensi server luar.
- [x] 5.2 Tambahkan tombol "Auto Arrange" di toolbar `BPMEditor.tsx` dengan integrasi ke riwayat Undo (agar penataan otomatis bisa langsung di-undo jika diinginkan).
- [x] 5.3 Tambahkan lokalisasi penuh bahasa (Inggris dan Indonesia) di `src/i18n/locales/**` untuk seluruh tooltip, label tombol Undo/Redo, Auto-Arrange, dan Selection HUD.

## 6. Verifikasi Kualitas & Mandat Tahap

- [x] 6.1 Jalankan `npm run type-check` dan pastikan 0 error TypeScript.
- [x] 6.2 Jalankan `npm run lint` dan pastikan tidak ada peringatan atau error linter.
- [x] 6.3 Jalankan `npm test` dan tambahkan pengujian unit untuk `bpm-auto-layout.ts` dan `use-canvas-history.ts`.
- [x] 6.4 Jalankan `npm run build` dan pastikan proses build produksi berhasil tanpa error.
