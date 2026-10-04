## ADDED Requirements

### Requirement: Unified evidence upload behavior
The system SHALL use a single evidence-upload behavior across the CSA execution form and the CSA archive record card: preview, compression, consistent metadata, and retry without data loss.

#### Scenario: Identical flow in form and archive
- **WHEN** Lini 1 attaches proof from the CSA form stepper or from an archive record card
- **THEN** both entry points SHALL preview before upload, compress large images identically, send the same metadata shape, and preserve the pending file on failure

### Requirement: GPS metadata stored per proof without blocking sign-off
The system SHALL persist GPS Fase-1 metadata per sample-control proof and SHALL NOT treat missing GPS as a sign-off blocker; the existing rule (every Passed control requires evidence) remains unchanged.

#### Scenario: Submit with denied location
- **WHEN** Lini 1 submits a CSA where all Passed controls have evidence but GPS status is `denied`
- **THEN** the system SHALL accept the submit path (subject to existing evidence and biometric checks) and SHALL retain the `denied` status on each proof for Line 2 visibility

#### Scenario: Line 2 sees location status
- **WHEN** Line 2 reviews a CSA record with GPS metadata
- **THEN** the system SHALL display per-proof location status (recorded coordinates or denied/timeout/unavailable) alongside the evidence link
