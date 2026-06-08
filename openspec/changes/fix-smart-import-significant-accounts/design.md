## Context

The "Smart Import" feature automates the creation of a baseline ICOFR cycle. It takes General Ledger (GL) data and RCM data, calculates materiality (OM/PM), and creates an "Approved" simulation. Currently, the backend implementation of this process creates the simulation but leaves the `significantAccounts` list empty, even though the OM/PM values are set. This leads to empty dropdowns in the BPM process mapping page, which filters its process list based on these significant accounts.

## Goals / Non-Goals

**Goals:**
- Automatically identify and persist significant accounts during the Smart Import finalization process.
- Ensure the persisted `significantAccounts` match the format expected by the frontend and other parts of the system.
- Maintain consistency between the calculated PM and the stored significant accounts.

**Non-Goals:**
- Changing the scoping logic itself (e.g., how PM is calculated).
- Modifying the frontend `SmartImportWizard` UI.
- Backfilling existing data (this will be handled by a separate one-time script).

## Decisions

### Backend Significance Calculation
We will calculate the list of significant accounts in the `worker/routes/migration.ts` file within the `/migration/finalize` endpoint.
- **Rationale**: Since the backend already has access to both the `tbData` and the `simulationParams` (including `pmValue`), it is the source of truth for creating the simulation record.
- **Implementation**: We will filter the `tbData` array where `abs(balance) >= pmValue` and map these rows to the `SignificantAccount` interface structure before the database insert.

### Data Structure Consistency
The `significantAccounts` array will store objects with the following fields: `name`, `balance`, `isQuantitative`, `fsliCode`, and `assignedDepartmentIds`.
- **Rationale**: This matches the `SignificantAccount` type defined in `shared/types.ts` and ensures compatibility with the BPM and Scoping pages.

## Risks / Trade-offs

- **[Risk]** Inconsistent mapping between FSLI names and codes if `tbData` is malformed. → **Mitigation**: Use the `suggestedFsli` and `fsliCode` fields directly from the parsed TB data provided by the wizard.
- **[Risk]** Performance impact for very large TB files. → **Mitigation**: Array filtering in memory is extremely fast for the typical size of a GL (1k-10k rows).
