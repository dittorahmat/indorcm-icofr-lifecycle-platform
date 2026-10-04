## ADDED Requirements

### Requirement: Line 1 field-focused Execution Hub
The system SHALL present a simplified Execution Hub to Line 1 users arriving from a CSA schedule, showing the CSA tab as the primary focus while hiding or collapsing non-CSA tabs (Worksheet, Sampling, RCM, Verification, Logs).

#### Scenario: Line 1 opens scheduled CSA from agenda
- **WHEN** a user with role Line 1 opens the Execution Hub with a schedule context on a narrow viewport
- **THEN** the system SHALL display the CSA tab content by default and SHALL NOT require navigating through Worksheet, Sampling, or RCM tabs to reach the CSA form

#### Scenario: Desktop and Line 2 behavior unchanged
- **WHEN** a Line 2 user or a desktop session without schedule context opens the Execution Hub
- **THEN** the system SHALL retain all six tabs with current behavior

### Requirement: Direct-to-form from schedule
The system SHALL skip the CSA History list when Line 1 opens the Execution Hub from a schedule and land directly on the assessment form (new or resumed draft).

#### Scenario: Scheduled task deep-link
- **WHEN** Line 1 taps Execute on an agenda item linked to a schedule
- **THEN** the system SHALL open the CSA form for that schedule context instead of the history list, with schedule identity visible in the header

### Requirement: Hide Line 2 actions on the Line 1 execution path
The system SHALL hide export and verification actions (Appendix 7A print, Excel export, TOD verification dialog entry) from the Line 1 CSA execution form while retaining Save Draft and Sign-off.

#### Scenario: Field form action bar
- **WHEN** Line 1 views the CSA execution form from a schedule
- **THEN** the system SHALL show Save Draft and Sign-off actions with 44px touch targets and SHALL NOT show Appendix 7A print or Excel export actions in that context
