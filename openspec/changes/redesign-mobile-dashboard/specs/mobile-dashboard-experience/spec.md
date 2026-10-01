## Purpose

Provides a clean, ergonomic, responsive, and executive-ready mobile dashboard experience for ICOFR practitioners and management across both portrait and landscape smartphone orientations.

## ADDED Requirements

### Requirement: Responsive Mobile Header Layout
The system SHALL display an un-truncated, non-overlapping header on mobile viewport widths (< 768px) and smartphone landscape orientations.

#### Scenario: Mobile viewport header items display without overlap
- **WHEN** user views the platform on a screen width below 768px
- **THEN** the sidebar toggle, brand icon and name, fiscal year dropdown, notification bell, and user avatar SHALL fit comfortably without overlapping each other or clipping badges.

#### Scenario: User role badge does not obscure avatar
- **WHEN** the user avatar displays the user's role badge (e.g. L1, L2, L3)
- **THEN** the role badge SHALL be positioned cleanly with sufficient margin and contrast without blocking the avatar's initials or overflowing the viewport border.

### Requirement: Mobile Orientation Adaptability
The system SHALL prevent desktop sidebar encroachment and layout breakage on mobile landscape devices.

#### Scenario: Smartphone in landscape orientation
- **WHEN** user rotates their mobile phone into landscape orientation (viewport height < 500px)
- **THEN** the layout SHALL treat the device as a mobile interface with collapsed sidebar, preserved touch padding, and without header/content overlapping.

### Requirement: Consolidated Mobile Executive Snapshot
The system SHALL provide a compact executive snapshot card on mobile that replaces oversized hero banners while preserving crucial lifecycle readiness metrics.

#### Scenario: Viewing readiness and KPIs on mobile
- **WHEN** a user opens the dashboard on a mobile screen
- **THEN** the readiness status, cycle year, active controls count, open deficiencies, and COSO coverage SHALL be viewable within the initial mobile viewport without truncation of titles or labels.

### Requirement: Complete SK-5 Lifecycle Stepper on Mobile
The system SHALL display the 6 mandatory ICOFR lifecycle phases (Perancangan, Implementasi, Evaluasi, Remediasi, Pelaporan, Asurans) in an interactive, horizontal swipeable or compact stepper format that prevents text truncation.

#### Scenario: Inspecting lifecycle progress on mobile
- **WHEN** user views the lifecycle progress section on a mobile viewport
- **THEN** all 6 phases SHALL be accessible and readable with clear visual status (completed, active, upcoming) without truncation of phase names.

### Requirement: Obstruction-Free AI Assistant Floating Action Button
The system SHALL position the floating AI assistant button (`AIFabButton`) such that it never obstructs interactive dashboard cards, bottom navigation items, or critical metrics.

#### Scenario: Scrolling mobile dashboard with AI FAB present
- **WHEN** user scrolls through the mobile dashboard
- **THEN** the AI FAB button SHALL maintain an elevated clearance above the bottom navigation bar and dashboard content cards with safe margins.
