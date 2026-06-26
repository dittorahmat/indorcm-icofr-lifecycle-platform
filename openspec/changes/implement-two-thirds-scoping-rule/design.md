## Context

The application currently computes materiality based on the user's selected snapshot. Users can filter entities (locations) in `ScopingPage.tsx`, but there's no feedback or validation mechanism to ensure the scoping conforms to the 2/3 coverage rules mandated by BUMN SK-5/2024. Furthermore, there's no color coding in the GL worksheet matching the 3-category scoping legend.

## Goals / Non-Goals

**Goals:**
- Build a compliance helper in `materiality-calc.ts` to calculate FSLI-level coverage and aggregate operating/position value coverage for selected locations vs consolidated values.
- Display compliance status (Pass/Fail) in `ScopingHealthDashboard` and `SignificantLocationModal`.
- Apply soft green, soft orange, and soft yellow highlights to row backgrounds in the `GLDataGrid` table based on the scoping reason.
- Support localization in English and Indonesian for compliance labels.

**Non-Goals:**
- Automatically modifying the user's manual selection of locations (except for Pareto calculations where we default to threshold).
- Implementing database persistence schema updates (selected entities can be derived from the existing filtered state or local storage/client-side session since the grid relies on active filters/selections).

## Decisions

### Client-Side Computation of 2/3 Compliance
- **Decision**: Calculate compliance directly in the `useScopingEditor` React hook rather than on the Worker API.
- **Rationale**: Calculations are purely mathematical projections based on `glData` and the list of selected entities. This avoids API latency when checkboxes are toggled in the `EntityTreeFilter`.

### Flagging Criteria for Soft Orange (Needed for 2/3 Coverage)
- **Decision**: An account/FSLI row is highlighted as Soft Orange if its FSLI is quantitatively below PM and it is NOT qualitatively significant, but the entity it belongs to must be included in scope in order to reach the 2/3 (66.67%) consolidated threshold for that FSLI.
- **Rationale**: Sort entities by balance descending for each FSLI, take the top entities until cumulative coverage $\ge 2/3$. The accounts belonging to these top entities that are under PM will be styled Soft Orange.

### Tailwind Color Scheme for Compliance Highlighting
- **Decision**: Use standard Tailwind utility colors mapped to OKLCH matching the BUMN regulatory template:
  - Exceeds PM (Green): `bg-emerald-50 text-emerald-950 dark:bg-emerald-950/20`
  - 2/3 Coverage (Orange/Amber): `bg-amber-50 text-amber-950 dark:bg-amber-950/20`
  - Qualitative (Yellow): `bg-yellow-50 text-yellow-950 dark:bg-yellow-950/20`

## Risks / Trade-offs

- **[Risk]** Large General Ledger snapshots might cause UI lag when recalculating coverage on the fly.
  - **[Mitigation]** Memoize the coverage calculations using `React.useMemo` based on `glData` and `selectedEntityCodes`.
