## Purpose

Delivers a glanceable, executive-friendly, and action-oriented dashboard layout optimized for mobile screens.

## ADDED Requirements

### Requirement: Compact 2x2 Metric Scorecard
The system SHALL present key performance indicators in a compact responsive 2-column grid on mobile viewports.

#### Scenario: Viewing KPIs on mobile
- **WHEN** user loads the dashboard on a viewport narrower than 768px
- **THEN** the system SHALL arrange the cycle readiness, control count, deficiency count, and COSO coverage cards in a 2x2 grid
- **AND** maintain minimum 12px readable text with high visual contrast

### Requirement: Priority Placement for Action Center
The system SHALL display urgent action items and pending tasks above secondary analytical charts on mobile viewports.

#### Scenario: Mobile dashboard loading order
- **WHEN** user views the dashboard on mobile
- **THEN** the Action Center container SHALL render directly beneath the KPI cards
- **AND** analytical charts and COSO principle grids SHALL render beneath the action center

### Requirement: Mobile Analytical Tabbed View
The system SHALL allow users on mobile to switch between compliance charts and COSO matrices using tabs or collapsibles to prevent excessive vertical scrolling.

#### Scenario: Viewing detailed analysis on mobile
- **WHEN** user views compliance analytics on a mobile viewport
- **THEN** the system SHALL present segmented tab controls for chart views
- **AND** activate only the selected chart to preserve vertical viewport space
