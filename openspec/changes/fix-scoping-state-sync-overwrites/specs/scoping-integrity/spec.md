## ADDED Requirements

### Requirement: Scoping Editor State Preservation
The scoping editor worksheet MUST preserve the user's unsaved changes (qualitative rules, department owners, and application mappings) and prevent background server query updates from resetting them.

#### Scenario: Background refresh while editor is dirty
- **WHEN** the user has modified one or more cells in the worksheet (`isDirty` is true) and a React Query background refetch completes
- **THEN** the worksheet local state is NOT overwritten and the user's local edits are preserved in the UI

#### Scenario: Switching active simulation
- **WHEN** the user navigates or selects a different simulation ID
- **THEN** the worksheet local state is reset to load the selected simulation's data
