## Why

Implementasi RCM ITGC (Information Technology General Controls) diperlukan untuk mematuhi regulasi **SK-5/DKU.MBU/11/2024 (Lampiran 5.c)**. Saat ini aplikasi sudah memiliki TLC dan ELC, namun ITGC masih belum terstandarisasi sesuai format matriks horizontal yang diwajibkan, termasuk field aplikasi pendukung dan jenis pengendalian otomatis.

## What Changes

- **New RCM ITGC Page**: Pembuatan halaman matriks ITGC horizontal sesuai Lampiran 5.c yang menghubungkan risiko operasional TI dengan aktivitas pengendalian.
- **Enhanced ITGC Form**: Penambahan field "Aplikasi Pendukung" dan "Jenis Pengendalian Otomatis" pada `RegulatoryPropertySheet` untuk melengkapi metadata yang diwajibkan regulasi.
- **Database Schema Update**: Penambahan kolom pada tabel `regulatory_pairs` untuk menyimpan data `itgcDomain`, `supportingApp`, dan `automatedControlType`.
- **Glossary & Tooltips**: Integrasi penjelasan domain ITGC dan tipe kontrol otomatis TI langsung pada UI untuk memandu user.
- **Localization**: Update kamus i18n untuk terminologi ITGC sesuai bahasa regulasi.

## Capabilities

### New Capabilities
- `rcm-itgc-mapping`: Kemampuan untuk memetakan kontrol TI ke domain ITGC (Access, Development, Changes, Operations) dan menampilkannya dalam matriks regulasi horizontal.
- `itgc-metadata-management`: Pengelolaan metadata spesifik TI seperti aplikasi pendukung dan klasifikasi kaku (Automated Control, Calculation, Restricted Access, Interface) sesuai standar SK-5.

### Modified Capabilities
- `rcm-bpm-visualization`: Update visual editor untuk mendukung input metadata ITGC yang lebih lengkap pada node aktivitas.

## Impact

- `src/pages/rcm/RCMITGCPage.tsx` (New)
- `src/components/rcm/properties/ITGCForm.tsx` (Enhanced input fields)
- `shared/types.ts` (Definition of ITGC specific types)
- `worker/db/schema.ts` (Drizzle schema updates)
- `src/i18n/id/rcm.json` (New localization strings)
