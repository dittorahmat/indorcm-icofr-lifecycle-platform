# Spec Delta

## ADDED Requirements

### Requirement: Control-Scoped Deficiency Deduplication
The system SHALL scope open deficiency deduplication to the exact combination of organization ID, control ID, and period, preventing false deduplication collisions across different controls or between control-specific and process-wide deficiencies.

#### Scenario: Registering multiple failed controls in the same period
- **WHEN** multiple failed controls are registered from the same CSA assessment period (e.g. `2025-Q1`)
- **THEN** each unique control ID SHALL produce its own distinct open deficiency and corresponding action plan
- **AND** pre-existing remediated or closed deficiencies in the same period SHALL NOT block creation of new open deficiencies

### Requirement: Retroactive CSA Deficiency Backfill
The system SHALL support retroactive backfilling of missing deficiencies and action plans for historical Ineffective CSA records that lack control-level deficiencies.

#### Scenario: Backfilling orphaned ineffective CSA records
- **WHEN** backfill procedure runs on historical CSA records where `result = 'Ineffective'` and `control_id IS NULL`
- **THEN** system SHALL inspect associated sample results, find all failed controls, and generate open deficiencies and draft action plans with workflow status `Ineffective`
- **AND** newly generated action plans SHALL immediately appear under the Ineffective column on the Deficiency Board
