## ADDED Requirements

### Requirement: Severity-Based Visual Accents
The system SHALL display Remediasi activities with visual accents representing their severity levels.

#### Scenario: Visual status of Material Weakness (MW)
- **WHEN** a Remediasi activity has severity 'Material Weakness'
- **THEN** it SHALL be displayed with a thick Black border and a warning icon (⚠️) in the calendar

### Requirement: Mandatory Rescheduling Justification
The system SHALL require a text justification whenever a Remediasi target date is changed.

#### Scenario: Rescheduling an activity
- **WHEN** user moves a Remediasi activity to a new date
- **THEN** system SHALL prompt for a "Reason for Rescheduling" and store it in the audit log
