## ADDED Requirements

### Requirement: OM Percentage Input Field
The system SHALL provide a numerical input field labeled "% OM (Overall Materiality)" within the Materiality Calculation form.

#### Scenario: Manual percentage adjustment
- **WHEN** the user enters a new value in the "% OM" field (e.g., 1%)
- **THEN** the system SHALL immediately update the calculated Overall Materiality (OM) and Performance Materiality (PM) values.

### Requirement: Default Value
The system SHALL default the "% OM" value to 5% (consistent with profit-based benchmarks).

#### Scenario: Form initialization
- **WHEN** the Scoping page is first loaded
- **THEN** the "% OM" field SHALL show 5 by default.

### Requirement: Value Validation
The system SHALL validate that the "% OM" value is between 0 and 100.

#### Scenario: Invalid input
- **WHEN** the user enters a value greater than 100 or less than 0
- **THEN** the system SHALL display a validation error and prevent saving.
