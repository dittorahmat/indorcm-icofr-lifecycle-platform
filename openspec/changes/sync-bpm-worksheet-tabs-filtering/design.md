## Context

In `BPMModal.tsx`, multiple tabs serve as the execution hub for a given Sub-Process, GL account (`noGL`), and fiscal year (`year`). As diagnosed in the explore session:
1. `VerificationDesignPage` sends `?bpmId=${filterBpmId}`, while the Hono route in `worker/routes/rcm.ts` expects `c.req.query('bpmProcessId')`.
2. `BPMWorksheet` receives `workingYear` but does not pass it into `/api/controls`, nor does it filter controls by effective year.
3. `RCMTLCPage` passes `bpmProcessId` and `year`, but `rcm.ts` does not pass `noGL` to `matrixService.getTlcMatrix(orgId, bpmProcessId, year, noGL)`.
4. `RCMITGCPage` does not pass `year`.

## Goals / Non-Goals

**Goals:**
- Fix the parameter mismatch in `VerificationDesignPage` and `rcm.ts` so BPM isolation works properly.
- Ensure all tabs in `BPMModal` consistently propagate `bpmProcessId`, `noGL`, and `workingYear` to their queries and components.
- Scope `VerificationDesignPage` and `BPMWorksheet` by fiscal working year.
- Preserve backward compatibility for standalone pages (`/rcm/verification-design`, `/rcm/tlc`, `/rcm/itgc`) where `bpmProcessId` or `noGL` may be optional.

**Non-Goals:**
- Redesigning the layout or UI styling of the tabs.
- Altering the database schema (no migration needed; columns like `effectivePeriod`, `rcmId`, and `workingYear` already exist).

## Decisions

### Decision 1: Query parameter unification on `bpmProcessId`
- **Choice**: Standardize on `bpmProcessId` across both frontend (`VerificationDesignPage`) and backend (`worker/routes/rcm.ts`), while accepting `bpmId` as fallback in `rcm.ts` for safety:
  ```ts
  const bpmProcessId = c.req.query('bpmProcessId') || c.req.query('bpmId');
  ```
- **Rationale**: Eliminates the mismatch bug without breaking any external callers.

### Decision 2: Context propagation in `BPMModal.tsx`
- **Choice**: Explicitly pass `year` and `noGL` props down to `VerificationDesignPage`, `RCMTLCPage`, and `RCMITGCPage` in `BPMModal`:
  ```tsx
  <VerificationDesignPage embedded={true} filterBpmId={bpmProcessId} workingYear={year} />
  <RCMTLCPage embedded={true} filterBpmId={bpmProcessId} workingYearOverride={year} noGLFilter={noGL} />
  <RCMITGCPage embedded={true} filterBpmId={bpmProcessId} workingYear={year} />
  ```
- **Rationale**: Ensures that components rendered inside `BPMModal` always inherit the exact modal context rather than falling back to un-scoped global state.

### Decision 3: Fiscal year filtering in `BPMWorksheet.tsx`
- **Choice**: Include `workingYear` in the controls query key `['bpm-controls', noGL, bpmProcessId, subProcessName, workingYear]` and query param `/api/controls?year=${workingYear}` (or client-side filtering if controls table stores `effectivePeriod`).
- **Rationale**: Prevents control entries from past or future years from appearing in the active year's matrix.

## Risks / Trade-offs

- **[Risk] Existing mock/seed controls may lack specific year tags** → Mitigation: If `effectivePeriod` or `year` is not populated on a control, retain safe fallback matching to prevent controls from vanishing unexpectedly in demo mode.
