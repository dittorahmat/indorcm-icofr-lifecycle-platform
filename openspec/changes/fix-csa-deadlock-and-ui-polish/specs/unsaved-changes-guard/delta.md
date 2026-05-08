# DELTA: unsaved-changes-guard

## Requirements

### Requirement: CSA Assessment Dirty State Accuracy
The system SHALL accurately detect unsaved changes in the CSA Assessment form, regardless of whether it is a new assessment or an existing draft record.

#### Scenario: Modifying a draft assessment
- **GIVEN** an existing CSA draft record is loaded into the form
- **WHEN** the user modifies any verification point, remark, or metadata field
- **THEN** the `isDirty` state SHALL become true
- **AND** the navigation guard SHALL be active until the user saves the draft or signs off.
