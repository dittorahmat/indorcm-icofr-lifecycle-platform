## ADDED Requirements

### Requirement: Global Confirm Dialog Hook
The system SHALL expose a unified `useConfirm` React hook that allows components to programmatically trigger a styled `<AlertDialog>` modal and await the user's response.

#### Scenario: User triggers confirm dialog and approves
- **WHEN** a component invokes `confirm` with a specific title and description, and the user clicks the confirm action button
- **THEN** the function SHALL resolve to `true`, and the dialog modal SHALL unmount.

#### Scenario: User triggers confirm dialog and cancels
- **WHEN** a component invokes `confirm` with a specific title and description, and the user clicks the cancel button or clicks outside the modal
- **THEN** the function SHALL resolve to `false`, and the dialog modal SHALL unmount.

### Requirement: Elimination of Browser window.confirm()
The system SHALL replace all existing native browser `window.confirm()` calls with the programmatic `useConfirm` hook to ensure consistent visual aesthetics and support full multi-language translations.

#### Scenario: Verify replacement in Scoping reset
- **WHEN** the user clicks "Reset Scoping Data" on the Scoping page
- **THEN** the system SHALL display the confirmation modal using the `useConfirm` hook rather than the native browser confirm dialog.
