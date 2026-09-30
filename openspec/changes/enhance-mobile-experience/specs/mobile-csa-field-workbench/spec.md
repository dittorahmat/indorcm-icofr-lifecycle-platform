## Purpose

Enables field performers (Lini 1) and auditors to conduct Control Self-Assessments and capture evidence effectively on mobile devices.

## ADDED Requirements

### Requirement: Touch-First CSA Card Presentation
The system SHALL transform wide tabular CSA rows into self-contained touch-friendly cards on mobile viewports.

#### Scenario: Assessing controls on mobile
- **WHEN** user opens the CSA workbench on a mobile viewport
- **THEN** control records SHALL render as card units containing Control ID, status badges, frequency, and primary risk summary
- **AND** provide a prominent full-width action button to initiate or continue the assessment

### Requirement: Responsive Verification Bottom-Sheet Drawer
The system SHALL present the TOD 6-Pilar verification and assessment form inside a responsive sliding drawer on mobile viewports.

#### Scenario: Opening TOD verification on smartphone
- **WHEN** user taps to verify or assess a control on a mobile viewport
- **THEN** the form SHALL open in a bottom-sheet drawer with a sticky bottom action footer containing Save and Cancel buttons
- **AND** preserve all input fields and validations without clipping or nested scroll issues

### Requirement: Mobile Direct Photo and Evidence Capture
The system SHALL support mobile camera capture and responsive file selection when uploading supporting documentation in the field.

#### Scenario: Capturing physical evidence on-site
- **WHEN** user taps the evidence upload trigger from a mobile device
- **THEN** the system SHALL allow direct camera capture or photo selection
- **AND** display the uploaded attachment thumbnail with file size and status
