## ADDED Requirements

### Requirement: Granular Transaction Repository
The system SHALL store transaction details in a dedicated table including Reference No, Date, Account No, Type, Currency, D/C Flag, and Amount.

#### Scenario: Transaction storage
- **WHEN** user uploads 100 rows of transaction snippets
- **THEN** system saves 100 records to `transaction_details` table

### Requirement: Account-based Filtering
The system SHALL filter transaction details based on the selected `noGL` in the Execution Hub.

#### Scenario: Viewing specific account
- **WHEN** user views "Detail Transaksi" for account "12345"
- **THEN** system displays only rows with `noGL` "12345"

### Requirement: Mapping Wizard
The system SHALL provide a UI wizard to map ERP columns to regulatory fields.

#### Scenario: Successful column mapping
- **WHEN** user maps "VoucherID" to "No_Referensi"
- **THEN** system correctly interprets values as reference numbers during preview
