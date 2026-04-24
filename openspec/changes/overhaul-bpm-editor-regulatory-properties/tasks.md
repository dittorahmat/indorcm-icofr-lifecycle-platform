# Tasks: Overhaul BPM Editor Regulatory Properties

## 1. Core Implementation
- [x] 1.1 Implementasi `RegulatoryPropertySheet.tsx` dengan sistem Tabs.
- [x] 1.2 Implementasi ID Unik otomatis (R- & C-) untuk setiap node.
- [x] 1.3 Integrasi `useUnsavedChanges` hook pada editor visual dan matriks.

## 2. Regulatory Sub-Forms
- [x] 2.1 TLC Form: Tabel IPO dengan dropdown Y/N.
- [x] 2.2 ELC Form: Pemetaan 17 Prinsip COSO dengan tooltip integrasi Lampiran 1.
- [x] 2.3 ITGC Form: Placeholder domain & asersi contek Lampiran 5.c.

## 3. Matrix Overhaul & Performance
- [x] 3.1 Refactor `RCMELCPage.tsx` ke layout horizontal (Lampiran 5 a).
- [x] 3.2 Implementasi `sticky` columns untuk navigasi matriks yang lebar.
- [x] 3.3 Optimalisasi performa menggunakan filtered endpoints & frontend subsidiary mapping.
- [x] 3.4 Penambahan filter multi-subsidiary di header matriks.

## 4. Auditability (Lampiran 6)
- [x] 4.1 Update API `/api/changelogs` untuk mendukung filter `entityId`.
- [x] 4.2 Implementasi "History Tab" pada Property Sheet untuk log spesifik entitas.
- [x] 4.3 Verifikasi pencatatan snapshot data saat "Save & Sync" ditekan.

## 5. Final Localization
- [x] 5.1 Glosarium 17 Prinsip COSO (Indonesian & English).
- [x] 5.2 Tooltip teknis untuk kriteria IPO (Completeness, etc).
