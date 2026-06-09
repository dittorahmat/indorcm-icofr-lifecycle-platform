## Why

Currently, when a user imports General Ledger (GL) data through the Smart Import Wizard, the system overrides the original filename with a hardcoded format like `Migration_2026_TB`. This prevents users from tracking which specific file was used as the source for a particular snapshot, leading to audit trail and data integrity concerns.

## What Changes

- **Frontend**: The `SmartImportWizard` component will be updated to capture the original filename of the uploaded GL/TB file and include it in the payload sent to the backend during the finalization step.
- **Backend**: The `/api/migration/finalize` endpoint will be updated to accept the `tbFileName` parameter from the request body.
- **Database**: The GL snapshot record will be created using the provided original filename instead of the hardcoded default.

## Capabilities

### New Capabilities
- None

### Modified Capabilities
- `gl-integration`: Added requirement to preserve and store the original uploaded filename for GL snapshots.

## Impact

- **Frontend**: `src/components/scoping/SmartImportWizard.tsx` (UI logic and API call).
- **Backend**: `worker/routes/migration.ts` (API route and database insertion logic).
- **System**: Auditability of GL data source files will be improved.
