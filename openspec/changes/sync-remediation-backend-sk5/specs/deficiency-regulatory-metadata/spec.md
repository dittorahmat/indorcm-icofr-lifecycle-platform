## ADDED Requirements

### Requirement: Deficiency Assessment Persistence
The system SHALL persist all attributes of a deficiency assessment, including Root Cause, Magnitude (value exposed to risk), and Likelihood.

#### Scenario: Update Deficiency Severity
- **WHEN** user completes the Degree of Deficiency (DoD) wizard for a specific deficiency
- **THEN** system saves the severity (CD, SD, MW) and its underlying assessment parameters to the database

### Requirement: Aggregate Deficiency Persistence
The system SHALL store aggregate deficiency analysis records as per Lampiran 10, including the list of linked deficiencies, total magnitude, and the conclusion rationale.

#### Scenario: Save Aggregate Analysis
- **WHEN** user submits an aggregate deficiency evaluation
- **THEN** system creates an `aggregate_deficiencies` record with links to all constituent deficiency IDs
