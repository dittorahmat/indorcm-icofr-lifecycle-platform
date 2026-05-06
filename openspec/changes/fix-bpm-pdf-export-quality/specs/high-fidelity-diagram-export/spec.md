## ADDED Requirements

### Requirement: Capturing High-Resolution Canvas
The system SHALL capture the entire React Flow diagram as a high-resolution PNG image, preserving all CSS styles, background colors, and SVG edge paths.

#### Scenario: Successful image capture
- **WHEN** user initiates the export process
- **THEN** system generates a Base64 encoded PNG representing the current diagram state

### Requirement: Auto-Scaling for A4 Documents
The system SHALL automatically scale the captured diagram to fit within a standard A4 page (210mm x 297mm), maintaining the original aspect ratio.

#### Scenario: Diagram fits on page
- **WHEN** a wide diagram is exported
- **THEN** system uses landscape orientation and scales the image to 100% page width

### Requirement: Export Loading State
The system SHALL display a visual loading indicator while the snapshot is being processed and the PDF is being generated.

#### Scenario: Loading indicator visibility
- **WHEN** export starts
- **THEN** system shows "Generating PDF..." overlay until the file is ready for download
