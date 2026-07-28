# Implementation Tasks: Garis Siku dan Distribusi Titik Konektor BPM Flowchart

## Tasks

- [x] 1. Adapt Orthogonal Routing in BridgeEdge Component <!-- id: 1 -->
  - [x] 1.1 Gantikan kalkulasi `getBezierPath` dengan `getSmoothStepPath` pada `src/components/rcm/edges/BridgeEdge.tsx`. <!-- id: 1.1 -->
  - [x] 1.2 Sesuaikan kalkulasi bridge intersection pada segmen garis orthogonal. <!-- id: 1.2 -->

- [x] 2. Implement Edge Connection Port Distribution Logic <!-- id: 2 -->
  - [x] 2.1 Buat helper fungsi untuk mengelompokkan edge per node & handle position. <!-- id: 2.1 -->
  - [x] 2.2 Terapkan klasifikasi node: `FIXED_CENTER_NODES` vs `DISTRIBUTED_NODES`. <!-- id: 2.2 -->
  - [x] 2.3 Hitung distributed offset koordinat X/Y pada target/source handle untuk node rectangular. <!-- id: 2.3 -->

- [x] 3. Update BPMEditor Integration & Edge Properties <!-- id: 3 -->
  - [x] 3.1 Pastikan pembentukan edge baru di `BPMEditor.tsx` (seperti saat koneksi OCR atau manual connect) menggunakan tipe edge `bridge` dengan alur orthogonal. <!-- id: 3.1 -->
  - [x] 3.2 Uji interaksi drag-and-drop node untuk memastikan posisi garis terdistribusi merespons perpindahan posisi node secara real-time. <!-- id: 3.2 -->

- [x] 4. Verification & Testing <!-- id: 4 -->
  - [x] 4.1 Verifikasi integritas tipe dengan `npm run type-check`. <!-- id: 4.1 -->
  - [x] 4.2 Verifikasi linting dan format dengan `npm run lint`. <!-- id: 4.2 -->
  - [x] 4.3 Verifikasi build aplikasi dengan `npm run build`. <!-- id: 4.3 -->
