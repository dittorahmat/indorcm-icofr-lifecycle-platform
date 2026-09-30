## Purpose

Provides a responsive and touch-optimized interface for mobile and tablet devices across the application shell, top bar, and dense audit tables.

## ADDED Requirements

### Requirement: Compact Top Bar on Small Screens
The system SHALL adapt the `MainHeader` and `FiscalYearSelector` to fit viewports under 640px without horizontal overflow or overlapping action buttons.

#### Scenario: Viewing top bar on mobile phone
- **WHEN** user views the header on a screen with width less than 640px
- **THEN** the fiscal year selector SHALL display in a compact format showing the year digits without breaking onto multiple lines
- **AND** all interactive touch targets (sidebar trigger, notifications, profile) SHALL have a minimum touch target size of 44x44px

### Requirement: Scaled Page Header Typography
The system SHALL render page headings with reduced vertical height and margins on small screens to preserve viewport real estate.

#### Scenario: Navigating to page on mobile
- **WHEN** a user loads any view utilizing `PageHeader` on a screen narrower than 768px
- **THEN** the main heading title font SHALL scale to `text-xl` or `text-2xl` instead of `text-3xl`
- **AND** the bottom margin SHALL be reduced to prevent excessive whitespace above the main content
