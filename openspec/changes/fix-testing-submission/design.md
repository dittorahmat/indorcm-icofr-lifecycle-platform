## Context

The Testing Workbench in `TestWorkbench.tsx` uses a complex form to capture TOD/TOE results according to SK-5 regulations. However, the supporting backend infrastructure is incomplete, leading to 404 errors and data persistence failures.

## Goals / Non-Goals

**Goals:**
- Align frontend API calls with existing backend routes.
- Implement the missing `POST /api/tests` backend route.
- Synchronize the `test_records` database schema with the frontend form requirements.
- Execute Drizzle migrations to apply schema changes to the database.
- Externalize all hardcoded strings in `TestWorkbench.tsx` into `testing.json` for i18n support.
- Ensure all SK-5 mandated attributes (attributes A-D, homogeneity, etc.) are persistable.

**Non-Goals:**
- Redesigning the Testing Workbench UI.
- Implementing automatic deficiency generation (this is handled by existing hooks but triggered by the mutation result).
- Modifying authentication logic (Biometric auth is already implemented and verified).

## Decisions

### 1. Database Schema Expansion
- **Decision**: Add `comments` (text), `sample_size` (integer), and `homogeneity_justification` (text) to the `test_records` table.
- **Rationale**: These fields are required by SK-5 and are already present in the frontend form but missing from the database.
- **Alternatives**: Storing them in the `evaluation_attributes` JSONB. Rejected because these are top-level business attributes that should be easily queryable for reporting.

### 2. Route Correction
- **Decision**: Change frontend call from `/api/users/me` to `/api/user/me`.
- **Rationale**: The backend already provides `/api/user/me`. "Users" (plural) was a typo in the initial implementation of the Testing Workbench.

### 3. Backend Route Implementation
- **Decision**: Add `app.post('/api/tests')` to `worker/user-routes.ts`.
- **Rationale**: Required to persist the form data sent by the frontend.

### 4. Localization Sync
- **Decision**: Create `src/i18n/locales/en/testing.json` and `src/i18n/locales/id/testing.json` and register them in `src/i18n/config.ts`.
- **Rationale**: Maintain codebase standards for multi-language support (ID/EN) as required for BUMN projects.

## Risks / Trade-offs

- **[Risk]** → Data migration might fail if existing records exist.
- **Mitigation** → Use Drizzle migrations to handle nullable additions safely. Execute `wrangler d1 migrations apply` for local development.
- **[Risk]** → Discrepancies between frontend Zod schema and backend Drizzle schema.
- **Mitigation** → Reference `shared/types.ts` as the single source of truth for both.

