## ADDED Requirements

### Requirement: Manual GL CSV Upload
The system SHALL provide a mechanism to upload General Ledger data in CSV format to populate the Scoping Matrix.

#### Scenario: Successful GL Upload
- **WHEN** the user selects a valid CSV file containing "Account Name" and "Balance" columns
- **THEN** the system SHALL parse the file and add the accounts to the local scoping state

#### Scenario: Auto-Identification of Significant Accounts
- **WHEN** a GL file is uploaded
- **THEN** the system SHALL automatically mark any account with a balance greater than or equal to the Performance Materiality (PM) as "Significant"

### Requirement: ERP Sync Simulation Mockup
The system SHALL include a UI mockup for configuring and simulating synchronization with an external ERP system.

#### Scenario: Configure Sync Schedule
- **WHEN** the user selects an ERP Provider and a Sync Schedule (Daily, Weekly, or Monthly)
- **THEN** the system SHALL save these settings locally for the duration of the session

#### Scenario: Simulate Manual Sync
- **WHEN** the user clicks the "Sync Now" button
- **THEN** the system SHALL display a loading state and then update the "Last Sync" timestamp to the current time
