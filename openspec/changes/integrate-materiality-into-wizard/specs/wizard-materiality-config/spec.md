## ADDED Requirements

### Requirement: Configure Materiality in Wizard
The `SmartImportWizard` SHALL provide a "Materiality Configuration" section in the Baselining step (Step 3) when a TB/GL file is part of the import session.

#### Scenario: Display Benchmark Candidates
- **WHEN** the user proceeds to Step 3 after successfully parsing a TB file
- **THEN** the system SHALL display a list of FSLI candidates aggregated from the uploaded data, sorted by total absolute balance (descending).

#### Scenario: Real-time Materiality Calculation
- **WHEN** the user selects a Benchmark Basis and modifies the OM% (default 5%) or Haircut% (default 25%)
- **THEN** the system SHALL recalculate and display the estimated Overall Materiality (OM) and Performance Materiality (PM) values.

### Requirement: Finalize Migration with Materiality Parameters
The system SHALL capture the materiality configuration from the Wizard and apply it to the automatically generated "Approved" simulation.

#### Scenario: Successful Baselining with Parameters
- **WHEN** the user clicks "Finalize Baseline" after configuring materiality
- **THEN** the backend SHALL create a simulation record with the user-selected `basis`, `om_percentage`, `haircut_percentage`, and calculated `om_value`/`pm_value`.
- **THEN** the simulation SHALL be in "Approved" status and linked to the new GL Snapshot.
