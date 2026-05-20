# rcm-risk-control-accordion Specification

## Purpose
TBD - created by archiving change fix-regulatory-sheet-flicker. Update Purpose after archive.

## Requirements

### Requirement: Accordion Control Grouping
The system SHALL organize control items within a risk group using an accordion UI pattern with stable identities to prevent unintended collapse during input.

#### Scenario: Expanding control details
- **WHEN** user clicks on a control item
- **THEN** the system SHALL expand the accordion to display detailed control fields
- **AND** it SHALL remain expanded while the user is typing in any input field within the accordion

### Requirement: Visual Differentiation of Control Types
The system SHALL visually differentiate control types (TLC, ELC, ITGC) using distinct border colors for the accordion header while maintaining a stable React key.

#### Scenario: Toggling control classification
- **WHEN** user changes control classification (TLC/ELC/ITGC)
- **THEN** the accordion border color SHALL update to match the assigned class color
- **AND** the component SHALL NOT re-mount (no flicker) during the classification change

### Requirement: Stable Identity Generation
The system SHALL generate permanent, unique IDs for Risk and Control entities immediately upon creation (on-add) to ensure stable keys for React rendering.

#### Scenario: Adding a new risk
- **WHEN** user clicks "Tambah Risiko Baru"
- **THEN** the system SHALL immediately assign a unique, permanent riskId (e.g., "R-8digit") to the new entry
- **AND** this ID SHALL remain constant throughout the editing session
