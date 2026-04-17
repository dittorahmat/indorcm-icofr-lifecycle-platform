## Context

The current reporting system in IndoRCM Pro is incomplete, with several critical API endpoints missing or malfunctioning. This leads to frontend crashes in `ReportsPage.tsx` and 500 errors in other modules. The platform must adhere to SK-5/DKU.MBU/11/2024, which requires specific reporting capabilities, including management assessment signatures and multi-format exports.

## Goals / Non-Goals

**Goals:**
- Resolve all 404/500 errors related to the Reporting and RCM modules.
- Ensure the `ReportsPage` is stable and correctly reflects real data from the database.
- Implement a functional sign-off and period-locking mechanism.
- Support multi-format (CSV/Excel) exports for regulatory compliance.
- Fix broken database interactions in `user-routes.ts`.

**Non-Goals:**
- UI/UX redesign of the reports page.
- Implementation of advanced AI analytics beyond simple mockups.
- Changes to the underlying database schema (Drizzle).

## Decisions

### 1. Derive `Settings` from `Organization` Metadata
Instead of creating a new `settings` table, we will use the `metadata` JSONB field in the existing `organization` table. This field will store `ceoName`, `cfoName`, `isPeriodLocked`, `verificationHash`, and `signedOffDate`. 
- **Rationale**: Minimal schema modification and leverages the existing organization-centric data model.

### 2. Defensive Frontend Mapping
The `ReportsPage.tsx` will be updated to use optional chaining and nullish coalescing for all data-dependent operations (e.g., `summaryData?.deficienciesByStatus?.map() ?? []`).
- **Rationale**: Prevents hard crashes when data is missing from the backend or during loading states.

### 3. Aggregate Deficiencies Calculations
The `/api/reports/summary` endpoint will be refactored to join the `deficiencies` table for accurate counts, replacing the incorrect use of `auditLogs`. It will return a structure that includes both severity and status groupings.

### 4. Excel Export using `xlsx` library
The export endpoint will return a flat JSON structure, and the frontend will utilize the `xlsx` library (dynamically imported) to generate the spreadsheet.
- **Rationale**: Consistent with existing export patterns in other modules and reduces backend processing overhead.

## Risks / Trade-offs

- **[Risk]** → Signature verification hash collision.
- **[Mitigation]** → Use a robust hashing algorithm (e.g., SHA-256) combined with the organization ID and timestamp.
- **[Risk]** → Large datasets causing export timeouts.
- **[Mitigation]** → Limit export to the current active period's consolidated data.
