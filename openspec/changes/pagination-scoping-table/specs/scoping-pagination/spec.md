## ADDED Requirements

### Requirement: FSLI-based Pagination
The system SHALL paginate the Scoping worksheet table based on FSLI (top-level) grouped rows.

#### Scenario: Displaying first page
- **WHEN** the user opens the Scoping Editor
- **THEN** the system displays the first 15 FSLI groups in the table

#### Scenario: Navigating to the next page
- **WHEN** the user clicks the "Next" button on the pagination bar
- **THEN** the system displays the next set of up to 15 FSLI groups

### Requirement: Fixed Page Size
The system SHALL maintain a fixed page size of 15 FSLI rows per page.

#### Scenario: Page calculation
- **WHEN** the dataset contains 40 FSLI groups
- **THEN** the system calculates and provides navigation for 3 pages (15 + 15 + 10)

### Requirement: Hierarchical Expansion within Pages
The system SHALL display all child GL accounts of an expanded FSLI on the same page as the parent FSLI.

#### Scenario: Expanding a large FSLI group
- **WHEN** the user expands an FSLI group containing 50 GL accounts
- **THEN** all 50 GL accounts are rendered on the current page, and the total FSLI count for that page remains 15

### Requirement: Pagination Controls UI
The system SHALL provide a user interface for navigating pages, including "Previous" and "Next" buttons and a current page indicator.

#### Scenario: Disabling controls at boundaries
- **WHEN** the user is on the first page
- **THEN** the "Previous" button SHALL be disabled
- **WHEN** the user is on the last page
- **THEN** the "Next" button SHALL be disabled
