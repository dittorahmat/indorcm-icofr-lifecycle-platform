## ADDED Requirements

### Requirement: Granular Sample Entry
The system MUST allow users to enter individual sample records for TOE and CSA pengujian, following the Lampiran 7 format.

#### Scenario: User adds a sample
- **WHEN** user is in TOE or CSA mode
- **THEN** an "Add Sample" button is available that opens a row in the sampling grid

### Requirement: Sample Attribute Pass/Fail
Each sample record SHALL include fields for Attribute A, B, C, D as defined in the test configuration, with a binary Pass/Fail/NA status.

#### Scenario: User checks an attribute
- **WHEN** user toggles an attribute for a specific sample
- **THEN** the sample's individual status is updated based on the attribute results

### Requirement: Zero Tolerance Calculation
The overall test result MUST be automatically set to "Ineffective" if any single sample record has a "Failed" status on any mandatory attribute.

#### Scenario: Automatic Ineffective status
- **WHEN** any sample in the list is marked as "Failed"
- **THEN** the parent Test Record status is automatically set to "Ineffective" and the field becomes read-only
