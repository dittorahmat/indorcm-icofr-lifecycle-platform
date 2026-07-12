## Why

Currently, when users view the "Master Data GL" tab, they see all uploaded General Ledger (GL) snapshots regardless of the active fiscal year they are working on. This causes confusion and clutters the interface with irrelevant older snapshots. We need to filter the displayed GL snapshots based on the active fiscal year when they were uploaded.

## What Changes

- Add a `year` field to GL snapshots to link them with a specific fiscal year.
- Filter the snapshots displayed on the "Master Data GL" tab of the scoping page by the active fiscal year.
- Ensure that manual uploads of GL snapshots are saved with the currently active fiscal year.
- Ensure that imports through the Smart Import Wizard are saved with the active fiscal year.
- Run a migration on existing uploaded data to reconstruct the `year` from the `ymd` field of the associated GL rows.

## Capabilities

### New Capabilities

*(None)*

### Modified Capabilities

- `gl-integration`: Update the GL integration spec to require filtering GL snapshots by fiscal year, adding the `year` attribute to the snapshot schema, and implementing a migration path for existing snapshots.

## Impact

- **Database**: Add `year` column to `gl_snapshots` table.
- **Backend API**:
  - `GET /api/gl-snapshots`: Support querying by `year`.
  - `POST /api/gl-snapshots`: Accept and save `year`.
  - `POST /api/migration/finalize`: Associate the newly created snapshot with the migration target `year`.
- **Frontend**:
  - `useScopingPage` hook: Send the active year in the manual upload mutation.
  - `useGLSnapshots` hook: Send the active year in the manual upload mutation.
