## Purpose

Provides a standardized audit worksheet for evaluating the Degree of Deficiency (DoD) in accordance with SK-5/DKU.MBU/11/2024 Lampiran 10, complete with automated evidence context integration and mandatory step-by-step auditor justification.

## ADDED Requirements

### Requirement: Lampiran 10 Tabular Evaluation Grid
The system SHALL provide an institutional DoD evaluation worksheet displaying the 24-column attributes specified in Lampiran 10 SK-5/DKU.MBU/11/2024, including deficiency reference, description, remediation status, ineffective period, exposure amount, 7 financial statement assertions, 5 COSO components, and sequential Box 1 through Box 7 evaluation.

#### Scenario: Displaying DoD Worksheet Modal
- **WHEN** an auditor opens the DoD assessment for an ineffective control or deficiency
- **THEN** the system SHALL display the structured worksheet containing Header details, Evidence context, Logic Matrix (Box 1–7), and Conclusion summary

### Requirement: Mandatory Professional Justification per Logic Box
The system SHALL require the auditor to provide a non-empty textual justification explaining their rationale for each active evaluation box (Box 1 through Box 7) before proceeding or finalizing the conclusion.

#### Scenario: Submitting without justification
- **WHEN** an auditor selects Yes or No on an evaluation box without entering a justification
- **THEN** the system SHALL disable completion and indicate that justification is mandatory for regulatory compliance

### Requirement: Automated Evidence Context Auto-Population
The system SHALL automatically aggregate and display relevant evidence context within the worksheet:
1. Sample testing failure rate and workpaper reference from the Testing (TOD/TOE) module for Box 2 (Likelihood).
2. Financial statement account exposure value and comparison against Performance Materiality (PM) / Overall Materiality (OM) for Box 3 (Magnitude).
3. Secondary controls in the same business process/assertion with their effectiveness status from the RCM module for Box 5 (Compensating Controls).
4. Regulatory red-flag indicators (management fraud, restatement, unmitigated material errors) for Box 6 (Prudent Official).

#### Scenario: Auto-populating Testing Evidence
- **WHEN** the worksheet is opened for a deficiency originating from a TOD/TOE test
- **THEN** the system SHALL display the sample failure count, total sample size, exception percentage, and clickable link to the test workpaper

#### Scenario: Exposure Comparison with Performance Materiality
- **WHEN** an exposure value is evaluated in Box 3
- **THEN** the system SHALL highlight whether the nominal value exceeds the Performance Materiality threshold with clear mathematical comparison

### Requirement: Regulatory Conclusion Determination
The system SHALL automatically compute the terminal conclusion (Control Deficiency, Significant Deficiency, or Material Weakness) strictly following the flowchart rules of Gambar 5 (SK-5/2024 Hal. 73) and Lampiran 10.

#### Scenario: Box 5 No Leads to Material Weakness
- **WHEN** Box 3 (Material Magnitude) is Yes AND Box 5 (Compensating Control) is No
- **THEN** the system SHALL determine the preliminary severity as 'Material Weakness'
