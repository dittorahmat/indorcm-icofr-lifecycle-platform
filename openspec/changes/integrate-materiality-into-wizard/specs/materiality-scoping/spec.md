## ADDED Requirements

### Requirement: Standardized Materiality Initialization
The automated initialization of the ICOFR lifecycle through data migration SHALL ensure that the baseline simulation is fully compliant with SK-5/2024 by including all mandatory materiality parameters.

#### Scenario: Approved Baseline Integrity
- **WHEN** a migration session is finalized
- **THEN** the resulting simulation MUST NOT have null or zero values for `om_percentage`, `haircut_percentage`, and `basis`.
- **THEN** the simulation MUST be automatically set to "Approved" to allow immediate transition to the Scoping phase.
