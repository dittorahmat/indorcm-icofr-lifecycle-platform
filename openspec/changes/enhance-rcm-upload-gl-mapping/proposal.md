## Why

Currently, when users upload RCM files (TLC) via the Smart Import Wizard, the system cannot link the imported processes to specific GL accounts because there is no `No_GL` or `noGL` column parsed. This forces the user to manually recreate processes with matching names in `BPMPage.tsx` to establish the connection, leading to a redundant and confusing user experience.

## What Changes

- **TLC RCM Ingestion Enhancements**: Add a `No_GL` column to the TLC RCM template and parser to capture GL account codes on upload.
- **Auto-linking Processes on Finalize**: Update the backend `migration/finalize` endpoint to populate both `noGL` and `fsliName` on `bpmProcesses` when finalizing the RCM.
- **Process Visibility on BPM Page**: In `BPMPage.tsx`, the RCM-imported processes will automatically appear under the corresponding FSLI and GL selection, eliminating the need for manual process recreation.
- **Migration Backlog Drag-and-Drop**: The unmapped controls and risks from the imported RCM will be available in the side panel of the BPM Editor to be dragged directly onto the canvas, automatically pre-filling the node details.

## Capabilities

### New Capabilities
<!-- None -->

### Modified Capabilities
- `gl-integration`: Update the GL integration to support mapping GL accounts directly in the RCM import flow.
- `bpm-execution-hub`: Update process diagram loading to match against the newly integrated `noGL` from the RCM upload and support drag-and-drop from the migration backlog.

## Impact

- **Frontend Pages**: `src/pages/scoping/services/rcm-parser.ts`, `src/components/scoping/SmartImportWizard.tsx`, `src/components/rcm/BPMEditor.tsx`.
- **Backend API**: `worker/routes/migration.ts`.
- **Data Schemas**: `bpmProcesses` and `controls` relation queries.
