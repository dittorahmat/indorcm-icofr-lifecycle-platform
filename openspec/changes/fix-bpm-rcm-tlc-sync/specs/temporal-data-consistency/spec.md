## ADDED Requirements

### Requirement: Temporal Alignment of Regulatory Data
The system SHALL ensure that all Risks (rcms) and Controls created or synced via the BPM Editor are associated with the specific fiscal year of the diagram.

#### Scenario: Syncing new risks and controls
- **WHEN** the user saves a diagram for year 2026 in the BPM Editor
- **THEN** the system MUST set the `year` field to 2026 for all newly created `rcms` and `controls` records
- **AND** it MUST update existing linked records to match the diagram's year if they differ or are null
