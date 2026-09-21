# Tasks: Enhance BPM Edge Routing and Synchronized Auto-Layout

- [x] 1. Perbaikan Visibilitas Panah & Marker Clearance <!-- id: 1 -->
  - [x] 1.1 Tambahkan offset clearance pada `BridgeEdge.tsx` agar titik target tidak tenggelam di balik background node <!-- id: 1.1 -->
  - [x] 1.2 Sesuaikan marker SVG dan ketebalan garis tepi untuk memastikan arrowhead selalu tampak tegas dan kontras <!-- id: 1.2 -->
  - [x] 1.3 Perhalus styling handle pada `BaseNodeComponents.tsx` agar tidak menutupi ujung panah saat tidak di-hover <!-- id: 1.3 -->

- [x] 2. Penyempurnaan Routing Garis Bebas Halangan (Gutter Routing) <!-- id: 2 -->
  - [x] 2.1 Modifikasi kalkulasi orthogonal di `BridgeEdge.tsx` untuk menggunakan koridor/gutter bebas antar node saat menyeberang swimlane <!-- id: 2.1 -->
  - [x] 2.2 Perbaiki deteksi dan mapping handle untuk tipe node khusus (`decision` yes/no, `document`, `manual-operation`) <!-- id: 2.2 -->
  - [x] 2.3 Stabilkan jembatan lompat (`bridge arcs`) agar tidak tumpang tindih pada garis paralel <!-- id: 2.3 -->

- [x] 3. Implementasi Synchronized Cross-Swimlane Auto-Layout <!-- id: 3 -->
  - [x] 3.1 Bangun algoritma global topological layering (rank assignment) di `bpm-auto-layout.ts` <!-- id: 3.1 -->
  - [x] 3.2 Terapkan sinkronisasi koordinat vertikal (Y) antar seluruh swimlane berdasarkan rank waktu alur <!-- id: 3.2 -->
  - [x] 3.3 Sinkronkan algoritma auto-layout dengan layout staging di `ocr-layout.ts` <!-- id: 3.3 -->

- [x] 5. Fitur Viewport BPM: Zoom Out Fleksibel, Fit-to-Screen, Fullscreen & Layout Kompak <!-- id: 5 -->
  - [x] 5.1 Perluas jangkauan zoom ReactFlow (`minZoom={0.02}`) dan sediakan handler `fitView` instan <!-- id: 5.1 -->
  - [x] 5.2 Tambahkan tombol Fit View dan Fullscreen toggle pada toolbar BPM <!-- id: 5.2 -->
  - [x] 5.3 Optimalkan `ROW_HEIGHT` dan rank leveling vertikal di `bpm-auto-layout.ts` agar diagram lebih kompak dan proporsional <!-- id: 5.3 -->
  - [x] 5.4 Lokalisasi label tombol dan tooltip (`src/i18n/locales/**`) <!-- id: 5.4 -->
  - [x] 5.5 Verifikasi Mandat Penyelesaian Tahap (`type-check`, `lint`, `build`, `test`) <!-- id: 5.5 -->

