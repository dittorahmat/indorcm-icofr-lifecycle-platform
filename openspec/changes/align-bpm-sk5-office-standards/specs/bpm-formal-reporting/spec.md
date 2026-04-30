## ADDED Requirements

### Requirement: Formal Document UI Layer
The BPM Editor SHALL feature a "Document View" mode that displays a standardized Header and Footer on the canvas, aligning with the official BUMN reporting style.

#### Scenario: Visualizing the formal layout
- **WHEN** user enables "Document View"
- **THEN** system MUST render a Header with Company Logo, Name, and Metadata (Sub-process, Year).
- **THEN** system MUST render a Footer with an Approval/Sign-off block.

### Requirement: Configurable Header and Footer
The Header (Logo, Company Name) and Footer (Sign-off signatories) SHALL be configurable via the global system settings.

#### Scenario: Setting custom logo
- **WHEN** user updates the logo in "Settings"
- **THEN** the BPM Document View MUST automatically reflect the new logo in the header.

### Requirement: Export to PDF/PNG
The system SHALL provide a feature to export the entire BPM diagram (including formal header/footer and swimlanes) as a high-quality PDF or PNG image.

#### Scenario: Exporting a diagram
- **WHEN** user clicks "Export to PDF"
- **THEN** system downloads a document-ready PDF file of the diagram with all regulatory elements included.
