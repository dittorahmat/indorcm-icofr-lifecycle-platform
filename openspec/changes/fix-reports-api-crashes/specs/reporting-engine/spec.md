## ADDED Requirements

### Requirement: Period summary for regulatory reports
The system SHALL provide a summary of ICOFR effectiveness including total controls, RCM count, and deficiencies grouped by severity and status for the active organization.

#### Scenario: Retrieval of report summary
- **WHEN** user accesses the Reports Dashboard
- **THEN** the system returns aggregated data from the `controls`, `rcms`, and `deficiencies` tables for the current organization

### Requirement: Digital sign-off and period lock
The system SHALL allow authorized users (CEO/CFO) to sign the management assessment, which triggers a period lock and generates a unique verification hash.

#### Scenario: CFO/CEO signs the report
- **WHEN** CEO or CFO clicks "Sign and Lock"
- **THEN** the system updates the organization metadata with the signature date, signer IDs, and a generated verification hash, and sets `isPeriodLocked` to true

### Requirement: Multi-format report export
The system SHALL allow users to export the consolidated ICOFR report in both CSV and Excel formats.

#### Scenario: Exporting report to Excel
- **WHEN** user selects "Export to Excel"
- **THEN** the system generates and downloads an `.xlsx` file containing the Management Assessment, Deficiency Details, and Test Results
