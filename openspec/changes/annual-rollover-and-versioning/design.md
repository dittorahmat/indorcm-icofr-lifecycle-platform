## Context

The ICOFR Lifecycle Platform currently operates on a per-fiscal-year basis for scoping, BPM diagrams, and RCM controls. However, two major technical gaps exist:
1. The `account_assertions` table (which stores qualitative assertions for financial accounts) lacks a `year` column. This makes assertions global across all years, meaning editing assertions in one fiscal year overrides them for all other years.
2. There is no rollover/clone mechanism to copy last year's configurations (scoping settings, RCM, ELC, and ITGC controls, diagrams, and open deficiencies/action plans) to a new year. A new year starts blank, requiring manual CSV uploads or manual entry.

This design document outlines adding `year` to `account_assertions` and building an API and UI to rollover configurations safely.

## Goals / Non-Goals

**Goals:**
- Partition qualitative account assertions (`account_assertions` table) by fiscal year.
- Build a database migration to backfill existing assertions data with a default year (`2025`).
- Implement a backend rollover API (`POST /api/migration/rollover`) that clones RCM, controls, processes, diagrams, scoping assertions, and open deficiencies/action plans from a source year to a target year.
- Implement frontend UI dialogs/banners in `ScopingPage.tsx` and `RCMTLCPage.tsx` that detect an empty year and offer a "Carry Forward / Copy from previous year" trigger.
- Handle many-to-many relationship updates (e.g., ensuring new `rcm_controls` records point to the newly cloned `rcms` and `controls` IDs).

**Non-Goals:**
- Allowing multiple concurrent/repetitive rollovers that overwrite manually modified data in the target year (the API should check if the target year already has data or throw an error/prompt confirm).
- Automating historical transaction details migration (only configuration, templates, open deficiencies, and master data are rolled over).

## Decisions

### Decision 1: Database Schema Modifications
- **Choice:** Add `year: integer` to the `account_assertions` table.
- **Alternatives Considered:** 
  1. *Keeping it global:* Rejected because regulatory auditing requires yearly snapshot archives.
  2. *Adding a separate mapping table:* Rejected as it unnecessarily complicates simple entity attributes.
- **Rationale:** Straightforwardly partitions account assertions by year, allowing history tracing.

### Decision  decision 2: Rollover ID Mapping Strategy
- **Choice:** When copying records (e.g., Controls, Risks) to a new year, they must get new UUIDs (or generated IDs) to avoid primary key collisions. Since `rcm_controls` maps `rcm_id` to `control_id`, we must keep a map of `old_rcm_id -> new_rcm_id` and `old_control_id -> new_control_id` in memory during the migration transaction, then insert the new `rcm_controls` referencing the new IDs.
- **Rationale:** Ensures referential integrity is preserved in the cloned year.

### Decision 3: Carry Forward of Deficiencies & Action Plans
- **Choice:** Only clone `deficiencies` with `status: 'Open'`. Create new records for them in the target year, and remap their `controlId` to the newly cloned control ID in the target year (if the control exists there).
- **Rationale:** "Closed" deficiencies are archival and belong to the previous year. "Open" deficiencies represent active remediation tasks that must carry over to the new year's compliance workflow.

## Risks / Trade-offs

- **[Risk] ID Mapping Failure during cloning** → *Mitigation:* Perform all inserts inside a single database transaction. If any step fails, roll back the entire rollover.
- **[Risk] Duplicate Rollovers** → *Mitigation:* The API will check if any data already exists in the target year (e.g., existing simulation, RCM, etc.). If data exists, prevent rollover unless explicitly forced.
