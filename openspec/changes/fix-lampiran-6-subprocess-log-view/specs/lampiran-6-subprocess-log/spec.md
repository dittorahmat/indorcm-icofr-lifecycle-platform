## Purpose

Enables viewing and filtering of approved business process and control change logs (Lampiran 6) within the context of a specific Sub-Process and BPM Diagram.

## ADDED Requirements

### Requirement: Sub-process Scoped Change Log Retrieval
The system SHALL display change history in the BPM Modal filtered by the active business sub-process or BPM process ID instead of GL account numbers.

#### Scenario: User opens Lampiran 6 tab in BPM modal
- **WHEN** user selects the "Log Perubahan" (Lampiran 6) tab within the BPM Modal for a specific sub-process
- **THEN** the system retrieves and displays change logs whose before/after snapshot matches the active sub-process name or BPM process ID

#### Scenario: Filtering by fiscal year
- **WHEN** user navigates the BPM modal with an active working year (e.g., 2026)
- **THEN** only change logs matching the specified year (or all years if year is unspecified) are displayed

### Requirement: Standardized Lampiran 6 Metadata Presentation
The system SHALL present change log entries adhering to the 11 regulatory columns prescribed by SK-5/DKU.MBU/11/2024 Lampiran 6.

#### Scenario: Displaying historical control modification
- **WHEN** an approved change to a control in the sub-process is rendered
- **THEN** the table displays company name, business process, sub-process, report date, owner, before description, after description, before reference, after reference, and effective date

#### Scenario: Empty state display
- **WHEN** no approved changes exist for the active sub-process in the selected year
- **THEN** an empty state indicator informs the user that no approved changes have been recorded under Lampiran 6 for this sub-process
