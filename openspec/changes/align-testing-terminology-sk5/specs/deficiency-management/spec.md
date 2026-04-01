## ADDED Requirements

### Requirement: Deficiency Identification Triggered by Ineffective Result
The system MUST automatically trigger the deficiency identification process (e.g., prompting for severity or adding to the Deficiency Board) when a TOD or TOE result is recorded as "Ineffective".

#### Scenario: Identifying deficiency after Ineffective TOE
- **WHEN** an auditor records a TOE result as "Ineffective"
- **THEN** the system SHALL create a new `Deficiency` record linked to that control and update the control's testing status

### Requirement: Standardized Conclusion Terminology
All modules (Testing, Remediation, Reports) SHALL use standardized conclusion terminology as per SK-5/2024 ("Efektif" / "Tidak Efektif" or "Effective" / "Ineffective").

#### Scenario: Displaying results in reports
- **WHEN** generating Appendix 11 (Management Assessment)
- **THEN** the system SHALL display the conclusion as "Efektif" if the testing result is "Effective"
