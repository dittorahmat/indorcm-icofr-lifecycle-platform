## ADDED Requirements

### Requirement: Execution Hub RCM Tab Integration
The Execution Hub (BPMModal) SHALL integrate RCM Matrix views (Lampiran 5a, 5b, 5c) into its "RCM" tab without layout artifacts.

#### Scenario: Viewing RCM Tab in Execution Hub
- **WHEN** the user selects the "RCM" tab in the BPMModal
- **THEN** the system SHALL render the RCM TLC, ELC, and ITGC matrix components in `embedded` mode
- **AND** the application sidebar SHALL NOT be visible within the modal area.
