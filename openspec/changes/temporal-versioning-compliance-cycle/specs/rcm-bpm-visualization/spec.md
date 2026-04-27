## ADDED Requirements

### Requirement: BPM Diagram Versioning
The system SHALL ensure that BPM diagrams are versioned by year, preventing changes in the current year from impacting previous years' diagrams.

#### Scenario: Editing a diagram in 2025
- **WHEN** user edits a BPM diagram in 2025
- **THEN** the change is saved ONLY for the 2025 version of that diagram
- **AND** the 2024 version remains unchanged
