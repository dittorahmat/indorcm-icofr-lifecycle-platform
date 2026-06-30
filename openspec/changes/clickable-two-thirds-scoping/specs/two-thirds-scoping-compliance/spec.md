## MODIFIED Requirements

### Requirement: Grid Row Flagging and Color Coding
The system SHALL highlight rows in the General Ledger grid with specific background colors based on their scope classification, and SHALL make accounts classified as in-scope (including those in scope due to the 2/3 coverage requirement) interactive and editable.

#### Scenario: Highlighting rows based on scope
- **WHEN** the GL worksheet is displayed
- **THEN** the system SHALL apply the following styles to each row based on its inclusion criteria:
  - **Hijau (Soft Green)** if the account's absolute balance is greater than or equal to the Performance Materiality (PM) value (classification: `above-pm`)
  - **Jingga/Oranye (Soft Orange)** if the account's absolute balance is below PM but is included in scope specifically to satisfy the 2/3 FSLI-level coverage requirement (classification: `two-thirds`)
  - **Kuning (Soft Yellow)** if the account is below PM and not required for 2/3 coverage, but is included in scope due to a Qualitative Risk Assessment of 'High' or if it is a Mandatori FSLI (e.g. Kas dan Setara Kas) (classification: `qualitative`)
  - **No highlight** if the account is out of scope

#### Scenario: Interactive and clickable grid rows
- **WHEN** a row in the GL worksheet is classified as in-scope (whether `above-pm`, `two-thirds`, or `qualitative`)
- **THEN** the system SHALL render the account description (`glDesc`) as a clickable link that navigates to the BPM editor for that account
- **AND** the system SHALL render the significant application (`significantApp`) selector for that account to allow Line 1 owners to map applications
- **AND** the system SHALL display the scope status as `In Scope` (`grid.inScope` badge)
