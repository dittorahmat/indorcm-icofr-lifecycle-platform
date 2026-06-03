## Context

RCM data (Risks and Controls) is currently only visible in the matrix views if it has been mapped to a visual node in a BPM diagram. This is because the database query uses an `innerJoin` on the `bpm_node_rcms` table. Additionally, while the application has a global fiscal year context, the RCM Matrix endpoints ignore the year filter, leading to stale or incorrect data being displayed.

## Goals / Non-Goals

**Goals:**
- Make all RCM data visible in matrix views regardless of whether they have diagram nodes.
- Implement correct fiscal year filtering for TLC and ITGC matrices.
- Ensure the frontend correctly propagates the active year to the backend.

**Non-Goals:**
- Automatically creating diagram nodes for migrated data (this remains a manual user action).
- Changing the underlying database schema.

## Decisions

### 1. Database Query Refactoring
- **Choice**: Change `innerJoin` to `leftJoin` for `bpmNodeRcms` and `bpmDiagrams`.
- **Rationale**: A `leftJoin` allows the query to return Risks and Controls even if they haven't been assigned to a visual node. This is essential for visibility of migrated/uploaded data.
- **Implementation**: Update `worker/routes/rcm.ts` for both TLC and ITGC matrix endpoints.

### 2. Fiscal Year Filtering in API
- **Choice**: Explicitly add `year` filtering to the RCM Matrix endpoints.
- **Rationale**: The user expects the "2023 Cycle" selected in the header to filter all modules, including RCM.
- **Implementation**: 
  - Backend: Extract `year` from `c.req.query()` and add `eq(rcms.year, year)` to the conditions.
  - Frontend: Update `useQuery` queryKeys and URLs to include the year.

### 3. Frontend Data Consistency
- **Choice**: Use the global `useFiscalYearStore` as the source of truth for the active year.
- **Rationale**: Standardizes year selection across the application (Scoping, BPM, RCM).

## Risks / Trade-offs

- **[Risk]**: Performance impact of `leftJoin` vs `innerJoin`. 
  - **Mitigation**: RCM datasets are typically manageable in size (thousands, not millions of rows), and indices on `organizationId` and `year` will maintain speed.
- **[Risk]**: `null` values for Process/Subprocess names if an RCM isn't linked to a diagram.
  - **Mitigation**: Use coalescing or fallbacks to the `rcms.process` and `rcms.subProcess` columns which are populated during migration.
