## ADDED Requirements

### Requirement: Destructive Action Confirmations
The system SHALL intercept destructive delete actions—specifically deleting Materiality Simulations and GL Snapshots—and require user confirmation via a modal dialog before the action is executed.

#### Scenario: User clicks delete simulation and cancels
- **WHEN** the user clicks the trash icon on a Materiality Simulation and clicks "Cancel" in the confirmation dialog
- **THEN** the system SHALL NOT delete the simulation and the modal SHALL close.

#### Scenario: User clicks delete simulation and confirms
- **WHEN** the user clicks the trash icon on a Materiality Simulation and clicks "Delete" in the confirmation dialog
- **THEN** the system SHALL execute the delete mutation, remove the simulation from the list, show a success toast, and close the modal.

#### Scenario: User clicks delete GL snapshot and cancels
- **WHEN** the user clicks the trash icon on a GL Snapshot and clicks "Cancel" in the confirmation dialog
- **THEN** the system SHALL NOT delete the snapshot and the modal SHALL close.

#### Scenario: User clicks delete GL snapshot and confirms
- **WHEN** the user clicks the trash icon on a GL Snapshot and clicks "Delete" in the confirmation dialog
- **THEN** the system SHALL execute the delete mutation, remove the snapshot from the list, show a success toast, and close the modal.

### Requirement: Standardized AlertDialog Style
The delete confirmation dialog SHALL use the Shadcn/UI `<AlertDialog>` component, featuring red styling for destructive triggers and full localization support for Indonesian and English.

#### Scenario: Displaying the AlertDialog in English
- **WHEN** the user language is set to English and a delete modal is triggered
- **THEN** the dialog title, description, Cancel, and Delete buttons SHALL display in English.

#### Scenario: Displaying the AlertDialog in Indonesian
- **WHEN** the user language is set to Indonesian and a delete modal is triggered
- **THEN** the dialog title, description, Cancel, and Delete buttons SHALL display in Indonesian.
