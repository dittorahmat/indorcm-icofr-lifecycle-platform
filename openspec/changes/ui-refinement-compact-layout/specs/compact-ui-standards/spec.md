## ADDED Requirements

### Requirement: Static Non-Collapsible Sidebar
The application SHALL feature a static, non-collapsible sidebar in desktop views (width > 768px). The toggle trigger SHALL be removed.

#### Scenario: Persistent Sidebar Visibility
- **WHEN** user views the application on a desktop screen
- **THEN** the sidebar remains visible and cannot be collapsed by the user

### Requirement: Compact Sidebar Typography
The sidebar SHALL use high-density typography. Main menu items SHALL use a font size of 11px, and group labels SHALL use 9px.

#### Scenario: Visual Verification of Sidebar Density
- **WHEN** user views the sidebar menu
- **THEN** menu labels appear smaller than standard body text (12px-14px) and more items are visible vertically

### Requirement: High-Density RCM Table Typography
The RCM matrix tables (TLC, ELC, ITGC) SHALL use a uniform font size of 10px for all content, including headers, cell text, and input/select fields.

#### Scenario: Uniform Table Density
- **WHEN** user views the RCM Matrix table
- **THEN** all text within the table area is rendered at 10px size

### Requirement: Cell Edit Indicator
The RCM matrix tables SHALL provide immediate visual feedback when a cell value has been modified from its original fetched state.

#### Scenario: Highlighting Unsaved Changes
- **WHEN** user changes the text in a 'Control Name' cell
- **THEN** a small visual indicator (e.g., a blue border-right or dot icon) appears within that cell to signal an unsaved change

### Requirement: Unified Vertical Scrolling
The RCM pages SHALL feature a single vertical scrollbar that manages both the page content and the table rows, preventing "scrollbar nesting" (nested overflow).

#### Scenario: Smooth Table Scrolling
- **WHEN** user scrolls vertically on an RCM page
- **THEN** only the primary scrollbar responds, and the table headers remain sticky to the top of the table container
