## Context

The `ScopingPage.tsx` currently uses a `Tabs` component with two tabs: "Worksheet Data" and "Activity Log". The `ScopingHealthDashboard` (which includes balance checks and Benford's Law analysis) is rendered inside the "Worksheet Data" tab, above the `GLDataGrid`. This creates a vertically long page where the main data table is pushed down.

## Goals / Non-Goals

**Goals:**
- Separate data entry/assessment from data integrity/forensics.
- Improve the accessibility of the `GLDataGrid` by reducing vertical scroll requirements.
- Standardize tab naming across languages.

**Non-Goals:**
- Changing the logic of `GLDataGrid` or `ScopingHealthDashboard`.
- Modifying backend APIs or data structures.

## Decisions

### Decision 1: Tab Structure Refactor
- **Rationale**: A three-tab layout provides better logical grouping.
- **Implementation**: Update `ScopingEditor` in `ScopingPage.tsx` to define three `TabsTrigger` and `TabsContent` blocks.
- **Order**: `worksheet` -> `history` -> `integrity`. (Note: Per user hint, Data Integrity is at the end).

### Decision 2: Tab Labeling via i18n
- **Rationale**: Maintain consistent localization.
- **Labels**:
  - `worksheet`: "Scoping Worksheet" (EN) / "Ruang Lingkup" (ID)
  - `history`: "Activity Log" (EN) / "Log Aktivitas" (ID)
  - `integrity`: "Data Integrity" (EN) / "Integritas Data" (ID)

### Decision 3: Move Health Dashboard
- **Rationale**: `ScopingHealthDashboard` is a diagnostic tool, while `GLDataGrid` is an operational tool.
- **Implementation**: Remove `ScopingHealthDashboard` from the `worksheet` content and place it in the `integrity` content.

## Risks / Trade-offs

- **[Risk]**: Users might miss the health dashboard if they don't click the third tab.
  - **Mitigation**: Add a small indicator (e.g., a colored dot or badge) on the "Data Integrity" tab trigger if anomalies are detected (optional/future enhancement). For now, the logical separation is prioritized.
- **[Trade-off]**: Context switching between tabs is required to see integrity status while assessing accounts.
  - **Mitigation**: The current priority is a cleaner workspace for assessment.
