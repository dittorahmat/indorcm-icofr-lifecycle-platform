## ADDED Requirements

### Requirement: Manual Sample Addition
The system SHALL provide a mechanism for users to manually add sample rows to the CSA assessment workspace when digital transaction data is unavailable.

#### Scenario: User clicks Add Manual Sample
- **WHEN** the user clicks the "Add Manual Sample" button in the CSA Tab
- **THEN** a new blank sample row is appended to the Summary Status Matrix

### Requirement: Editable Sample Reference
The system SHALL allow users to edit the "Sample Reference" field for any row in the CSA Summary Status Matrix, whether it was auto-populated or manually added.

#### Scenario: User edits sample reference
- **WHEN** the user types in the "Sample Reference" input field of a specific row
- **THEN** the value is updated in real-time across both the Summary Matrix and the Detailed Verification table

### Requirement: Grouped Verification View
The system SHALL organize the "Detailed Verification & Evidence" table by grouping related control points under their respective Sample Reference header.

#### Scenario: Visualization of multiple controls per sample
- **WHEN** a sample has multiple linked controls (risks)
- **THEN** the Detailed Verification table SHALL display the Sample Reference once as a header or primary column, with all associated controls listed sequentially under it
