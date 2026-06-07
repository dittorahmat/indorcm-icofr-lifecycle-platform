## MODIFIED Requirements

### Requirement: Stable Identity Generation
The system SHALL generate permanent, unique IDs for Risk and Control entities immediately upon creation (on-add) to ensure stable keys for React rendering.

#### Scenario: Adding a new risk
- **WHEN** user clicks "Tambah Risiko Baru"
- **THEN** the system SHALL immediately assign a unique, permanent riskId (e.g., "R-8digit") to the new entry
- **AND** this ID SHALL remain constant throughout the editing session

#### Scenario: Adding a new control to a risk group
- **WHEN** user clicks "Add Control" button in the Regulatory Property Sheet
- **THEN** the system SHALL immediately assign a unique, permanent controlId (e.g., "C-8digit") to the new entry
- **AND** this ID SHALL remain constant throughout the editing session
