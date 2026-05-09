## ADDED Requirements

### Requirement: Restore AI Analytics Hub
The system SHALL provide an AI Analytics Hub page containing the previously developed predictive analytics and monitoring mockups.

#### Scenario: Navigating to AI Analytics Hub
- **WHEN** user clicks on the "AI Analytics" link in the sidebar footer (Utility section)
- **THEN** system redirects the user to the `/ai-hub` page

#### Scenario: Visualizing AI Analytics Dashboard
- **WHEN** user is on the `/ai-hub` page
- **THEN** the system displays the `AIAnalyticsMockup` dashboard showing mock predictive and fraud detection data

### Requirement: Sidebar Utility Navigation
The system SHALL display "AI Analytics" in the sidebar footer group, placed directly above the "Settings" menu item.

#### Scenario: Sidebar AI Link Visibility
- **WHEN** the `AppSidebar` is rendered
- **THEN** an "AI Analytics" navigation item is visible in the Utility section, placed above "Settings"
