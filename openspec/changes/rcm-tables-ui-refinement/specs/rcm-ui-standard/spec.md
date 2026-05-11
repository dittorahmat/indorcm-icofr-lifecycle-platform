## ADDED Requirements

### Requirement: Standardized Zebra Striping Contrast
The RCM tables SHALL utilize a high-contrast zebra stripe pattern for even rows to enhance horizontal readability across many columns.

#### Scenario: Visual validation of row contrast
- **WHEN** the user views an RCM table (TLC, ITGC, or ELC)
- **THEN** every even row MUST have a background color of #A9A9A9

### Requirement: Single Global Horizontal Scroll
The system SHALL provide exactly one horizontal scrollbar for the matrix content area to prevent "scroll within scroll" confusion.

#### Scenario: Horizontal navigation ergonomics
- **WHEN** the user scrolls horizontally in any RCM matrix page
- **THEN** only the main content area scrollbar SHALL move
- **AND** the table header SHALL remain sticky at the top of the viewport

### Requirement: Flexible Table Component Wrapping
The base `Table` component SHALL provide an option to disable its internal overflow wrapper.

#### Scenario: Parent-managed scroll
- **WHEN** the `Table` component is rendered with the `noWrapper` prop set to true
- **THEN** the `div` wrapper with `overflow-auto` SHALL NOT be rendered
- **AND** the `table` element SHALL be rendered as a direct child or within the parent's layout structure
