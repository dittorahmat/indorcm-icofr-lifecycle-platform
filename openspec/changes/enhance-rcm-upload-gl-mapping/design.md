## Context

Currently, the TLC RCM Excel/CSV templates contain an `Item_Laporan_Keuangan_yang_Terdampak` column mapping to FSLI names, but they do not contain a GL account code column. This results in the backend creating `bpmProcesses` rows with an empty `noGL` string (`""`), which prevents them from being queried on `BPMPage.tsx` under the selected GL account filter.

## Goals / Non-Goals

**Goals:**
- Capture a new `No_GL` column in the TLC RCM file upload.
- Update `parseRCMFile` in `rcm-parser.ts` to read this column and expose it as `accountCode`.
- Modify the backend `/api/migration/finalize` route to write `noGL` and `fsliName` to the `bpmProcesses` table on RCM finalization.
- Support dragging unmapped risks and controls from the backlog directly onto the visual canvas in `BPMEditor.tsx`.

**Non-Goals:**
- Modifying ELC or ITGC ingestion to link to GL accounts (ITGC relies on application names, and ELC is entity-level, not transaction-level).

## Decisions

### Decision 1: Capture `No_GL` in TLC RCM Parser
We will update `rcm-parser.ts` to check for a `No_GL` (or `noGL`, `Kode GL`, `Kode_GL`, `Account Code`) column.
- **Alternatives Considered**: Resolving the GL code automatically using AI matching based on FSLI.
- **Rationale**: AI matching can be inaccurate for large charts of accounts. Allowing an explicit `No_GL` column in the RCM CSV ensures 100% accurate mapping to the GL.

### Decision 2: Backend Auto-linking on Finalize
We will modify `/api/migration/finalize` in `worker/routes/migration.ts` to write `noGL` (from `row.accountCode`) and `fsliName` (from `row.affectedFsliItem`) to the `bpmProcesses` row being created.
- **Alternatives Considered**: Requiring the user to link the process manually in the UI after import.
- **Rationale**: Manual linking is tedious. Automatic linking makes the process immediately visible under the matching FSLI/GL.

### Decision 3: Skip GL Code Risk-ID Suffix Filter on Process-scoped Queries
We will update `/api/rcm-matrix/tlc` in `worker/routes/rcm.ts` to only apply the `like(rcms.id, '%-' + noGL)` suffix filter if `bpmProcessId` is not provided.
- **Alternatives Considered**: Automatically generating risk IDs with the `-${noGL}` suffix during RCM import.
- **Rationale**: Adding the GL suffix to the risk ID is an anti-pattern as risks can be linked to multiple GLs. Skiping the filter when a specific process ID is selected allows the backlog panel to retrieve the migrated risks cleanly.

## Risks / Trade-offs

- **Risk**: User uploads an RCM file without a `No_GL` column.
  - **Mitigation**: The parser will default `accountCode` to `""`, and the system will fallback to current behavior (the user can manually create or link the process in `BPMPage.tsx`).
