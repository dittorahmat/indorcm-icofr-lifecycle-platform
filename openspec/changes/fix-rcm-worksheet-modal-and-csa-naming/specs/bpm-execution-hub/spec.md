## ADDED Requirements

### Requirement: Configurable Initial Tab and State Isolation
The system SHALL allow setting the initial active tab of the Execution Hub (BPMModal) and MUST reset transient selection state (such as sampled transactions) upon modal closure.

#### Scenario: Opening Worksheet tab from BPM page
- **WHEN** the user clicks "Open RCM Worksheet" on a sub-process row
- **THEN** the Execution Hub SHALL open with the "worksheet" tab active by default
- **AND** the CSA tab SHALL remain in its default list view without residual transaction samples

#### Scenario: Closing Execution Hub cleans up residual state
- **WHEN** the user closes the Execution Hub modal
- **THEN** any selected transaction samples held in the modal state SHALL be cleared
- **AND** subsequent re-openings of the modal SHALL NOT automatically navigate into the CSA assessment form view
