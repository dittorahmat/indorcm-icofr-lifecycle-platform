## Purpose

Provides a structured, audit-defensible justification framework for Overall Materiality (OM), Performance Materiality (PM), and Haircut parameters in ICOFR scoping simulations, ensuring compliance with BUMN Regulation SK-5/DKU.MBU/11/2024 and audit standards.

## ADDED Requirements

### Requirement: Structured 4-Factor Materiality Assessment
The system SHALL provide a structured assessment mechanism in the Scoping Editor capturing four essential risk factors:
1. `entityCharacteristics`: Entity focus and justification for benchmark selection (e.g., `profit_oriented`, `asset_intensive`, `revenue_driven`, `volatile_breakeven`).
2. `internalControlMaturity`: Internal control maturity and prior year ICOFR findings (e.g., `effective_strong`, `moderate`, `deficient_material_weakness`).
3. `auditAdjustmentHistory`: Historical magnitude of audit adjustments by external auditors (e.g., `low_clean`, `moderate`, `significant`).
4. `systemStability`: Accounting IT systems and operational stability (e.g., `stable`, `major_change_erp_restructure`).

#### Scenario: User configures structured materiality factors
- **WHEN** user opens the Materiality Justification modal in a scoping simulation
- **THEN** system presents the 4 standard factor choices with clear option labels and contextual audit guidance
- **AND** records the selected factor keys on the simulation model

### Requirement: Auto-Generated Narrative with Supplementary Notes
The system SHALL automatically generate a coherent, professional narrative paragraph synthesized from the four selected factors, while allowing supplementary manual notes (e.g., Audit Committee decree or meeting minutes reference).

#### Scenario: Real-time generation of narrative preview
- **WHEN** user updates any of the 4 factor selections
- **THEN** system dynamically updates an auto-generated narrative preview synthesizing the justification
- **AND** provides an optional free-text field for supplementary governance notes (e.g., `referenceDocNumber` / `auditCommitteeNotes`)

### Requirement: Prerequisite Validation for Scoping Lock and Finalization
The system SHALL enforce that a scoping simulation cannot be locked, frozen, or submitted for formal approval unless all 4 materiality justification factors have been fully completed.

#### Scenario: Prevent locking when justification is incomplete
- **WHEN** user attempts to lock or submit a scoping simulation that does not have all 4 factors populated
- **THEN** system blocks the action and displays an alert indicating that materiality justification is required before freezing the scope
- **AND** highlights or provides a direct action to open the justification modal

#### Scenario: Successful locking when justification is complete
- **WHEN** all 4 factors and benchmark parameters are configured and user initiates lock/freeze
- **THEN** system allows the lock action to proceed, timestamps the approval, and freezes the justification parameters from modification

### Requirement: Audit Defense and Presentation Sync
The system SHALL persist the materiality justification on the simulation and make it available in the Scoping Editor view, audit trail logs, and regulatory export previews.

#### Scenario: Display justification badge and summary in Scoping Editor
- **WHEN** viewing a scoping simulation with complete justification
- **THEN** system displays a "Justified" badge in the materiality parameters card
- **AND** allows viewing the locked justification snapshot in read-only mode if the simulation is locked
