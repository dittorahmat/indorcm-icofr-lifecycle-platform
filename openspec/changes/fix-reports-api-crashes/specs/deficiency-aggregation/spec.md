## ADDED Requirements

### Requirement: Aggregate deficiency analysis
The system SHALL support combining multiple deficiencies into a single aggregate analysis to evaluate their combined impact on financial reporting (Lampiran 10).

#### Scenario: Creating an aggregate deficiency record
- **WHEN** user selects multiple deficiencies and clicks "Aggregate Analysis"
- **THEN** the system creates a new aggregate deficiency record with links to the selected deficiencies, specified rationale, and the calculated final severity

### Requirement: Deficiency status and severity management
The system SHALL maintain a real-time record of all identified deficiencies, allowing for updates to their status (Open, Remediated, Verified, Closed) and severity (CD, SD, MW) throughout the assessment period.

#### Scenario: Updating deficiency severity
- **WHEN** user updates a deficiency severity to "Material Weakness"
- **THEN** the overall ICOFR effectiveness is automatically recalculated as "Ineffective"
