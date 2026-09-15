## ADDED Requirements

### Requirement: System-Generated CSA Reference Code
The system SHALL automatically generate a standardized, unique Reference Code for each CSA assessment following the formula CSA-{BPM_CODE}-{YEAR}-{PERIOD}.

#### Scenario: Generating reference code with existing BPM code
- **WHEN** a user initiates or views a CSA assessment for a process with BPM code "FIN-01" in year 2025 for period "Q1"
- **THEN** the system SHALL display and record the reference code as "CSA-FIN01-2025-Q1"

#### Scenario: Fallback reference code generation when BPM code is missing
- **WHEN** a user initiates a CSA assessment for a process lacking a bpmCode
- **THEN** the system SHALL fallback to using the GL account number (e.g., "CSA-GL110100-2025-Q1") or truncated process ID (e.g., "CSA-PROC-A8F2-2025-Q1")

### Requirement: Structured Period Selector
The system SHALL constrain CSA assessment period selection to standardized quarters/periods tied to the active working fiscal year.

#### Scenario: Selecting assessment period
- **WHEN** a user creates or edits a CSA assessment
- **THEN** the period selection SHALL be provided via a structured selector supporting "Q1", "Q2", "Q3", and "Q4 / Annual"
- **AND** the assessment year SHALL automatically bind to the active cycle year without allowing arbitrary free-text period input
