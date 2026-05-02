## ADDED Requirements

### Requirement: Multi-Ritual Scheduling
The system SHALL allow scheduling for the following ICOFR activities: CSA, TOE, TOD, Review Scoping, RCM Update, SOC Evaluation, Investee Monitoring, and Annual Sign-off.

#### Scenario: Creating a new schedule
- **WHEN** Admin selects "Review Scoping" from the scheduling dialog
- **THEN** system SHALL allow setting a planned date and reminder for this activity

### Requirement: Configurable Reminders
The system SHALL support configurable reminder intervals including minutes, hours, days, and months.

#### Scenario: Setting a day-based reminder
- **WHEN** user selects "3" and "Days" in the reminder configuration
- **THEN** system SHALL store this configuration in JSONB format linked to the schedule
