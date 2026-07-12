## Context

Currently, the `gl_snapshots` table lacks a year field, meaning the system displays all historical GL snapshots together under "Master Data GL". The frontend sends a query parameter `year`, but the backend API ignores it.

To resolve this, we will add a `year` field to the `gl_snapshots` schema, filter API results on the backend, update frontend manual upload mutations to pass the active year, and run a database migration to backfill the `year` column for existing snapshots.

## Goals / Non-Goals

**Goals:**
- Filter the GL snapshots on the scoping Master Data GL tab based on the active fiscal year.
- Automatically link newly created/uploaded snapshots with the active working year.
- Backfill the fiscal year for existing snapshots without requiring user action.

**Non-Goals:**
- This does not change how actual GL Rows (`gl_rows`) are mapped to simulations, only how the snapshot records themselves are cataloged and retrieved.

## Decisions

### 1. Schema modification for `gl_snapshots`
- **Decision**: Add an optional `year` column to `glSnapshots` in `worker/db/schema.ts` as `year: integer("year")`.
- **Alternatives Considered**: 
  - Making `year` not null. *Rejected* because existing rows will initially be NULL before the migration script runs.
  - Splicing the filename to extract the year. *Rejected* as filenames can be arbitrary and are less reliable than a structured database column.

### 2. Backend query-level filtering
- **Decision**: Update `GET /api/gl-snapshots` in `worker/routes/scoping.ts` to parse the `year` query parameter and append an `eq(glSnapshots.year, parsedYear)` condition.
- **Alternatives Considered**:
  - Filter client-side in the React application. *Rejected* as this still transfers all snapshots over the network, leading to performance degradation as snapshot history grows.

### 3. Backfill Strategy for Existing Snapshots
- **Decision**: Run a PostgreSQL update query during schema synchronization. The query updates any snapshot where `year` is NULL by pulling the first 4 characters of `gl_rows.ymd` (cast to integer) from associated row records:
  ```sql
  UPDATE gl_snapshots 
  SET year = (
    SELECT CAST(SUBSTRING(gl_rows.ymd FROM 1 FOR 4) AS INTEGER) 
    FROM gl_rows 
    WHERE gl_rows.snapshot_id = gl_snapshots.id 
    LIMIT 1
  ) 
  WHERE year IS NULL;
  ```
- **Alternatives Considered**: 
  - Leave existing snapshots with NULL years. *Rejected* because they would disappear from the UI since the UI always filters by the selected active year.

## Risks / Trade-offs

- **[Risk]**: Associated `gl_rows.ymd` contains invalid or non-numeric year strings.
  - **Mitigation**: Add fallback check in migration logic. If casting fails or is NULL, fallback to the current system year (e.g., 2026).
