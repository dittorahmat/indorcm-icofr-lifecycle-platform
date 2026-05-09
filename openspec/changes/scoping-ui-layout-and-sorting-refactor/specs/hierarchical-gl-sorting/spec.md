## ADDED Requirements

### Requirement: Hierarchical Numeric Sorting
The system SHALL sort the scoping worksheet data hierarchically: first by FSLI group, then by GL account within each group, using the `noUrut` field.

#### Scenario: FSLI Group Sorting
- **WHEN** multiple FSLI groups are displayed
- **THEN** groups SHALL be ordered based on the smallest `noUrut` value present among all GL accounts belonging to that FSLI.

#### Scenario: Internal GL Sorting
- **WHEN** multiple GL accounts are displayed within a single FSLI group
- **THEN** those GL accounts SHALL be ordered ascendingly by their `noUrut` field.
