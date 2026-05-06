## ADDED Requirements

### Requirement: Save Progress Tracking (Drafting)
The system SHALL provide an API endpoint to save partial CSA results and track the "In Progress" status without full finalization.

#### Scenario: Submitting a draft result
- **WHEN** the API receives a `POST /api/csa` with `isDraft: true`
- **THEN** it SHALL update the `csa_samples` and `csa_records` tables
- **AND** it SHALL return a success response without locking the record
