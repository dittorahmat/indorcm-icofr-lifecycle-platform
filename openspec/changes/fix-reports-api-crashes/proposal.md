## Why

The `ReportsPage` is currently unusable due to frontend crashes and missing or buggy backend API routes. This change addresses critical reliability issues to ensure regulatory reports (Appendix 11 of SK-5/2024) can be viewed, signed, and exported as required by the ICOFR lifecycle.

## What Changes

- **Frontend Stability**: Implementation of defensive data handling in `ReportsPage.tsx` to prevent crashes when API responses are incomplete or pending.
- **Reporting API Fixes**: 
    - Fix `/api/reports/summary` to return correct grouping from the `deficiencies` table instead of audit logs.
    - Add missing `deficienciesByStatus` and `allDeficiencies` fields to the summary response.
- **New API Routes**:
    - Implementation of `/api/settings` to retrieve company and period-lock metadata.
    - Implementation of `/api/aggregatedeficiencies` for Lampiran 10 support.
    - Implementation of `/api/reports/sign-off` for CEO/CFO digital signature workflow.
    - Implementation of `/api/reports/export` for CSV/Excel generation.
- **Bug Fixes**:
    - Fix `/api/tests` 500 error by adding missing `testRecords` table import in `user-routes.ts`.
    - Fix missing RCM validation and approval routes required by the RCM management module.

## Capabilities

### New Capabilities
- `reporting-engine`: Comprehensive API support for SK-5/2024 regulatory reporting, including summary aggregation, sign-off workflow, and multi-format export.
- `deficiency-aggregation`: Capability to aggregate and analyze multiple deficiencies to determine combined magnitude (Lampiran 10).

### Modified Capabilities
- `gl-integration`: Update to support setting-related metadata and period-locking associated with reporting cycles.

## Impact

- **Affected Code**: `worker/user-routes.ts`, `worker/app.ts`, `src/pages/reports/ReportsPage.tsx`.
- **APIs**: New endpoints under `/api/reports/*`, `/api/settings`, and `/api/aggregatedeficiencies`.
- **Database**: No schema changes required (utilizing existing tables: `deficiencies`, `test_records`, `organization`, `audit_logs`).
