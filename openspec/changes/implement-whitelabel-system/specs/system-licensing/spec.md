## MODIFIED Requirements

### Requirement: Cryptographic License Verification
The system SHALL verify the authenticity of a license key offline using the Ed25519 public key configured in the environment. It MUST support dynamic hybrid verification:
- Direct Sales (Single-Signature): If the key has 2 parts, it SHALL verify it using `DEVELOPER_PUBLIC_KEY`.
- Whitelabel Sales (Double-Signature): If the key has 3 parts, it SHALL verify the partner's signature using `PARTNER_PUBLIC_KEY` and the developer's signature using `DEVELOPER_PUBLIC_KEY`.

#### Scenario: Valid direct sales single-signature key
- **WHEN** a 2-part license key signed with the developer private key is provided
- **THEN** the system SHALL verify it against the developer public key and decrypt the payload offline

#### Scenario: Valid whitelabel double-signature key
- **WHEN** a 3-part license key signed with both partner and developer private keys is provided
- **THEN** the system SHALL verify it against both partner and developer public keys and decrypt the payload offline

#### Scenario: Invalid or tampered signature
- **WHEN** any signature in a 2-part or 3-part license key fails verification
- **THEN** the system SHALL reject the key and lock access to all protected resources
