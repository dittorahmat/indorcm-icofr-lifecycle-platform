## ADDED Requirements

### Requirement: Automatic Material Weakness Indicators Assessment
The system SHALL provide a preliminary assessment step (Step 0) to evaluate five critical indicators that trigger an automatic "Material Weakness" conclusion. These indicators are:
1. Senior management fraud (regardless of materiality).
2. Fraud that has a material impact on financial statements.
3. Restatements of prior period financial statements to correct material errors.
4. Identification by auditor of a material misstatement that was not identified by the company's internal control.
5. Ineffective oversight by the Audit Committee.

#### Scenario: User selects an automatic indicator
- **WHEN** user checks any of the five automatic MW indicators in Step 0
- **THEN** system SHALL conclude the assessment as "Material Weakness" and skip the remaining flowchart steps.

### Requirement: Scoping Materiality Linkage for Magnitude
The system SHALL retrieve the Performance Materiality (PM) value from the active Scoping simulation. In "Box 3: Magnitude", if a quantitative exposure value is provided, the system SHALL compare it against the PM.

#### Scenario: Exposure value exceeds Performance Materiality
- **WHEN** user enters an exposure value in Box 3 that is >= Performance Materiality
- **THEN** system SHALL auto-suggest "YES" for the magnitude question.

### Requirement: Financial Statement Assertion Mapping
The system SHALL allow users to map a deficiency to specific financial statement assertions as required by Lampiran 10 (C, A, E/O, CO, R&O, V/A, PD).

#### Scenario: User selects assertions in result view
- **WHEN** user reaches the result screen
- **THEN** system SHALL present a multi-select list of assertions (Completeness, Accuracy, Existence/Occurrence, Cut-off, Rights & Obligations, Valuation/Allocation, Presentation & Disclosure) to be saved with the deficiency record.

### Requirement: Quantitative Exposure Capture
The system SHALL provide a field to record the nominal "Nilai Eksposur Defisiensi" as per the Lampiran 10 worksheet requirement.

#### Scenario: User records exposure value
- **WHEN** user enters a numeric value for exposure
- **THEN** system SHALL store this value and display it in the final summary/rationale.

### Requirement: Multi-language Support for DoD Wizard
All UI text within the DoD Wizard SHALL be localized in both English and Indonesian.

#### Scenario: Language switch
- **WHEN** user changes the application language
- **THEN** the DoD Wizard questions, labels, and results SHALL update to the selected language.
