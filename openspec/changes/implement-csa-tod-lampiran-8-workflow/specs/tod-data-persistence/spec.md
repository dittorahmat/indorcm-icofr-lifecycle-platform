## ADDED Requirements

### Requirement: TOD Evaluation Storage
The system SHALL persist Test of Design (TOD) evaluations performed by Line 2 in a dedicated database structure.

#### Scenario: Saving a TOD evaluation
- **WHEN** a Line 2 user submits the Lampiran 8 form
- **THEN** the system SHALL save the result to the `tod_evaluations` table
- **AND** the record SHALL include the `csaId`, `controlId`, the 8 evaluation criteria values, and the final conclusion.

### Requirement: TOD Conclusion Integration
The system SHALL allow retrieving the TOD conclusion to be displayed alongside the control in the review matrix.

#### Scenario: Viewing evaluation status
- **WHEN** the transposed matrix is rendered in `CSAPage`
- **THEN** each control row SHALL display its TOD status (e.g., Pending, Effective, Ineffective) based on the latest record in `tod_evaluations`.
