## ADDED Requirements

### Requirement: Mobile Vertical Card Presentation
The system SHALL provide a vertical card representation for each Risk Control Matrix item when accessed from mobile devices, preserving all regulatory fields accessible via inline expansion or modal sheet.

#### Scenario: Mobile RCM view activation
- **WHEN** the user views the RCM Matrix on a screen with width < 768px
- **THEN** the system SHALL render items using an institutional mobile card layout
- **AND** provide explicit action buttons for editing control details and inspecting line 2 validations
