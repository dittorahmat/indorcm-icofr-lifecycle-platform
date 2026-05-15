## ADDED Requirements

### Requirement: Bi-directional Field Mapping
The system SHALL translate frontend-standardized field names to backend-specific database column names based on the RCM level (ELC, TLC, or ITGC) before submission to the API.

#### Scenario: Mapping for ELC Level
- **WHEN** a user saves an ELC control
- **THEN** the system SHALL map the frontend field `mappedControlName` to the backend field `name` and `mappedControlDescription` to `description`.

#### Scenario: Mapping for TLC/ITGC Level
- **WHEN** a user saves a TLC or ITGC control mapping
- **THEN** the system SHALL map the frontend field `mappedControlName` to the backend field `controlName` and `mappedControlDescription` to `controlDescription`.

### Requirement: Integrated Risk and Control Persistence
The system SHALL ensure that both Risk and Control data modified in the unified dialog are persisted to their respective backend tables.

#### Scenario: Save Risk Data in TLC/ITGC
- **WHEN** a user updates `riskDescription` or `riskRating` in the dialog for a TLC or ITGC item
- **THEN** the system MUST ensure these changes are saved to the `rcms` table, either through a multi-target update or an atomic batch operation on the backend.

### Requirement: Boolean State Normalization
The system SHALL normalize boolean UI states (switches) to the backend-expected string format for compliance flags during the submission process.

#### Scenario: IPO and Assertion Normalization
- **WHEN** a user toggles an IPO or Assertion switch in the dialog
- **THEN** the system MUST convert the boolean value to the specific string representation (e.g., 'Y'/'N') expected by the database schema.
