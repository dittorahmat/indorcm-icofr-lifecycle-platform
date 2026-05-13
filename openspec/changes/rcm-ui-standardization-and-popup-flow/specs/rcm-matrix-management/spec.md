# rcm-matrix-management Specification (Delta)

## Purpose
This specification updates the requirements for RCM matrix data management to support the transition from inline grid editing to a safe popup-driven workflow with enhanced visual hierarchy.

## Requirements

### Requirement: Transition to Popup Editing
The system SHALL discontinue inline editing for RCM matrices (ELC, TLC, ITGC) in favor of a centralized dialog-based approach.

#### Scenario: Edit Action Access
- **WHEN** the user is viewing an RCM matrix
- **THEN** the edit icon (Pencil) MUST be present in a sticky column at the start of each row.

### Requirement: Enhanced Navigation Context
The system SHALL ensure that large-scale RCM matrices maintain clear context regardless of scroll position.

#### Scenario: Grouped Context
- **THEN** the system MUST display category-level headers (e.g., Process/Cycle titles) that break the row flow to provide a visual anchor for the data below.

### Requirement: Data Safety Integration
The system SHALL ensure all RCM modifications are protected from accidental navigation.

#### Scenario: Dialog Interruption
- **WHEN** a user has modified fields in the RCM Edit Dialog and attempts to close it without saving or navigates away
- **THEN** the system MUST trigger the `unsaved-changes-guard` prompt.
