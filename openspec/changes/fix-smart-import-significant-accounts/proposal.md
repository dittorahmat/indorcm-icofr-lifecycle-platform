## Why

The "Smart Import" feature allows users to quickly baseline their ICOFR cycle by importing GL data and RCMs in one step. However, the current implementation in `worker/routes/migration.ts` auto-approves the simulation without calculating or persisting the `significantAccounts` list. This leads to broken downstream workflows (like the BPM Page) which rely on this persisted list to populate their process mapping dropdowns.

## What Changes

- **Automatic Account Significance Persistence**: Update the `/api/migration/finalize` endpoint to identify all GL accounts that exceed the calculated Performance Materiality (PM) and store them in the `significantAccounts` array within the simulation record.
- **Data Integrity during Baselining**: Ensure that the "Approved" simulation created via Smart Import is functionally identical to a manually approved scoping simulation.

## Capabilities

### New Capabilities
- None.

### Modified Capabilities
- `gl-integration`: The requirement for automatically marking accounts as Significant (`balance >= PM`) must now be explicitly persisted to the `simulations` record during the finalized baselining step, not just calculated in the UI.

## Impact

- **Affected Code**: `worker/routes/migration.ts` (Endpoint: `/api/migration/finalize`).
- **Data Model**: `simulations` table (column `significant_accounts`).
- **Dependencies**: None.
