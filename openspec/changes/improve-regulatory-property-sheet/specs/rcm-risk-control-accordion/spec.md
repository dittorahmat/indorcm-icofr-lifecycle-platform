## ADDED Requirements

### Requirement: Accordion Control Grouping
The system SHALL organize control items within a risk group using an accordion UI pattern to improve information density management.

#### Scenario: Expanding control details
- **WHEN** user clicks on a control item
- **THEN** the system shall expand the accordion to display detailed control fields

### Requirement: Visual Differentiation of Control Types
The system SHALL visually differentiate control types (TLC, ELC, ITGC) using distinct border colors for the accordion header.

#### Scenario: Toggling control classification
- **WHEN** user changes control classification (TLC/ELC/ITGC)
- **THEN** the accordion border color shall update to match the assigned class color
