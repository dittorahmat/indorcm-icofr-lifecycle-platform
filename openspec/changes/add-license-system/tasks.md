## 1. Schema & Database

- [x] 1.1 Add `system_licenses` table to `worker/db/schema.ts` with all required fields (key, machineCode, timestamps).
- [x] 1.2 Generate and run Drizzle migrations to apply the new schema.
- [x] 1.3 Add initial database seeding or check logic to ensure the table is ready on boot.

## 2. Backend Core Implementation

- [x] 2.1 Create `worker/lib/license.ts` to handle hardware fingerprinting logic (reading `/host_machine_id`).
- [x] 2.2 Implement Ed25519 signature verification in `worker/lib/license.ts` using Bun's native crypto.
- [x] 2.3 Implement the `last_heartbeat` update logic and time-travel detection helper.
- [x] 2.4 Create the `licenseGuard` middleware in `worker/app.ts` to enforce license validity on all protected routes.

## 3. Licensing API

- [x] 3.1 Implement `GET /api/license/status` to return remaining days, machine ID, and status.
- [x] 3.2 Implement `POST /api/license/activate` to accept and validate a new license key.
- [x] 3.3 Ensure the activation endpoint is accessible even when the system is locked.

## 4. Frontend Implementation

- [x] 4.1 Create a new `ActivationPage` component to display the machine ID and the license entry form.
- [x] 4.2 Update `src/main.tsx` or create a `LicenseProvider` to handle global license state and redirection.
- [x] 4.3 Build the `LicenseBanner` component for the 90-day warning.
- [x] 4.4 Build the `LicenseModal` component for the 7-day aggressive warning.

## 5. Infrastructure & Tools

- [x] 5.1 Update `Dockerfile` to ensure necessary permissions for reading the mounted machine-id.
- [x] 5.2 Create a production-ready `docker-compose.yml` that includes Postgres and the host machine-id volume mapping.
- [x] 5.3 Create a standalone `scripts/generate-license.ts` utility for internal use to sign license payloads.
- [x] 5.4 Update `README.md` with instructions on how to activate and manage the license on-premise.
