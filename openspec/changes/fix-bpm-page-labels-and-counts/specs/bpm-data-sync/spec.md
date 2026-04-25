## ADDED Requirements

### Requirement: Automatic Count Synchronization
The system SHALL automatically synchronize the count of unique Risks and Controls associated with a BPM Process whenever its related diagram is saved.

#### Scenario: Diagram Save Synchronization
- **WHEN** a user saves changes in the BPM Editor for a specific Sub Process
- **THEN** the system MUST query the unique Risks (RCMs) and Controls mapped in that diagram
- **AND** update the `risk_count` and `control_count` columns in the `bpm_processes` table for the corresponding process header.

### Requirement: Persistent Process List Counts
The process list API SHALL return the synchronized counts directly from the database to ensure high performance and data accuracy.

#### Scenario: Fetch Process List
- **WHEN** the BPM Page loads the list of processes for a selected GL Account
- **THEN** the system MUST return the `risk_count` and `control_count` values stored in the `bpm_processes` table.
