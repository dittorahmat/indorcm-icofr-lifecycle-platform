## ADDED Requirements

### Requirement: Granular Source Filtering on Deficiency Board
The system SHALL allow users on the Deficiency Board (`/deficiencies`) to filter deficiency records by their granular origin across the Three Lines Model.

#### Scenario: User filters by CSA Ineffective
- **WHEN** user selects the 'CSA Ineffective' filter
- **THEN** only deficiencies originating from 'Lini 1 - CSA' SHALL be displayed in the Kanban board columns

#### Scenario: User filters by TOD Review
- **WHEN** user selects the 'TOD Review' filter
- **THEN** only deficiencies originating from 'Lini 2 - TOD Review' SHALL be displayed in the Kanban board columns

#### Scenario: User filters by TOE Review
- **WHEN** user selects the 'TOE Review' filter
- **THEN** only deficiencies originating from 'Lini 2 - CSA Validation' or 'Lini 2 - TOE Review' SHALL be displayed in the Kanban board columns

#### Scenario: User filters by External / Internal Audit
- **WHEN** user selects the 'Audit' filter
- **THEN** only deficiencies originating from 'Lini 3 - Audit' SHALL be displayed in the Kanban board columns

#### Scenario: User selects All Sources
- **WHEN** user selects the 'All' filter
- **THEN** all deficiencies regardless of source SHALL be displayed

### Requirement: Explicit Origin Tagging on Deficiency Cards
The system SHALL display an explicit and visually distinct source flag badge on each deficiency card indicating the exact evaluation source.

#### Scenario: Card displays source badge
- **WHEN** a deficiency card is rendered
- **THEN** it SHALL display a dedicated badge containing the specific origin label (e.g. CSA Ineffective, TOD Review, TOE Review, Audit) with institutional styling (no sub-12px font, enterprise rounded corners).
