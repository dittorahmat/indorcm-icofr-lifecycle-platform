## Why

Fix control visibility issues in the CSA Assessment and Worksheet tabs where controls appear as 0 despite being defined in the BPM Editor. This is primarily due to case-sensitive naming mismatches and missing ID-based linkages for data created via the Visual Editor. Additionally, improve the Execution Hub header UI to prioritize the Sub-Process name for better user context.

## What Changes

- **Robust Data Linking**: Update backend logic to ensure controls saved via the Visual Editor are automatically linked to the correct `BPMProcess` ID and GL codes using case-insensitive matching.
- **Case-Insensitive Filtering**: Modify frontend components (`BPMModal`, `CSAModal`, `BPMWorksheet`) to use case-insensitive matching when filtering controls by Sub-Process name.
- **Header UI Overhaul**: Refactor the `BPMModal` (Execution Hub) header to display the Sub-Process name as the primary title, with Account/GL details as supporting metadata.
- **Fallback Logic**: Implement a reliable fallback mechanism that tries to match controls by ID first, then by Sub-Process name (case-insensitively).

## Capabilities

### New Capabilities
- `bpm-execution-hub`: Centralizes the logic and UI for the Execution Hub, ensuring robust linking between visual diagrams and tabular RCM data.

### Modified Capabilities
- `csa-management`: Update visibility requirements to ensure controls are correctly retrieved regardless of text casing in Sub-Process names.

## Impact

- `worker/user-routes.ts`: `PUT /api/bpm-diagrams/:id` route logic.
- `src/components/bpm/BPMModal.tsx`: Header UI and control filtering.
- `src/components/bpm/CSAModal.tsx`: Control fetching and filtering.
- `src/components/bpm/BPMWorksheet.tsx`: Header UI and control filtering.
