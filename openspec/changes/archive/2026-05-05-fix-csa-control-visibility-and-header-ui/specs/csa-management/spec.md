## ADDED Requirements

### Requirement: Case-Insensitive Control Filtering
The system SHALL retrieve and display controls in the CSA Assessment and Worksheet tabs regardless of text casing in the Sub-Process name.

#### Scenario: Searching for controls by name
- **WHEN** the system filters controls for a specific Sub-Process (e.g., "Penerimaan setoran tunai")
- **THEN** it SHALL include controls associated with names like "Penerimaan Setoran Tunai" or "PENERIMAAN SETORAN TUNAI"
- **AND** it SHALL prioritize matching by `bpmProcessId` if available, using the name match as a robust fallback
