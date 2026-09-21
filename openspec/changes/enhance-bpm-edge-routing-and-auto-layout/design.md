# Design: Enhanced BPM Edge Routing and Synchronized Auto-Layout

## 1. Context & Problems

Diagram alir proses bisnis pada perbankan dan BUMN (seperti SOP Rahn) memiliki karakteristik:
- Berjalan melintasi banyak swimlane (departemen/fungsi).
- Memiliki alur waktu (time-step) vertikal terkoordinasi.
- Terdapat dokumen ganda (KTP, formulir, jaminan) dan percabangan keputusan (*Decision node: Ya / Tidak*).

Masalah saat ini:
1. **Arrowhead Occlusion**: Titik akhir garis jatuh tepat di border node, sehingga kepala panah SVG tertutup oleh badan node (fill putih solid) dan titik handle bundar.
2. **Gutter Collision**: Garis yang menyeberang swimlane memotong lurus secara horizontal, menabrak kotak teks dan ikon node perantara.
3. **Desynchronized Swimlane Layout**: Tiap lane menyusun nodenya dari atas ke bawah secara independen tanpa mempedulikan urutan langkah global, menyebabkan alur proses tampak berantakan dan garis menyeberang tak teratur.

---

## 2. Technical Architecture & Solutions

### A. Arrowhead Clearance & Edge Rendering (`BridgeEdge.tsx`)
1. **Target Point Offset Calculation**:
   - Untuk setiap sisi koneksi (`top`, `bottom`, `left`, `right`), kurangi titik `targetPt` sejauh `arrowLength` (sekitar 6-8px) ke arah luar node.
   - Hal ini memastikan marker arrowhead berhenti tepat menyentuh batas luar node tanpa tenggelam di balik background node.
2. **Handle Dot Cleanliness**:
   - Kurangi dominasi visual handle tidak aktif pada `BaseNodeComponents.tsx` atau atur `pointer-events` dan transparansi agar tidak menutupi ujung panah tajam.

### B. Obstacle Avoidance / Channel Gutter Routing (`BridgeEdge.tsx`)
1. **Channel Midpoint Routing**:
   - Ketika garis menghubungkan node antar-swimlane yang tidak bertetangga langsung atau berada di baris berbeda, jalur orthogonal dialihkan melalui ruang bebas (gutter) horizontal di bawah node sumber atau di atas node target, bukan memotong di tengah tinggi node.
2. **Decision Handle Alignment**:
   - Node decision harus secara konsisten menggunakan handle `yes` (kanan/bawah) dan `no` (kiri), dan garis disalurkan keluar menjauh sebelum berbelok vertikal.

### C. Global Synchronized Auto-Layout (`bpm-auto-layout.ts`)
1. **Global Topological Layering (Rank Assignment)**:
   - Hitung depth level untuk seluruh graph alur kerja (bukan per lane secara terpisah).
   - Node akar (Start / Dokumen Awal) = Rank 0.
   - Node turunan = Rank(parent) + 1.
   - Hubungkan node yang saling bergantung pada ketinggian $Y$ yang sepadan di masing-masing swimlane:
     $Y_{rank} = \text{HEADER\_HEIGHT} + \text{rank} \times \text{ROW\_STEP\_HEIGHT}$.
2. **Lane Grid Harmonization**:
   - Jika satu swimlane memiliki lebih sedikit node, posisinya tidak dimampatkan ke atas, melainkan tetap berada pada baris $Y$ alur logisnya.
3. **Multi-Input / Document Grouping**:
   - Jika beberapa dokumen menuju ke 1 proses yang sama (seperti KTP + Formulir + Emas menuju ke Penaksir), beri offset vertikal/horizontal halus di dalam lane tanpa merusak alur ke kanan.

---

## 3. Interfaces & State Flow

```
Raw Diagram / OCR Parsed Nodes & Edges
                 │
                 ▼
    [Global Topological Ranker]
    (Menghitung urutan kronologis langkah proses global)
                 │
                 ▼
    [Synchronized Lane Placer]
    (Menempatkan node di masing-masing swimlane dengan koordinat Y tersinkron)
                 │
                 ▼
    [Edge Handle & Gutter Channel Router]
    (Mengatur handle 'yes'/'no'/'top'/'bottom' + routing bebas rintangan)
                 │
                 ▼
    [BridgeEdge with Arrowhead Clearance]
    (Render panah tegas dan jembatan lompat garis rapi)
```

---

## 4. Risks & Mitigations
- **Siklus (Looping/Feedback Edges)**: Alur alur balik (revisit/rejection) bisa membuat topological sort menghasilkan infinite cycle.
  - *Mitigasi*: Deteksi back-edge (siklus) dan gunakan fallback heuristic depth atau BFS leveling dengan visited set.
- **Swimlane Tinggi Berlebih**: Jika rank terlalu banyak, swimlane bisa menjadi sangat panjang.
  - *Mitigasi*: Row step height yang adaptif (misal 110-140px) dan auto-expand tinggi swimlane agar membungkus semua node secara seragam.
