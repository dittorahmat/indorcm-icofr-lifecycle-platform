## Why

In the ICOFR Scoping module, new and existing simulations often render qualitative assessment columns (8 pillars starting with "Susceptibility to Fraud") as empty dashes (`"-"`) instead of defaulting to "Low" as required by SK-5/2024 compliance guidelines. Existing simulation records in the database may also have empty `{}` `assessmentData`. Additionally, the GL benchmark dropdown in `SmartImportWizard` unnecessarily displays `#minNoUrut` badges, cluttering the UI.

## What Changes

- **Qualitative Assessment UI Fallback**: Update `GLDataGrid` to default unassessed qualitative rules to "Low" instead of empty string `""`.
- **Simulation State & Mutation Safeguard**: Ensure `useScopingEditor` and backend simulation save routes preserve and auto-populate qualitative defaults for any missing FSLI entries instead of overwriting them with empty objects.
- **Database Backfill Script**: Add a dedicated database backfill script (`scripts/backfill-scoping-assertions.ts`) to populate `assessmentData` for all existing simulations in the database with SK-5 default ratings ("Low").
- **Benchmark Selection UI Cleanup**: Remove `#minNoUrut` badges from the FSLI benchmark selection dropdown items in `SmartImportWizard.tsx` to streamline the user interface.

## Capabilities

### New Capabilities
- `scoping-qualitative-self-healing`: Ensures resilient client and server side fallback for FSLI qualitative ratings defaulting to "Low", including database backfill utilities.

### Modified Capabilities
- `gl-integration`: Clean up benchmark selection UI and prevent state overwrites for qualitative assertions.

## Impact

- **Scripts**: `scripts/backfill-scoping-assertions.ts` (New script to repair existing DB records)
- **Frontend**: `src/components/scoping/GLDataGrid.tsx`, `src/components/scoping/SmartImportWizard.tsx`, `src/pages/scoping/hooks/useScopingPage.ts`
- **Backend**: `worker/routes/scoping.ts`
