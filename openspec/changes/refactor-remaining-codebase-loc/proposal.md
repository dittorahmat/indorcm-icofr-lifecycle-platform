# Proposal: Refactor Remaining Codebase LOC Compliance (DB Schema & Scoping GL Data Grid)

## Why
Sesuai mandat konvensi arsitektur di [AGENTS.md](file:///C:/backup/indorcm-icofr-lifecycle-platform/AGENTS.md), batas ukuran file kode adalah **Soft Limit 500 LOC** dan **Hard Limit 800 LOC** untuk mencegah "AI slop", menurunkan cognitive load, dan menjaga modularitas kode produksi. 

Dua berkas utama yang masih melanggar limit adalah:
1. `worker/db/schema.ts` (864 LOC) – Mendefinisikan seluruh tabel database PostgreSQL Drizzle dalam satu file monolitik.
2. `src/components/scoping/GLDataGrid.tsx` (647 LOC) – Menggabungkan render tabel, aggregasi formula, toolbar, dan filter scoping GL.

Refactor ini akan mendekomposisi kedua berkas tersebut menjadi domain modul mandiri (< 350-400 LOC) dengan **Zero Migration Diff** (tidak ada perubahan DDL PostgreSQL) dan **Zero Functional Regression**.

## What Changes
- **Database Schema Modularization (`worker/db/schema/`)**:
  - `worker/db/schema/auth.ts`: Tabel Better-Auth & Org (`user`, `session`, `account`, `verification`, `organization`, `member`, `businessEntities`).
  - `worker/db/schema/gl-scoping.ts`: Tabel GL & Scoping (`glSnapshots`, `glRows`, `transactionDetails`, `materiality`, `simulations`, `simulationAccountApplications`, `accountAssertions`).
  - `worker/db/schema/rcm-bpm.ts`: Tabel RCM & BPM (`bpmDiagrams`, `bpmProcesses`, `bpmNodeRcms`, `rcmControls`, `rcms`, `controls`, `bpmProcessGlCodes`, `bpmExports`).
  - `worker/db/schema/csa-testing.ts`: Tabel CSA & Testing (`csaRecords`, `csaSamples`, `testRecords`, `testSamples`, `todEvaluations`, `csaSchedules`).
  - `worker/db/schema/knowledge-soc.ts`: Tabel Knowledge Base, SOC, Vendor & Deficiencies (`documents`, `documentChunks`, `documentDepartments`, `documentGls`, `documentFslis`, `vendors`, `socReports`, `socEvaluations`, `systemLicenses`, `auditLogs`, `aggregateDeficiencies`, `userPreferences`).
  - `worker/db/schema/relations.ts`: Seluruh Drizzle ORM entity relations.
  - `worker/db/schema.ts`: Berubah menjadi *facade re-exporter* ramping (< 30 LOC) yang mengekspor seluruh domain schema di atas tanpa merusak import statement yang sudah ada di codebase.
- **Scoping GL Data Grid Decomposition (`src/components/scoping/`)**:
  - Ekstraksi `GLDataGridColumns.tsx`: Definisi TanStack Table columns, custom cells, and styling formatting.
  - Ekstraksi `GLDataGridToolbar.tsx`: Search bar, filter dropdowns, dan action buttons.
  - `GLDataGrid.tsx`: Tetap sebagai orchestrator container yang ramping (< 350 LOC).

## Capabilities

### New Capabilities
- `schema-loc-compliance`: Memastikan seluruh modul skema database Drizzle terbagi rapi berdasarkan bounded context (< 300 LOC per file) dengan zero database migration changes.
- `gl-grid-loc-compliance`: Memastikan visual data grid scoping terpecah antara definisi tabel, toolbar, dan state container (< 400 LOC).

### Modified Capabilities
<!-- Tidak ada perubahan requirement bisnis / functional spec yang berubah. -->

## Impact
- **Database DDL**: Zero impact. Tidak ada nama tabel, kolom, constraint, atau tipe data yang berubah. `npx drizzle-kit push` akan menghasilkan 0 migration diff.
- **Backend Imports**: Semua file yang mengimpor dari `worker/db/schema` tetap berfungsi normal tanpa perlu refactor path import.
- **Frontend Scoping UI**: Seluruh fungsi interaktif (filter GL, pemetaan FSLI, sorting) di GL Data Grid tetap bekerja 100% identik.
