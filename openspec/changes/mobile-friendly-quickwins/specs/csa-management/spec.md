## ADDED Requirements

### Requirement: Responsive Card Presentation for CSA Records
The system SHALL display CSA assessment records as stacked cards on mobile viewports (< 768px) and as a structured table on desktop viewports (>= 768px).

#### Scenario: Viewing CSA records on mobile viewport
- **WHEN** user views the CSA list on a screen narrower than 768px
- **THEN** the system SHALL render each CSA record as an interactive card displaying process title, unit, Lini 2 validation status, and action buttons
- **AND** the desktop table view SHALL be hidden to eliminate forced horizontal scrolling

#### Scenario: Interacting with CSA record card on mobile
- **WHEN** user taps a CSA record card or expand trigger on a mobile viewport
- **THEN** the card SHALL expand to display the detailed control review matrix, workflow history, and verification actions
