## ADDED Requirements

### Requirement: Local Parameter Inputs
The system SHALL maintain local/draft values for the materiality parameters (OM percentage, Haircut percentage, and Basis) within the inputs, decoupling them from the active calculation state.

#### Scenario: Responsive parameter inputs without auto-calculation
- **WHEN** the user types or selects a new value for OM percentage, Haircut percentage, or Basis
- **THEN** the inputs SHALL update immediately and stay highly responsive, but the active materiality values (OM Value, PM Value) and the scoping matrix SHALL NOT calculate or re-render.

### Requirement: Stale State Detection
The system SHALL detect when the local/draft parameter inputs differ from the currently active calculated parameters and flag the workspace state as stale.

#### Scenario: Stale state visual feedback
- **WHEN** any draft input (OM%, Haircut%, or Basis) differs from the active parameters
- **THEN** the "Recalculate" button SHALL become active/enabled, and a stale warning message SHALL be displayed to notify the user that calculations are pending.

### Requirement: Manual Recalculation Trigger
The system SHALL provide a "Recalculate" action to trigger the calculation pipeline manually using the draft parameters.

#### Scenario: Triggering recalculation
- **WHEN** the user clicks the "Recalculate" button
- **THEN** the system SHALL run the calculation pipeline (OM, PM, significant accounts, and scoping compliance) and display a loading overlay with "Recalculating scoping compliance..." message, and then update the active scoping grid and metrics.
