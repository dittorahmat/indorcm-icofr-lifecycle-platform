## 1. Database Migrations

- [x] 1.1 Add `year` column to `account_assertions` table in `worker/db/schema.ts`
- [x] 1.2 Generate the drizzle migration files for adding the `year` column
- [x] 1.3 Create a backfill database script to update existing `account_assertions` records to `year: 2025`
- [x] 1.4 Apply migrations using drizzle push command and run the backfill script

## 2. Backend Rollover API Implementation

- [x] 2.1 Create a new file `worker/routes/rollover.ts` (or add to `worker/routes/migration.ts`) with a `POST /api/migration/rollover` endpoint
- [x] 2.2 Validate request body `sourceYear` and `targetYear` parameter inputs
- [x] 2.3 Check if data already exists in the target year and abort unless a `force` flag is set
- [x] 2.4 Query and clone `account_assertions` records from the source year to the target year
- [x] 2.5 Query and clone `bpm_processes`, `bpm_diagrams`, `rcms`, `controls`, and `rcm_controls` records, re-mapping IDs to preserve foreign key constraints
- [x] 2.6 Query and clone `deficiencies` and `action_plans` that are still 'Open', and link them to the target year's new control IDs
- [x] 2.7 Mount the rollover API route in the main worker app router (`worker/app.ts`)

## 3. Frontend Rollover UI & Trigger

- [x] 3.1 Create a generic `RolloverPrompt` dialog component in `src/components/layout/`
- [x] 3.2 Add logic in `ScopingPage.tsx` to detect if there is no scoping/simulation data for the selected fiscal year, and trigger the rollover prompt
- [x] 3.3 Add logic in `RCMTLCPage.tsx` and `RCMELCPage.tsx` to display a banner/prompt if RCM data is empty, offering to copy from last year
- [x] 3.4 Call the rollover API when the user confirms, and refresh the page data
- [x] 3.5 Localize all newly introduced UI labels and alert strings in `src/i18n/locales/`
- [x] 3.6 Perform validation checks (run build, lint, type-check, and tests) to verify system integrity
