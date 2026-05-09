## ADDED Requirements

### Requirement: Localized BPM Labels
The system SHALL display BPM diagram element labels and descriptions in the currently selected language.

#### Scenario: Viewing BPM in EN
- **WHEN** the language is set to English and a BPM diagram is opened
- **THEN** all node labels (Activity, Risk, Control) SHALL be displayed in English

### Requirement: BPM Unsaved Changes Guard
The system SHALL prevent users from leaving the BPM Editor if there are unsaved changes to the diagram layout or metadata.

#### Scenario: Closing BPM Editor with changes
- **WHEN** the user has moved a node in the BPM Editor and attempts to close the editor
- **THEN** the system SHALL display an unsaved changes confirmation dialog
