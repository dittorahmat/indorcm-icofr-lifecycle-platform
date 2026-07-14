## ADDED Requirements

### Requirement: Calculate and Display Real-time CSA Completion Rate
The system SHALL dynamically calculate the Control Self-Assessment (CSA) completion rate for the active fiscal year. The rate SHALL be calculated as the percentage of controls that have completed their assessment (e.g., status is completed/validated) relative to the total number of active controls for that year.

#### Scenario: CSA completion rate calculation
- **WHEN** the dashboard page is loaded for the active fiscal year
- **THEN** the system fetches active controls for the active fiscal year and displays the computed completion rate in the Action Center and KPIs card

### Requirement: Calculate and Display Dynamic Remediation Velocity
The system SHALL dynamically calculate the average number of days taken to resolve or remediate open deficiencies for the active fiscal year.

#### Scenario: Remediation velocity calculation
- **WHEN** the dashboard page is loaded for the active fiscal year
- **THEN** the system fetches deficiency records, calculates the average age or resolution time of deficiencies, and displays it in the secondary metrics card

### Requirement: Calculate and Display Dynamic Line 2 Validation Rate
The system SHALL dynamically calculate the percentage of completed CSAs that have been validated by Line 2 (Lini 2) for the active fiscal year.

#### Scenario: Line 2 validation rate calculation
- **WHEN** the dashboard page is loaded for the active fiscal year
- **THEN** the system fetches assessment statuses, computes the validation percentage, and displays it in the secondary metrics card
