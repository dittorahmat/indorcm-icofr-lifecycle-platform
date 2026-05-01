## ADDED Requirements

### Requirement: Multi-line Text Wrapping
The sidebar SHALL allow menu item text to wrap onto multiple lines when the label exceeds the available horizontal space of the sidebar.

#### Scenario: Long Indonesian Label Wrapping
- **WHEN** the sidebar is in expanded mode and a menu label (e.g., "Sinkronisasi Laporan Keuangan") exceeds the sidebar width
- **THEN** the text wraps to a new line and the menu button height increases to accommodate the text

### Requirement: Dynamic Button Height
The system SHALL adjust the height of `SidebarMenuButton` and `SidebarMenuSubButton` dynamically based on the amount of content (text) they contain.

#### Scenario: Variable Label Lengths
- **WHEN** multiple menu items have different label lengths
- **THEN** each button displays at a height that fits its specific text content without clipping

### Requirement: Icon Alignment
The system SHALL maintain the top-alignment of the menu icon relative to the first line of wrapped text.

#### Scenario: Wrapped Text Alignment
- **WHEN** a menu label wraps to two or more lines
- **THEN** the leading icon remains aligned with the top line of the text

### Requirement: Collapsed State Truncation
The system SHALL hide or truncate text content when the sidebar is in its collapsed (icon-only) state to prevent layout overflow.

#### Scenario: Sidebar Collapsed
- **WHEN** the user collapses the sidebar to icon mode
- **THEN** only the icons are visible and no wrapped text "leaks" from the hidden panel
