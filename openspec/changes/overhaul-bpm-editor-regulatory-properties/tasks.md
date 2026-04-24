# Tasks: Overhaul BPM Editor Regulatory Properties

## 1. Preparation & Database
- [x] 1.1 Update `worker/db/schema.ts`: Tambahkan kolom untuk IPO (xiv-xvii) dan COSO Mapping jika belum persisten di level relasi.
- [x] 1.2 Generate migration: `npx drizzle-kit generate`.
- [x] 1.3 Run migration: `npx drizzle-kit migrate` (atau via wrangler d1).
- [x] 1.4 Update `shared/types.ts` agar sejalan dengan schema baru.

## 2. Standalone Property Panel (Requirement 1, 5, 6, 7)
- [x] 2.1 Buat komponen `RegulatoryPropertySheet.tsx` menggunakan `Sheet` shadcn.
- [x] 2.2 Implementasi form dasar: Deskripsi Risiko & Kontrol (Textarea).
- [x] 2.3 Ganti Switch Toggle ke Dropdown (Yes/No) untuk Fraud, Key Control, dan Rating.
- [x] 2.4 Integrasi `useUnsavedChanges` hook (Internal & External guard) pada editor.

## 3. Automation & Logic (Requirement 1, 2, 3)
- [x] 3.1 Hapus `RiskSearchOrCreate` dan `ControlSearchOrCreate` yang lama (model lookup).
- [x] 3.2 Implementasi logic `autoCreateUniquePair` setiap kali node Activity baru dibuat.
- [x] 3.3 Buat generator running number untuk ID Risiko & Kontrol (Prefix R- & C-).

## 4. Dynamic Sub-Forms (Requirement 8, 9, 10)
- [x] 4.1 Implementasi `TLCForm`: Tabel IPO dengan dropdown Y/N.
- [x] 4.2 Tambahkan tooltips penjelasan IPO di `src/i18n/locales/*/bpm.json`.
- [x] 4.3 Implementasi `ELCForm`: Pemetaan 17 Prinsip COSO (Grid/Checkbox).
- [x] 4.4 Implementasi `ITGCForm`: Halaman Dummy ITGC contek Lampiran 5.c.

## 5. Localization & Integration
- [x] 5.1 Update `src/i18n/locales/*/rcm.json` untuk label-label baru.
- [x] 5.2 Update `src/i18n/locales/*/bpm.json` untuk tooltip IPO dan asersi.
- [x] 5.3 Verifikasi mapping data muncul di `RCMTLCPage.tsx` dan `RCMELCPage.tsx`.

## 6. Final Polish
- [x] 6.1 Test visual "Double-Layer Safety" (Coba tutup tab & navigasi internal).
- [x] 6.2 Validasi integritas ID Unik di database.
