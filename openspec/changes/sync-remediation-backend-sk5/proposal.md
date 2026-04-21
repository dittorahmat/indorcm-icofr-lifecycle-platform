## Why

The current remediation module has a frontend UI aligned with Regulation SK-5/2024, but it lacks the necessary backend infrastructure (database schema and API endpoints) to persist critical regulatory data. This results in data loss upon page refresh and fails the auditability requirements of the mandatory ICOFR lifecycle.

## What Changes

- **Database Schema**: Extend `action_plans` and `deficiencies` tables in `worker/db/schema.ts` with mandatory regulatory fields (e.g., `pic_name`, `related_function`, `root_cause`, `remediation_timing`).
- **API Handlers**: Implement full CRUD (specifically `POST` and `PUT`) for `/api/actionplans` and `/api/deficiencies` in `worker/user-routes.ts` to support the Kanban workflow.
- **Workflow Synchronization**: Ensure state transitions in the frontend (e.g., "Submit for Review") are correctly reflected in the database and audit logs.
- **Localization (i18n)**: Add translation keys for new regulatory remediation fields in `src/i18n/locales/` for both English and Indonesian.

## Capabilities

### New Capabilities
- `remediation-persistence`: Reliable storage and retrieval of enhanced remediation plans including PIC, functions, and target dates.
- `deficiency-regulatory-metadata`: Persistence of Degree of Deficiency (DoD) assessment results and aggregate analysis metadata.

### Modified Capabilities
- `deficiency-management`: Update the lifecycle of a deficiency to include transition to "Remediated" and "Verified" statuses synced with action plans.

## Impact

- **Database**: New columns in `deficiencies` and `action_plans` tables; new Drizzle migration.
- **API**: New route handlers in `worker/user-routes.ts`.
- **Shared Types**: Potential minor alignment in `shared/types.ts`.
- **Audit Log**: Integration of remediation actions into the `audit_logs` table.
