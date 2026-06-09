## Context

The system allows importing General Ledger data via `SmartImportWizard.tsx`. Upon finalization, it calls the `/api/migration/finalize` endpoint. Currently, this endpoint does not receive the original filename from the frontend, so it hardcodes the filename in the database as `Migration_${year}_TB`.

## Goals / Non-Goals

**Goals:**
- Pass the original filename from the frontend to the backend.
- Store the original filename in the `gl_snapshots` table.
- Maintain backward compatibility for the API if possible.

**Non-Goals:**
- Retroactively fixing old snapshots (out of scope for this fix).
- Changing the RCM file naming logic (only focusing on GL/TB for now as requested).

## Decisions

### 1. API Payload Update
**Decision:** Add `tbFileName` as an optional string field to the `/api/migration/finalize` request body.
**Rationale:** This is the most direct way to transmit the needed metadata without changing the API structure significantly.

### 2. Backend Logic Update
**Decision:** Use the provided `tbFileName` when inserting into `glSnapshots`. If `tbFileName` is missing, fall back to the existing `Migration_${year}_TB` pattern.
**Rationale:** Ensures the system doesn't break if a client doesn't send the new field (though in this repo, frontend and backend are usually updated together).

## Risks / Trade-offs

- **Risk:** User might upload a file with an extremely long name or invalid characters.
- **Mitigation:** The database `filename` column is usually `text`. We should ensure the backend handles potentially missing values gracefully.
