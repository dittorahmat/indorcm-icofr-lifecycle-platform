## Why

Tampilan matriks ELC saat ini tidak sesuai dengan standar **Lampiran 5 a Regulasi SK-5/2024**, di mana struktur yang benar seharusnya menempatkan Kontrol sebagai Baris dan 17 Prinsip COSO sebagai Kolom. Selain itu, pemetaan metadata regulasi ini belum memiliki *audit trail* yang terintegrasi secara visual dan belum mendukung filter tingkat grup/anak perusahaan.

## What Changes

- **Horizontal Matrix Overhaul**: Refactor `RCMELCPage.tsx` untuk mengubah orientasi tabel (Kontrol = Baris, COSO = Kolom) sesuai format Lampiran 5 a.
- **Regulatory Glossary Tooltips**: Penambahan tooltip deskriptif pada header prinsip COSO (1-17) menggunakan konten dari Lampiran 1.
- **Entity-Specific History Tab**: Penambahan tab "History" pada `RegulatoryPropertySheet.tsx` untuk menampilkan log perubahan spesifik bagi kontrol tersebut.
- **Multi-Entity Filtering**: Penambahan filter "Anak Perusahaan" pada halaman Matriks ELC untuk mendukung pelaporan konsolidasian.
- **Safety Navigation Guard**: Implementasi hook `useUnsavedChanges` pada Matriks ELC dan Property Sheet sesuai standar proyek.

## Capabilities

### New Capabilities
- `elc-regulatory-matrix`: Kemampuan menampilkan dan mengelola matriks ELC sesuai standar format Lampiran 5 a Regulasi SK-5/2024.
- `entity-audit-history`: Kemampuan menampilkan riwayat perubahan (audit trail) langsung pada level entitas kontrol/risiko.

### Modified Capabilities
- `rcm-bpm-visualization`: Penyesuaian `RegulatoryPropertySheet` untuk mendukung tab history dan integrasi metadata ELC yang lebih dalam.

## Impact

- `src/pages/rcm/RCMELCPage.tsx`: Perubahan total struktur tabel dan penambahan filter.
- `src/components/rcm/properties/RegulatoryPropertySheet.tsx`: Integrasi tab baru dan sinkronisasi status `isDirty`.
- `src/components/rcm/properties/ELCForm.tsx`: Penambahan deskripsi tooltip.
- `src/i18n/locales/id/rcm.json`: Penambahan glosarium 17 Prinsip COSO.
- `worker/user-routes.ts`: Update API `/api/changelogs` untuk mendukung query per `entityId`.
