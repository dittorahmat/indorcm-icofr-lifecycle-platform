## ADDED Requirements

### Requirement: Remove Redundant UI Elements
The system MUST remove the Pin/Unpin sidebar control from the top navigation header.

#### Scenario: Verify header layout
- **WHEN** user views the header
- **THEN** the Pin/Unpin button is not rendered.

### Requirement: Consistent Table Row Styling
The RCM data tables (TLC, ELC, ITGC) MUST implement alternating row background colors (zebra-striping) for improved legibility.

#### Scenario: Verify zebra-striping on RCM pages
- **WHEN** user views the RCM tables
- **THEN** every other row has a slightly darker slate background color (slate-50) compared to the base white rows.