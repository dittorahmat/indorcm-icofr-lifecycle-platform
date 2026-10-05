## Purpose

Provides a responsive layout for the ICOFR Scoping editor that ensures immediate visibility and access to General Ledger accounts on mobile devices while maintaining full materiality parameter configurability.

## ADDED Requirements

### Requirement: Responsive default collapse of materiality parameters
The Scoping editor SHALL initialize the materiality parameters card in a collapsed state when accessed on a mobile viewport (< 768px), while keeping it expanded by default on desktop viewports (>= 768px).

#### Scenario: Mobile viewport load
- **WHEN** a user opens a scoping simulation on a viewport narrower than 768px
- **THEN** the materiality parameters card is collapsed by default and the GL Data Grid tabs are visible in the initial viewport without vertical scrolling

#### Scenario: Desktop viewport load
- **WHEN** a user opens a scoping simulation on a desktop viewport (>= 768px)
- **THEN** the materiality parameters sidebar card is expanded by default to the left of the GL Data Grid

### Requirement: Mobile parameter expansion toggle
The Scoping editor SHALL provide an accessible touch-friendly trigger button to toggle the visibility of the materiality parameters card on mobile viewports.

#### Scenario: User expands parameters on mobile
- **WHEN** a user taps the parameters toggle button on a mobile viewport
- **THEN** the materiality parameters card expands, allowing the user to review or update OM/PM benchmarks and haircuts

#### Scenario: User collapses parameters on mobile
- **WHEN** a user taps "Hide Parameters" or the close button on an expanded parameter card on mobile
- **THEN** the parameters card collapses, restoring unobstructed view of the GL Data Grid
