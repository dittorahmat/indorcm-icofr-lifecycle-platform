## MODIFIED Requirements

### Requirement: Execution Hub Tab Navigation
The system SHALL provide a structured tabbed interface for the Execution Hub (BPMModal) to group related activities. The tabs MUST be ordered logically to follow the ICOFR lifecycle.

#### Scenario: Tab Order and Verification Integration
- **WHEN** the user opens the BPM Modal
- **THEN** the system SHALL display tabs in the following order:
  1. Lembar Kerja (worksheet)
  2. Detail Transaksi (sampling)
  3. Matriks RCM (rcm)
  4. Asesmen CSA (csa)
  5. Desain Verifikasi (verification)
  6. Log Perubahan (logs)
- **AND** selecting "Desain Verifikasi" SHALL render the `VerificationDesignPage` in embedded mode, filtered by the current process ID.
