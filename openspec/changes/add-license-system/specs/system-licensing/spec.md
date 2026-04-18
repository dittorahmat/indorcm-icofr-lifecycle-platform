## ADDED Requirements

### Requirement: Machine Fingerprinting
The system SHALL generate a unique identifier for the host machine by reading `/host_machine_id` (mounted from host `/etc/machine-id`).

#### Scenario: Valid Machine ID found
- **WHEN** the system starts and `/host_machine_id` exists
- **THEN** the system SHALL use its content as the unique hardware identifier for license validation

#### Scenario: Machine ID missing
- **WHEN** the system starts and `/host_machine_id` does not exist
- **THEN** the system SHALL fallback to the primary network interface MAC address and log a warning

### Requirement: Cryptographic License Verification
The system SHALL verify the authenticity of a license key using the Ed25519 public key configured in the environment.

#### Scenario: Valid license key
- **WHEN** a license key signed with the correct private key is provided
- **THEN** the system SHALL successfully decrypt the payload and extract the machine ID and expiry date

#### Scenario: Tampered license key
- **WHEN** a license key with an invalid signature is provided
- **THEN** the system SHALL reject the key and return a signature verification error

### Requirement: License Expiry Enforcement
The system SHALL block access to all API endpoints (except licensing endpoints) if the current system date is past the `expiresAt` date in the active license.

#### Scenario: License expired
- **WHEN** a user attempts to access any protected API and the current date > license expiry date
- **THEN** the system SHALL return a 403 Forbidden error with the code `LICENSE_EXPIRED`

### Requirement: Time-Travel Detection
The system SHALL maintain a `last_heartbeat` timestamp in the database and block access if the current system time is earlier than the last heartbeat.

#### Scenario: System clock moved backward
- **WHEN** a request is made and the current system time is < `last_heartbeat` - 5 minutes
- **THEN** the system SHALL set the license status to `tampered` and block all further requests until a fresh license is provided or the clock is corrected
