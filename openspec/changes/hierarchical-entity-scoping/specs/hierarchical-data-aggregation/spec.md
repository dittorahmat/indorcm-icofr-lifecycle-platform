## ADDED Requirements

### Requirement: Bottom-up Balance Aggregation
The system SHALL automatically aggregate financial balances from child entities to their parent entities recursively up the hierarchy.

#### Scenario: Rolling up balances to parent
- **WHEN** child entities 'Branch A' ($100) and 'Branch B' ($200) are children of 'Subsidiary X'
- **THEN** 'Subsidiary X' SHALL reflect a total aggregated balance of $300 in the scoping matrix

### Requirement: Dynamic Worksheet Re-aggregation
The system SHALL dynamically recalculate worksheet values (e.g., materiality, risk scores) based on the currently filtered set of business entities.

#### Scenario: Re-aggregating materiality after filtering
- **WHEN** a user filters the scoping matrix to only show 'Subsidiary Y' and its children
- **THEN** the system SHALL recalculate the total assets/revenue and materiality thresholds specifically for the 'Subsidiary Y' branch
