## Why

Users in state-owned enterprises (BUMN) often encounter scenarios where transaction samples are not available in the digital General Ledger or Transaction database, requiring manual entry of sample references into the ICOFR Execution Hub. Additionally, the current CSA UI is difficult to navigate for large sample sets due to the lack of grouped visualization in the verification table and the use of technical control IDs instead of human-readable control names in the status matrix.

## What Changes

- **Manual Sample Entry**: Add "Add Manual Sample" functionality to the `CSATabContent` component to allow users to append custom sample rows.
- **Editable Sample References**: Convert the static `sampleRef` display in the Summary Status Matrix into an editable `Input` field to support manual corrections and entries.
- **Improved Control Identification**: Update table headers in the Status Matrix to display Control Names instead of internal IDs, with tooltips for full descriptions.
- **Grouped Verification Table**: Refactor the "Detailed Verification & Evidence" table to group rows by Sample Reference, improving readability and workflow continuity.
- **Unsaved Changes Integration**: Apply the `unsaved-changes-guard` to the CSA workspace to prevent data loss.
- **Localization & Terminology**: Synchronize all new UI elements with the Indonesian localization (`id`) and English fallback.
- **Quality Gates**: Ensure the final implementation passes strict type-checking, linting, and build validation.

## Capabilities

### New Capabilities
- `csa-manual-entry`: Capability to manually add and edit sample references within the CSA workspace.

### Modified Capabilities
- `granular-csa-verification`: Grouping logic for the verification table.
- `unsaved-changes-guard`: Integration of the standardized guard into the CSA lifecycle.
- `compliance-notification-system`: (Optional) Targeted notifications for CSA lifecycle events if triggered by manual entries.

## Impact

- **Frontend**: `CSATabContent.tsx`, `BPMModal.tsx`, `app-sidebar.tsx` (for potential notification bell polish).
- **Localization**: `src/i18n/locales/`.
- **Backend**: No schema changes required (handled via existing JSONB `controlResults` and `sampleRef` fields).
