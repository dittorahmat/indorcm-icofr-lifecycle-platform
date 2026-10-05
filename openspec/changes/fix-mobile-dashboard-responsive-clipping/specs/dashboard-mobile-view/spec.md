## Purpose

Ensures the executive ICOFR dashboard renders responsively without horizontal clipping, truncation of critical badges, or overflow breakage on mobile devices across 320px to 390px viewports.

## ADDED Requirements

### Requirement: Full Mobile Viewport Containment
The Dashboard page and its layout shell SHALL contain all visual elements within the device screen width without causing uncontained horizontal page overflow or clipping on viewports from 320px to 768px.

#### Scenario: User opens dashboard on 360px mobile viewport
- **WHEN** user views the Dashboard on a mobile viewport of 360px width
- **THEN** the root layout does not hard-clip the right edge of cards, charts, or headers
- **THEN** all cards span cleanly without horizontal page scrollbars

### Requirement: Responsive Compliance Charts
The compliance analytics charts SHALL scale down gracefully or provide isolated touch-pan scroll containers without breaking parent layout boundaries.

#### Scenario: Viewing Bar Chart on narrow mobile screen
- **WHEN** user views the "Controls per Process" bar chart on a screen under 640px
- **THEN** the chart container renders within its card boundaries without pushing the card wider than viewport width
- **THEN** all process bars remain legible and reachable via smooth horizontal touch scrolling if data points exceed screen width

#### Scenario: Viewing Deficiencies Donut Chart on mobile screen
- **WHEN** user views the "Findings by Severity" pie/donut chart on a screen under 640px
- **THEN** the donut chart is centered symmetrically (`cx="50%"`, `cy="50%"`) and not cut off on the right edge
- **THEN** the central deficiency counter remains fully visible and legible

### Requirement: Adaptive COSO Coverage Grid
The 17 COSO Principles Coverage grid SHALL adapt its column count dynamically to fit narrow mobile viewports.

#### Scenario: Viewing COSO principles grid on mobile screen
- **WHEN** user inspects the COSO principles grid on a mobile device under 640px
- **THEN** the principle tiles wrap cleanly into responsive columns without tiles being sliced or hidden at the right screen boundary
- **THEN** each principle tile displays its code and control count with full visibility

### Requirement: Truncation-Resistant Action Center and Stepper
All action items and lifecycle stepper elements SHALL preserve their status indicators, badges, and completion values without pushing them off-screen.

#### Scenario: Action Center with lengthy descriptions
- **WHEN** an action card contains a multi-word descriptive text on mobile
- **THEN** the description text truncates or wraps safely within `min-w-0 flex-1`
- **THEN** the action badge, count, and completion percentage remain fully visible and aligned on the right side
