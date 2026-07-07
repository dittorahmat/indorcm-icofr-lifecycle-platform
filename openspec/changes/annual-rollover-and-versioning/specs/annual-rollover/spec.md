## ADDED Requirements

### Requirement: Rollover / Clone ICOFR Data
The system MUST allow users to clone or rollover scoping, RCM, ELC, and ITGC configurations from a previous fiscal year (source year) to the selected fiscal year (target year) to serve as a baseline.

#### Scenario: Trigger rollover for empty year
- **WHEN** user selects a fiscal year that has no GL snapshots, simulations, or RCM mappings
- **THEN** system SHALL display a rollover prompt option to "Carry Forward / Copy from previous year"

#### Scenario: Copy RCM and Controls
- **WHEN** user initiates the rollover from source year 2024 to target year 2025
- **THEN** system SHALL copy all records from `rcms`, `controls`, `rcm_controls`, `bpm_processes`, and `bpm_diagrams` setting their year to 2025

#### Scenario: Carry forward Open Deficiencies
- **WHEN** rollover is executed
- **THEN** system SHALL copy only the active deficiencies (status = 'Open') and their corresponding active action plans to the target year, maintaining their links to the new controls
