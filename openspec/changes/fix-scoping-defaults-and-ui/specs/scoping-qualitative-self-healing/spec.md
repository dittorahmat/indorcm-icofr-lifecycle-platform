## ADDED Requirements

### Requirement: Default Qualitative Assertion Fallback
The scoping data grid SHALL render unassessed qualitative risk pillars as "Low" by default instead of an empty string or dash.

#### Scenario: Unassessed FSLI rating in grid
- **WHEN** an FSLI group has no explicit qualitative assessment override in `assessmentData`
- **THEN** the GL data grid displays "Low" as the default selection for all 8 qualitative pillars

### Requirement: Persistence Safeguard for Qualitative Ratings
The system SHALL preserve qualitative assessment defaults when saving or recalculating simulation materiality parameters.

#### Scenario: Simulation save or recalculate
- **WHEN** a user updates materiality parameters or saves a simulation state
- **THEN** qualitative assessment data is merged with default FSLI ratings and saved without wiping existing entries

### Requirement: Database Backfill for Existing Simulation Records
The system SHALL provide a database backfill script to populate missing qualitative assessment ratings for all existing simulations in the database.

#### Scenario: Running backfill script
- **WHEN** backfill script `scripts/backfill-scoping-assertions.ts` is executed
- **THEN** all simulation records in the database with empty or incomplete `assessmentData` have their qualitative ratings populated with default "Low" ratings for all snapshot FSLIs
