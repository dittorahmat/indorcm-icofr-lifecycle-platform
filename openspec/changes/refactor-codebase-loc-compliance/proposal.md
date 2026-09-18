## Why

Berdasarkan mandat arsitektural pada [AGENTS.md](file:///C:/backup/indorcm-icofr-lifecycle-platform/AGENTS.md):
1. **Soft Limit (500 LOC):** File UI / Container yang melebihi 500 baris harus dipertimbangkan untuk didekomposisi menjadi subkomponen atau hooks terpisah.
2. **Hard Limit (800 LOC):** File yang melampaui 800 baris secara ketat dilarang menerima penambahan fungsional baru sebelum dipecah terlebih dahulu.
3. **Single Responsibility Principle:** Pemisahan container orchestrator dari isolated presentation widgets, modals, dan domain logic.

Pemindaian menyeluruh terhadap repositori mendeteksi file inti frontend dan backend yang melanggar batas tersebut (bahkan menembus 1.100+ LOC), seperti `BPMCustomNodes.tsx` (1.146 LOC), `bpm-service.ts` (1.164 LOC), `rcm.ts` (835 LOC), `csa.ts` (780 LOC), dan beberapa dialog/worksheet kompleks. 

Refactoring menyeluruh (Full-stack) ini akan mengembalikan kepatuhan kode ke standar tata kelola IndoGRC Pro tanpa mengubah perilaku maupun fungsionalitas aplikasi (Zero Behavioral Regression).

## What Changes

### A. Frontend Refactoring (Batas 500-800 LOC)
1. **Dekomposisi `src/components/rcm/nodes/BPMCustomNodes.tsx` (1.146 LOC):**
   - Memecah 30+ varian node Lampiran 3 menjadi sub-modul per kategori dalam folder `src/components/rcm/nodes/`:
     - `ProcessNodes.tsx` (Start/End oval, task rect, subprocess, off-page connector).
     - `RiskControlNodes.tsx` (Hexagon risk, control activity, mitigation).
     - `SystemMediaNodes.tsx` (Cylinder database/media, application system, manual input).
     - `AnnotationNodes.tsx` (Inverted triangle archive, comment, text note).
   - Menyediakan `index.ts` sebagai barrel export tunggal sehingga import di seluruh consumer tetap bersih dan backward-compatible.
2. **Modularisasi `src/components/bpm/BPMWorksheet.tsx` (783 LOC):**
   - Mengekstrak toolbar worksheet, kolom generator, dan modal filter ke komponen pendukung.
3. **Modularisasi Dialog & Sheet Besar (> 600 LOC):**
   - `RegulatoryPropertySheet.tsx` (752 LOC): Membagi inspector ke sub-tab berdasarkan node type.
   - `ApplicationDetailDialog.tsx` (768 LOC): Memisahkan sub-tab detail aplikasi ITGC & SOC monitoring.
   - `AddAssessmentDialog.tsx` (665 LOC) & `TODVerificationDialog.tsx` (615 LOC): Memisahkan section form assessment & bukti verifikasi.

### B. Backend Refactoring (Batas 800 LOC)
1. **Dekomposisi `worker/services/bpm-service.ts` (1.164 LOC):**
   - Memisahkan logika domain menjadi modul khusus di bawah `worker/services/bpm/`:
     - `bpm-validator.ts`: Validasi aturan kepatuhan BUMN SK-5, integritas node/edge, dan siklus proses.
     - `bpm-transformer.ts`: Transformasi format diagram ReactFlow, kalkulasi auto-layout, dan export/import.
     - `bpm-audit.ts`: Pencatatan histori Lampiran 6 dan audit trail perubahan diagram.
   - Menyisakan `bpm-service.ts` sebagai facade orchestrator yang ramping (< 400 LOC).
2. **Modularisasi Rute Hono `worker/routes/rcm.ts` (835 LOC) & `worker/routes/csa.ts` (780 LOC):**
   - Mengekstrak query database Drizzle yang repetitif dan parsing payload kompleks ke domain service pendukung (`worker/services/rcm-service.ts` dan `worker/services/csa-service.ts`).
   - Merapikan endpoint controller agar fokus pada validasi request (zod/param), pemanggilan service, dan pengembalian response JSON yang seragam.

## Capabilities

### New Capabilities
*(Tidak ada fungsionalitas bisnis baru yang ditambahkan; ini adalah restrukturisasi teknis dan arsitektural.)*

### Modified Capabilities
*(Semua perilaku sistem, API contracts, validasi SK-5, diagramming BPM, dan alur CSA tetap 100% identik dengan implementasi saat ini.)*

## Impact

- **Frontend:**
  - `src/components/rcm/nodes/` terorganisir rapi, maintainability pembuatan/pengeditan custom node meningkat drastis.
  - Waktu muat dan test suite frontend lebih cepat karena code-splitting komponen dialog/sheet.
- **Backend:**
  - Service BPM dan rute API (`rcm`, `csa`) jauh lebih mudah diuji via unit test secara terisolasi.
  - Mengurangi coupling antara layer HTTP router dan layer database query.
- **Standar Kode:**
  - Seluruh file aktif yang sebelumnya melanggar Hard Limit (> 800 LOC) turun ke bawah batas, mendekati atau berada di bawah Soft Limit (< 500 LOC).
