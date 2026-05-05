# granular-csa-verification Specification

## Purpose
TBD - created by archiving change granular-csa-evidence-management. Update Purpose after archive.
## Requirements
### Requirement: Dual-Table Assessment Interface
The system SHALL present two synchronized tables in the CSA Assessment tab:
1.  **Summary Matrix**: Displays samples (rows) against controls (columns) for high-level status.
2.  **Granular Evidence Table**: Displays flattened verification points for detailed audit documentation.

#### Scenario: Switching between tables
- **WHEN** the user interacts with the CSA Assessment tab
- **THEN** both the Summary Matrix and the Granular Evidence Table SHALL be visible
- **AND** updates made in one table (e.g., implementation status) SHALL automatically reflect in the other.

### Requirement: Granular Evidence and Remarks
The system SHALL provide dedicated input fields for evidence upload, remarks, and deficiency status ONLY within the Granular Evidence Table.

#### Scenario: Documenting a verification point
- **WHEN** the user scrolls to the Granular Evidence Table
- **THEN** they SHALL find one row for every `Sample x Control` intersection
- **AND** every row SHALL contain a mandatory upload button, a free-text remark field, and a status toggle.

