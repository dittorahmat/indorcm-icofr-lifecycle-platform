## ADDED Requirements

### Requirement: Searchable and Sorted Benchmark Selection
The Smart Import Wizard SHALL sort candidate benchmark basis items by sequence number (`minNoUrut` ascending) and provide a search filter input to quickly find candidate accounts by name.

#### Scenario: FSLI items sorted by noUrut ascending
- **WHEN** user opens Step 3 (Baselining) in Smart Import Wizard with parsed GL data
- **THEN** the benchmark basis items in the dropdown/combobox are ordered by `minNoUrut` in ascending order

#### Scenario: User searches for a specific FSLI benchmark
- **WHEN** user types a search query into the benchmark basis combobox input
- **THEN** only candidate FSLI items matching the search query are displayed
