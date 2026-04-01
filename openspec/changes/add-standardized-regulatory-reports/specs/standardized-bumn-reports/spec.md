## ADDED Requirements

### Requirement: Standardized Regulatory Report Tabs
The system SHALL provide a dedicated "Regulatory Appendices" (Lampiran) section within the Reports page to house the 7 mandatory reports from SK-5/2024.

#### Scenario: Switching between reports
- **WHEN** the user selects the "Regulatory Appendices" tab
- **THEN** the system SHALL show a selector (dropdown or sub-tabs) for:
    1. Lampiran 5a: RCM ELC
    2. Lampiran 5b: RCM TLC
    3. Lampiran 5c: RCM ITGC
    4. Lampiran 9: Format Daftar Temuan
    5. Lampiran 10: Penentuan DOD
    6. Lampiran 6: Log Perubahan Bisnis
    7. Lampiran 7: Dokumentasi CSA

### Requirement: RCM TLC View (Lampiran 5b)
The system SHALL display a high-fidelity table for RCM Transaction Level Control with industry-specific data for Coal Mining.

#### Scenario: Data display for Coal Mining
- **WHEN** the RCM TLC report is viewed
- **THEN** the system SHALL display mockup data for "PT BATUBARA NUSANTARA SEJAHTERA" including processes like "Coal Getting" and "Overburden Removal".
- **THEN** the table SHALL include columns for: Process Info, Sub-process, Risk, Fraud Indicator, Risk Rating, Control Ref, Control Name, Assertions (C, A, E/O, CO, R&O, V/A, PD), Nature (Preventive/Detective), and Affected FSLI.

### Requirement: Findings List (Lampiran 9)
The system SHALL display a detailed table of audit findings and remediation plans.

#### Scenario: Viewing a finding
- **WHEN** the Format Daftar Temuan report is viewed
- **THEN** the system SHALL show columns for: Observation Title, Detail, Affected Account, Exposure Value, Deficiency Type, Remediation Action Plan, and Approval Status.

### Requirement: Degree of Deficiency (Lampiran 10)
The system SHALL implement the decision-tree logic for Penentuan DoD as per regulation.

#### Scenario: Visualizing the DoD matrix
- **WHEN** the Penentuan DOD report is viewed
- **THEN** the system SHALL display the 7-Box logic (Kotak 1 s.d. Kotak 7) used to conclude whether a deficiency is a Control Deficiency (CD), Significant Deficiency (SD), or Material Weakness (MW).

### Requirement: Change Management Log (Lampiran 6)
The system SHALL display a history of changes to business processes and controls.

#### Scenario: Audit trail of changes
- **WHEN** the Log Perubahan Bisnis report is viewed
- **THEN** the system SHALL show "Before" and "After" descriptions of controls, effective dates, and reference versioning (e.g., Ver 1.0 to Ver 2.0).
