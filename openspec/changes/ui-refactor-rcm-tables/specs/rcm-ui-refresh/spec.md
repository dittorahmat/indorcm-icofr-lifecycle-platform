## ADDED Requirements

### Requirement: Minimalist Zebra Row Separation
The system SHALL display data rows in RCM tables with alternating background colors: `bg-white` for even rows and `bg-slate-50/50` for odd rows.

#### Scenario: Verify alternating colors
- **WHEN** user views the RCM Matrix TLC/ELC/ITGC page
- **THEN** odd rows shall have a subtle `bg-slate-50/50` color and even rows shall be white.

### Requirement: Technical Column Grouping
The system SHALL visually group technical columns (IPO, Assertions) with a light background header highlight (`bg-indigo-50` for IPO, `bg-blue-50` for Assertions).

#### Scenario: Verify header grouping
- **WHEN** user views the RCM Matrix TLC page
- **THEN** header cells for IPO and Assertions columns shall have the designated group background colors.

### Requirement: Table Density Adjustment
The system SHALL increase font size of table cells to `text-xs` (12px) and add vertical padding of at least `p-2` or equivalent.

#### Scenario: Verify font and padding
- **WHEN** user inspects table cells
- **THEN** font size shall be 12px (text-xs) and row padding shall be increased to improve readability.
