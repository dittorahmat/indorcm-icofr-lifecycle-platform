## ADDED Requirements

### Requirement: GL Snapshot Fiscal Year Association
The system SHALL associate every uploaded GL snapshot and its rows with a specific fiscal year (integer value).

#### Scenario: Manual upload GL snapshot fiscal year association
- **WHEN** a user manually uploads a GL snapshot file in the Master Data GL tab
- **THEN** the system SHALL send the currently active working fiscal year to the backend, storing it in the `year` column of the `gl_snapshots` table

#### Scenario: Smart Import Wizard finalization fiscal year association
- **WHEN** a user finalizes a migration import in the Smart Import Wizard
- **THEN** the system SHALL store the selected fiscal year (from the wizard's configuration) in the `year` column of the newly created `gl_snapshots` record

### Requirement: Filter GL Snapshots by Fiscal Year
The system SHALL filter the GL snapshots displayed on the Master Data GL tab by the active working fiscal year.

#### Scenario: Displaying GL snapshots in active fiscal year
- **WHEN** a user views the Master Data GL tab with a selected active fiscal year (e.g. 2026)
- **THEN** the system SHALL only query and display GL snapshots where the `year` equals the active fiscal year (2026)

### Requirement: Retroactive Migration of Existing GL Snapshots
The system SHALL automatically populate the `year` column for existing GL snapshots using the year prefix in the associated GL rows' `ymd` field.

#### Scenario: Automatic migration run
- **WHEN** database migrations are executed
- **THEN** the system SHALL update all `gl_snapshots` where `year` is NULL by extracting the year component from their associated `gl_rows.ymd` records
