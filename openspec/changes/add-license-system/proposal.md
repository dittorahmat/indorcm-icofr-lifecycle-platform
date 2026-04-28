## Why

Implement a secure, offline-first licensing system for IndoGRC Pro to protect intellectual property and manage subscriptions in on-premise BUMN environments. This ensures that the application is only used on authorized machines and within the agreed-upon subscription period, providing a sustainable business model for the platform.

## What Changes

- **Mandatory Activation:** Added a new first-time setup requirement where the application must be activated with a valid license key before any other functionality is accessible.
- **Machine Binding:** Implemented machine fingerprinting using host-level identification (via Docker mount) to prevent unauthorized migration of the application to other servers.
- **Gradual Notification System:** Introduced a multi-tiered warning system for license expiration:
  - 90 days before: Non-intrusive banner.
  - 7 days before: Persistent modal notification.
- **Hard Lock enforcement:** **BREAKING** Prevents all user logins if the license has expired or is invalid for the current machine.
- **Time-Travel Protection:** Integrated logic to detect and block manual system clock manipulation.
- **Cloudflare Demo Bypass:** Added an environment-based toggle (`SKIP_LICENSE`) to allow seamless demonstration in serverless environments.
- **Hybrid Auth Support:** Integrated dual-hashing (PBKDF2 & Scrypt) to ensure demo users can login in both restricted and full environments without conflict.

## Capabilities

### New Capabilities
- `system-licensing`: Core logic for hardware fingerprinting, cryptographic license verification (RSA/Ed25519), and expiry state management.
- `licensing-ui`: Frontend components for license activation, status monitoring, and the expiry notification flow.

### Modified Capabilities
- `user-authentication`: Requirement added to verify license validity as a prerequisite for session creation.

## Impact

- **Backend (`worker/`):** New middleware in `app.ts`, new database table in `schema.ts`, and a new utility library for cryptographic verification and hardware fingerprinting.
- **Frontend (`src/`):** Integration in `main.tsx` for global license guarding, new activation page, and shared state for license status.
- **Infrastructure:** Updated `Dockerfile` and documentation to require mounting `/etc/machine-id` from the host.
- **Deployment:** Transition to Docker Compose as the recommended deployment method to manage Postgres and the machine-id volume mapping.
