## ADDED Requirements

### Requirement: Uniform RCM Table Typography and Styling
The system SHALL render all RCM matrix tables (TLC, ELC, ITGC) with standardized typographic scale, clear two-tier font weights (semibold for headers/identifiers and normal/medium for descriptions), solid non-blurred sticky headers, and consistent tabular contrast.

#### Scenario: Rendering RCM matrix tables
- **WHEN** the user navigates to TLC, ELC, or ITGC matrix views
- **THEN** table column headers SHALL render with solid backgrounds without backdrop blur
- **AND** data cell text SHALL have a minimum font size of 12px with high-contrast text color
- **AND** control descriptions SHALL NOT use italic styling to ensure maximum legibility for audit documentation
- **AND** container elements SHALL use clean institutional corner radii (maximum rounded-lg) rather than oversized pill cards
