# regulatory-lifecycle-tracking Specification

## Purpose
TBD - created by archiving change align-dashboard-lifecycle-with-regulatory-standard. Update Purpose after archive.
## Requirements
### Requirement: 6-Stage ICOFR Lifecycle Progress
The system SHALL visualize the ICOFR lifecycle using 6 specific stages as per Regulation SK-5/DKU.MBU/11/2024.

#### Scenario: Visualizing the full lifecycle
- **WHEN** a user views the Dashboard
- **THEN** the system SHALL display exactly 6 stages in sequential order: Perancangan, Implementasi & Pemantauan, Evaluasi, Remediasi, Pelaporan, and Asurans Eksternal
- **AND** it SHALL highlight the current active stage

### Requirement: Stage-ID Mapping
The system SHALL use standardized IDs for each lifecycle stage to ensure consistency across the application.

#### Scenario: Mapping IDs to labels
- **WHEN** the system renders a stage
- **THEN** it SHALL map the following IDs to their respective localized labels:
  - `planning` -> Perancangan
  - `implementation` -> Implementasi & Pemantauan
  - `evaluation` -> Evaluasi
  - `remediation` -> Remediasi
  - `reporting` -> Pelaporan
  - `assurance` -> Asurans Eksternal

