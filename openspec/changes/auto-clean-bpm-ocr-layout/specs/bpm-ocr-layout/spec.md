## Purpose

Kemampuan otomatisasi tata letak diagram proses bisnis dari ekstraksi OCR gambar ke kanvas swimlane yang rapi dan deterministik tanpa intervensi manual.

## ADDED Requirements

### Requirement: Spatial swimlane snapping for OCR nodes
Sistem SHALL secara otomatis mengaitkan setiap node hasil ekstraksi OCR ke swimlane yang tepat berdasarkan batas geometris koordinat horizontal (X), meskipun metadata parentId dari ekstraksi awal kosong atau meleset.

#### Scenario: Node berada dalam rentang kolom swimlane pertama
- **WHEN** gambar diagram dianalisis dan terdapat node pada rentang koordinat kolom swimlane paling kiri (misalnya "Nasabah")
- **THEN** sistem menempatkan node tersebut ke dalam swimlane paling kiri dengan koordinat posisi lokal yang rapi di dalam lajur tersebut

### Requirement: Stacked multi-document consolidation
Sistem SHALL mengonsolidasikan elemen tumpukan dokumen fisik dari gambar SOP menjadi satu node bertipe `multi-document` dengan label teks terstruktur multiline, daripada memecahnya menjadi banyak node terpisah yang saling menumpuk.

#### Scenario: Deteksi tumpukan dokumen perbankan atau SOP
- **WHEN** sistem mengekstraksi gambar yang memuat simbol tumpukan dokumen seperti "Formulir", "KTP", dan "Emas"
- **THEN** sistem menghasilkan satu node dengan type `multi-document` dan label memuat daftar dokumen tersebut secara vertikal bersih

### Requirement: Dynamic vertical spacing in swimlane
Sistem SHALL mengalokasikan jarak vertikal (Y) antar node secara adaptif berdasarkan tinggi aktual node dan struktur alur cabang keputusan, mencegah tumpang tindih teks atau bentuk node.

#### Scenario: Penyusunan beberapa node berurutan dalam satu kolom
- **WHEN** beberapa node berada pada lajur yang sama secara vertikal
- **THEN** sistem memberikan jarak vertikal minimal yang aman (120px sampai 160px) antar elemen sehingga tidak ada teks atau garis bentuk yang saling menutupi
