## 1. Localization & Glossary Setup

- [x] 1.1 Tambahkan glosarium 17 Prinsip COSO dari Lampiran 1 ke `src/i18n/locales/id/rcm.json` (kunci `coso_tooltips`).
- [x] 1.2 Update label filter dan header kolom di localization file.

## 2. Backend & API Adjustments

- [x] 2.1 Modifikasi endpoint GET `/api/changelogs` di `worker/user-routes.ts` untuk menerima query parameter `entityId`.
- [x] 2.2 Pastikan response API diurutkan berdasarkan timestamp terbaru.

## 3. RCM ELC Matrix Overhaul (Lampiran 5 a)

- [x] 3.1 Refactor struktur `Table` di `src/pages/rcm/RCMELCPage.tsx` agar menggunakan Kontrol sebagai Baris.
- [x] 3.2 Implementasi header kolom Prinsip COSO 1-17 dengan integrasi `Tooltip` dari glosarium i18n.
- [x] 3.3 Tambahkan filter dropdown "Anak Perusahaan" di header halaman `RCMELCPage.tsx`.
- [x] 3.4 Implementasi visualisasi centang (Icon Check) pada kolom prinsip berdasarkan data `cosoPrinciples`.
- [x] 3.5 Pastikan integrasi hook `useUnsavedChanges` aktif pada halaman matriks.

## 4. Regulatory Property Sheet Enhancement

- [x] 4.1 Tambahkan tab "History" pada komponen `Sheet` di `src/components/rcm/properties/RegulatoryPropertySheet.tsx`.
- [x] 4.2 Implementasi komponen list history yang melakukan fetch data secara on-demand saat tab History dibuka.
- [x] 4.3 Update `src/components/rcm/properties/ELCForm.tsx` untuk menampilkan tooltip deskripsi pada label prinsip COSO.
- [x] 4.4 Pastikan status `isDirty` di Property Sheet terhubung dengan guard navigasi global.

## 5. Verification & Testing

- [x] 5.1 Verifikasi tampilan horizontal matriks sesuai dengan spesifikasi Lampiran 5 a.
- [x] 5.2 Uji fungsionalitas tooltip pada header kolom dan form editor.
- [x] 5.3 Validasi filter anak perusahaan dan filter history entitas.
- [x] 5.4 Pastikan peringatan "Unsaved Changes" muncul saat navigasi dengan data belum tersimpan.
