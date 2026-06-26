## ADDED Requirements

### Requirement: FSLI-Level 2/3 Coverage Calculation
The system SHALL calculate the percentage of total consolidated balance represented by selected entities for each FSLI.

#### Scenario: Calculating FSLI coverage
- **WHEN** the user selects or filters the in-scope entities (locations) for a simulation
- **THEN** the system SHALL calculate the coverage percentage for each FSLI as the sum of absolute balances of the FSLI in selected entities divided by the sum of absolute balances of the FSLI in all entities of the snapshot
- **AND** if the coverage percentage is less than 66.67% (2/3), the system SHALL flag this FSLI as non-compliant

### Requirement: Aggregate Operating and Position Value 2/3 Coverage Calculation
The system SHALL calculate the overall coverage percentage for Total Assets, Total Liabilities, Total Revenue, and Total Expenses across selected entities.

#### Scenario: Calculating aggregate coverage
- **WHEN** the user selects or filters the in-scope entities (locations) for a simulation
- **THEN** the system SHALL calculate the coverage percentage for:
  - Total Assets (sum of selected entity assets / consolidated assets)
  - Total Liabilities (sum of selected entity liabilities / consolidated liabilities)
  - Total Revenue (sum of selected entity revenues / consolidated revenues)
  - Total Expenses (sum of selected entity expenses / consolidated expenses)
- **AND** if any of these aggregate coverages is less than 66.67% (2/3), the system SHALL flag the overall simulation as non-compliant with the BUMN SK-5/2024 regulations

### Requirement: Grid Row Flagging and Color Coding
The system SHALL highlight rows in the General Ledger grid with specific background colors based on their scope classification.

#### Scenario: Highlighting rows based on scope
- **WHEN** the GL worksheet is displayed
- **THEN** the system SHALL apply the following styles to each row based on its inclusion criteria:
  - **Hijau (Soft Green)** if the account's absolute balance is greater than or equal to the Performance Materiality (PM) value
  - **Jingga/Oranye (Soft Orange)** if the account's absolute balance is below PM but is included in scope specifically to satisfy the 2/3 FSLI-level coverage requirement
  - **Kuning (Soft Yellow)** if the account is below PM and not required for 2/3 coverage, but is included in scope due to a Qualitative Risk Assessment of 'High' or if it is a Mandatori FSLI (e.g. Kas dan Setara Kas)
  - **No highlight** if the account is out of scope

### Requirement: Coverage Visualization in Scoping Health Dashboard
The system SHALL display the 2/3 compliance status and detailed coverage percentages in the Scoping Health Dashboard (Data Integrity tab).

#### Scenario: Displaying coverage statistics
- **WHEN** the user views the "Data Integrity" tab in the Scoping page
- **THEN** the system SHALL render a summary card showing:
  - The coverage status (Pass/Fail) for each FSLI that has accounts in scope
  - The aggregate coverage status (Pass/Fail) for Assets, Liabilities, Revenue, and Expenses
  - A warning message listing any FSLIs that currently fail to meet the 66.67% minimum threshold
