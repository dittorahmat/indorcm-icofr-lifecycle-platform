## ADDED Requirements

### Requirement: Real-time Sampling Validation (Tabel 22)
The system SHALL validate the `sampleSize` input against the minimum requirements defined by Regulation SK-5/2024 Tabel 22, based on the control's frequency and risk rating.

#### Scenario: Compliant Sample Size
- **WHEN** user enters a sample size that is greater than or equal to the Tabel 22 minimum
- **THEN** the system SHALL display a visual indicator of compliance (e.g., green highlight) and make the justification field optional.

#### Scenario: Non-compliant Sample Size without Justification
- **WHEN** user enters a sample size below the Tabel 22 minimum and leaves the justification field empty
- **THEN** the system SHALL display a validation error and block the submission of the test record.

### Requirement: Mandatory Deviation Justification
The system SHALL require a "Homogeneity Justification" if the provided sample size is below the recommended minimum range for that control's frequency and risk level.

#### Scenario: Providing Justification for Deviation
- **WHEN** user enters a sample size below minimum AND provides a non-empty justification
- **THEN** the system SHALL allow the submission of the test record.

### Requirement: Unsaved Changes Guard
The system SHALL warn users if they attempt to navigate away from the Test Workbench while there are unsaved changes in the test form.

#### Scenario: Accidental Navigation
- **WHEN** user has modified form fields and clicks a sidebar link or browser back button
- **THEN** the system SHALL display a confirmation dialog warning about data loss.
