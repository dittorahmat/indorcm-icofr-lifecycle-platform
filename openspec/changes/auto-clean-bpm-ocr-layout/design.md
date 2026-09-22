## Context

Pipeline OCR BPM saat ini terdiri dari dua tahap:
1. `worker/routes/bpm.ts`: Endpoint `POST /api/bpm-diagrams/ocr` yang mengirim citra diagram ke model Gemini multimodal menggunakan instruksi sistem SK-5.
2. `src/utils/ocr-layout.ts`: Engine deterministik murni TypeScript yang menata ulang posisi X, Y, dan parent swimlane sebelum dirender di `BPMOcrModal.tsx` dan `BPMEditor.tsx`.

Saat ini, ketidakrapian timbul dari dua celah: (a) prompt AI belum menegaskan partisi kolom fisik dan konsolidasi multi-dokumen, dan (b) engine layout di frontend hanya mengandalkan ranking topologi tanpa snapping koordinat geometris jika parentId tidak tepat.

## Goals / Non-Goals

**Goals:**
- Menghasilkan diagram alur yang 100% otomatis tertata rapi di masing-masing kolom swimlane saat diimpor.
- Mengeliminasi tumpukan node bertabrakan (*overlap*) dengan perataan vertikal berbasis dimensi nyata (bounding box).
- Mengonsolidasikan dokumen bertumpuk menjadi bentuk `multi-document` tunggal.
- Tidak menambah tombol atau kontrol baru pada toolbar editor utama.

**Non-Goals:**
- Merombak renderer React Flow atau mengubah skema database.
- Menyediakan editor drag manual baru di dalam toolbar kanvas utama.

## Decisions

### 1. Backend: Spatial Column Partitioning & Stacked Document Instruction
- **Keputusan**: Pada prompt sistem `worker/routes/bpm.ts`, tambahkan instruksi eksplisit:
  - Urutkan swimlane secara horizontal (misal Lane 1: 0-200, Lane 2: 200-400, dst).
  - Setiap bentuk di dalam kolom fisik wajib mengaitkan `parentId` ke lane tersebut.
  - Tumpukan dokumen fisik wajib diekstrak sebagai 1 node `multi-document` dengan teks baris baru untuk tiap dokumen.
- **Alternatif**: Membiarkan AI mengembalikan koordinat bebas tanpa batasan kolom. Ditolak karena sering menyebabkan node salah masuk lajur.

### 2. Frontend: Spatial Geometric Snapping Fallback di `ocr-layout.ts`
- **Keputusan**: Di `layoutOcrDiagram`, lakukan perhitungan bounding box horizontal untuk setiap swimlane yang terdeteksi. Jika sebuah node tidak memiliki `parentId` atau `parentId`-nya invalid, hitung titik tengah X node dan kaitkan ke swimlane dengan rentang X terdekat.
- **Alternatif**: Menghapus node tanpa parent atau meletakkannya di bawah swimlane. Ditolak karena merusak kelengkapan diagram.

### 3. Adaptive Vertical Flow & Anti-Collision Y Stacking
- **Keputusan**: Naikkan default `ROW_HEIGHT` dari 80px ke minimum 140px (atau tinggi node + 40px padding) dan perbaiki perhitungan `lastUsedY` agar selalu memastikan jarak antar elemen di dalam lane tidak pernah tumpang tindih.
- **Alternatif**: Menggunakan solver fisika (mis. dagre/force-directed) yang tidak deterministik dan menambah library bundle. Ditolak karena engine layout murni TS sudah deterministik dan cepat.

## Risks / Trade-offs

- **[Risk]** Gambar diagram tanpa garis swimlane yang jelas bisa menyebabkan partisi kolom salah tebak.
  → **Mitigasi**: Deteksi swimlane hanya diaktifkan jika AI mendeteksi minimal satu lajur pembatas; jika tidak ada swimlane, layout beralih ke flowchart bebas (top-to-bottom).
- **[Risk]** Konsolidasi multi-dokumen berpotensi menggabungkan dua dokumen terpisah yang posisinya sangat berdekatan.
  → **Mitigasi**: Hanya gabungkan jika simbol visualnya memang dokumen berlapis bertumpuk (*stacked document*) sesuai standar flowchart.
