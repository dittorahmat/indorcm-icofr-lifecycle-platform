## Why

In the BPM Worksheet (`CSATabContent.tsx`), when a user views the CSA assessment history for a specific business sub-process, the table lists all CSA records across the organization regardless of process or fiscal year. This occurs because `GET /api/csa` ignores the `bpmProcessId` query parameter and does not filter by active fiscal year or task schedule. Consequently, users see assessments from other sub-processes and historical years instead of the specific assessment(s) pertinent to the active sub-process and working year.

## What Changes

- **Backend Route Filtering**:
  - Update `GET /api/csa` in `worker/routes/csa.ts` to accept and filter by `bpmProcessId` and `scheduleId`.
  - Ensure `year` query parameter filters records by matching the `period` prefix or pattern (e.g. `2026-Q1`).
- **Frontend Hook & Component Integration**:
  - Update `useCSA` in `src/hooks/use-csa.ts` to accept `year` as an optional parameter and include `year` and `bpmProcessId` in the query URL and React Query cache key.
  - Update `CSATabContent.tsx` to pass the active `workingYear` from `useFiscalYearStore` to `useCSA`.

## Capabilities

### Modified Capabilities
- `csa-management`: Add requirement for scoped CSA history retrieval by Sub-Process (`bpmProcessId`) and active fiscal year (`year`).

## Impact

- **Backend**: `worker/routes/csa.ts` (`GET /csa`)
- **Frontend**: `src/hooks/use-csa.ts`, `src/components/bpm/CSATabContent.tsx`
- **APIs**: `GET /api/csa` now supports filtering by `bpmProcessId`, `scheduleId`, and `year` concurrently.
