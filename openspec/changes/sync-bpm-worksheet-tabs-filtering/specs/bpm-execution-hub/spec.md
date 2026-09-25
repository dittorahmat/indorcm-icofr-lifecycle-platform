## ADDED Requirements

### Requirement: Execution Hub Multi-Tab Context Scoping
The system SHALL strictly isolate and scope all data presented within the tabs of the Execution Hub (BPMModal) to match the selected BPM Process (`bpmProcessId`), Account (`noGL`), and Fiscal Working Year (`workingYear`).

#### Scenario: Opening Verification Design in Execution Hub
- **WHEN** the user navigates to the "Verification Design" tab inside the Execution Hub
- **THEN** the client SHALL send `bpmProcessId` and the active fiscal `year` as query parameters
- **AND** the backend API `/api/rcm-matrix/verification-design` SHALL only return controls and TOD evaluations linked to the specified `bpmProcessId` and effective period
- **AND** controls from other business processes SHALL NOT be displayed.

#### Scenario: Scoping Worksheet by Fiscal Working Year
- **WHEN** the user opens the "Worksheet" tab inside the Execution Hub
- **THEN** the client SHALL fetch controls passing the active `workingYear`
- **AND** only controls valid or active for that fiscal year, linked to the `bpmProcessId` or `noGL`, SHALL be displayed in the matrix.

#### Scenario: Scoping RCM TLC and ITGC Matrices
- **WHEN** the user opens the "RCM" tab inside the Execution Hub
- **THEN** the TLC Matrix SHALL filter data by the specified `bpmProcessId`, `noGL`, and fiscal `year`
- **AND** the ITGC Matrix SHALL be scoped to the active fiscal `year`.

#### Scenario: Scoping Historical Change Logs
- **WHEN** the user opens the "Logs" tab inside the Execution Hub
- **THEN** the system SHALL display audit change logs relevant to the current account and sub-process context for the active or relevant fiscal periods.
