## ADDED Requirements

### Requirement: CSA Result Options Redefinition
The system SHALL provide "High", "Medium", and "Low" as the only options for the "Is the control operating effectively?" question in the CSA Workspace.

#### Scenario: Display Rating Options
- **WHEN** a user opens a Control Assessment Card in the CSA Workspace
- **THEN** the system SHALL show three radio buttons labeled "High", "Medium", and "Low".

### Requirement: CSA Visual Coding
The system SHALL apply specific visual styles to each CSA rating option to indicate its severity or status.

#### Scenario: Color-Coded Options
- **WHEN** the CSA rating options are displayed
- **THEN** the "High" option SHALL have a red background, "Medium" SHALL have a yellow background, and "Low" SHALL have a green background.

### Requirement: Data Integrity for Rating
The system SHALL ensure that only the redefined rating values are persisted in the database.

#### Scenario: Persisting High Rating
- **WHEN** a user submits a CSA with "High" selected
- **THEN** the system SHALL save the result as "High" and trigger any related deficiency notifications or query updates.
