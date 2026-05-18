## MODIFIED Requirements

### Requirement: Print PDF Functionality
The system SHALL provide a "Print / Export PDF" button on the `VerificationDesignPage` that triggers the browser's native print dialog. The print layout MUST be formatted for landscape, ensure all columns fit on the page by aggressively scaling down or text-wrapping, and hide the main application header and navigation sidebars to resemble a formal document.

#### Scenario: Clicking Print
- **WHEN** the user clicks the "Print / Export PDF" button
- **THEN** the browser print dialog opens, displaying the table fully scaled to fit horizontally, with the `MainHeader` and sidebars completely hidden.
