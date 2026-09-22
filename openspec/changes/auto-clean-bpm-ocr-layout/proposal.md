## Why

Saat pengguna mengunggah gambar diagram alur proses bisnis (seperti flowchart SOP pembiayaan rahn SOP perbankan/BUMN), hasil import OCR saat ini sering berantakan:
- Kolom swimlane pertama (misalnya "Nasabah") kosong karena node dokumen salah ditempatkan ke kolom lain.
- Tumpukan dokumen fisik (*multi-document*) terpecah menjadi banyak node terpisah yang bertumpukan di koordinat yang sama.
- Penataan vertikal kaku berbasis ranking topologi murni tanpa memperhitungkan tinggi elemen aktual sehingga teks saling bertabrakan.
- Pengguna menginginkan hasil import yang otomatis rapi, bersih, dan langsung presisi di masing-masing kolom swimlane tanpa perlu konfigurasi manual tambahan di toolbar.

## What Changes

- **Backend AI Extraction Prompt Enhancement (`worker/routes/bpm.ts`)**:
  - Menambahkan aturan ketat pemetaan partisi kolom swimlane (spatial column boundaries) agar node yang berada pada rentang horizontal kolom otomatis diberikan `parentId` swimlane yang tepat.
  - Menambahkan instruksi konsolidasi *stacked documents* menjadi 1 node bertipe `multi-document` dengan teks multiline, mencegah ledakan node dokumen bertumpuk.
  - Mempertegas deteksi simbol SOP BUMN/Perbankan: Trapesium terbalik sebagai `manual-operation`, Segitiga terbalik sebagai `archive`, dan teks cabang keputusan (SETUJU / TIDAK) sebagai label edge bukan node mengambang.
- **Frontend OCR Layout Engine Hardening (`src/utils/ocr-layout.ts`)**:
  - Implementasi **Spatial Auto-Snap Fallback**: Jika `parentId` kosong atau tidak valid, sistem menghitung posisi geometris X relatif terhadap batas lajur swimlane untuk secara otomatis mengaitkan node ke lajur yang benar.
  - Implementasi **Dynamic Adaptive Vertical Spacing**: Menghitung jarak Y dinamis berdasarkan tinggi sebenarnya dari masing-masing node (120-160px) dan memberikan padding aman untuk mencegah tumpang tindih visual.
  - Implementasi **Decision Branch Clear Separation**: Memberikan pergeseran routing horizontal dan vertikal yang lapang untuk percabangan decision.

## Capabilities

### New Capabilities
- `bpm-ocr-layout`: Kemampuan otomatisasi tata letak diagram proses bisnis dari ekstraksi OCR gambar ke kanvas swimlane yang rapi dan deterministik tanpa intervensi manual.

### Modified Capabilities
<!-- None -->

## Impact

- **Backend**: `worker/routes/bpm.ts` (penyempurnaan instruksi prompt Gemini AI dan validasi skema keluaran).
- **Frontend**: `src/utils/ocr-layout.ts` (penyempurnaan algoritma penataan spasial node & edge).
- **Kompatibilitas**: Tidak ada perubahan skema database atau API breaking changes; kompatibel penuh dengan format data React Flow yang sudah ada.
