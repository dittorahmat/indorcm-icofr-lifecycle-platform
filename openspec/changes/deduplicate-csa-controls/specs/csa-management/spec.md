## ADDED Requirements

### Requirement: Distinct Control Rendering in Review Matrix
The CSA review matrix SHALL display each evaluated control exactly once per business sub-process, deduplicating records by unique control ID even if mapped to multiple RCM risk statements.

#### Scenario: Sub-process with multi-risk control mapping
- **WHEN** a sub-process has a control associated with multiple risk entries in the RCM
- **THEN** the review matrix SHALL render only a single row for that control
- **AND** the TOD status and sample test results SHALL be consolidated under that single control row

### Requirement: Explicit Transaction Sample Identifier Presentation
The CSA review matrix SHALL present clear and distinguishable identifiers for each transaction sample column, preventing excessive text truncation and providing complete reference visibility.

#### Scenario: Viewing sample columns in review matrix
- **WHEN** the user expands a CSA record row to view the review matrix
- **THEN** each sample column header SHALL display the sample reference identifier
- **AND** full transaction detail SHALL be accessible without clipping critical identifiers
