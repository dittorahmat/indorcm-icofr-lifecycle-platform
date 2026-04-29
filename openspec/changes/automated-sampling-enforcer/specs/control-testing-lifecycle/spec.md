## ADDED Requirements

### Requirement: Mandatory Sampling Validation Gate
The test submission process SHALL include a validation gate that prevents submission if the sample size is non-compliant with Tabel 22 and no justification is provided.

#### Scenario: Blocked Submission
- **WHEN** user clicks "Submit" with a sample size below minimum and empty justification
- **THEN** the system SHALL show a validation error and keep the form open.

#### Scenario: Allowed Submission with Justification
- **WHEN** user clicks "Submit" with a sample size below minimum but has provided a justification
- **THEN** the system SHALL allow the test record to be saved.
