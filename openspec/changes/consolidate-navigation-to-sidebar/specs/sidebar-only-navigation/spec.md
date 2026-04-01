## MODIFIED Requirements

### Requirement: Sidebar Only Navigation
The system SHALL provide all application navigation links exclusively through the App Sidebar.

#### Scenario: Navigating to Import (Lini 2)
- **WHEN** a user with 'Line 2' role opens the Sidebar
- **THEN** they SHALL see an "Import" link under the "Planning & Risk" section.

#### Scenario: Header Minimalist State
- **WHEN** the system renders the Main Header
- **THEN** it SHALL NOT display any internal navigation links (e.g., Dashboard, CSA, etc.).
- **THEN** it SHALL NOT display a mobile navigation menu (Sheet).
