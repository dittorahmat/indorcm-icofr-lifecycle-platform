## ADDED Requirements

### Requirement: Transaction Snippet Upload
The system SHALL provide a manual upload interface for transaction detail snippets (Excel/CSV) within the Execution Hub.

#### Scenario: Successful snippet upload
- **WHEN** user drops an Excel file containing transaction details into the upload zone
- **THEN** system launches the mapping wizard to align ERP columns with regulatory fields

### Requirement: ERP Column Mapping Wizard
The system SHALL allow users to manually map ERP export columns to the seven required regulatory transaction fields.

#### Scenario: Mapping ERP columns
- **WHEN** user maps "DocNum" to "No_Referensi" and "Amount" to "Nominal Transaksi"
- **THEN** system previews the data with the new mapping and allows final submission
