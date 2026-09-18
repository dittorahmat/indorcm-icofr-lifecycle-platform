# Tasks: Refactor Remaining Codebase LOC Compliance

## 1. Database Schema Modularization (Hard Limit Fix: worker/db/schema.ts)

- [x] 1.1 Buat `worker/db/schema/types.ts` untuk custom Drizzle types (`tsvector`, `vector`, `icofrSchema`, `ownerAcceptanceEnum`)
- [x] 1.2 Buat `worker/db/schema/auth.ts` untuk tabel better-auth (`user`, `session`, `account`, `verification`, `organization`, `businessEntities`, `member`)
- [x] 1.3 Buat `worker/db/schema/gl-scoping.ts` untuk tabel GL & Scoping (`departments`, `glSnapshots`, `glRows`, `transactionDetails`, `transactionUploads`, `materiality`, `simulations`, `simulationAccountApplications`, `accountAssertions`)
- [x] 1.4 Buat `worker/db/schema/rcm-bpm.ts` untuk tabel RCM & BPM (`bpmDiagrams`, `bpmNodeRcms`, `rcmControls`, `rcms`, `controls`, `bpmProcesses`, `bpmProcessGlCodes`, `bpmExports`)
- [x] 1.5 Buat `worker/db/schema/csa-testing.ts` untuk tabel CSA & Testing (`csaRecords`, `csaSamples`, `testRecords`, `testSamples`, `todEvaluations`, `csaSchedules`, `aggregateDeficiencies`)
- [x] 1.6 Buat `worker/db/schema/knowledge-soc.ts` untuk tabel Knowledge base, SOC & Logs (`documents`, `documentDepartments`, `documentGls`, `documentFslis`, `documentChunks`, `systemLicenses`, `vendors`, `socReports`, `socEvaluations`, `auditLogs`, `migrationSessions`, `userPreferences`)
- [x] 1.7 Buat `worker/db/schema/relations.ts` untuk seluruh relasi Drizzle ORM
- [x] 1.8 Refactor `worker/db/schema.ts` menjadi facade index (< 30 LOC) yang me-reexport seluruh domain skema
- [x] 1.9 Verifikasi TypeScript type-check pada worker dan aplikasi lolos tanpa error

## 2. Scoping GL Data Grid UI Decomposition (Soft Limit Fix: GLDataGrid.tsx)

- [x] 2.1 Ekstrak definisi kolom TanStack Table ke `src/components/scoping/GLDataGridColumns.tsx` (< 300 LOC)
- [x] 2.2 Ekstrak filter, search bar, dan action bar ke `src/components/scoping/GLDataGridToolbar.tsx` (< 200 LOC)
- [x] 2.3 Sederhanakan `src/components/scoping/GLDataGrid.tsx` menjadi container orchestrator ramping (< 350 LOC)
- [x] 2.4 Verifikasi fungsionalitas visual tabel scoping GL tetap bekerja identik

## 3. Mandat Penyelesaian Tahap (Mandatory Quality Gate)

- [x] 3.1 Sinkronisasi Skema Database: Jalankan `npx drizzle-kit push` untuk memastikan 0 schema difference
- [x] 3.2 Lokalisasi Penuh (i18n): Pastikan tidak ada hardcoded strings baru
- [x] 3.3 Integritas Tipe: Jalankan `npm run type-check` (0 TS error)
- [x] 3.4 Standar Kode (Lint): Jalankan `npm run lint` (0 error)
- [x] 3.5 Verifikasi Kompilasi (Build): Jalankan `npm run build`
- [x] 3.6 Pengujian Otomatis (Test): Jalankan `npm test`
