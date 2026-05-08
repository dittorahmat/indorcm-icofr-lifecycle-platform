## ADDED Requirements

### Requirement: Static Sidebar Configuration
The application sidebar SHALL be static and non-collapsible on desktop viewports. The toggle button for collapsing the sidebar MUST be removed.

#### Scenario: Sidebar visibility
- **WHEN** user views the application on a desktop screen
- **THEN** the sidebar SHALL always be fully expanded.

### Requirement: Sidebar Aesthetic Standard
The sidebar background color SHALL be Skyblue (#87CEEB). Sidebar menu text SHALL be black and bold.

#### Scenario: Sidebar styling
- **WHEN** sidebar is rendered
- **THEN** background color MUST be `#87CEEB` and text SHALL use `font-bold` and `text-black`.

### Requirement: Global Scrolling Behavior
The application SHALL utilize a single global scrollbar located at the right edge of the viewport. Internal scrolling for sidebars and data grids MUST be disabled.

#### Scenario: Unified scroll navigation
- **WHEN** a page contains long content (long menu or large table)
- **THEN** the entire layout (including sidebar and content) SHALL move together via the global scrollbar.

### Requirement: Table Visual Standardization
All data tables SHALL have thickened borders (Excel-style) and use zebra striping (alternating grey and white background for rows).

#### Scenario: Zebra striping visibility
- **WHEN** a table is rendered with multiple rows
- **THEN** even-numbered rows SHALL have a light grey background (`bg-slate-100/50`) and odd rows SHALL be white.

### Requirement: RCM Inline Editing
The RCM grids SHALL support inline editing where clicking an "Edit" action inserts a new input row directly below the target row. Other rows SHALL be visually "frozen" (read-only/disabled) during this state.

#### Scenario: Inline edit activation
- **WHEN** user clicks "Edit" on an RCM row
- **THEN** a new row with input fields SHALL appear immediately below it and other rows MUST become non-interactive.
