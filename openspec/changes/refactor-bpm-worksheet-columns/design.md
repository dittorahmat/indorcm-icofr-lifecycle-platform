## Context

The BPM Worksheet currently uses a "Level 1" and "Level 2" hierarchy for business process information. Level 2 was intended to be removed from the database but persists in the UI code. This change aims to simplify the model to a single "Business Process" level and optimize the table layout for better user experience.

## Goals / Non-Goals

**Goals:**
- Consolidate business process information into a single field.
- Align the UI with the intended database schema (removing Lvl 2).
- Improve the column order for logical data entry flow.
- Ensure all translations are updated and consistent.

**Non-Goals:**
- Migrating or preserving any existing "Level 2" data (which is currently not being saved properly anyway).
- Changing the underlying BPM diagramming logic.

## Decisions

### 1. Rename `business_process_lvl1` to `business_process`
- **Rationale**: Reflects the simplified hierarchy where "Level 1" is now the only process level.
- **Alternatives**: Keeping the `Lvl1` suffix but that would be misleading as there is no `Lvl2`.
- **Implementation**: 
    - Drizzle Migration: `ALTER TABLE "controls" RENAME COLUMN "business_process_lvl1" TO "business_process"`.
    - Update `worker/db/schema.ts` and `shared/types.ts`.

### 2. Remove `business_process_lvl2` from UI and Types
- **Rationale**: The column was already dropped in SQL but code remains. Removing it prevents confusion and reduces code bloat.

### 3. Column Reordering in `BPMWorksheet.tsx`
- **Rationale**: Moving "Nama Aktivitas Pengendalian" closer to the process descriptions helps users contextualize the control name immediately after defining the sub-process.
- **New Order**: `Workflow` -> `Process` -> `Sub-Process` -> `Control Name` -> `Location`.

### 4. Translation Key Update
- **Rationale**: Use i18n keys instead of hardcoded labels for all headers.
- **Keys**: `bpm:worksheet.columns.businessProcess`, `bpm:worksheet.columns.subProcess`, `bpm:worksheet.columns.controlName`, `bpm:worksheet.columns.location`.

## Risks / Trade-offs

- **[Risk] Data Loss** → We are explicitly discarding `business_process_lvl2` data. Since it wasn't being saved to the database in the current version (already dropped in SQL), the impact is minimal.
- **[Risk] Broken API** → Renaming the field in the database requires updating all API routes that interact with `controls`.
- **[Mitigation]** → Perform a full codebase search for `businessProcessLvl1` and `business_process_lvl1` to ensure all instances are replaced.
