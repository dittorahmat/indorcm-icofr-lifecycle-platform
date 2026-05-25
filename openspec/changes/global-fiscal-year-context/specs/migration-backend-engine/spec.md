## ADDED Requirements

### Requirement: Production Data Injection
The system SHALL provide a backend endpoint to convert staged migration data into production-ready records in the main database tables.

#### Scenario: Finalizing TB migration
- **WHEN** user clicks "Finalize Baseline" for TB data
- **THEN** system SHALL create a new entry in `gl_snapshots`
- **AND** it SHALL create an `Approved` entry in `materiality_simulations` for the selected year.

#### Scenario: Finalizing RCM migration
- **WHEN** user clicks "Finalize Baseline" for RCM data
- **THEN** system SHALL create entries in `bpm_processes`, `rcms`, and `controls`
- **AND** it SHALL link them to the correct `entityCode` and selected fiscal year.
