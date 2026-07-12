## Why

Currently, critical destructive actions in the scoping module—specifically deleting a Materiality Simulation or a GL Snapshot—occur immediately when clicking the trash icon without any confirmation. This poses a significant risk of accidental data loss and goes against the platform's Data Loss Prevention principles.

## What Changes

- Add confirmation dialogs to simulation deletion in the scoping module.
- Add confirmation dialogs to GL snapshot deletion in the scoping module.
- Standardize all delete confirmations to use the Shadcn/UI `<AlertDialog>` component (matching the pattern in `RegulatoryPropertySheet.tsx`), replacing immediate deletions and inline native browser `confirm()` popups.

## Capabilities

### New Capabilities
- `secure-delete-confirmations`: Introduces a consistent, localized, and styled AlertDialog confirmation pattern for destructive delete operations.

### Modified Capabilities
- `unsaved-changes-guard`: Integrates with overall unsaved change and state protection guards to ensure data integrity during edit/delete cycles.

## Impact

- `ScopingPage.tsx`: Receives confirmation state management for both Simulation and Snapshot deletions.
- `SimulationListTable.tsx`: Calls confirmation triggers instead of direct deletion.
- `GLSourceTable.tsx`: Calls confirmation triggers instead of direct deletion.
- Shared translations (`scoping.json` / `common.json`): Receives key-value pairs for delete titles, descriptions, and buttons in both English and Indonesian.
