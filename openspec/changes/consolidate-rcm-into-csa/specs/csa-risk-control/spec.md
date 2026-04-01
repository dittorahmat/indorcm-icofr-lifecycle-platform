## ADDED Requirements

### Requirement: Integrated Risk Control Tab in CSA
The CSA Workspace SHALL include a "Risk Control" tab that displays the complete Risk Control Matrix (RCM) for in-scope processes.

#### Scenario: Navigating to Risk Control
- **WHEN** a user opens the CSA Workspace
- **THEN** they SHALL see three tabs: "Pending Action", "Completed History", and "Risk Control".

#### Scenario: View RCM in CSA
- **WHEN** the "Risk Control" tab is active
- **THEN** the system SHALL display the RCM Matrix currently found in `/rcm`, including the ability to search, view BPM flows, and add new processes/controls (for Lini 2).

## REMOVED Requirements

### Requirement: Global RCM Navigation
**Reason**: Functionality is now consolidated within the CSA Workspace.
**Migration**: Users SHALL access RCM data via the "Risk Control" tab in the CSA menu.

#### Scenario: Header Cleanup
- **WHEN** the system renders the Main Header
- **THEN** it SHALL NOT include the "RCM" link.

#### Scenario: Sidebar Cleanup
- **WHEN** the system renders the App Sidebar
- **THEN** it SHALL NOT include "RCM & BPM" or "Change Log" items.
