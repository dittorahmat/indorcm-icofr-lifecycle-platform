## Context

The system uses a global `useFiscalYearStore` (Zustand) to manage the `workingYear`. While most operational pages (RCM, Scoping, BPM) are already integrated with this store, the Dashboard remains disconnected. It fetches data without year parameters and displays static labels, leading to a "frozen" appearance when the user switches years.

## Goals / Non-Goals

**Goals:**
- Integrate `useFiscalYearStore` into `src/pages/Dashboard.tsx`.
- Ensure all `useQuery` calls on the dashboard include `workingYear` in their keys.
- Parameterize API calls with the active `workingYear`.
- Update `DashboardKPIs` and `LifecycleProgress` to render dynamic year labels.

**Non-Goals:**
- Modifying backend logic (assuming the API already handles the `year` parameter).
- Changing the visual layout of the dashboard.
- Implementing historical data comparisons (out of scope).

## Decisions

- **Decision: Centralized State Management**: The `workingYear` will be accessed at the `Dashboard` page level and passed down to child components via props.
  - **Rationale**: Keeps the dashboard page as the orchestrator and ensures all components stay in sync.
- **Decision: Query Key Enrichment**: Add `workingYear` as the second element in all `queryKey` arrays.
  - **Rationale**: This is the standard TanStack Query pattern to trigger automatic refetching when the dependency (year) changes.
- **Decision: Component Parameterization**: Refactor `DashboardKPIs` and `LifecycleProgress` to accept a `workingYear` prop.
  - **Rationale**: Avoids having every small component subscribe to the global store individually, making them easier to test and more predictable.

## Risks / Trade-offs

- **[Risk]** API endpoints might not support filtering by year for all dashboard metrics. → **Mitigation**: Verify backend support during implementation; if missing, defaults will be handled gracefully.
- **[Risk]** Heavy refetching when switching years rapidly. → **Mitigation**: TanStack Query's default caching and deduplication will handle this efficiently.
