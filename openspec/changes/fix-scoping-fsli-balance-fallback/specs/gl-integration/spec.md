## ADDED Requirements

### Requirement: FSLI Group Header Balance Display Fallback
The scoping matrix grid grouped FSLI rows SHALL display the pre-calculated `fsliBalance` when it is present and non-zero, rather than the sum of the individual `balance` fields of the GL rows under it.

#### Scenario: Displaying pre-calculated FSLI balance for zero-balance GL rows
- **WHEN** the scoping matrix grid renders a grouped FSLI row where all GL rows under it have a balance of 0, but the representative `fsliBalance` is non-zero (e.g. 50,000,000)
- **THEN** the grid SHALL display the balance for the grouped FSLI row as "Rp 50.000.000"

### Requirement: FSLI Group Header Significance and Scoping Aggregation
The scoping matrix grid grouped FSLI row significance (`quantFlag`) and scoping (`finalStatus`) conclusion SHALL be evaluated using the FSLI's pre-calculated `fsliBalance` if it is present and non-zero, rather than the individual GL row balances.

#### Scenario: FSLI group marked as significant and in-scope based on FSLI balance fallback
- **WHEN** the scoping matrix grid evaluates a grouped FSLI row where all GL rows have a balance of 0, but the representative `fsliBalance` (e.g., 50,000,000) is greater than or equal to Performance Materiality (PM)
- **THEN** the grid SHALL mark the grouped FSLI row's quantitative flag as "Significant"
- **AND** the grid SHALL mark the grouped FSLI row's final status as "In Scope"

### Requirement: FSLI Group Balance Excel Export Fallback
The scoping matrix Excel export handler SHALL write the pre-calculated `fsliBalance` as the total balance of the FSLI group row in the exported sheet if the `fsliBalance` is present and non-zero.

#### Scenario: Exporting FSLI group total balance to Excel
- **WHEN** the user exports the scoping matrix to Excel and a grouped FSLI row has a non-zero `fsliBalance` (e.g. 50,000,000) but all underlying GL accounts have 0 balance
- **THEN** the exporter SHALL write the value 50,000,000 in the Balance cell for the FSLI group header row in the Excel sheet
