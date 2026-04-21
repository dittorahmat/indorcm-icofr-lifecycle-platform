## ADDED Requirements

### Requirement: Regulatory Terminology for Test Results
The Test Results Report SHALL display conclusions for TOD and TOE using localized terminology ("Efektif"/"Tidak Efektif" for ID, "Effective"/"Ineffective" for EN) to comply with Regulation SK-5/2024 while supporting multi-language.

#### Scenario: Display Effective result
- **WHEN** a test record has a result of 'Effective' or 'Pass'
- **THEN** the report table displays the localized label for "Effective" with a green success badge

#### Scenario: Display Ineffective result
- **WHEN** a test record has a result of 'Ineffective' or 'Fail'
- **THEN** the report table displays the localized label for "Ineffective" with a red destructive badge
