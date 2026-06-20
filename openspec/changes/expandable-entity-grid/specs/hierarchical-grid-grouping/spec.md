## ADDED Requirements

### Requirement: Dynamic Table Grouping
The system SHALL automatically configure the TanStack Table grouping state to include parent entity and child entity levels when the active dataset contains multiple entities.

#### Scenario: Single entity dataset loaded
- **WHEN** a dataset with one or fewer entities is loaded
- **THEN** the table groups rows by `['fsliName']` only

#### Scenario: Multiple hierarchical entities loaded
- **WHEN** a dataset with multiple entities having parent-child relations is loaded
- **THEN** the table groups rows by `['fsliName', 'parentEntityCode', 'entityCode']`

### Requirement: Hierarchical Row Expansion
The system SHALL render expand/collapse chevron controls and formatted labels for parent entities, child entities, and FSLIs in a unified tree column.

#### Scenario: Interacting with Parent Entity row
- **WHEN** the user clicks the expand chevron next to a Parent Entity row
- **THEN** the row expands to show child entities and/or FSLIs underneath it

### Requirement: Grouped Balance Summation
The system SHALL aggregate the sum of leaf row balances and display it at each parent group level (Parent Entity, Child Entity, FSLI).

#### Scenario: Displaying balance of grouped rows
- **WHEN** a grouped row is rendered in the grid
- **THEN** the balance column displays the total sum of all nested GL accounts under that group level

### Requirement: Grouped Scope Status Roll-up
The system SHALL roll up the scoping status so that a parent group level shows as "In Scope" if any child node or GL account within that branch is significant.

#### Scenario: Determining scope status of parent group
- **WHEN** at least one child node or account is marked as "In Scope"
- **THEN** the parent entity or FSLI group row SHALL display the "In Scope" badge
