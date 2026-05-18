## ADDED Requirements

### Requirement: Missing Columns
The `VerificationDesignPage` matrix SHALL include the following columns to comply with SK-5 Lampiran 8:
- `Aplikasi Pendukung` (Supporting App / `supportingApp`)
- `Fungsi Pelaksana` (Executing Function / `executingFunction`)
- `Pelaku Pengendalian` (Executor Role / `executorRole`)
- `Item LK terdampak` (Affected FSLI Item / `affectedFsliItem`)
- `Periode Efektif` (Effective Period / `effectivePeriod`)

#### Scenario: Viewing the Matrix
- **WHEN** a user navigates to the Verification Design Page
- **THEN** the matrix displays the new columns `Aplikasi Pendukung`, `Fungsi Pelaksana`, `Pelaku Pengendalian`, `Item LK terdampak`, and `Periode Efektif` populated with data from the `rcm_controls` table.
