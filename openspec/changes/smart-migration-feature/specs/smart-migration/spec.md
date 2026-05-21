## ADDED Requirements

### Requirement: Excel Ingestion for Brownfield Data
The system SHALL allow users to upload Excel files (.xlsx, .csv) containing existing Risk Control Matrix (RCM) and Trial Balance (TB) data.

#### Scenario: Successful RCM upload
- **WHEN** user uploads a valid RCM Excel file
- **THEN** system SHALL parse rows and display them in a staging area for review.

### Requirement: AI-Assisted Normalization
The system SHALL use AI to map free-text Excel fields to system-defined Enums (e.g., mapping "Setiap Bulan" to `Monthly`, "Pencegahan" to `Preventive`).

#### Scenario: Normalizing Nature of Control
- **WHEN** a row has Nature text "Manual via Spreadsheet"
- **THEN** AI SHALL suggest mapping it to `ITDM - EUC`.

### Requirement: AI Regulatory Metadata Guessing
The system SHALL intelligently derive missing regulatory fields (Assertions, IPO, Control Type) based on the Control Description and Title.

#### Scenario: Guessing Existence Assertion
- **WHEN** a control description mentions "Physical count of assets"
- **THEN** AI SHALL suggest checking the `Existence` assertion.

### Requirement: Staging Area Review UI
The system SHALL provide a workspace where users can review all parsed data, see AI suggestions marked with visual flags, and make manual corrections.

#### Scenario: Highlighting AI guesses
- **WHEN** a field is populated by AI guessing (not direct Excel mapping)
- **THEN** system SHALL display a warning icon or distinct background color for that cell.

### Requirement: Financial-Control Cross-Check
The system SHALL automatically validate the consistency between uploaded TB data (accounts) and RCM data (mapped controls).

#### Scenario: Identifying unmitigated significant accounts
- **WHEN** an account in TB is > PM but has no corresponding control in RCM
- **THEN** system SHALL display a high-severity warning in the staging dashboard.

### Requirement: One-Click Migration Baselining
The system SHALL allow authorized users (Lini 1/CFO) to approve all staged data in bulk, creating a formal audit trail entry.

#### Scenario: Finalizing migration
- **WHEN** user clicks "Finalize Migration & Set Baseline"
- **THEN** system SHALL change all staged records to `Approved`
- **AND** it SHALL create a regulatory audit log entry marked as `isRegulatory: true`.
