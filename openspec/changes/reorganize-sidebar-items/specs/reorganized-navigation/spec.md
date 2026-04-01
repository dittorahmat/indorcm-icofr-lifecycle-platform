## ADDED Requirements

### Requirement: MASTER Sidebar Group
The system SHALL display a "MASTER" navigation group at the top of the sidebar.

#### Scenario: MASTER group items
- **WHEN** the sidebar is rendered
- **THEN** the system SHALL show the following items under "MASTER":
    - Sync Financial Statement (Link to Import/Dashboard)
    - Select BPM (Link to Risk Control Matrix)
    - Config OM/PM (Link to Scoping & Materiality)

### Requirement: RCSA Sidebar Group
The system SHALL display an "RCSA" navigation group.

#### Scenario: RCSA group items
- **WHEN** the sidebar is rendered
- **THEN** the system SHALL show the following items under "RCSA":
    - Identifikasi Risiko (Link to Risk Control Matrix)
    - Control (Link to Risk Control Matrix)
    - Self Assessment (Link to CSA Workspace)

### Requirement: TOD/TOE Sidebar Group
The system SHALL display a "TOD/TOE" navigation group.

#### Scenario: TOD/TOE group items
- **WHEN** the sidebar is rendered
- **THEN** the system SHALL show the following items under "TOD/TOE":
    - Test Operasi Design (Link to Testing Workbench)
    - Test Operasi Efektivitas (Link to Testing Workbench)

### Requirement: Report Sidebar Group
The system SHALL display a "Report" navigation group containing links to regulatory appendices.

#### Scenario: Report group items
- **WHEN** the sidebar is rendered
- **THEN** the system SHALL show links for "Lampiran 1" through "Lampiran 11" (initially mapping to the consolidated Reports page).

### Requirement: AI Sidebar Group
The system SHALL display an "AI" navigation group.

#### Scenario: AI group items
- **WHEN** the sidebar is rendered
- **THEN** the system SHALL show the following items under "AI":
    - Anomaly Check
    - Financial Journal Check
    - Predictive Story Life
    - Continuous Improvement

### Requirement: User Sidebar Group
The system SHALL display a "User" navigation group.

#### Scenario: User group items
- **WHEN** the sidebar is rendered
- **THEN** the system SHALL show a "User Admin" item (Link to Settings/Users).
