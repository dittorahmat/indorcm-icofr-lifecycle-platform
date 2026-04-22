## ADDED Requirements

### Requirement: Searchable Linking UI
The BPM Editor side panel SHALL provide search inputs within the Risk and Control selection areas to filter large datasets.

#### Scenario: Filter controls by code
- **WHEN** user types "P2P" in the control search box
- **THEN** only controls containing "P2P" SHALL be visible in the selection list.

### Requirement: Enforced Library Selection
The system SHALL NOT allow users to manually type a risk description in the BPM Editor; it MUST be selected from the standardized Risk Library.

#### Scenario: Add risk to activity
- **WHEN** user clicks "+ Add Risk"
- **THEN** the Risk Library Lookup dialog SHALL open.
