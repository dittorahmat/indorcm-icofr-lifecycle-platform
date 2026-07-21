## ADDED Requirements

### Requirement: BPM Code Input and Suggestion on Creation
The system SHALL provide a "BPM Code" text input field in the Create Process dialog. If a BPM process with a similar name already exists, the system SHALL prefill/suggest the existing process's BPM Code.

#### Scenario: Prefilling BPM Code for process with duplicate/similar name
- **WHEN** the user types a process name in the "+ Create Process" dialog
- **THEN** the client SHALL check existing processes for matching names
- **AND** it SHALL suggest or prefill the matching process's `bpmCode` in the code input field.

### Requirement: Automatic Generation of Sequential IDs
The system SHALL automatically generate sequential IDs for new risks (prefix `R-[bpmCode]-[0001-9999]`) and controls (prefix `C-[bpmCode]-[0001-9999]`) added in the BPM Editor based on the parent process's `bpmCode` and the highest sequence number currently in use.

#### Scenario: Dragging/Creating new Risk and Control pair in editor
- **WHEN** the user creates a new Risk and Control pair in the BPM Editor
- **THEN** the system SHALL compute the next sequential ID by querying the existing risk and control codes in the database/workspace
- **AND** it SHALL prefill the ID fields with the next sequential value (e.g. `R-ACCT-0001`, `C-ACCT-0001`).

### Requirement: Manual ID Override and Uniqueness Validation
The system SHALL allow users to manually override the suggested structured IDs in the Property Sheet (`RegulatoryPropertySheet`) while validating that the resulting IDs are unique.

#### Scenario: Modifying ID manually in Property Sheet
- **WHEN** the user edits the Risk ID or Control ID textbox in the Property Sheet
- **THEN** the system SHALL allow any alphanumeric and custom character string (e.g. `R-ACCT-0001-A`)
- **AND WHEN** the diagram is saved
- **THEN** the backend SHALL validate that the new IDs do not conflict with existing records.
