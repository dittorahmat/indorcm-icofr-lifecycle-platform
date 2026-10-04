## Purpose

Field evidence capture lets Lini 1 on mobile-only devices attach trustworthy CSA proof in one predictable pattern: preview before upload, bandwidth-friendly compression, retry without reselecting, and optional GPS location recorded per proof.

## ADDED Requirements

### Requirement: Preview-before-upload evidence capture
The system SHALL let Lini 1 preview a selected photo or file before uploading, and keep the pending file available for retry when the upload fails.

#### Scenario: Preview before committing quota
- **WHEN** Lini 1 selects a photo for a sample-control point
- **THEN** the system SHALL show a preview with file name and size plus explicit Upload and Cancel actions, and SHALL NOT upload before Upload is tapped

#### Scenario: Failed upload keeps the file
- **WHEN** an evidence upload fails (timeout, offline, server error)
- **THEN** the system SHALL keep the pending file in place with a Retry action, and SHALL NOT lose draft form state or previously attached proof

### Requirement: Bandwidth-friendly image handling
The system SHALL downscale large camera photos before upload (long-edge cap with JPEG quality reduction) and fall back to the original file when compression is unavailable.

#### Scenario: Large field photo on slow connection
- **WHEN** Lini 1 captures a photo larger than the long-edge cap
- **THEN** the system SHALL upload the compressed variant and SHALL preserve the original filename base

### Requirement: Consistent evidence metadata payload
The system SHALL send identical evidence metadata from every capture entry point (CSA execution form and archive record card), including schedule/control linkage.

#### Scenario: Same payload from form and archive card
- **WHEN** evidence is uploaded from either the CSA form or the archive record card
- **THEN** the request SHALL include `csaId`, sample index, and control id alongside the file

### Requirement: Optional GPS Fase-1 per proof
The system SHALL request device location in parallel with photo selection, store coordinates per proof when granted, and SHALL NOT block CSA submit when location is denied, timed out, or unavailable.

#### Scenario: Location granted
- **WHEN** Lini 1 grants location permission and captures proof
- **THEN** the system SHALL store latitude, longitude, accuracy in meters, capture timestamp, and status `granted` alongside the proof, and SHALL display a "Lokasi tercatat" badge with coordinates

#### Scenario: Location denied or timeout
- **WHEN** location permission is denied, times out within 10 seconds, or the context is insecure (`http://` non-localhost)
- **THEN** the system SHALL store status `denied`, `timeout`, or `unavailable`, SHALL still allow Upload and CSA submit, and SHALL show a non-blocking notice with how to enable location

#### Scenario: Honest forensic labeling
- **WHEN** GPS Fase-1 metadata exists without EXIF verification
- **THEN** the system SHALL label it "Lokasi tercatat" and SHALL NOT label it "Forensik terverifikasi"
