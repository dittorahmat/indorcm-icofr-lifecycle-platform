## Context

The system currently allows Risks (`rcms`) and Controls (`controls`) to exist with `NULL` or mismatched `year` values. This happens because the `BpmService` synchronization logic previously only "backfilled" the year if it was missing, rather than enforcing it. Additionally, name changes in the BPM Editor (e.g., changing a Sub-Process name) were not being propagated to existing database records, leading to stale data in the RCM Matrix.

## Goals / Non-Goals

**Goals:**
- Enforce strict temporal (year) consistency between BPM Diagrams and their child Risks/Controls.
- Ensure all synced RCM/Control records reflect the current Sub-Process and Process names from the BPM Editor.
- Harden API endpoints to filter out legacy data or "ghost" processes with missing year metadata.
- Repair existing data inconsistencies via a one-time backfill script.

**Non-Goals:**
- Modifying the visual layout or React Flow logic of the BPM Editor.
- Changing the schema of the `rcms` or `controls` tables.

## Decisions

### 1. Force Metadata Synchronization in BpmService
- **Decision**: Update `year`, `process`, and `subProcess` fields on every save operation in `syncRisk` and `syncControl`, even for existing records.
- **Rationale**: Risks and Controls in the BPM context are subordinates of the Diagram. If a user moves a Risk to a different diagram or renames the sub-process, the database must reflect this structural change to remain consistent in tabular views.
- **Alternative**: Only updating if fields are empty. (Rejected: Leads to stale metadata when names change).

### 2. Year-Aware BPM Process Resolution
- **Decision**: Modify the `BPMProcess` resolution logic in `updateDiagram` to include `year` in the query criteria.
- **Rationale**: Prevents a Control in a 2026 diagram from being accidentally linked to a legacy 2023 `BPMProcess` record with the same name.

### 3. Strict Year Filtering in RCM Matrix and BPM Process APIs
- **Decision**: Add mandatory `year` conditions to the `/api/rcm-matrix/tlc` and `/api/bpm-processes` routes.
- **Rationale**: Ensures that when a user is working in the "2026" context, they only see data valid for that year, hiding orphaned or legacy records.

### 4. Automated Data Remediation Script
- **Decision**: Create `scripts/backfill-rcm-tlc-sync.ts` to perform a comprehensive cleanup of the database.
- **Rationale**: Manual cleanup of hundreds of records is infeasible. The script will:
  1. Assign years to `BPMProcess` records based on their associated Diagrams.
  2. Sync `rcms.year` and `controls.year` to match their diagrams/processes.
  3. Ensure all Controls have a valid `bpmProcessId` based on name and year matching.

## Risks / Trade-offs

- **[Risk] Data Overwrite** → If a Risk/Control is shared across multiple diagrams with different years (rare), forcing the year might cause flipping. *Mitigation*: The current system architecture assumes RCM entities are primarily owned by their specific sub-process context.
- **[Risk] Breaking Legacy Reports** → Older reports might rely on the `NULL` year data. *Mitigation*: The backfill script will default NULLs to 2026 or their closest identifiable year, ensuring visibility in the modern UI while preserving the records.
