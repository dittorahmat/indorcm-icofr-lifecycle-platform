## ADDED Requirements

### Requirement: Smart Import Baselining Persistence
The system MUST persist the list of significant accounts to the database when a simulation is auto-approved during the Smart Import process.

#### Scenario: Finalizing Smart Import
- **WHEN** the user finalizes the Smart Import wizard
- **THEN** the backend SHALL identify all accounts where `abs(balance) >= PM`
- **AND** it SHALL store these accounts in the `significantAccounts` array of the newly created `simulations` record
- **AND** the simulation status SHALL be set to `Approved`
