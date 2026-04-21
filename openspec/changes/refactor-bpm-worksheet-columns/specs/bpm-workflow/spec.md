## ADDED Requirements

### Requirement: Simplified Business Process Hierarchy
The system SHALL simplify the business process hierarchy by removing "Level 2" information and renaming "Level 1" to a general "Business Process" category.

#### Scenario: Displaying simplified hierarchy
- **WHEN** a user views the BPM Worksheet
- **THEN** only "Informasi Proses Bisnis" and "Informasi Sub-Proses Bisnis" SHALL be visible as hierarchy descriptors

### Requirement: Optimized Column Order
The system SHALL position the "Nama Aktivitas Pengendalian" column between "Informasi Sub-Proses Bisnis" and "Lokasi" to facilitate a more logical data entry flow.

#### Scenario: Verifying column order
- **WHEN** a user views the BPM Worksheet table headers
- **THEN** the column following "Informasi Sub-Proses Bisnis" SHALL be "Nama Aktivitas Pengendalian"
- **AND** the column following "Nama Aktivitas Pengendalian" SHALL be "Lokasi"

## REMOVED Requirements

### Requirement: Business Process Level 2
**Reason**: Redundant and confusing for users; simplified to a single "Process" level.
**Migration**: Existing "Level 2" data SHALL be discarded as it was not fully implemented in the database and is considered redundant.

## RENAMED Requirements

### Requirement: Business Process Level 1
- **FROM**: Informasi Proses Bisnis (Lvl 1)
- **TO**: Informasi Proses Bisnis
- **FIELD_FROM**: businessProcessLvl1
- **FIELD_TO**: businessProcess
