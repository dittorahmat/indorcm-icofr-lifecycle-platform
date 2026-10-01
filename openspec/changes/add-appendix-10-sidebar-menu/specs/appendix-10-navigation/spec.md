## Purpose

Provides direct first-class sidebar navigation and routing to the SK-5/2024 Lampiran 10 Degree of Deficiency (DoD) audit worksheet.

## ADDED Requirements

### Requirement: Appendix 10 Sidebar Entry
The system SHALL provide a navigation item for Lampiran 10 in the sidebar menu under the "Reporting & RCM" (`reportingRcm`) group, situated strictly between WBS Recap (`items.wbs`) and Appendix 11 / Management Assessment (`items.app11`).

#### Scenario: User views sidebar navigation in Indonesian
- **WHEN** user views the sidebar with Indonesian language active
- **THEN** system displays "Lampiran 10 (Kertas Kerja DoD)" between "Rekap WBS" and "Lampiran 11 (Asesmen Manajemen)"
- **AND** the link routes to `/reports/appendix-10` preserving the working fiscal year parameter

#### Scenario: User views sidebar navigation in English
- **WHEN** user views the sidebar with English language active
- **THEN** system displays "Appendix 10 (DoD Worksheet)" between "WBS Recap" and "Appendix 11 (Asesmen Manajemen)"
- **AND** the link routes to `/reports/appendix-10` preserving the working fiscal year parameter

### Requirement: Direct Lampiran 10 View Routing
The system SHALL route `/reports/appendix-10` directly to the Lampiran 10 Degree of Deficiency evaluation worksheet without requiring manual tab switches.

#### Scenario: User navigates to /reports/appendix-10
- **WHEN** user navigates directly to `/reports/appendix-10`
- **THEN** system renders the 24-column DoD evaluation table with filters, search, and CSV export capabilities
- **AND** the sidebar highlights the Appendix 10 menu item as active
