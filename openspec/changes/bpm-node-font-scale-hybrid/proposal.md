## Why

Saat ini, beberapa node di editor BPM (Business Process Mapping) mengalami kendala visual di mana label teks yang terlalu panjang meluber (overflow) melewati batas visual node (shape border). Hal ini disebabkan oleh ukuran lebar dan tinggi node SVG serta ukuran font yang bersifat statis (hardcoded). 

Perubahan ini bertujuan untuk mengimplementasikan solusi Hybrid yang menggabungkan perbaikan layout otomatis (word-wrapping & dynamic height), pengaturan skala font secara global dari toolbar utama (Global Scale Selector), serta pengaturan ukuran node dan font per node (Node-Specific Overrides) melalui panel Regulatory Property Sheet untuk menjaga kelayakan presentasi visual BPMN sesuai dengan standar kepatuhan Regulation SK-5/DKU.MBU/11/2024.

## What Changes

- **Peningkatan CSS / Layout Node**: Mengubah layout SVG dan container teks di custom nodes agar mendukung otomatis turun baris (word-wrap) dan tinggi dinamis (dynamic height/flex layout) alih-alih menggunakan tinggi statis.
- **Global Scale Selector**: Menambahkan pilihan skala ukuran font & node di toolbar utama `BPMEditor` (misalnya: 80% Small, 100% Normal, 120% Large) yang menyesuaikan tampilan seluruh diagram.
- **Node-Specific Overrides**: Menambahkan opsi di `RegulatoryPropertySheet` agar pengguna dapat menyesuaikan skala node atau ukuran font secara spesifik untuk node yang sedang dipilih jika perbaikan otomatis dirasa kurang pas.
- **Metadata Persistence**: Menyimpan status skala global dan opsi override per node ke dalam database skema metadata diagram agar tetap persisten saat dimuat ulang.

## Capabilities

### New Capabilities
Tidak ada modul kapabilitas baru berskala besar yang diperkenalkan. Perubahan ini berfokus pada penyempurnaan interaksi visual.

### Modified Capabilities
- `bpm-execution-hub`: Modifikasi antarmuka visual editor BPMN untuk mendukung zoom/scale dropdown di toolbar atas, penyesuaian dinamis pada visualisasi node, serta persistence data preferensi skala visual ke dalam diagram metadata.

## Impact

- **Frontend Components**:
  - `src/components/rcm/BPMEditor.tsx`: Penambahan state skala global, kontrol UI dropdown skala di toolbar atas, serta interaksi penyimpanan data.
  - `src/components/rcm/nodes/BPMCustomNodes.tsx`: Refaktor pada style visual dan handling parameter skala (lebar/tinggi dinamis serta font size dinamis berdasarkan properti node).
  - `src/components/rcm/properties/RegulatoryPropertySheet.tsx`: Penambahan form kontrol ukuran node dan font khusus di panel tab properti visual.
- **Data Models / APIs**:
  - Penyimpanan properti visual tambahan (`globalScale`, `nodeScaleOverride`, `fontScaleOverride`) di dalam payload metadata API diagram `/api/bpm-diagrams`.
