## Why

Users are experiencing recurring RCM-TLC synchronization issues where Risks and Controls created or modified in the BPM Editor either fail to appear in the Execution Hub (TLC Matrix) or display stale metadata (e.g., outdated sub-process names or mismatched years). This undermines data integrity and prevents reliable regulatory reporting as required by SK-5/DKU.MBU/11/2024.

## What Changes

- **Strict Temporal Alignment**: `BpmService` will be updated to force all synced Risks and Controls to inherit the `year` from the parent BPM Diagram, overriding any existing mismatched values.
- **Enhanced Metadata Synchronization**: The sync logic for Risks and Controls will be modified to update all relevant fields (process name, sub-process name, descriptions) every time a diagram is saved, rather than only backfilling missing values.
- **Robust Process Linkage**: Ensures that Controls are always linked to the correct `bpmProcessId` corresponding to the diagram's year and sub-process name.
- **API Filtering Hardening**: The RCM Matrix and BPM Process APIs will be updated to enforce strict `year` filtering, preventing data from "ghost" processes (records with NULL years) from appearing in the UI.
- **Automated Data Remediation**: A dedicated backfill script will be provided to reconcile existing data inconsistencies across the `rcms`, `controls`, and `bpm_processes` tables.

## Capabilities

### New Capabilities
- `rcm-tlc-integrity`: Establishes a strict synchronization contract between visual BPM diagrams and tabular RCM/Control records, ensuring temporal (year) and structural (process) consistency.

### Modified Capabilities
- `bpm-execution-hub`: Strengthening the requirement for visual-to-tabular data linking to include mandatory metadata propagation and year-strict filtering.

## Impact

- **Worker Services**: `worker/services/bpm-service.ts` (Core sync logic refactor).
- **API Routes**: `worker/routes/rcm.ts` and `worker/routes/bpm.ts` (Strict year filtering).
- **Maintenance Tools**: `scripts/backfill-rcm-tlc-sync.ts` (New data repair utility).
- **Database**: Ensuring all records in `rcms`, `controls`, and `bpm_processes` have valid year metadata.
