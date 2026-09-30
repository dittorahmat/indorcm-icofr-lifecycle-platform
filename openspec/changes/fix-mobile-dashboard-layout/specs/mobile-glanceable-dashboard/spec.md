## Purpose

Delivers a glanceable, executive-friendly, and action-oriented dashboard layout optimized for mobile screens.

## ADDED Requirements

### Requirement: Non-Overlapping Lifecycle Stepper
The system SHALL display the ICOFR 6-stage lifecycle progress in a mobile-adaptive format that prevents text overlapping and clipping on screens narrower than 768px.

#### Scenario: Mobile lifecycle view
- **WHEN** user views the dashboard on a mobile screen (<768px)
- **THEN** the lifecycle stepper SHALL render the active stage clearly with a linear progress bar and stage count
- **AND** prevent text collisions between adjacent stage labels

### Requirement: Zero Horizontal Page Leakage
The system SHALL strictly constrain all dashboard cards, headers, and charts within the viewport width without causing horizontal window scroll.

#### Scenario: Viewport boundary constraint
- **WHEN** the dashboard renders on a 360px to 390px mobile viewport
- **THEN** the entire layout width SHALL equal 100% of the viewport
- **AND** all metric cards and Recharts elements SHALL remain completely visible without right-margin clipping
