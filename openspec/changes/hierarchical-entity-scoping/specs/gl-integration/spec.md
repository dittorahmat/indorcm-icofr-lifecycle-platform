## MODIFIED Requirements

### Requirement: Manual GL Upload
The system SHALL support manual GL data population through CSV/Excel uploads.
- The system SHALL extract account codes, names, and ending balances.
- The system SHALL automatically mark accounts as `Significant` if the balance meets or exceeds the Performance Materiality (PM) threshold.
- The system SHALL support a `Parent_Entity` column to associate accounts with the hierarchical business entity structure.
- The system SHALL append newly uploaded data to the existing scoping matrix while maintaining entity associations.

#### Scenario: Successful hierarchical GL upload
- **WHEN** a user uploads a CSV containing accounts with `Parent_Entity` values
- **THEN** the system SHALL parse the data and associate each GL account with its corresponding business entity in the hierarchy
- **AND** the system SHALL mark significant accounts based on the established PM threshold
