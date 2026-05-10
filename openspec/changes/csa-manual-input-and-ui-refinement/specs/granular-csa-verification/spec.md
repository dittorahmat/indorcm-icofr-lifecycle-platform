## MODIFIED Requirements

### Requirement: Dual-Table Assessment Interface
The system SHALL present two synchronized tables in the CSA Assessment tab:
1.  **Summary Matrix**: Displays samples (rows) against controls (columns) for high-level status.
2.  **Granular Evidence Table**: Displays flattened verification points for detailed audit documentation, organized by Sample Reference.

#### Scenario: Switching between tables
- **WHEN** the user interacts with the CSA Assessment tab
- **THEN** both the Summary Matrix and the Granular Evidence Table SHALL be visible
- **AND** updates made in one table (e.g., implementation status) SHALL automatically reflect in the other.

#### Scenario: Sample-Based Grouping
- **WHEN** viewing the Granular Evidence Table
- **THEN** the system SHALL group all control verification points belonging to the same sample under a shared sample header or row grouping to improve visual scanning.
