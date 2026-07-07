## Why

Currently, all Trial Balance data (GL Rows), RCM matrices, ELC checklists, ITGC scopes, and Scoping Assertions are stored per fiscal year. However, when a new fiscal year starts (e.g., 2025), there is no mechanism to clone or rollover last year's configurations. Users must either manually upload all files again or start from scratch. Additionally, qualitative scoping assertions on financial accounts (the `account_assertions` table) are currently global and lack a `year` column, causing edits in one year to affect all years.

Adding an annual rollover mechanism and versioning of account assertions will allow users to transition to a new fiscal year seamlessly by copying previous templates and configurations as a baseline, only modifying quantitative values or qualitative updates for the new year.

## What Changes

- Add a `year` column to `account_assertions` to partition qualitative account assertions by fiscal year.
- Create a database migration script to backfill existing `account_assertions` to year `2025` (the current working year).
- Implement a backend API route (`POST /api/migration/rollover`) to copy configurations (RCM, Controls, Processes, Diagrams, Scoping Assertions) from a source year to a target year.
- Build a frontend UI trigger (e.g., in the Scoping page or RCM matrix) that detects if the selected fiscal year has no data, prompting the user to copy/rollover data from the previous fiscal year.
- Ensure that during rollover, open deficiencies and action plans are carried forward to the target year as active tasks.

## Capabilities

### New Capabilities
- `annual-rollover`: Capability to rollover/clone scoping, RCM, ELC, ITGC, and open deficiencies/action plans from a previous fiscal year to the target fiscal year as a baseline.

### Modified Capabilities
- `gl-integration`: Modify FSLI scoping assertions to support year-based partitioning.

## Impact

- Database Schema: Updates to the `account_assertions` table schema.
- Backend API: New `/api/migration/rollover` route.
- Frontend pages: ScopingPage.tsx, RCMTLCPage.tsx, and related components to trigger rollover when data is missing for a year.
