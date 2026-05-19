# remediation-tracking Specification

## Purpose
TBD - created by archiving change outlook-style-execution-hub. Update Purpose after archive.
## Requirements
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

### Requirement: AI-Enabled Remediation Inquiries
The system SHALL allow users to query action plans, deadlines, and deficiency statuses via the AI Assistant.

#### Scenario: Querying remediation deadlines
- **WHEN** user asks "What remediation plans are due next month?"
- **THEN** the AI SHALL call the relevant tool to retrieve `action_plans` with `dueDate` in the following month
- **AND** return a list of plans with their current status and severity

### Requirement: Lifecycle Phase Alignment
The system SHALL associate remediation activities primarily with the 'Remediasi' lifecycle stage.

#### Scenario: Remediation status influence on lifecycle
- **WHEN** the system evaluates the overall ICOFR progress
- **THEN** it SHALL use the status of action_plans to determine progress within the 'Remediasi' stage

