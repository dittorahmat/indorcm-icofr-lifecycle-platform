## Purpose

Provides a mobile-first ergonomic navigation shell including global header trigger and thumb-zone bottom navigation bar.

## ADDED Requirements

### Requirement: Global Mobile Header Trigger
The system SHALL provide a persistent sidebar trigger button in the main application header visible on mobile viewports.

#### Scenario: Mobile user opens sidebar
- **WHEN** user views the platform on a viewport narrower than 768px (md breakpoint)
- **THEN** the system SHALL display a sidebar trigger button in the global header
- **AND** tapping the trigger SHALL open the navigation drawer sheet

### Requirement: Persistent Mobile Bottom Navigation Bar
The system SHALL display a fixed bottom navigation bar on mobile viewports providing one-tap access to core ICOFR workflows.

#### Scenario: Navigating via bottom bar
- **WHEN** user is on a mobile device
- **THEN** a bottom navigation bar SHALL be fixed at the bottom with actions for Dashboard, CSA Tasks, RCM Matrix, and Main Menu
- **AND** tapping an item SHALL navigate directly to the target route or toggle the menu drawer

### Requirement: Floating Widget Safe Area Clearance
The system SHALL position floating action buttons and chatbot triggers with proper bottom padding to prevent overlapping with the mobile bottom navigation bar.

#### Scenario: Interacting with AI button on mobile
- **WHEN** user views the application with the mobile bottom navigation active
- **THEN** floating buttons SHALL be positioned above the bottom bar with safe clearance
- **AND** tapping bottom navigation items SHALL not be obstructed by floating elements
