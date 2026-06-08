## Context

Controls created in the BPM Editor are currently detached from the RCM TLC matrix because the synchronization logic fails to propagate the `year` field and sometimes fails to link the correct `bpmProcessId`. This results in data appearing on the visual canvas but being filtered out of the tabular RCM view.

## Goals / Non-Goals

**Goals:**
- Fix `BpmService.ts` to ensure `year` is correctly saved for all synced entities.
- Improve `bpmProcessId` resolution to be more resilient.
- Ensure FSLI codes and other process-specific metadata are correctly linked.
- Provide a mechanism to fix existing orphaned data.

**Non-Goals:**
- Refactoring the entire database schema.
- Changing how the frontend RCM Matrix renders data (only fixing the data source).

## Decisions

### 1. Unified Metadata Injection in `BpmService`
- **Decision**: Update `syncRisk`, `syncControl`, and `syncRcmControlMapping` to accept an optional `year` parameter.
- **Rationale**: Currently, these functions ignore the year, leading to `null` values in the database. Passing the diagram's year ensures consistency.

### 2. Enhanced BPM Process Matching
- **Decision**: Modify the query in `updateDiagram` that finds `matchedProcesses` to use `.where(and(eq(bpmProcesses.organizationId, orgId), eq(bpmProcesses.year, diagramYear), ...))`.
- **Rationale**: Just matching by name is insufficient if multiple years exist. Adding the year constraint ensures we link to the process record for the correct fiscal cycle.

### 3. Data Backfill Logic
- **Decision**: Implement a check in `updateDiagram` to update existing records associated with the diagram that have `null` years.
- **Rationale**: This automatically repairs data as users save their diagrams, without requiring a manual migration script for every single record upfront.

## Risks / Trade-offs

- [Risk] Incorrect Year Assignment → Mitigation: Always derive the year from the diagram metadata (`diagram.year`) which is populated during creation.
- [Risk] Name Mismatches → Mitigation: Use `TRIM(LOWER(...))` for name matching as a fallback if explicit IDs are missing.
