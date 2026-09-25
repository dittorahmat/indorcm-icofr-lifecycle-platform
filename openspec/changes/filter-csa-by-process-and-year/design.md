## Context

See `proposal.md` for motivation. In the current implementation of `GET /csa` in `worker/routes/csa.ts`, query parameters `bpmProcessId` and `scheduleId` are received over HTTP from frontend clients but ignored when building Drizzle SQL conditions. Furthermore, `useCSA` in `src/hooks/use-csa.ts` does not pass the current fiscal `workingYear` to the API query.

## Goals / Non-Goals

**Goals:**
- Enable `GET /csa` backend route to filter by `bpmProcessId`, `scheduleId`, and `year` (matching period).
- Pass `workingYear` and `bpmProcessId` from `CSATabContent.tsx` through `useCSA` to fetch strictly filtered records.
- Ensure query cache key in React Query invalidates and refetches appropriately when year or sub-process changes.

**Non-Goals:**
- Modifying the underlying database schema (all columns `bpm_process_id`, `schedule_id`, `period`, `organization_id` already exist on `csa_records`).
- Changing other CSA modules such as `TodoListPage` or `csa_schedules` table queries.

## Decisions

### 1. Backend Query Filtering in `worker/routes/csa.ts`
- **Decision**: Read `bpmProcessId` and `scheduleId` from `c.req.query()` alongside existing `controlId`, `period`, and `year`. Combine them using Drizzle `and(...)`.
- **Alternatives Considered**:
  - *Filtering in frontend client-side memory*: Rejected because it wastes bandwidth and leaks irrelevant cross-process/historical data across tenant sessions.

### 2. Passing Fiscal Year to `useCSA` Hook
- **Decision**: Introduce `year?: string | number` to `UseCSAProps`. In `CSATabContent.tsx`, pass `workingYear` from `useFiscalYearStore`.
- **Query Construction**: Use `URLSearchParams` to conditionally append `bpmProcessId` and `year`. Include `bpmProcessId` and `year` in the React Query key: `['csa-list', bpmProcessId, year]`.

## Risks / Trade-offs

- **[Risk] Existing CSA records without `bpmProcessId`**: Older records created before `bpmProcessId` was tracked might not show up if filtered strictly by `bpmProcessId`.
  - **Mitigation**: This is intended behavior for sub-process scoping. If no `bpmProcessId` query is sent, the route returns all records for the org as before.
