# sidebar-workflow-badge Specification

## Purpose
TBD - created by archiving change remove-bpm-sidebar-badge. Update Purpose after archive.
## Requirements
### Requirement: No pending badge on BPM sidebar item
The system SHALL NOT render any workflow pending badge (number of pending actions) next to the "BPM & CSA" link in the sidebar menu.

#### Scenario: Verify sidebar menu has no pending badge count on BPM menu item
- **WHEN** the user views the sidebar menu
- **THEN** the "BPM & CSA" menu item is rendered without the WorkflowPendingBadge component

