## ADDED Requirements

### Requirement: Horizontal ELC Matrix Layout
The system SHALL display the Entity Level Control (ELC) matrix in a horizontal layout where Controls are rows and the 17 COSO Principles are columns, as per Lampiran 5 a Regulation SK-5/2024.

#### Scenario: Displaying ELC Matrix
- **WHEN** user navigates to the RCM ELC page
- **THEN** the system displays a table with controls as rows and columns for Ref, Description, Frequency, Docs, Executing Function, Reviewer, Effective Period, and COSO Principles 1-17.

### Requirement: Interactive COSO Principles Mapping
The system SHALL indicate the mapping of a control to COSO principles using a checkmark icon or "V" in the corresponding column when the mapping is set to "Y" (Yes).

#### Scenario: Mapping visualization
- **WHEN** a control has Principle 1 marked as 'Y' in its metadata
- **THEN** the system displays a checkmark in the '1' column for that control's row.

### Requirement: Regulatory Glossary Tooltips
The system SHALL provide descriptive tooltips for each COSO Principle column header (1-17) using content from Lampiran 1 Regulation SK-5/2024.

#### Scenario: Viewing principle description
- **WHEN** user hovers over the '8' column header
- **THEN** the system displays a tooltip: "Perusahaan mempertimbangkan potensi risiko kecurangan (fraud) dalam menilai risiko."

### Requirement: Multi-Subsidiary Filter
The system SHALL allow users to filter the ELC matrix by "Anak Perusahaan" (Subsidiary) to support consolidated group reporting.

#### Scenario: Filtering by subsidiary
- **WHEN** user selects a specific subsidiary from the filter dropdown
- **THEN** the system refreshes the matrix to show only ELC controls belonging to that subsidiary.
