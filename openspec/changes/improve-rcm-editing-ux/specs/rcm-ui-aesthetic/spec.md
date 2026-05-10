## ADDED Requirements

### Requirement: Modernized Table Readability
The system SHALL display RCM tables without zebra-striping, using subtle row separators (`border-b`) and interactive row highlights (`hover:bg-slate-50/50`) to improve legibility.

#### Scenario: Visual table scan
- **WHEN** user views the RCM table
- **THEN** rows are clearly separated by borders instead of background colors
- **AND** user can identify active row via hover highlight

### Requirement: Unified RCM Header
The system SHALL display a standardized header across RCM pages (TLC, ITGC, ELC) with consistent placement of search, filters, and metadata.

#### Scenario: Header layout consistency
- **WHEN** user navigates between TLC, ITGC, and ELC pages
- **THEN** header elements maintain consistent positioning and styling
