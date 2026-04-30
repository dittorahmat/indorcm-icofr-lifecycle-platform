## MODIFIED Requirements

### Requirement: Manual GL Upload
The system SHALL support `.csv` and `.xlsx` files, extract account names and ending balances, automatically mark accounts as `Significant` if `|balance| >= PM`, and support assignment of multiple department owners to each account.

#### Scenario: Successful upload and initial mapping
- **WHEN** user uploads a valid GL file
- **THEN** system parses rows, calculates significance, and displays them in a worksheet where multiple department owners can be assigned to each significant account.
