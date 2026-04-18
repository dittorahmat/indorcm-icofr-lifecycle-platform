## Context

IndoRCM Pro is a specialized platform for BUMN, often deployed in isolated (air-gapped) or on-premise environments. Currently, there is no mechanism to enforce subscription terms or prevent unauthorized distribution. The system must transition from a Cloudflare-first architecture to a Docker-hosted environment while maintaining strict offline licensing compliance.

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
**Decision:** Use Ed25519 digital signatures for license verification.
**Rationale:** Ed25519 provides high security with short keys and signatures. It is supported natively by modern runtimes (Bun/Node) and avoids the complexity of RSA.
**Alternatives:** AES (Symmetric) was rejected because it requires the secret key to be stored in the app, making it trivial to crack.

### 2. Machine Fingerprinting (Host machine-id)
**Decision:** Use the host's `/etc/machine-id` (or `/var/lib/dbus/machine-id`) by mounting it as a read-only volume in Docker.
**Rationale:** Inside Docker, MAC addresses and CPU IDs can be virtualized or unstable. The host's machine-id is a standard, persistent unique identifier for Linux systems.
**Implementation:** `volumes: ["/etc/machine-id:/host_machine_id:ro"]` in `docker-compose.yml`.

### 3. Middleware-based Enforcement
**Decision:** Implement a global Hono middleware (`licenseGuard`) that executes before authentication.
**Rationale:** This ensures that even the login process is blocked if the license is invalid, preventing any unauthorized access to the application logic.

### 4. Time-Travel Detection (Heartbeat Logic)
**Decision:** Update a `last_heartbeat` timestamp in the `system_licenses` table on every valid API request.
**Rationale:** If the current system time is ever significantly earlier than the `last_heartbeat`, it indicates the system clock was moved backward to bypass expiry. The system will enter a `tampered` state.

## Risks / Trade-offs

- **[Risk] Hardware Replacement** → If the host server is replaced or the OS reinstalled, the machine-id will change. 
  - **Mitigation:** The vendor (you) must provide a replacement key. This is a standard manual process for enterprise software.
- **[Risk] Database Deletion** → A user could drop the database to clear the heartbeat.
  - **Mitigation:** The application will immediately return to the "Activation Required" state. The user must re-input the license key, which will then trigger the machine-id check and reset the heartbeat to the current (valid) time.
- **[Risk] User Privacy** → Reading host hardware info.
  - **Mitigation:** We only read a hash/id of the machine, which stays local to the server. No data is sent to the vendor.
