## ADDED Requirements

### Requirement: Transaction Filtering by BPM ID
The system SHALL filter transaction details based on both the Account Code (noGL) and the specific Business Process (bpmProcessId).

#### Scenario: Viewing transactions in a process hub
- **WHEN** an auditor opens the "Detail Transaksi" tab within an Execution Hub
- **THEN** the system SHALL only fetch and display transactions that are explicitly linked to that `bpmProcessId`
- **AND** it SHALL ensure transactions linked to the same Account but different processes are hidden

### Requirement: Automatic Linkage on Upload
The system SHALL automatically associate uploaded transactions with the active business process context.

#### Scenario: Uploading CSV with row-level BPM Codes
- **WHEN** a user uploads a transaction file containing a `bpmCode` column
- **THEN** the system SHALL resolve each row's `bpmCode` to its corresponding process ID
- **AND** it SHALL link each transaction item to the correct sub-process, even if multiple processes are present in a single upload.
