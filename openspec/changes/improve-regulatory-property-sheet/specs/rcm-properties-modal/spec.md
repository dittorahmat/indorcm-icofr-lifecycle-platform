## ADDED Requirements

### Requirement: Full-Screen Modal Dialog
The system SHALL display the regulatory property editor as a full-screen modal dialog instead of a side-slider sheet.

#### Scenario: Opening property editor
- **WHEN** user clicks on a diagram node
- **THEN** the regulatory properties modal shall cover the entire screen area

### Requirement: Responsive Dialog Design
The system SHALL ensure the modal is responsive and provides adequate padding for content readability.

#### Scenario: Dialog layout display
- **WHEN** user opens the property editor
- **THEN** the content layout shall use an 850px max-width container centered within the full-screen dialog
