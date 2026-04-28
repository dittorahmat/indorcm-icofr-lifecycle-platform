## Context

IndoGRC Pro is a specialized platform for BUMN, often deployed in isolated (air-gapped) or on-premise environments. Currently, there is no mechanism to enforce subscription terms or prevent unauthorized distribution. The system must transition from a Cloudflare-first architecture to a Docker-hosted environment while maintaining strict offline licensing compliance.

## Goals / Non-Goals

**Goals:**
- **Asymmetric Security:** Use Public/Private key signing to ensure only the vendor can generate valid license keys.
- **Hardware Binding:** Tie the license to the specific physical or virtual host using a stable machine identifier.
- **Offline Reliability:** No internet connection required for activation or ongoing verification.
- **Subscription Management:** Enforce 1-year terms with proactive user notifications.
- **Tamper Resistance:** Detect and block attempts to bypass expiry by altering the system clock.

**Non-Goals:**
- **Online "Phone Home":** The system will not attempt to contact any external servers.
- **Seat-based Licensing:** The license applies to the entire instance/organization, not per-user.
- **Grace Periods:** Expiry results in an immediate lock (as requested by the user), relying on the 90-day warning period for compliance.

## Decisions

### 1. Cryptographic Scheme (Ed25519)
**Decision:** Use Ed25519 digital signatures with **WebCrypto API** for license verification.
**Rationale:** WebCrypto is the native standard for Cloudflare and modern browsers, ensuring the verification logic is identical between localhost simulation and production.
**Alternatives:** `node:crypto` was initially considered but proved inconsistent in the Cloudflare simulation environment.

### 2. Machine Fingerprinting (Host machine-id)
**Decision:** Use the host's `/etc/machine-id` (or `/var/lib/dbus/machine-id`) by mounting it as a read-only volume in Docker.
**Rationale:** Inside Docker, MAC addresses and CPU IDs can be virtualized or unstable. The host's machine-id is a standard, persistent unique identifier for Linux systems.
**Implementation:** `volumes: ["/etc/machine-id:/host_machine_id:ro"]` in `docker-compose.yml`.

### 3. Middleware-based Enforcement
**Decision:** Implement a global Hono middleware (`licenseGuard`) that executes before authentication.
**Rationale:** This ensures that even the login process is blocked if the license is invalid, preventing any unauthorized access to the application logic.

### 4. Time-Travel Detection (Throttled Heartbeat)
**Decision:** Update a `last_heartbeat` timestamp in the `system_licenses` table only once every **1 hour**.
**Rationale:** Continuous DB updates for every request are resource-intensive. Throttling reduces DB load while maintaining high security (maximum 1 hour of potential bypass).

## Risks / Trade-offs

- **[Risk] Hardware Replacement** → If the host server is replaced or the OS reinstalled, the machine-id will change. 
  - **Mitigation:** The vendor (you) must provide a replacement key. This is a standard manual process for enterprise software.
- **[Risk] Database Deletion** → A user could drop the database to clear the heartbeat.
  - **Mitigation:** The application will immediately return to the "Activation Required" state. The user must re-input the license key, which will then trigger the machine-id check and reset the heartbeat to the current (valid) time.
- **[Risk] User Privacy** → Reading host hardware info.
  - **Mitigation:** We only read a hash/id of the machine, which stays local to the server. No data is sent to the vendor.
