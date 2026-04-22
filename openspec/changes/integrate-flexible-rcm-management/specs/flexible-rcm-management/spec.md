## ADDED Requirements

### Requirement: Integrated Risk Search and Creation
The system SHALL provide a unified interface in the BPM side panel to search existing risks and create new ones with specific metadata.

#### Scenario: Searching for an existing risk
- **WHEN** user types in the risk search bar in the BPM side panel
- **THEN** system SHALL show a filtered list of risks from the `rcms` table

#### Scenario: Creating a new risk with mandatory metadata
- **WHEN** user selects "+ Add New Risk" or presses Enter for a non-existent risk
- **THEN** system SHALL display a form with fields for Description, Fraud Indicator (Yes/No), and Risk Rating (Low/Medium/High)
- **THEN** system SHALL save the new risk to the `rcms` table upon submission

### Requirement: Integrated Control Search and Creation
The system SHALL provide a unified interface within each risk entry in the BPM side panel to search existing controls and create new ones.

#### Scenario: Creating a new control within a risk context
- **WHEN** user selects "+ Add New Control" under a specific risk
- **THEN** system SHALL display a form with fields for Control Name, Description, and Key Control Indicator (Yes/No)
- **THEN** system SHALL save the new control to the `controls` table and link it to the parent risk
