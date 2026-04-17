## ADDED Requirements

### Requirement: Company and period-lock metadata
The system SHALL provide an API to retrieve current organization settings including company name, CEO/CFO names, and the period-lock status for the active reporting cycle.

#### Scenario: Retrieval of organization settings
- **WHEN** user logs in and accesses any page
- **THEN** the system returns the organization metadata from the `organization` table and session context

### Requirement: GL account owner acceptance
The system SHALL allow assigned owners to mark General Ledger accounts as "Accepted" or "Rejected" within the scoping matrix.

#### Scenario: Owner accepts a GL account
- **WHEN** owner selects "Accepted" for a GL account
- **THEN** the system updates the `ownerAcceptance` status in the `gl_rows` table for the active snapshot
