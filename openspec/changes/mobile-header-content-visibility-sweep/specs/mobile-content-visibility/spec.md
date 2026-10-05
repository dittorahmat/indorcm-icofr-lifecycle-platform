## Purpose

Responsive presentation contract ensuring page headers stay compact, filter walls collapse on mobile, numeric KPIs stay glanceable, and primary content is reachable within approximately one viewport of scroll on 320px/360px viewports without page-level horizontal scroll.

## ADDED Requirements

### Requirement: Compact page header on mobile
The shared page header SHALL render a compact layout on viewports narrower than 640px: the description is limited to one line and action buttons are arranged in a horizontally scrollable row rather than stacked full-width rows.

#### Scenario: Mobile header render
- **WHEN** a user opens any page using the shared header on a 360px viewport
- **THEN** the title, sidebar trigger, and badge fit in a compact block, the description does not wrap past one line, and all CTA buttons are reachable via horizontal scroll without pushing content below the fold

### Requirement: Filter walls collapse by default on mobile
Filter and parameter panels SHALL initialize collapsed on mobile viewports (< 768px) and expanded on desktop, with an accessible touch target (minimum 44px height) to expand or collapse them at any time. Explicit user toggles are preserved across viewport resizes.

#### Scenario: Mobile filter load
- **WHEN** a user opens BPM, CSA, Reports, or RCM list views on a mobile viewport
- **THEN** filter panels are collapsed and the primary list, grid, or matrix is visible in the initial viewport

#### Scenario: User toggles filter
- **WHEN** a user taps the filter toggle on mobile
- **THEN** the panel expands for editing and collapses again on demand, restoring the content view

### Requirement: KPIs stay glanceable on mobile
Numeric KPI blocks SHALL remain visible without interaction on mobile, densified to at most two columns (or a horizontal snap row for five or more items) instead of a single stacked column.

#### Scenario: Dashboard KPI load
- **WHEN** a user opens the Dashboard, WBS, Appendix10, or Audit portal on a 360px viewport
- **THEN** all KPI values are visible within a compact block without expanding anything

### Requirement: No page-level horizontal scroll
Wide tables and matrices SHALL scroll inside their own container on mobile; the page itself SHALL NOT scroll horizontally at 320px or 360px.

#### Scenario: Wide assertion table on BPM
- **WHEN** a user selects an FSLI and GL account on the BPM page on a mobile viewport
- **THEN** the 7-column Management Assertions table scrolls horizontally inside its card while the page remains fixed-width
