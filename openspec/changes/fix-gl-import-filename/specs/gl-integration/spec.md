## ADDED Requirements

### Requirement: Preserve Original Filename
The system SHALL preserve and store the original filename of the uploaded General Ledger (GL) or Trial Balance (TB) file.

#### Scenario: GL Snapshot Creation
- **WHEN** user finalizes a GL import through the Smart Import Wizard
- **THEN** the created GL snapshot record MUST use the original uploaded filename in its `filename` field instead of a system-generated default.
