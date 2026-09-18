# Tasks: Full-stack Codebase LOC Compliance Refactoring

## Phase 1: Frontend Nodes Decomposition (Hard Limit Fix)
- [x] 1.1 Buat sub-komponen node di `src/components/rcm/nodes/ProcessNodes.tsx` <!-- id: 1.1 -->
- [x] 1.2 Buat sub-komponen node di `src/components/rcm/nodes/RiskControlNodes.tsx` <!-- id: 1.2 -->
- [x] 1.3 Buat sub-komponen node di `src/components/rcm/nodes/SystemMediaNodes.tsx` <!-- id: 1.3 -->
- [x] 1.4 Buat sub-komponen node di `src/components/rcm/nodes/AnnotationNodes.tsx` <!-- id: 1.4 -->
- [x] 1.5 Gabungkan dan re-export seluruh tipe node di `src/components/rcm/nodes/index.ts` <!-- id: 1.5 -->
- [x] 1.6 Update referensi import di `BPMEditor.tsx` dan consumer lainnya <!-- id: 1.6 -->
- [x] 1.7 Verifikasi tidak ada regresi visual atau koneksi edge pada canvas diagram <!-- id: 1.7 -->

## Phase 2: Backend BPM Service Decomposition (Hard Limit Fix)
- [x] 2.1 Ekstrak validasi diagram dan aturan SK-5 ke `worker/services/bpm/bpm-validator.ts` <!-- id: 2.1 -->
- [x] 2.2 Ekstrak transformasi data dan layouting ke `worker/services/bpm/bpm-transformer.ts` <!-- id: 2.2 -->
- [x] 2.3 Ekstrak pencatatan histori dan audit trail ke `worker/services/bpm/bpm-audit.ts` <!-- id: 2.3 -->
- [x] 2.4 Refactor `worker/services/bpm-service.ts` menjadi facade orchestrator ramping (< 400 LOC) <!-- id: 2.4 -->
- [x] 2.5 Jalankan unit test BPM backend untuk memastikan zero regression <!-- id: 2.5 -->

## Phase 3: Backend Routes & Controller Layering (Hard & Soft Limit Fix)
- [x] 3.1 Buat domain service `worker/services/rcm-service.ts` untuk query matrix dan RCM logic <!-- id: 3.1 -->
- [x] 3.2 Sederhanakan `worker/routes/rcm.ts` agar hanya menangani request routing dan response (< 400 LOC) <!-- id: 3.2 -->
- [x] 3.3 Buat domain service `worker/services/csa-service.ts` untuk orkestrasi assessment dan todo list <!-- id: 3.3 -->
- [x] 3.4 Sederhanakan `worker/routes/csa.ts` agar hanya menangani request routing dan response (< 400 LOC) <!-- id: 3.4 -->
- [x] 3.5 Verifikasi seluruh endpoint RCM dan CSA berfungsi normal <!-- id: 3.5 -->

## Phase 4: Frontend UI Sheets & Dialogs Refactoring (Soft Limit Fix)
- [x] 4.1 Dekomposisi `RegulatoryPropertySheet.tsx` menjadi sub-form per kategori node <!-- id: 4.1 -->
- [x] 4.2 Dekomposisi `BPMWorksheet.tsx` dengan mengekstrak toolbar dan column definition <!-- id: 4.2 -->
- [x] 4.3 Dekomposisi `ApplicationDetailDialog.tsx` memisahkan tab SOC dan ITGC <!-- id: 4.3 -->
- [x] 4.4 Dekomposisi `AddAssessmentDialog.tsx` dan `TODVerificationDialog.tsx` <!-- id: 4.4 -->

## Phase 5: Mandat Penyelesaian Tahap (Mandatory Quality Gate)
- [x] 5.1 Sinkronisasi Skema Database: `npx drizzle-kit push` (skema db tidak berubah) <!-- id: 5.1 -->
- [x] 5.2 Lokalisasi Penuh (i18n): Verifikasi tidak ada hardcoded strings baru <!-- id: 5.2 -->
- [x] 5.3 Integritas Tipe: Jalankan `npm run type-check` (0 TS error) <!-- id: 5.3 -->
- [x] 5.4 Standar Kode (Lint): Jalankan `npm run lint` (0 error) <!-- id: 5.4 -->
- [x] 5.5 Verifikasi Kompilasi (Build): Jalankan `npm run build` (build sukses) <!-- id: 5.5 -->
- [x] 5.6 Pengujian Otomatis (Test): Jalankan `npm test` (33 files, 122 tests passed) <!-- id: 5.6 -->
