## ADDED Requirements

### Requirement: Centralized Assertion Configuration
The system SHALL provide a dedicated configuration table in `BPMPage.tsx` for defining financial assertions for a selected GL Account and FSLI.

#### Scenario: Displaying assertions for selected account
- **WHEN** user selects an FSLI and a GL Account
- **THEN** the system SHALL display the Financial Assertion Table with checkboxes/dropdowns for E/O, C, A, CO, R&O, V/A, and PD
- **AND** the system SHALL fetch existing values from the `account_assertions` table

#### Scenario: Saving assertion configuration
- **WHEN** user changes a value in the assertion table
- **THEN** the system SHALL immediately persist the change to the backend
- **AND** the system SHALL show a success toast notification

### Requirement: Regulatory Guidance Tooltips
The system SHALL display detailed descriptions for each financial assertion as defined in Regulation SK-5 Table 8 when the user hovers over the table headers.

#### Scenario: Viewing assertion guidance
- **WHEN** user hovers over the "E/O" column header
- **THEN** the system SHALL display a tooltip with the text: "Existence: meyakinkan apakah seluruh aset, liabilitas dan ekuitas yang tercantum di laporan posisi keuangan benar-benar ada. Occurrence: meyakinkan apakah seluruh transaksi yang dipresentasikan dalam laporan laba rugi dan penghasilan komprehensif lainnya betul-betul terjadi."

### Requirement: Assertion Inheritance in RCM
The system SHALL automatically populate assertions in the RCM Matrix based on the centralized configuration defined at the Account/BPM level.

#### Scenario: Automatic population of RCM assertions
- **WHEN** user views the RCM Matrix for a specific GL Account
- **THEN** the system SHALL display the assertions from the centralized configuration as default values for all controls linked to that account

#### Scenario: Manual override in RCM
- **WHEN** user manually changes an assertion value in the RCM Matrix
- **THEN** the system SHALL persist the override specifically for that control mapping
- **AND** the system SHALL NOT update the centralized configuration in `account_assertions`

### Requirement: Unsaved Changes Protection
The system SHALL warn the user when they attempt to navigate away from the `BPMPage` with unsaved changes in the assertion configuration.

#### Scenario: Navigation warning
- **WHEN** user has modified the assertion table but the save operation is pending or if there are other unsaved inputs
- **THEN** the system SHALL display a confirmation dialog before allowing navigation to another page
