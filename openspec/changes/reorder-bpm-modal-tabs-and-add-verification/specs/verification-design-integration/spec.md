## ADDED Requirements

### Requirement: Verification Design Tab Integration
The system SHALL integrate a "Verification Design" tab within the BPM Modal (Execution Hub) to allow users to review and manage control testing designs in context.

#### Scenario: Navigating to Verification Design
- **WHEN** the user is in the BPM Modal
- **AND** the user clicks on the "Desain Verifikasi" tab
- **THEN** the system SHALL render the `VerificationDesignPage` component
- **AND** the system SHALL filter the content by the current `bpmProcessId` to ensure relevance

## MODIFIED Requirements

### Requirement: Execution Hub Tab Navigation
The system SHALL provide a structured tabbed interface for the Execution Hub (BPMModal) to group related activities. The tabs MUST be ordered logically: Worksheet, Sampling, RCM, CSA, Verification, and Logs.

#### Scenario: Tab Order and Selection
- **WHEN** the user opens the BPM Modal
- **THEN** the system SHALL display tabs in the order: Lembar Kerja, Detail Transaksi, Matriks RCM (5a,b,c), Asesmen CSA, Desain Verifikasi, and Log Perubahan (Lampiran 6)
- **AND** the "Asesmen CSA" tab SHALL remain the default active tab if opened from a scheduled task (scheduleId present)
