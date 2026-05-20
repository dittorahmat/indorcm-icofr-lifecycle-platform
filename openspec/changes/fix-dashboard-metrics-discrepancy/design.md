## Context

The Dashboard currently aggregates data in the frontend using multiple `useQuery` hooks. Some visualizations (Pie Chart) use the raw data from these queries, while others (KPI Cards) apply filters. Additionally, the Bar Chart expects data to be nested within RCM items, but the current backend service only returns flat RCM records.

## Goals / Non-Goals

**Goals:**
- Unify data aggregation logic in `Dashboard.tsx` so all components reflect the same filtered state.
- Fix the broken mapping in the Bar Chart without requiring backend changes (pure frontend fix).
- Improve label clarity in `DashboardKPIs.tsx` and chart headers.

**Non-Goals:**
- Refactoring the backend API to include joined data (decided to keep it efficient and handle grouping in the frontend for now).
- Implementing new metrics beyond fixing the existing ones.

## Decisions

### Decision 1: Filter Deficiency Data at Source
**Rationale:** To ensure the KPI card and the Pie Chart are always in sync, we will move the 'Open' filter to the `useMemo` hook that prepares `deficiencyBySeverity`.
**Alternatives:** Adding a status filter to the API. Rejected to avoid extra round trips or complex query params for this specific dashboard view.

### Decision 2: Calculate Controls by Process from `controlsData`
**Rationale:** Since `controlsData.items` contains all controls, each having a `businessProcess` field, we can accurately group them in the frontend. This is more reliable than relying on the `rcm.controls` array which is currently empty.
**Alternatives:** Update `RcmService` to join controls. Rejected to maintain simple API endpoints and leverage already fetched data in the frontend.

### Decision 3: Update i18n Labels
**Rationale:** Using precise terms like "Open Deficiencies" prevents user confusion when they see a number smaller than the total historical record.

## Risks / Trade-offs

- [Risk] Performance of frontend grouping → [Mitigation] The number of controls/deficiencies is typically < 1000 per org, so `useMemo` grouping will be nearly instantaneous.
- [Risk] Mismatch between i18n keys → [Mitigation] Verify and add keys to `src/i18n/locales/en/dashboard.json` and `id/dashboard.json`.
